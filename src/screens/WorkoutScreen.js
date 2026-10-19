import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View,
} from 'react-native';
import { useStore, fmtDuration } from '../data/store';
import { Header, Icon, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

const clock = (sec) =>
  [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((n) => String(n).padStart(2, '0')).join(':');
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const firstNum = (reps, fallback) => parseInt(String(reps).match(/\d+/)?.[0] ?? fallback, 10);

export default function WorkoutScreen({ nav, params }) {
  const { getPlan, exercise, lastSets, saveWorkout } = useStore();
  const plan = getPlan(params.planId);
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(null); // { endAt, total }
  const [saving, setSaving] = useState(false);
  const buzzed = useRef(false);

  // Her hareket için setler; ağırlık/tekrar son antrenmandan gelir
  const [log, setLog] = useState(() =>
    plan.items.map((it) => {
      const ex = exercise(it.exerciseId);
      const prev = lastSets[it.exerciseId] || [];
      return {
        exerciseId: it.exerciseId,
        reps: it.reps,
        restSec: it.rest,
        sets: Array.from({ length: it.sets }, (_, i) => {
          const p = prev[i] || prev[prev.length - 1];
          return {
            kg: String(p?.kg ?? ex.defaultKg),
            rep: String(p?.reps ?? firstNum(it.reps, ex.defaultRep)),
            done: false,
          };
        }),
      };
    })
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const restLeft = rest ? Math.max(0, Math.ceil((rest.endAt - now) / 1000)) : 0;

  // Dinlenme bitince titret
  useEffect(() => {
    if (rest && restLeft === 0 && !buzzed.current) {
      buzzed.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      const t = setTimeout(() => setRest(null), 1500);
      return () => clearTimeout(t);
    }
  }, [rest, restLeft]);

  const startRest = (sec) => {
    buzzed.current = false;
    setRest({ endAt: Date.now() + sec * 1000, total: sec });
  };
  const shiftRest = (d) =>
    setRest((r) => (r ? { endAt: Math.max(Date.now() + 1000, r.endAt + d * 1000), total: Math.max(1, r.total + d) } : r));

  const { total, done } = useMemo(() => {
    const all = log.flatMap((l) => l.sets);
    return { total: all.length, done: all.filter((x) => x.done).length };
  }, [log]);

  const update = (ei, si, p) =>
    setLog((l) => l.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j === si ? { ...x, ...p } : x)) })));

  const toggleDone = (ei, si) => {
    const wasDone = log[ei].sets[si].done;
    update(ei, si, { done: !wasDone });
    if (!wasDone) startRest(log[ei].restSec || 90);
  };

  const addSet = (ei) =>
    setLog((l) => l.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false }] })));
  const removeSet = (ei) =>
    setLog((l) => l.map((e, i) => (i !== ei || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) })));

  const finish = async () => {
    setSaving(true);
    const counted = done > 0 ? (x) => x.done : () => true;
    const cleanLog = log
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.filter(counted).map((x) => ({ kg: parseFloat(x.kg) || 0, rep: parseInt(x.rep, 10) || 0 })).filter((x) => x.rep > 0),
      }))
      .filter((e) => e.sets.length);
    try {
      const res = await saveWorkout({
        planId: plan.id, planName: plan.name, startedAt, durationSec: elapsed,
        kcal: Math.round(plan.kcal * (done > 0 ? done / total : 1)), log: cleanLog,
      });
      const rec = res.records.length ? `\n\n🏆 Yeni rekor!\n${res.records.join('\n')}` : '';
      Alert.alert('Tebrikler! 💪', `${plan.name} tamamlandı.\n${res.volume} kg hacim · ${fmtDuration(elapsed)}${rec}`);
      nav.back();
    } catch (e) {
      setSaving(false);
      Alert.alert('Kaydedilemedi', String(e.message || e));
    }
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
            <Text style={st.timerText}>{clock(elapsed)}</Text>
          </View>
        </View>
        <Header eyebrow="Aktif antrenman" title={plan.name} />
        <View style={st.progress}>
          <View style={[st.progressFill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
        </View>

        {log.map((e, ei) => {
          const ex = exercise(e.exerciseId);
          return (
            <View key={e.exerciseId + ei} style={st.card}>
              <Pressable onPress={() => nav.go('exerciseDetail', { id: e.exerciseId })} style={st.exHead}>
                <View style={{ flex: 1 }}>
                  <Text style={st.exName}>{ex.name}</Text>
                  <Text style={st.exMeta}>{ex.muscle} · hedef {e.sets.length} set × {e.reps} · {e.restSec} sn</Text>
                </View>
                <Icon name="info-outline" size={22} color={colors.muted} />
              </Pressable>
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
                  <Pressable onPress={() => toggleDone(ei, si)} style={[st.check, x.done && st.checkOn]} hitSlop={6}>
                    <Icon name="check" size={20} color={x.done ? '#fff' : colors.muted} />
                  </Pressable>
                </View>
              ))}
              <View style={st.setActions}>
                <Pressable onPress={() => removeSet(ei)} style={st.setAction} hitSlop={6}>
                  <Icon name="remove" size={18} color={colors.muted} />
                  <Text style={[st.setActionText, { color: colors.muted }]}>Set sil</Text>
                </Pressable>
                <Pressable onPress={() => addSet(ei)} style={st.setAction} hitSlop={6}>
                  <Icon name="add" size={18} color={colors.accent} />
                  <Text style={st.setActionText}>Set ekle</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={st.footer}>
        {rest && (
          <View style={st.rest}>
            <View style={[st.restFill, { width: `${(1 - restLeft / rest.total) * 100}%` }]} />
            <Icon name="hourglass-bottom" size={22} color={colors.accentText} />
            <View style={{ flex: 1 }}>
              <Text style={st.restLabel}>{restLeft > 0 ? 'Dinlenme' : 'Sıradaki sete geç!'}</Text>
              <Text style={st.restTime}>{mmss(restLeft)}</Text>
            </View>
            <RestBtn label="−15" onPress={() => shiftRest(-15)} />
            <RestBtn label="+15" onPress={() => shiftRest(15)} />
            <RestBtn label="Atla" onPress={() => setRest(null)} />
          </View>
        )}
        <PrimaryButton label={saving ? 'Kaydediliyor…' : 'Antrenmanı bitir'} icon="sports-score" disabled={saving} onPress={confirmFinish} />
      </View>
    </KeyboardAvoidingView>
  );
}

const RestBtn = ({ label, onPress }) => (
  <Pressable onPress={onPress} style={st.restBtn} hitSlop={4}><Text style={st.restBtnText}>{label}</Text></Pressable>
);

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
  exHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  exName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  exMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
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
  setActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  setAction: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  setActionText: { color: colors.accent, fontWeight: '800' },
  footer: { padding: 22, paddingTop: 10, gap: 10 },
  rest: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2A1A15', borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accentSoft, paddingHorizontal: 14, height: 64, overflow: 'hidden',
  },
  restFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.accentSoft },
  restLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  restTime: { color: colors.text, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  restBtn: { backgroundColor: colors.input, borderRadius: radius.sm, paddingHorizontal: 12, height: 40, justifyContent: 'center' },
  restBtnText: { color: colors.textSoft, fontWeight: '800' },
});
