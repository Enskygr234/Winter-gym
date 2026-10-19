import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore, estimate } from '../data/store';
import { Header, Icon, OutlineButton, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

// params.planId → mevcut planı düzenle · params.copyFrom → hazır planı kopyalayıp başla
export default function PlanEditorScreen({ nav, params }) {
  const { getPlan, exercise, savePlan, deletePlan } = useStore();
  const source = getPlan(params.planId || params.copyFrom);
  const editing = !!params.planId;
  const [name, setName] = useState(editing ? source.name : source ? `${source.name} (kopya)` : '');
  const [items, setItems] = useState(() => (source ? source.items.map((i) => ({ ...i })) : []));
  const [saving, setSaving] = useState(false);

  const est = estimate(items);
  const canSave = name.trim() && items.length && !saving;

  const patch = (idx, p) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...p } : it)));
  const move = (idx, dir) =>
    setItems((list) => {
      const j = idx + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  const remove = (idx) => setItems((list) => list.filter((_, i) => i !== idx));

  const addExercises = () =>
    nav.go('exercises', {
      pick: true,
      exclude: items.map((i) => i.exerciseId),
      onPick: (ids) =>
        setItems((list) => [
          ...list,
          ...ids.map((id) => {
            const e = exercise(id);
            return { exerciseId: id, sets: e.sets, reps: e.reps, rest: e.rest };
          }),
        ]),
    });

  const save = async () => {
    setSaving(true);
    try {
      await savePlan({ id: editing ? params.planId : undefined, name: name.trim(), items });
      nav.back();
      nav.tab('plans');
    } catch (e) {
      Alert.alert('Kaydedilemedi', String(e.message || e));
      setSaving(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert('Planı sil', `"${name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deletePlan(params.planId); nav.back(); } },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <Header
          eyebrow="Kişisel program"
          title={editing ? 'Planı düzenle' : 'Plan oluştur'}
          onBack={nav.back}
          right={editing ? (
            <Pressable onPress={confirmDelete} hitSlop={10} style={st.trash}><Icon name="delete-outline" size={24} color="#E5534B" /></Pressable>
          ) : null}
        />

        <Text style={st.label}>Plan adı</Text>
        <TextInput
          value={name} onChangeText={setName} placeholder="Örn. Pazartesi Güç" placeholderTextColor={colors.dim}
          style={st.input} maxLength={40}
        />

        <View style={st.labelRow}>
          <Text style={st.label}>Hareketler</Text>
          {items.length > 0 && <Text style={st.est}>~{est.minutes} dk · {est.kcal} kcal</Text>}
        </View>

        {items.length === 0 && <Text style={st.muted}>Henüz hareket yok. Aşağıdan ekle.</Text>}

        {items.map((it, idx) => {
          const e = exercise(it.exerciseId);
          return (
            <View key={`${it.exerciseId}-${idx}`} style={st.item}>
              <View style={st.itemHead}>
                <View style={st.order}><Text style={st.orderText}>{idx + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={st.name} numberOfLines={1}>{e.name}</Text>
                  <Text style={st.muted}>{e.muscle}</Text>
                </View>
                <IconBtn icon="keyboard-arrow-up" onPress={() => move(idx, -1)} disabled={idx === 0} />
                <IconBtn icon="keyboard-arrow-down" onPress={() => move(idx, 1)} disabled={idx === items.length - 1} />
                <IconBtn icon="close" onPress={() => remove(idx)} />
              </View>
              <View style={st.controls}>
                <Stepper label="Set" value={String(it.sets)} onMinus={() => patch(idx, { sets: Math.max(1, it.sets - 1) })} onPlus={() => patch(idx, { sets: Math.min(10, it.sets + 1) })} />
                <View style={st.control}>
                  <Text style={st.ctrlLabel}>Tekrar</Text>
                  <TextInput value={it.reps} onChangeText={(reps) => patch(idx, { reps })} style={st.repsInput} maxLength={10} />
                </View>
                <Stepper label="Dinlenme" value={`${Math.floor(it.rest / 60)}:${String(it.rest % 60).padStart(2, "0")}`} onMinus={() => patch(idx, { rest: Math.max(15, it.rest - 15) })} onPlus={() => patch(idx, { rest: Math.min(600, it.rest + 15) })} />
              </View>
            </View>
          );
        })}

        <OutlineButton label="Hareket ekle" icon="add" onPress={addExercises} style={{ height: 60, marginTop: 4 }} />
        <Text style={st.note}>Planın telefondaki veritabanında saklanır. Planlar sekmesinden başlatabilirsin.</Text>
      </ScrollView>
      <View style={st.footer}>
        <PrimaryButton label={editing ? 'Değişiklikleri kaydet' : 'Planı kaydet'} icon="save" disabled={!canSave} onPress={save} />
      </View>
    </View>
  );
}

const IconBtn = ({ icon, onPress, disabled }) => (
  <Pressable onPress={onPress} disabled={disabled} hitSlop={6} style={[st.iconBtn, disabled && { opacity: 0.3 }]}>
    <Icon name={icon} size={22} color={colors.textSoft} />
  </Pressable>
);

const Stepper = ({ label, value, onMinus, onPlus }) => (
  <View style={st.control}>
    <Text style={st.ctrlLabel}>{label}</Text>
    <View style={st.stepper}>
      <Pressable onPress={onMinus} hitSlop={6} style={st.stepBtn}><Icon name="remove" size={18} color={colors.textSoft} /></Pressable>
      <Text style={st.stepVal} numberOfLines={1}>{value}</Text>
      <Pressable onPress={onPlus} hitSlop={6} style={st.stepBtn}><Icon name="add" size={18} color={colors.textSoft} /></Pressable>
    </View>
  </View>
);

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 30 },
  trash: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textSoft, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 },
  est: { color: colors.accentText, fontWeight: '800', fontSize: 14 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    height: 62, paddingHorizontal: 18, color: colors.text, fontSize: 17,
  },
  item: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  order: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  orderText: { color: colors.accentText, fontWeight: '800' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', gap: 8, marginTop: 14 },
  control: { flex: 1 },
  ctrlLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderRadius: radius.sm, height: 44 },
  stepBtn: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepVal: { flex: 1, textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 14 },
  repsInput: { backgroundColor: colors.input, borderRadius: radius.sm, height: 44, textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 14 },
  footer: { padding: 22, paddingTop: 10 },
});
