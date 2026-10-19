import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, planFocus } from '../data/store';
import { DumbbellIcon, Header, Icon, OutlineButton, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

export default function PlansScreen({ nav }) {
  const { plans, deletePlan } = useStore();
  const presets = plans.filter((p) => p.preset);
  const mine = plans.filter((p) => !p.preset);

  const confirmDelete = (plan) =>
    Alert.alert('Planı sil', `"${plan.name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deletePlan(plan.id) },
    ]);

  return (
    <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
      <Header eyebrow="Programların" title="Planlar" subtitle="Bugünkü hedefini seç ve her sette biraz daha ileri git." />

      <Text style={st.section}>HAZIR PROGRAMLAR</Text>
      {presets.map((p) => <PlanCard key={p.id} plan={p} nav={nav} />)}

      {mine.length > 0 && <Text style={[st.section, { marginTop: 10 }]}>KENDİ PLANLARIN</Text>}
      {mine.map((p) => <PlanCard key={p.id} plan={p} nav={nav} onLongPress={() => confirmDelete(p)} />)}

      <OutlineButton label="Kendi planını oluştur" icon="add" onPress={() => nav.go('createPlan')} />
      {mine.length > 0 && <Text style={st.hint}>Kendi planını silmek için kartın üstüne basılı tut.</Text>}
    </ScrollView>
  );
}

function PlanCard({ plan, nav, onLongPress }) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={400} style={st.card}>
      <View style={st.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>{plan.name}</Text>
          <Text style={st.focus}>{planFocus(plan)}</Text>
        </View>
        <View style={st.iconBox}><DumbbellIcon size={24} /></View>
      </View>
      <View style={st.meta}>
        <Meta icon="schedule" text={`${plan.minutes} dk`} />
        <Meta icon="local-fire-department" text={`${plan.kcal} kcal`} />
        <Meta icon="format-list-numbered" text={`${plan.exerciseIds.length} hareket`} />
      </View>
      <PrimaryButton label="Antrenmanı başlat" icon="play-arrow" onPress={() => nav.go('workout', { planId: plan.id })} />
    </Pressable>
  );
}

const Meta = ({ icon, text }) => (
  <View style={st.metaItem}>
    <Icon name={icon} size={18} color={colors.muted} />
    <Text style={st.metaText}>{text}</Text>
  </View>
);

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  section: { color: colors.muted, fontWeight: '800', letterSpacing: 1.4, fontSize: 14, marginBottom: 16 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 22, marginBottom: 24,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  focus: { color: colors.muted, fontSize: 15, marginTop: 4 },
  iconBox: {
    width: 54, height: 54, borderRadius: radius.sm, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  meta: { flexDirection: 'row', gap: 22, marginVertical: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSoft, fontWeight: '800', fontSize: 15 },
  hint: { color: colors.dim, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
