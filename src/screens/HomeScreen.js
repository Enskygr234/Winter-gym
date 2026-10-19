import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, formatK } from '../data/store';
import { Badge, DumbbellIcon, Icon, OutlineButton } from '../components/ui';
import { colors, radius, type } from '../theme';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function HomeScreen({ nav }) {
  const { userName, plans, weekly, streak, workouts } = useStore();
  // Öneri: en son yapılan planın sıradaki planı; hiç yoksa ilk plan
  const last = workouts[workouts.length - 1];
  const lastIdx = last ? plans.findIndex((p) => p.id === last.planId) : -1;
  const today = plans[(lastIdx + 1) % plans.length];
  const dayName = DAYS[new Date().getDay()];

  return (
    <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
      <View style={st.top}>
        <View style={{ flex: 1 }}>
          <Text style={st.brand}>{`DEMİR FITNESS / ${dayName.toLocaleUpperCase('tr-TR')}`}</Text>
          <Text style={type.h1}>Hoş geldin, {userName}.</Text>
        </View>
        <Pressable style={st.avatar} onPress={() => nav.tab('profile')}>
          <Text style={st.avatarText}>{(userName[0] || '?').toLocaleUpperCase('tr-TR')}</Text>
        </Pressable>
      </View>

      <View style={st.hero}>
        <View style={st.heroCircle} />
        <Badge icon="local-fire-department" label={streak > 0 ? `${streak} GÜN SERİ` : 'SERİYE BAŞLA'} />
        <Text style={st.heroTitle}>Bugün güç sende.</Text>
        <Text style={st.heroSub}>Planını tamamla, ritmini koru.</Text>
        <View style={st.heroBottom}>
          <View style={{ flex: 1 }}>
            <Text style={st.heroPlan}>{today.name}</Text>
            <Text style={st.heroPlan}>{today.minutes} dk · {today.kcal} kcal</Text>
          </View>
          <Pressable style={st.startBtn} onPress={() => nav.go('workout', { planId: today.id })}>
            <Icon name="play-arrow" size={24} color="#fff" />
            <Text style={st.startText}>Başlat</Text>
          </Pressable>
        </View>
      </View>

      <View style={st.sectionRow}>
        <Text style={type.h2}>Bu haftanın özeti</Text>
        <Pressable onPress={() => nav.tab('progress')} hitSlop={8}>
          <Text style={st.link}>Detaylar</Text>
        </Pressable>
      </View>
      <View style={st.stats}>
        <Stat label="HAFTALIK HACİM" value={formatK(weekly.volume)} unit="kg toplam" />
        <Stat label="ANTRENMAN" value={String(weekly.count).padStart(2, '0')} unit="bu hafta" />
        <Stat label="KALORİ" value={formatK(weekly.kcal)} unit="kcal yakıldı" />
      </View>

      <Text style={[type.h2, { marginTop: 30, marginBottom: 16 }]}>Hızlı erişim</Text>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <OutlineButton style={{ flex: 1 }} label="Hareketler" iconNode={<DumbbellIcon />} onPress={() => nav.go('exercises')} />
        <OutlineButton style={{ flex: 1 }} label="Plan oluştur" icon="add-circle-outline" onPress={() => nav.go('planEditor')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 14 }}>
        <OutlineButton style={{ flex: 1 }} label="Geçmiş" icon="history" onPress={() => nav.go('history')} />
        <OutlineButton style={{ flex: 1 }} label="Rekorlar" icon="emoji-events" onPress={() => nav.go('records')} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, unit }) {
  return (
    <View style={st.stat}>
      <Text style={st.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statUnit} numberOfLines={1}>{unit}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  brand: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft,
    borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.accentText, fontWeight: '800', fontSize: 18 },
  hero: {
    backgroundColor: '#211E22', borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    padding: 24, overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.accentSoft,
    top: -70, right: -40,
  },
  heroTitle: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 20 },
  heroSub: { color: colors.muted, fontSize: 16, marginTop: 6 },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 40 },
  heroPlan: { color: colors.textSoft, fontWeight: '800', fontSize: 15, lineHeight: 21 },
  startBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 22, height: 56,
  },
  startText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 16 },
  link: { color: colors.accent, fontWeight: '800', fontSize: 15 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 16,
  },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '800', marginVertical: 6 },
  statUnit: { color: colors.muted, fontSize: 13 },
});
