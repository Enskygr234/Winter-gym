import React from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useStore, formatK, fmtDuration } from '../data/store';
import { Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export default function HistoryScreen({ nav }) {
  const { workouts } = useStore();

  const sections = [];
  for (const w of [...workouts].reverse()) {
    const d = new Date(w.date);
    const title = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    let s = sections[sections.length - 1];
    if (!s || s.title !== title) sections.push((s = { title, data: [], volume: 0 }));
    s.data.push(w);
    s.volume += w.volume;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(w) => String(w.id)}
      contentContainerStyle={st.wrap}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<Header eyebrow={`${workouts.length} antrenman`} title="Geçmiş" onBack={nav.back} />}
      ListEmptyComponent={
        <View style={st.empty}>
          <Icon name="event-note" size={40} color={colors.dim} />
          <Text style={st.muted}>Henüz antrenman yok. İlk antrenmanını bitirdiğinde burada görünecek.</Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={st.secHead}>
          <Text style={st.secTitle}>{section.title.toLocaleUpperCase('tr-TR')}</Text>
          <Text style={st.secMeta}>{section.data.length} antrenman · {formatK(section.volume)} kg</Text>
        </View>
      )}
      renderItem={({ item: w }) => {
        const d = new Date(w.date);
        return (
          <Pressable style={st.row} onPress={() => nav.go('workoutDetail', { id: w.id })}>
            <View style={st.date}>
              <Text style={st.day}>{d.getDate()}</Text>
              <Text style={st.dow}>{DAYS[d.getDay()]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name} numberOfLines={1}>{w.planName}</Text>
              <Text style={st.muted}>{fmtDuration(w.durationSec)} · {w.kcal} kcal</Text>
            </View>
            <Text style={st.vol}>{formatK(w.volume)} kg</Text>
            <Icon name="chevron-right" size={22} color={colors.dim} />
          </Pressable>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, marginBottom: 12 },
  secTitle: { color: colors.muted, fontWeight: '800', letterSpacing: 1.2, fontSize: 13 },
  secMeta: { color: colors.dim, fontSize: 12, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10,
  },
  date: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.accentText, fontWeight: '800', fontSize: 18 },
  dow: { color: colors.accentText, fontSize: 11, fontWeight: '700' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 2 },
  vol: { color: colors.textSoft, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, textAlign: 'left' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
});
