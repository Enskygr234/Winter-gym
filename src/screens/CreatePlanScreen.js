import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../data/store';
import { EXERCISES, estimatePlan } from '../data/defaults';
import { Header, Icon, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

export default function CreatePlanScreen({ nav }) {
  const { addPlan } = useStore();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const canSave = name.trim().length > 0 && selected.length > 0;

  const save = () => {
    addPlan({ name: name.trim(), exerciseIds: selected, ...estimatePlan(selected) });
    nav.back();
    nav.tab('plans');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <Header eyebrow="Kişisel program" title="Plan oluştur" onBack={nav.back} />

        <Text style={st.label}>Plan adı</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Örn. Pazartesi Güç"
          placeholderTextColor={colors.dim}
          style={st.input}
          maxLength={40}
        />

        <Text style={[st.label, { marginTop: 24 }]}>Hareketlerini seç</Text>
        {EXERCISES.map((e) => {
          const on = selected.includes(e.id);
          return (
            <Pressable key={e.id} onPress={() => toggle(e.id)} style={[st.row, on && st.rowOn]}>
              <Icon
                name={on ? 'check-circle' : 'radio-button-unchecked'}
                size={26}
                color={on ? colors.accent : colors.muted}
              />
              <View>
                <Text style={st.name}>{e.name}</Text>
                <Text style={st.meta}>{e.muscle} · {e.sets} set × {e.reps}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={st.note}>
          Planın bu cihazda saklanır. Daha sonra Planlar sekmesinden antrenmanına devam edebilirsin.
        </Text>
      </ScrollView>
      <View style={st.footer}>
        <PrimaryButton
          label={selected.length ? `Planı kaydet (${selected.length})` : 'Planı kaydet'}
          icon="save"
          disabled={!canSave}
          onPress={save}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 30 },
  label: { color: colors.textSoft, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    height: 62, paddingHorizontal: 18, color: colors.text, fontSize: 17,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 12,
  },
  rowOn: { borderColor: colors.accent, backgroundColor: '#22201F' },
  name: { color: colors.text, fontWeight: '800', fontSize: 17 },
  meta: { color: colors.muted, fontSize: 14, marginTop: 3 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 12 },
  footer: { padding: 22, paddingTop: 10 },
});
