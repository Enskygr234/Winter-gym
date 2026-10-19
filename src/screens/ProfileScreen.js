import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore, formatK } from '../data/store';
import { Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

export default function ProfileScreen() {
  const { userName, setUserName, workouts, customPlans, streak, reset } = useStore();
  const [name, setName] = useState(userName);

  const totalVolume = workouts.reduce((s, w) => s + w.volume, 0);
  const totalMin = Math.round(workouts.reduce((s, w) => s + (w.durationSec || 0), 0) / 60);
  const recent = [...workouts].reverse().slice(0, 5);

  const confirmReset = () =>
    Alert.alert('Verileri sıfırla', 'Tüm antrenman, plan ve ölçümlerin silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: reset },
    ]);

  return (
    <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
      <Header eyebrow="Hesabın" title="Profil" />

      <View style={st.card}>
        <View style={st.avatar}><Text style={st.avatarText}>{(name[0] || '?').toLocaleUpperCase('tr-TR')}</Text></View>
        <Text style={st.label}>Adın</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => name.trim() && setUserName(name.trim())}
          style={st.input}
          maxLength={20}
          placeholder="Adın"
          placeholderTextColor={colors.dim}
        />
      </View>

      <View style={st.grid}>
        <Stat label="Toplam antrenman" value={workouts.length} />
        <Stat label="Güncel seri" value={`${streak} gün`} />
        <Stat label="Toplam hacim" value={`${formatK(totalVolume)} kg`} />
        <Stat label="Toplam süre" value={`${totalMin} dk`} />
      </View>

      <Text style={st.section}>SON ANTRENMANLAR</Text>
      {recent.length === 0 && <Text style={st.muted}>Henüz antrenman yok. İlk antrenmanını Planlar'dan başlat.</Text>}
      {recent.map((w) => (
        <View key={w.id} style={st.row}>
          <Icon name="check-circle" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.rowTitle}>{w.planName}</Text>
            <Text style={st.muted}>{new Date(w.date).toLocaleDateString('tr-TR')} · {Math.round(w.durationSec / 60)} dk</Text>
          </View>
          <Text style={st.rowVal}>{formatK(w.volume)} kg</Text>
        </View>
      ))}

      <Text style={[st.muted, { marginTop: 22 }]}>{customPlans.length} kendi planın var. Tüm veriler bu cihazda saklanır.</Text>
      <Pressable onPress={confirmReset} style={st.reset}>
        <Icon name="delete-outline" size={20} color="#E5534B" />
        <Text style={st.resetText}>Verileri sıfırla</Text>
      </Pressable>
    </ScrollView>
  );
}

const Stat = ({ label, value }) => (
  <View style={st.stat}>
    <Text style={st.statVal}>{value}</Text>
    <Text style={st.muted}>{label}</Text>
  </View>
);

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 22 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentSoft, borderWidth: 1,
    borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  avatarText: { color: colors.accentText, fontWeight: '800', fontSize: 26 },
  label: { color: colors.textSoft, fontWeight: '800', marginBottom: 8 },
  input: {
    backgroundColor: colors.input, borderRadius: radius.sm, height: 52, paddingHorizontal: 14,
    color: colors.text, fontSize: 17, fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 24 },
  stat: {
    width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 16,
  },
  statVal: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  section: { color: colors.muted, fontWeight: '800', letterSpacing: 1.4, fontSize: 14, marginBottom: 14 },
  muted: { color: colors.muted, fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10,
  },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 2 },
  rowVal: { color: colors.textSoft, fontWeight: '800' },
  reset: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18,
    borderWidth: 1, borderColor: '#4A2626', borderRadius: radius.md, height: 54,
  },
  resetText: { color: '#E5534B', fontWeight: '800', fontSize: 15 },
});
