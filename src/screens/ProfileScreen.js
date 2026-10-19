import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore, formatK, fmtDuration } from '../data/store';
import { Header, Icon } from '../components/ui';
import { colors, radius } from '../theme';

export default function ProfileScreen({ nav }) {
  const { userName, setUserName, workouts, plans, prs, streak, reset, exportAll } = useStore();
  const [name, setName] = useState(userName);
  useEffect(() => setName(userName), [userName]);

  const totalVolume = workouts.reduce((s, w) => s + w.volume, 0);
  const totalSec = workouts.reduce((s, w) => s + (w.durationSec || 0), 0);
  const mine = plans.filter((p) => !p.preset).length;

  const saveName = () => {
    const n = name.trim();
    if (n && n !== userName) setUserName(n);
  };

  const backup = async () => {
    try {
      const data = await exportAll();
      await Share.share({ title: 'Demir Fitness yedeği', message: JSON.stringify(data) });
    } catch (e) {
      Alert.alert('Yedeklenemedi', String(e.message || e));
    }
  };

  const confirmReset = () =>
    Alert.alert('Verileri sıfırla', 'Tüm antrenman, ölçüm ve kendi planların silinecek. Bu geri alınamaz.', [
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
          value={name} onChangeText={setName} onEndEditing={saveName} onSubmitEditing={saveName}
          style={st.input} maxLength={20} placeholder="Adın" placeholderTextColor={colors.dim} returnKeyType="done"
        />
      </View>

      <View style={st.grid}>
        <Stat label="Toplam antrenman" value={workouts.length} />
        <Stat label="Güncel seri" value={`${streak} gün`} />
        <Stat label="Toplam hacim" value={`${formatK(totalVolume)} kg`} />
        <Stat label="Toplam süre" value={fmtDuration(totalSec)} />
      </View>

      <Row icon="history" label="Antrenman geçmişi" meta={`${workouts.length}`} onPress={() => nav.go('history')} />
      <Row icon="emoji-events" label="Rekorlar" meta={`${Object.keys(prs).length} hareket`} onPress={() => nav.go('records')} />
      <Row icon="event" label="Kendi planların" meta={`${mine}`} onPress={() => nav.tab('plans')} />
      <Row icon="ios-share" label="Verileri yedekle (JSON)" onPress={backup} />

      <Text style={st.note}>Tüm veriler bu telefondaki SQLite veritabanında saklanır. Uygulamayı silersen veriler de silinir, önce yedek al.</Text>
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

const Row = ({ icon, label, meta, onPress }) => (
  <Pressable onPress={onPress} style={st.row}>
    <Icon name={icon} size={22} color={colors.accent} />
    <Text style={st.rowTitle}>{label}</Text>
    {meta ? <Text style={st.muted}>{meta}</Text> : null}
    <Icon name="chevron-right" size={22} color={colors.dim} />
  </Pressable>
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
    width: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 16,
  },
  statVal: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  muted: { color: colors.muted, fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 60, marginBottom: 10,
  },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: 16, flex: 1 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 14 },
  reset: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18,
    borderWidth: 1, borderColor: '#4A2626', borderRadius: radius.md, height: 54,
  },
  resetText: { color: '#E5534B', fontWeight: '800', fontSize: 15 },
});
