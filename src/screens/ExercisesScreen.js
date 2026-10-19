import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EXERCISES, MUSCLE_FILTERS } from '../data/defaults';
import { DumbbellIcon, Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

const norm = (t) => t.toLocaleLowerCase('tr-TR');

export default function ExercisesScreen({ nav }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Tümü');

  const list = EXERCISES.filter(
    (e) => (filter === 'Tümü' || e.group === filter || e.muscle === filter) && norm(e.name + e.muscle + e.equipment).includes(norm(q.trim()))
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(e) => e.id}
      contentContainerStyle={st.wrap}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <Header eyebrow="Hareket kütüphanesi" title="Hareketler" onBack={nav.back} />
          <View style={st.search}>
            <Icon name="search" size={24} color={colors.muted} />
            <TextInput
              value={q} onChangeText={setQ} placeholder="Hareket ara..." placeholderTextColor={colors.dim}
              style={st.searchInput} returnKeyType="search"
            />
            {q ? <Pressable onPress={() => setQ('')} hitSlop={8}><Icon name="close" size={20} color={colors.muted} /></Pressable> : null}
          </View>
          <View style={st.chips}>
            {MUSCLE_FILTERS.map((f) => (
              <Pressable key={f} onPress={() => setFilter(f)} style={[st.chip, filter === f && st.chipOn]}>
                <Text style={[st.chipText, filter === f && { color: '#fff' }]}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </>
      }
      ListEmptyComponent={<Text style={st.empty}>Sonuç bulunamadı.</Text>}
      renderItem={({ item: e }) => (
        <View style={st.row}>
          <View style={st.iconBox}><DumbbellIcon size={24} /></View>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{e.name}</Text>
            <Text style={st.meta}>{e.muscle} · {e.equipment} · {e.sets} set × {e.reps}</Text>
          </View>
          <View style={st.level}><Text style={st.levelText}>{e.level}</Text></View>
        </View>
      )}
    />
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18, height: 62,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 22 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSoft, fontWeight: '800', fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14,
  },
  iconBox: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '800', fontSize: 18 },
  meta: { color: colors.muted, fontSize: 14, marginTop: 4 },
  level: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  levelText: { color: colors.accentText, fontWeight: '800', fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
});
