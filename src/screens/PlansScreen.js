import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../data/store';
import { Header, Icon, OutlineButton, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

export default function PlansScreen({ nav }) {
  const { plans } = useStore();
  const presets = plans.filter((p) => p.preset);
  const mine = plans.filter((p) => !p.preset);

  return (
    <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
      <Header eyebrow="Programların" title="Planlar" subtitle="Bugünkü hedefini seç ve her sette biraz daha ileri git." />

      {mine.length > 0 && <Text style={st.section}>KENDİ PLANLARIN</Text>}
      {mine.map((p) => (
        <PlanCard key={p.id} plan={p} nav={nav} action={{ icon: 'edit', onPress: () => nav.go('planEditor', { planId: p.id }) }} />
      ))}

      <OutlineButton label="Kendi planını oluştur" icon="add" onPress={() => nav.go('planEditor', {})} style={{ marginBottom: 28 }} />

      <Text style={st.section}>HAZIR PROGRAMLAR</Text>
      {presets.map((p) => (
        <PlanCard key={p.id} plan={p} nav={nav} action={{ icon: 'content-copy', onPress: () => nav.go('planEditor', { copyFrom: p.id }) }} />
      ))}
      <Text style={st.hint}>Hazır programları kopyalayıp kendine göre düzenleyebilirsin.</Text>
    </ScrollView>
  );
}

function PlanCard({ plan, nav, action }) {
  return (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>{plan.name}</Text>
          <Text style={st.focus}>{plan.focus}</Text>
        </View>
        <Pressable onPress={action.onPress} hitSlop={6} style={st.iconBox}>
          <Icon name={action.icon} size={22} color={colors.accent} />
        </Pressable>
      </View>
      <View style={st.meta}>
        <Meta icon="schedule" text={`${plan.minutes} dk`} />
        <Meta icon="local-fire-department" text={`${plan.kcal} kcal`} />
        <Meta icon="format-list-numbered" text={`${plan.items.length} hareket`} />
      </View>
      <PrimaryButton label="Antrenmanı başlat" icon="play-arrow" disabled={!plan.items.length} onPress={() => nav.go('workout', { planId: plan.id })} />
    </View>
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
    padding: 22, marginBottom: 20,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  focus: { color: colors.muted, fontSize: 15, marginTop: 4 },
  iconBox: {
    width: 50, height: 50, borderRadius: radius.sm, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  meta: { flexDirection: 'row', gap: 22, marginVertical: 18 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSoft, fontWeight: '800', fontSize: 15 },
  hint: { color: colors.dim, fontSize: 13, textAlign: 'center', marginTop: 4 },
});
