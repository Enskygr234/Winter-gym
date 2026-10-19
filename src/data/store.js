import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRESET_PLANS, SEED_MEASUREMENTS, findExercise } from './defaults';

const KEY = 'demir-fitness:v1';
const initial = { userName: 'Efe', customPlans: [], workouts: [], measurements: SEED_MEASUREMENTS };

const StoreContext = createContext(null);

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (t) => new Date(t).toDateString();

function startOfWeek(t = Date.now()) {
  const d = new Date(t);
  const diff = (d.getDay() + 6) % 7; // Pazartesi başlangıç
  d.setHours(0, 0, 0, 0);
  return d.getTime() - diff * DAY;
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState({ ...initial, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const api = useMemo(() => {
    const plans = [...PRESET_PLANS, ...state.customPlans];

    const weekStart = startOfWeek();
    const weekWorkouts = state.workouts.filter((w) => w.date >= weekStart);
    const weekly = {
      volume: weekWorkouts.reduce((s, w) => s + w.volume, 0),
      count: weekWorkouts.length,
      kcal: weekWorkouts.reduce((s, w) => s + w.kcal, 0),
    };

    // Seri: bugünden (ya da dünden) geriye kesintisiz antrenman günleri
    const days = new Set(state.workouts.map((w) => dayKey(w.date)));
    let streak = 0;
    let cursor = Date.now();
    if (!days.has(dayKey(cursor))) cursor -= DAY;
    while (days.has(dayKey(cursor))) {
      streak += 1;
      cursor -= DAY;
    }

    return {
      ...state,
      ready,
      plans,
      weekly,
      streak,
      getPlan: (id) => plans.find((p) => p.id === id),
      setUserName: (userName) => setState((s) => ({ ...s, userName })),
      addPlan: (plan) =>
        setState((s) => ({ ...s, customPlans: [...s.customPlans, { ...plan, id: `c${Date.now()}` }] })),
      deletePlan: (id) => setState((s) => ({ ...s, customPlans: s.customPlans.filter((p) => p.id !== id) })),
      saveWorkout: (w) => setState((s) => ({ ...s, workouts: [...s.workouts, { ...w, id: `w${Date.now()}` }] })),
      addMeasurement: (m) =>
        setState((s) => ({ ...s, measurements: [...s.measurements, { ...m, id: `m${Date.now()}`, date: Date.now() }] })),
      reset: () => setState({ ...initial, measurements: [] }),
    };
  }, [state, ready]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

export const planFocus = (plan) =>
  plan.focus || [...new Set(plan.exerciseIds.map((id) => findExercise(id)?.muscle))].join(' · ');

export const formatK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 2)}K` : `${Math.round(n)}`);
