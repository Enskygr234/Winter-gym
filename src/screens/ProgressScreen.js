import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore, formatK } from '../data/store';
import { Header, Icon, OutlineButton, PrimaryButton } from '../components/ui';
import { colors, radius } from '../theme';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const shortDate = (t) => {
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
};
const DAY = 24 * 60 * 60 * 1000;
const TABS = ['Kilo', 'Ölçümler', 'Hacim'];

export default function ProgressScreen() {
  const { measurements, workouts, addMeasurement, deleteMeasurement } = useStore();
  const [tab, setTab] = useState('Kilo');
  const [modal, setModal] = useState(false);

  const sorted = [...measurements].sort((a, b) => a.date - b.date);
  const recentWorkouts = workouts.filter((w) => w.date > Date.now() - 28 * DAY).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <Header eyebrow="Performans merkezi" title="İlerleme" subtitle="Gücünü verilerle gör, ritmini koru." />

        <View style={st.seg}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[st.segItem, tab === t && st.segOn]}>
              <Text style={[st.segText, tab === t && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'Kilo' && <WeightCard data={sorted} />}
        {tab === 'Ölçümler' && <MeasureCard data={sorted} onDelete={deleteMeasurement} />}
        {tab === 'Hacim' && <VolumeCard workouts={workouts} />}

        <View style={st.insight}>
          <Icon name="bolt" size={26} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.insightTitle}>{recentWorkouts >= 4 ? 'İstikrarlı ilerliyorsun' : 'Ritmini yakala'}</Text>
            <Text style={st.insightText}>
              {recentWorkouts > 0
                ? `Son 4 haftada ${recentWorkouts} antrenmanı tamamladın.`
                : 'Son 4 haftada antrenman yok. Bugün başlamak için harika bir gün.'}
            </Text>
          </View>
        </View>

        <OutlineButton label="Yeni ölçüm ekle" icon="add" onPress={() => setModal(true)} />
      </ScrollView>

      <AddMeasurement
        visible={modal}
        last={sorted[sorted.length - 1]}
        onClose={() => setModal(false)}
        onSave={(m) => { addMeasurement(m); setModal(false); }}
      />
    </View>
  );
}

function Bars({ items, unit }) {
  if (!items.length) return <Text style={st.empty}>Henüz veri yok.</Text>;
  const vals = items.map((i) => i.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  // Hacimde sıfır tabanlı, kiloda min-max aralığına göre ölçekle
  const h = (v) => {
    if (unit === 'K') return v <= 0 ? 4 : 12 + (v / max) * 148;
    return max === min ? 120 : 30 + ((v - min) / (max - min)) * 130;
  };
  return (
    <View style={st.bars}>
      {items.map((i, idx) => (
        <View key={idx} style={st.barCol}>
          <Text style={st.barVal}>{unit === 'K' ? formatK(i.value) : i.value}</Text>
          <View style={[st.bar, { height: h(i.value) }]} />
          <Text style={st.barLabel}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

function WeightCard({ data }) {
  const withW = data.filter((m) => m.weight);
  const last = withW[withW.length - 1];
  const base = withW.find((m) => m.date >= Date.now() - 30 * DAY) || withW[0];
  const delta = last && base ? +(last.weight - base.weight).toFixed(1) : 0;
  return (
    <View style={st.card}>
      <View style={st.cardHead}>
        <View>
          <Text style={st.kicker}>SON KAYIT</Text>
          <Text style={st.big}>{last ? `${last.weight} kg` : '—'}</Text>
          {last && (
            <Text style={[st.delta, { color: delta <= 0 ? colors.green : colors.accentText }]}>
              {delta > 0 ? '+' : delta < 0 ? '−' : ''}{Math.abs(delta)} kg / son 30 gün
            </Text>
          )}
        </View>
        <Icon name="show-chart" size={30} color={colors.accent} />
      </View>
      <Bars items={withW.slice(-5).map((m) => ({ value: m.weight, label: shortDate(m.date) }))} />
    </View>
  );
}

function MeasureCard({ data, onDelete }) {
  const last = data[data.length - 1];
  const rows = [
    { key: 'weight', label: 'Kilo', unit: 'kg' },
    { key: 'waist', label: 'Bel', unit: 'cm' },
    { key: 'chest', label: 'Göğüs', unit: 'cm' },
  ];
  return (
    <View style={st.card}>
      <Text style={st.kicker}>SON ÖLÇÜMLER{last ? ` · ${shortDate(last.date)}` : ''}</Text>
      {rows.map((r) => {
        const series = data.filter((m) => m[r.key]);
        const cur = series[series.length - 1];
        const prev = series[series.length - 2];
        const d = cur && prev ? +(cur[r.key] - prev[r.key]).toFixed(1) : null;
        return (
          <View key={r.key} style={st.mRow}>
            <Text style={st.mLabel}>{r.label}</Text>
            <Text style={st.mVal}>{cur ? `${cur[r.key]} ${r.unit}` : '—'}</Text>
            <Text style={st.mDelta}>{d === null || d === 0 ? '' : `${d > 0 ? '+' : '−'}${Math.abs(d)}`}</Text>
          </View>
        );
      })}
      {data.length > 0 && <Text style={[st.kicker, { marginTop: 22, marginBottom: 4 }]}>GEÇMİŞ</Text>}
      {[...data].reverse().slice(0, 12).map((m) => (
        <Pressable
          key={m.id}
          style={st.hRow}
          onLongPress={() =>
            Alert.alert('Ölçümü sil', `${shortDate(m.date)} tarihli ölçüm silinsin mi?`, [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Sil', style: 'destructive', onPress: () => onDelete(m.id) },
            ])
          }
        >
          <Text style={st.hDate}>{shortDate(m.date)}</Text>
          <Text style={st.hVals}>
            {[m.weight && `${m.weight} kg`, m.waist && `bel ${m.waist}`, m.chest && `göğüs ${m.chest}`].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
      ))}
      {data.length > 0 && <Text style={[st.empty, { paddingVertical: 8, fontSize: 12 }]}>Silmek için ölçüme basılı tut.</Text>}
    </View>
  );
}

function VolumeCard({ workouts }) {
  // Son 5 haftanın toplam hacmi
  const now = Date.now();
  const weeks = Array.from({ length: 5 }, (_, i) => {
    const end = now - (4 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    return {
      value: workouts.filter((w) => w.date > start && w.date <= end).reduce((s, w) => s + w.volume, 0),
      label: shortDate(start + DAY),
    };
  });
  const total = weeks.reduce((s, w) => s + w.value, 0);
  return (
    <View style={st.card}>
      <View style={st.cardHead}>
        <View>
          <Text style={st.kicker}>SON 5 HAFTA</Text>
          <Text style={st.big}>{formatK(total)} kg</Text>
          <Text style={[st.delta, { color: colors.muted }]}>toplam kaldırılan hacim</Text>
        </View>
        <Icon name="bar-chart" size={30} color={colors.accent} />
      </View>
      {total === 0 ? <Text style={st.empty}>Antrenman bitirdikçe burada haftalık hacmin görünecek.</Text> : <Bars items={weeks} unit="K" />}
    </View>
  );
}

function AddMeasurement({ visible, last, onClose, onSave }) {
  const [f, setF] = useState({ weight: '', waist: '', chest: '' });
  const num = (v) => parseFloat(String(v).replace(',', '.'));
  const valid = ['weight', 'waist', 'chest'].some((k) => num(f[k]) > 0);
  const save = () => {
    const m = {};
    ['weight', 'waist', 'chest'].forEach((k) => { if (num(f[k]) > 0) m[k] = num(f[k]); });
    onSave(m);
    setF({ weight: '', waist: '', chest: '' });
  };
  const Field = ({ k, label, unit }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={st.fLabel}>{label} ({unit})</Text>
      <TextInput
        style={st.fInput} keyboardType="decimal-pad" value={f[k]}
        placeholder={last?.[k] ? String(last[k]) : ''} placeholderTextColor={colors.dim}
        onChangeText={(v) => setF((s) => ({ ...s, [k]: v }))}
      />
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={st.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={st.sheet}>
          <Text style={[st.big, { fontSize: 24, marginBottom: 18 }]}>Yeni ölçüm</Text>
          {Field({ k: 'weight', label: 'Kilo', unit: 'kg' })}
          {Field({ k: 'waist', label: 'Bel', unit: 'cm' })}
          {Field({ k: 'chest', label: 'Göğüs', unit: 'cm' })}
          <PrimaryButton label="Kaydet" icon="save" disabled={!valid} onPress={save} style={{ marginTop: 8 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  seg: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 5, marginBottom: 24,
  },
  segItem: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.muted, fontWeight: '800', fontSize: 15 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 22, marginBottom: 24,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  kicker: { color: colors.muted, fontWeight: '800', fontSize: 14, letterSpacing: 0.6 },
  big: { color: colors.text, fontSize: 38, fontWeight: '800', marginTop: 4 },
  delta: { fontWeight: '700', fontSize: 14, marginTop: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 200 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barVal: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 6 },
  barLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 8 },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: 20 },
  mRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  mLabel: { flex: 1, color: colors.textSoft, fontSize: 16, fontWeight: '700' },
  mVal: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  hDate: { color: colors.muted, fontWeight: '700', width: 56 },
  hVals: { color: colors.textSoft, fontWeight: '700', flex: 1 },
  mDelta: { width: 54, textAlign: 'right', color: colors.muted, fontWeight: '700' },
  insight: {
    flexDirection: 'row', gap: 16, alignItems: 'center', backgroundColor: '#33201A',
    borderRadius: radius.md, padding: 20, marginBottom: 24,
  },
  insightTitle: { color: colors.accentText, fontWeight: '800', fontSize: 17 },
  insightText: { color: colors.muted, fontSize: 14, marginTop: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  fLabel: { color: colors.textSoft, fontWeight: '700', marginBottom: 8 },
  fInput: {
    backgroundColor: colors.input, borderRadius: radius.sm, height: 52, paddingHorizontal: 14,
    color: colors.text, fontSize: 17, fontWeight: '700',
  },
});
