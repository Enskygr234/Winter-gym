import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../data/store';
import { findExercise } from '../data/defaults';
import { Header, Icon, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

const fmt = (sec) =>
  [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((n) => String(n).padStart(2, '0')).join(':');

export default function WorkoutScreen({ nav, params }) {
  const { getPlan, workouts, saveWorkout } = useStore();
  const plan = getPlan(params.planId);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Her hareket için setler; ağırlıklar son antrenmandan gelir
  const [log, setLog] = useState(() =>
    plan.exerciseIds.map((id) => {
      const ex = findExercise(id);
      const prev = [...workouts].reverse().flatMap((w) => w.log || []).find((l) => l.exerciseId === id);
      return {
        exerciseId: id,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          kg: String(prev?.sets[i]?.kg ?? ex.defaultKg),
          rep: String(prev?.sets[i]?.rep ?? ex.defaultRep),
          done: false,
        })),
      };
    })
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const { total, done } = useMemo(() => {
    const all = log.flatMap((l) => l.sets);
    return { total: all.length, done: all.filter((x) => x.done).length };
  }, [log]);

  const update = (ei, si, patch) =>
    setLog((l) => l.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j === si ? { ...x, ...patch } : x)) })));

  const addSet = (ei) =>
    setLog((l) => l.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false }] })));

  const finish = () => {
    const counted = done > 0 ? (x) => x.done : () => true;
    const cleanLog = log.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.filter(counted).map((x) => ({ kg: parseFloat(x.kg) || 0, rep: parseInt(x.rep, 10) || 0 })),
    }));
    const volume = cleanLog.reduce((s, e) => s + e.sets.reduce((a, x) => a + x.kg * x.rep, 0), 0);
    const ratio = done > 0 ? done / total : 1;
    saveWorkout({
      planId: plan.id,
      planName: plan.name,
      date: Date.now(),
      durationSec: elapsed,
      volume: Math.round(volume),
      kcal: Math.round(plan.kcal * ratio),
      log: cleanLog,
    });
    Alert.alert('Tebrikler! 💪', `${plan.name} tamamlandı.\n${Math.round(volume)} kg hacim · ${fmt(elapsed)}`);
    nav.back();
  };

  const confirmFinish = () =>
    Alert.alert('Antrenmanı bitir', done === 0 ? 'Hiç set işaretlemedin, tüm setler kaydedilecek.' : `${done}/${total} set tamamlandı.`, [
      { text: 'Devam et', style: 'cancel' },
      { text: 'Bitir', onPress: finish },
    ]);

  const confirmLeave = () =>
    Alert.alert('Çıkılsın mı?', 'Bu antrenman kaydedilmeyecek.', [
      { text: 'Kal', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: nav.back },
    ]);

  useEffect(() => {
    nav.setBackHandler(confirmLeave); // Android geri tuşu
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <View style={st.topRow}>
          <Pressable onPress={confirmLeave} style={st.back} hitSlop={8}>
            <Icon name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={st.timer}>
            <Icon name="timer" size={18} color={colors.accent} />
            <Text style={st.timerText}>{fmt(elapsed)}</Text>
          </View>
        </View>
        <Header eyebrow="Aktif antrenman" title={plan.name} />
        <View style={st.progress}>
          <View style={[st.progressFill, { width: `${(done / total) * 100}%` }]} />
        </View>

        {log.map((e, ei) => {
          const ex = findExercise(e.exerciseId);
          return (
            <View key={e.exerciseId} style={st.card}>
              <Text style={st.exName}>{ex.name}</Text>
              <Text style={st.exMeta}>{ex.muscle} · hedef {ex.sets} set × {ex.reps}</Text>
              {e.sets.map((x, si) => (
                <View key={si} style={[st.setRow, x.done && { opacity: 0.55 }]}>
                  <View style={st.setNo}><Text style={st.setNoText}>{si + 1}</Text></View>
                  <TextInput
                    style={st.input} value={x.kg} keyboardType="decimal-pad" selectTextOnFocus
                    onChangeText={(kg) => update(ei, si, { kg: kg.replace(',', '.') })}
                  />
                  <Text style={st.unit}>kg</Text>
                  <TextInput
                    style={st.input} value={x.rep} keyboardType="number-pad" selectTextOnFocus
                    onChangeText={(rep) => update(ei, si, { rep })}
                  />
                  <Text style={st.unit}>rep</Text>
                  <Pressable onPress={() => update(ei, si, { done: !x.done })} style={[st.check, x.done && st.checkOn]} hitSlop={6}>
                    <Icon name="check" size={20} color={x.done ? '#fff' : colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => addSet(ei)} style={st.addSet}>
                <Icon name="add" size={18} color={colors.accent} />
                <Text style={st.addSetText}>Set ekle</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <View style={st.footer}>
        <PrimaryButton label="Antrenmanı bitir" icon="sports-score" onPress={confirmFinish} />
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 30 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  back: {
    width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentSoft,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  timerText: { color: colors.accentText, fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.input, marginTop: -6, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 18, marginBottom: 24,
  },
  exName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  exMeta: { color: colors.muted, fontSize: 14, marginTop: 3, marginBottom: 14 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  setNo: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  setNoText: { color: colors.muted, fontWeight: '800' },
  input: {
    flex: 1, height: 52, backgroundColor: colors.input, borderRadius: radius.sm, paddingHorizontal: 14,
    color: colors.text, fontWeight: '800', fontSize: 17,
  },
  unit: { color: colors.muted, fontSize: 12 },
  check: { width: 44, height: 52, borderRadius: radius.sm, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 6 },
  addSetText: { color: colors.accent, fontWeight: '800' },
  footer: { padding: 22, paddingTop: 10 },
});
