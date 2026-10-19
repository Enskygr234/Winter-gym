import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, formatK, fmtDuration, longDate } from '../data/store';
import { Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

export default function WorkoutDetailScreen({ nav, params }) {
  const { workouts, getWorkoutDetail, deleteWorkout, exercise } = useStore();
  const w = workouts.find((x) => x.id === params.id);
  const [sets, setSets] = useState(null);

  useEffect(() => {
    getWorkoutDetail(params.id).then(setSets).catch(() => setSets([]));
  }, [params.id]);

  if (!w) return null;

  // Setleri harekete göre grupla (sırayı koru)
  const groups = [];
  for (const s of sets || []) {
    let g = groups.find((x) => x.exerciseId === s.exercise_id);
    if (!g) groups.push((g = { exerciseId: s.exercise_id, name: s.exercise_name || s.exercise_id, sets: [] }));
    g.sets.push(s);
  }

  const confirmDelete = () =>
    Alert.alert('Antrenmanı sil', 'Bu antrenman ve tüm setleri silinecek. Rekorların yeniden hesaplanır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { nav.back(); await deleteWorkout(w.id); } },
    ]);

  return (
    <ScrollView contentContainerStyle={st.wrap}>
      <Header
        eyebrow={longDate(w.date)}
        title={w.planName}
        onBack={nav.back}
        right={<Pressable onPress={confirmDelete} hitSlop={10} style={st.trash}><Icon name="delete-outline" size={24} color="#E5534B" /></Pressable>}
      />

      <View style={st.stats}>
        <Stat label="Süre" value={fmtDuration(w.durationSec)} />
        <Stat label="Hacim" value={`${formatK(w.volume)} kg`} />
        <Stat label="Kalori" value={`${w.kcal}`} />
      </View>

      {sets === null && <Text style={st.muted}>Yükleniyor…</Text>}
      {groups.map((g) => {
        const vol = g.sets.reduce((s, x) => s + x.kg * x.reps, 0);
        const bodyweight = exercise(g.exerciseId)?.defaultKg === 0;
        return (
          <View key={g.exerciseId} style={st.card}>
            <Pressable style={st.cardHead} onPress={() => nav.go('exerciseDetail', { id: g.exerciseId })}>
              <Text style={st.exName}>{g.name}</Text>
              <Icon name="chevron-right" size={22} color={colors.dim} />
            </Pressable>
            {g.sets.map((s) => (
              <View key={s.id} style={st.setRow}>
                <View style={st.setNo}><Text style={st.setNoText}>{s.set_no}</Text></View>
                <Text style={st.setText}>{bodyweight && !s.kg ? `${s.reps} tekrar` : `${s.kg} kg × ${s.reps}`}</Text>
              </View>
            ))}
            {vol > 0 && <Text style={[st.muted, { marginTop: 6 }]}>{formatK(vol)} kg hacim</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const Stat = ({ label, value }) => (
  <View style={st.stat}><Text style={st.statVal}>{value}</Text><Text style={st.muted}>{label}</Text></View>
);

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  trash: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  exName: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  setNo: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  setNoText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  setText: { color: colors.textSoft, fontWeight: '700', fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
});
