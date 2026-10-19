import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from './db';

const LEGACY_KEY = 'demir-fitness:v1';
const DAY = 24 * 60 * 60 * 1000;
const StoreContext = createContext(null);

const dayKey = (t) => new Date(t).toDateString();
function startOfWeek(t = Date.now()) {
  const d = new Date(t);
  const diff = (d.getDay() + 6) % 7; // Pazartesi başlangıç
  d.setHours(0, 0, 0, 0);
  return d.getTime() - diff * DAY;
}

export const estimate = (items) => {
  const sets = items.reduce((s, i) => s + (i.sets || 0), 0);
  const restSec = items.reduce((s, i) => s + (i.sets || 0) * (i.rest || 90), 0);
  return { minutes: Math.max(10, Math.round((sets * 45 + restSec) / 60)), kcal: Math.round(sets * 26) };
};

export function StoreProvider({ children }) {
  const [snap, setSnap] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => setSnap(await db.loadSnapshot()), []);

  useEffect(() => {
    (async () => {
      try {
        await db.getDb();
        const raw = await AsyncStorage.getItem(LEGACY_KEY).catch(() => null);
        if (await db.migrateLegacy(raw)) await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
        await refresh();
      } catch (e) {
        setError(String(e?.message || e));
      }
    })();
  }, [refresh]);

  const api = useMemo(() => {
    if (!snap) return { ready: false, error };
    const exMap = Object.fromEntries(snap.exercises.map((e) => [e.id, e]));
    const plans = snap.plans.map((p) => {
      const items = p.items.filter((i) => exMap[i.exerciseId]);
      const focus = p.focus || [...new Set(items.map((i) => exMap[i.exerciseId].group))].join(' · ');
      return { ...p, items, focus, ...estimate(items) };
    });

    const weekStart = startOfWeek();
    const week = snap.workouts.filter((w) => w.date >= weekStart);
    const weekly = {
      volume: week.reduce((s, w) => s + w.volume, 0),
      count: week.length,
      kcal: week.reduce((s, w) => s + w.kcal, 0),
    };

    // Seri: bugünden (ya da dünden) geriye kesintisiz antrenman günleri
    const days = new Set(snap.workouts.map((w) => dayKey(w.date)));
    let streak = 0;
    let cursor = Date.now();
    if (!days.has(dayKey(cursor))) cursor -= DAY;
    while (days.has(dayKey(cursor))) { streak += 1; cursor -= DAY; }

    const run = (fn) => async (...args) => { const r = await fn(...args); await refresh(); return r; };

    return {
      ready: true,
      ...snap,
      plans,
      weekly,
      streak,
      exercise: (id) => exMap[id],
      getPlan: (id) => plans.find((p) => p.id === id),
      setUserName: run(db.setUserName),
      savePlan: run(db.savePlan),
      deletePlan: run(db.deletePlan),
      deleteWorkout: run(db.deleteWorkout),
      addMeasurement: run(db.addMeasurement),
      deleteMeasurement: run(db.deleteMeasurement),
      reset: run(db.resetAll),
      // Antrenmanı kaydeder, kırılan rekorları döndürür
      saveWorkout: async (w) => {
        const records = [];
        for (const e of w.log) {
          const pr = snap.prs[e.exerciseId];
          const ex = exMap[e.exerciseId];
          const topKg = Math.max(0, ...e.sets.map((x) => x.kg));
          const topRep = Math.max(0, ...e.sets.map((x) => x.rep));
          if (topKg > 0 && topKg > (pr?.maxKg || 0)) records.push(`${ex.name}: ${topKg} kg`);
          else if (topKg === 0 && topRep > (pr?.maxReps || 0) && pr) records.push(`${ex.name}: ${topRep} tekrar`);
        }
        const saved = await db.saveWorkout(w);
        await refresh();
        return { ...saved, records };
      },
      getWorkoutDetail: db.getWorkoutDetail,
      getExerciseHistory: db.getExerciseHistory,
      exportAll: db.exportAll,
    };
  }, [snap, error, refresh]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

export const formatK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 2)}K` : `${Math.round(n)}`);

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const shortDate = (t) => {
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
};
export const longDate = (t) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const fmtDuration = (sec) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`;
};
