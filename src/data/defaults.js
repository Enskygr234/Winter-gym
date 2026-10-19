export const EXERCISES = [
  { id: 'bench', name: 'Bench Press', muscle: 'Göğüs', group: 'Göğüs', equipment: 'Barbell', sets: 4, reps: '8–10', level: 'Orta', defaultKg: 20, defaultRep: 8 },
  { id: 'squat', name: 'Barbell Squat', muscle: 'Bacak', group: 'Bacak', equipment: 'Barbell', sets: 4, reps: '6–8', level: 'Orta', defaultKg: 30, defaultRep: 6 },
  { id: 'latpull', name: 'Lat Pulldown', muscle: 'Sırt', group: 'Sırt', equipment: 'Cable', sets: 3, reps: '10–12', level: 'Başlangıç', defaultKg: 20, defaultRep: 10 },
  { id: 'ohp', name: 'Shoulder Press', muscle: 'Omuz', group: 'Omuz', equipment: 'Dumbbell', sets: 3, reps: '8–10', level: 'Orta', defaultKg: 10, defaultRep: 8 },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Arka bacak', group: 'Bacak', equipment: 'Barbell', sets: 3, reps: '8–10', level: 'İleri', defaultKg: 40, defaultRep: 8 },
  { id: 'row', name: 'Cable Row', muscle: 'Sırt', group: 'Sırt', equipment: 'Cable', sets: 3, reps: '10–12', level: 'Başlangıç', defaultKg: 25, defaultRep: 10 },
];

export const PRESET_PLANS = [
  { id: 'upper', name: 'Üst Vücut Güç', focus: 'Göğüs · Sırt · Omuz', minutes: 42, kcal: 320, exerciseIds: ['bench', 'latpull', 'ohp'], preset: true },
  { id: 'lower', name: 'Alt Vücut Power', focus: 'Bacak · Core', minutes: 38, kcal: 360, exerciseIds: ['squat', 'rdl'], preset: true },
];

export const MUSCLE_FILTERS = ['Tümü', 'Göğüs', 'Sırt', 'Bacak', 'Omuz'];

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

// Örnek başlangıç verisi — Profil > "Verileri sıfırla" ile temizlenebilir.
export const SEED_MEASUREMENTS = [
  { id: 'm1', date: now - 28 * day, weight: 78.4, waist: 86, chest: 101 },
  { id: 'm2', date: now - 21 * day, weight: 77.6, waist: 85, chest: 101 },
  { id: 'm3', date: now - 14 * day, weight: 77.0, waist: 84.5, chest: 102 },
  { id: 'm4', date: now - 7 * day, weight: 76.5, waist: 84, chest: 102 },
  { id: 'm5', date: now - 1 * day, weight: 76.1, waist: 83.5, chest: 102.5 },
];

export const findExercise = (id) => EXERCISES.find((e) => e.id === id);

export const estimatePlan = (exerciseIds) => {
  const sets = exerciseIds.reduce((s, id) => s + (findExercise(id)?.sets || 0), 0);
  return { minutes: Math.max(10, Math.round(sets * 3.2)), kcal: Math.round(sets * 26) };
};
