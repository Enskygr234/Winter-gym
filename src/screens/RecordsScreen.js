import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../data/store';
import { Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

export default function RecordsScreen({ nav }) {
  const { prs, exercise } = useStore();
  const rows = Object.entries(prs)
    .map(([id, pr]) => ({ id, pr, ex: exercise(id) }))
    .filter((r) => r.ex)
    .sort((a, b) => (b.pr.e1rm || 0) - (a.pr.e1rm || 0) || b.pr.maxReps - a.pr.maxReps);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      contentContainerStyle={st.wrap}
      ListHeaderComponent={<Header eyebrow="Kişisel en iyiler" title="Rekorlar" onBack={nav.back} />}
      ListEmptyComponent={
        <View style={st.empty}>
          <Icon name="emoji-events" size={40} color={colors.dim} />
          <Text style={st.muted}>Antrenman bitirdikçe her hareketteki en iyi derecen burada toplanır.</Text>
        </View>
      }
      renderItem={({ item: { id, pr, ex }, index }) => (
        <Pressable style={st.row} onPress={() => nav.go('exerciseDetail', { id })}>
          <View style={[st.rank, index < 3 && { backgroundColor: colors.accentSoft }]}>
            {index < 3 ? <Icon name="emoji-events" size={20} color={colors.accent} /> : <Text style={st.rankText}>{index + 1}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.name} numberOfLines={1}>{ex.name}</Text>
            <Text style={st.muted}>{ex.group}{pr.e1rm ? ` · Tahmini 1RM ${Math.round(pr.e1rm)} kg` : ''}</Text>
          </View>
          <Text style={st.val}>{pr.maxKg > 0 ? `${pr.maxKg} kg` : `${pr.maxReps} tekrar`}</Text>
        </Pressable>
      )}
    />
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10,
  },
  rank: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: colors.muted, fontWeight: '800' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 2 },
  val: { color: colors.accentText, fontWeight: '800', fontSize: 16 },
  muted: { color: colors.muted, fontSize: 13 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
});
