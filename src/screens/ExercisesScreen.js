import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../data/store';
import { GROUPS } from '../data/exercises';
import { DumbbellIcon, Header, Icon, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

const norm = (t) => t.toLocaleLowerCase('tr-TR');

// params.pick = true → çoklu seçim modu (plan düzenleyiciden açılır), params.onPick(ids)
export default function ExercisesScreen({ nav, params }) {
  const { exercises, prs } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Tümü');
  const [picked, setPicked] = useState([]);
  const pick = !!params.pick;
  const already = params.exclude || [];

  const list = exercises.filter(
    (e) => (filter === 'Tümü' || e.group === filter) && norm(`${e.name} ${e.muscle} ${e.equipment}`).includes(norm(q.trim()))
  );

  const onRow = (e) => {
    if (!pick) return nav.go('exerciseDetail', { id: e.id });
    if (already.includes(e.id)) return;
    setPicked((p) => (p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id]));
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={st.wrap}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        ListHeaderComponent={
          <>
            <Header eyebrow={pick ? 'Plana ekle' : 'Hareket kütüphanesi'} title="Hareketler" onBack={nav.back} />
            <View style={st.search}>
              <Icon name="search" size={24} color={colors.muted} />
              <TextInput
                value={q} onChangeText={setQ} placeholder={`${exercises.length} hareket içinde ara...`}
                placeholderTextColor={colors.dim} style={st.searchInput} returnKeyType="search"
              />
              {q ? <Pressable onPress={() => setQ('')} hitSlop={8}><Icon name="close" size={20} color={colors.muted} /></Pressable> : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
              {GROUPS.map((f) => (
                <Pressable key={f} onPress={() => setFilter(f)} style={[st.chip, filter === f && st.chipOn]}>
                  <Text style={[st.chipText, filter === f && { color: '#fff' }]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={<Text style={st.empty}>Sonuç bulunamadı.</Text>}
        renderItem={({ item: e }) => {
          const on = picked.includes(e.id);
          const inPlan = already.includes(e.id);
          const pr = prs[e.id];
          return (
            <Pressable onPress={() => onRow(e)} style={[st.row, on && st.rowOn, inPlan && { opacity: 0.45 }]}>
              <View style={st.iconBox}>
                {pick ? (
                  <Icon name={on || inPlan ? 'check-circle' : 'radio-button-unchecked'} size={26} color={on || inPlan ? colors.accent : colors.muted} />
                ) : (
                  <DumbbellIcon size={24} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{e.name}</Text>
                <Text style={st.meta}>{e.muscle} · {e.equipment} · {e.sets} set × {e.reps}</Text>
                {pr?.maxKg > 0 && !pick ? <Text style={st.pr}>Rekor: {pr.maxKg} kg</Text> : null}
              </View>
              <View style={st.level}><Text style={st.levelText}>{e.level}</Text></View>
            </Pressable>
          );
        }}
      />
      {pick && (
        <View style={st.footer}>
          <PrimaryButton
            label={picked.length ? `${picked.length} hareketi ekle` : 'Hareket seç'}
            icon="add" disabled={!picked.length}
            onPress={() => { params.onPick(picked); nav.back(); }}
          />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18, height: 62,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 17 },
  chips: { gap: 10, paddingVertical: 22 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSoft, fontWeight: '800', fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12,
  },
  rowOn: { borderColor: colors.accent, backgroundColor: '#22201F' },
  iconBox: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '800', fontSize: 17 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  pr: { color: colors.accentText, fontSize: 12, fontWeight: '800', marginTop: 4 },
  level: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  levelText: { color: colors.accentText, fontWeight: '800', fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
  footer: { padding: 22, paddingTop: 10 },
});
