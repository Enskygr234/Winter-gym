// SQLite veri katmanı. Tüm okuma/yazma buradan geçer.
import * as SQLite from 'expo-sqlite';
import { EXERCISES, PRESET_PLANS } from './exercises';

const DB_NAME = 'demir-fitness.db';
const SCHEMA_VERSION = 1;
const SEED_VERSION = '2'; // hareket kütüphanesi değişince artır → yerleşik hareketler güncellenir

let dbPromise = null;
export const getDb = () => (dbPromise ??= openAndMigrate());

async function openAndMigrate() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const { user_version: v } = await db.getFirstAsync('PRAGMA user_version');
  if (v < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        grp TEXT NOT NULL,
        muscle TEXT NOT NULL,
        equipment TEXT NOT NULL,
        sets INTEGER NOT NULL DEFAULT 3,
        reps TEXT NOT NULL DEFAULT '10',
        level TEXT NOT NULL DEFAULT 'Başlangıç',
        default_kg REAL NOT NULL DEFAULT 0,
        default_rep INTEGER NOT NULL DEFAULT 10,
        rest INTEGER NOT NULL DEFAULT 90,
        descr TEXT NOT NULL DEFAULT '',
        tips TEXT NOT NULL DEFAULT '[]',
        custom INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        focus TEXT,
        preset INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id),
        position INTEGER NOT NULL,
        sets INTEGER NOT NULL,
        reps TEXT NOT NULL,
        rest INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        plan_name TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        volume REAL NOT NULL DEFAULT 0,
        kcal INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL,
        set_no INTEGER NOT NULL,
        kg REAL NOT NULL,
        reps INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date INTEGER NOT NULL,
        weight REAL,
        waist REAL,
        chest REAL
      );
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT);
      CREATE INDEX IF NOT EXISTS idx_items_plan ON plan_items(plan_id, position);
      CREATE INDEX IF NOT EXISTS idx_sets_ex ON workout_sets(exercise_id, workout_id);
      CREATE INDEX IF NOT EXISTS idx_sets_w ON workout_sets(workout_id);
      CREATE INDEX IF NOT EXISTS idx_w_date ON workouts(started_at);
    `);
  }
  if (v < SCHEMA_VERSION) await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  await seed(db);
  return db;
}

async function getSetting(db, key) {
  const r = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  return r ? r.value : null;
}
const setSetting = (db, key, value) =>
  db.runAsync('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);

async function seed(db) {
  if ((await getSetting(db, 'seed_version')) === SEED_VERSION) return;
  await db.withTransactionAsync(async () => {
    for (const e of EXERCISES) {
      await db.runAsync(
        `INSERT INTO exercises (id, name, grp, muscle, equipment, sets, reps, level, default_kg, default_rep, rest, descr, tips, custom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, grp=excluded.grp, muscle=excluded.muscle, equipment=excluded.equipment,
           sets=excluded.sets, reps=excluded.reps, level=excluded.level, default_kg=excluded.default_kg,
           default_rep=excluded.default_rep, rest=excluded.rest, descr=excluded.descr, tips=excluded.tips`,
        [e.id, e.name, e.group, e.muscle, e.equipment, e.sets, e.reps, e.level, e.defaultKg, e.defaultRep, e.rest, e.desc, JSON.stringify(e.tips)]
      );
    }
    const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
    for (const p of PRESET_PLANS) {
      const exists = await db.getFirstAsync('SELECT id FROM plans WHERE id = ?', [p.id]);
      if (exists) continue;
      await db.runAsync('INSERT INTO plans (id, name, focus, preset, created_at) VALUES (?, ?, ?, 1, ?)', [p.id, p.name, p.focus, Date.now()]);
      for (const [i, exId] of p.items.entries()) {
        const e = byId[exId];
        await db.runAsync('INSERT INTO plan_items (plan_id, exercise_id, position, sets, reps, rest) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, exId, i, e.sets, e.reps, e.rest]);
      }
    }
    if ((await getSetting(db, 'user_name')) === null) await setSetting(db, 'user_name', 'Sporcu');
    await setSetting(db, 'seed_version', SEED_VERSION);
  });
}

// ── Eski sürümden (AsyncStorage) veri taşıma ──
export async function migrateLegacy(raw) {
  const db = await getDb();
  if ((await getSetting(db, 'legacy_migrated')) === '1') return false;
  if (!raw) {
    await setSetting(db, 'legacy_migrated', '1');
    return false;
  }
  const old = JSON.parse(raw);
  await db.withTransactionAsync(async () => {
    if (old.userName) await setSetting(db, 'user_name', old.userName);
    for (const p of old.customPlans || []) {
      await insertPlan(db, { id: p.id, name: p.name, items: (p.exerciseIds || []).map((exerciseId) => ({ exerciseId })) });
    }
    for (const w of old.workouts || []) {
      await insertWorkout(db, {
        planId: w.planId, planName: w.planName, startedAt: w.date, durationSec: w.durationSec,
        kcal: w.kcal, log: w.log || [],
      });
    }
    for (const m of old.measurements || []) {
      await db.runAsync('INSERT INTO measurements (date, weight, waist, chest) VALUES (?, ?, ?, ?)',
        [m.date, m.weight ?? null, m.waist ?? null, m.chest ?? null]);
    }
    await setSetting(db, 'legacy_migrated', '1');
  });
  return true;
}

// ── Okuma: uygulamanın ihtiyaç duyduğu her şeyin özeti ──
export async function loadSnapshot() {
  const db = await getDb();
  const exRows = await db.getAllAsync('SELECT * FROM exercises ORDER BY custom, rowid');
  const exercises = exRows.map(rowToExercise);
  const plans = await db.getAllAsync('SELECT * FROM plans ORDER BY preset DESC, created_at');
  const items = await db.getAllAsync('SELECT * FROM plan_items ORDER BY plan_id, position');
  const workouts = await db.getAllAsync('SELECT * FROM workouts ORDER BY started_at');
  const measurements = await db.getAllAsync('SELECT * FROM measurements ORDER BY date');
  const prRows = await db.getAllAsync(`
    SELECT exercise_id, MAX(kg) AS max_kg, MAX(reps) AS max_reps,
           MAX(CASE WHEN kg > 0 THEN kg * (1 + reps / 30.0) END) AS e1rm
    FROM workout_sets WHERE reps > 0 GROUP BY exercise_id`);
  const lastRows = await db.getAllAsync(`
    SELECT ws.exercise_id, ws.set_no, ws.kg, ws.reps FROM workout_sets ws
    JOIN (SELECT exercise_id, MAX(workout_id) AS wid FROM workout_sets GROUP BY exercise_id) l
      ON l.exercise_id = ws.exercise_id AND l.wid = ws.workout_id
    ORDER BY ws.exercise_id, ws.set_no`);

  const lastSets = {};
  for (const r of lastRows) (lastSets[r.exercise_id] ??= []).push({ kg: r.kg, reps: r.reps });

  return {
    userName: (await getSetting(db, 'user_name')) || 'Sporcu',
    exercises,
    plans: plans.map((p) => ({
      id: p.id, name: p.name, focus: p.focus, preset: !!p.preset,
      items: items.filter((i) => i.plan_id === p.id).map((i) => ({ exerciseId: i.exercise_id, sets: i.sets, reps: i.reps, rest: i.rest })),
    })),
    workouts: workouts.map((w) => ({
      id: w.id, planId: w.plan_id, planName: w.plan_name, date: w.started_at,
      durationSec: w.duration_sec, volume: w.volume, kcal: w.kcal,
    })),
    measurements,
    prs: Object.fromEntries(prRows.map((r) => [r.exercise_id, { maxKg: r.max_kg, maxReps: r.max_reps, e1rm: r.e1rm }])),
    lastSets,
  };
}

const rowToExercise = (r) => ({
  id: r.id, name: r.name, group: r.grp, muscle: r.muscle, equipment: r.equipment, sets: r.sets, reps: r.reps,
  level: r.level, defaultKg: r.default_kg, defaultRep: r.default_rep, rest: r.rest, desc: r.descr,
  tips: safeJson(r.tips, []), custom: !!r.custom,
});
const safeJson = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

export async function getWorkoutDetail(id) {
  const db = await getDb();
  const sets = await db.getAllAsync(
    `SELECT ws.*, e.name AS exercise_name FROM workout_sets ws LEFT JOIN exercises e ON e.id = ws.exercise_id
     WHERE workout_id = ? ORDER BY ws.id`, [id]);
  return sets;
}

export async function getExerciseHistory(exerciseId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT w.id AS workout_id, w.started_at AS date, MAX(ws.kg) AS top_kg, MAX(ws.reps) AS top_reps,
            SUM(ws.kg * ws.reps) AS volume, COUNT(*) AS sets
     FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
     WHERE ws.exercise_id = ? GROUP BY w.id ORDER BY w.started_at`, [exerciseId]);
}

// ── Yazma ──
async function insertPlan(db, plan) {
  const id = plan.id || `c${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await db.runAsync('INSERT INTO plans (id, name, focus, preset, created_at) VALUES (?, ?, ?, 0, ?)', [id, plan.name, plan.focus ?? null, Date.now()]);
  await insertItems(db, id, plan.items);
  return id;
}

async function insertItems(db, planId, items) {
  for (const [i, it] of items.entries()) {
    const e = await db.getFirstAsync('SELECT sets, reps, rest FROM exercises WHERE id = ?', [it.exerciseId]);
    if (!e) continue;
    await db.runAsync('INSERT INTO plan_items (plan_id, exercise_id, position, sets, reps, rest) VALUES (?, ?, ?, ?, ?, ?)',
      [planId, it.exerciseId, i, it.sets ?? e.sets, it.reps ?? e.reps, it.rest ?? e.rest]);
  }
}

export async function savePlan(plan) {
  const db = await getDb();
  let id = plan.id;
  await db.withTransactionAsync(async () => {
    if (id) {
      const row = await db.getFirstAsync('SELECT preset FROM plans WHERE id = ?', [id]);
      if (!row || row.preset) throw new Error('Hazır programlar düzenlenemez');
      await db.runAsync('UPDATE plans SET name = ? WHERE id = ?', [plan.name, id]);
      await db.runAsync('DELETE FROM plan_items WHERE plan_id = ?', [id]);
      await insertItems(db, id, plan.items);
    } else {
      id = await insertPlan(db, plan);
    }
  });
  return id;
}

export async function deletePlan(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plans WHERE id = ? AND preset = 0', [id]);
}

async function insertWorkout(db, w) {
  const volume = w.log.reduce((s, e) => s + e.sets.reduce((a, x) => a + (x.kg || 0) * (x.rep ?? x.reps ?? 0), 0), 0);
  const res = await db.runAsync(
    'INSERT INTO workouts (plan_id, plan_name, started_at, duration_sec, volume, kcal) VALUES (?, ?, ?, ?, ?, ?)',
    [w.planId ?? null, w.planName, w.startedAt, w.durationSec || 0, Math.round(volume), w.kcal || 0]);
  const wid = res.lastInsertRowId;
  for (const e of w.log) {
    for (const [i, x] of e.sets.entries()) {
      await db.runAsync('INSERT INTO workout_sets (workout_id, exercise_id, set_no, kg, reps) VALUES (?, ?, ?, ?, ?)',
        [wid, e.exerciseId, i + 1, x.kg || 0, x.rep ?? x.reps ?? 0]);
    }
  }
  return { id: wid, volume: Math.round(volume) };
}

export async function saveWorkout(w) {
  const db = await getDb();
  let out;
  await db.withTransactionAsync(async () => { out = await insertWorkout(db, w); });
  return out;
}

export async function deleteWorkout(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

export async function addMeasurement(m) {
  const db = await getDb();
  await db.runAsync('INSERT INTO measurements (date, weight, waist, chest) VALUES (?, ?, ?, ?)',
    [m.date ?? Date.now(), m.weight ?? null, m.waist ?? null, m.chest ?? null]);
}

export async function deleteMeasurement(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM measurements WHERE id = ?', [id]);
}

export async function setUserName(name) {
  await setSetting(await getDb(), 'user_name', name);
}

export async function resetAll() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM workout_sets; DELETE FROM workouts; DELETE FROM measurements;
      DELETE FROM plans WHERE preset = 0;`);
  });
}

// Yedekleme: tüm kullanıcı verisini JSON olarak dışa aktar
export async function exportAll() {
  const db = await getDb();
  return {
    app: 'demir-fitness', version: SCHEMA_VERSION, exportedAt: Date.now(),
    userName: await getSetting(db, 'user_name'),
    plans: await db.getAllAsync('SELECT * FROM plans WHERE preset = 0'),
    planItems: await db.getAllAsync('SELECT pi.* FROM plan_items pi JOIN plans p ON p.id = pi.plan_id WHERE p.preset = 0'),
    workouts: await db.getAllAsync('SELECT * FROM workouts'),
    workoutSets: await db.getAllAsync('SELECT * FROM workout_sets'),
    measurements: await db.getAllAsync('SELECT * FROM measurements'),
  };
}
