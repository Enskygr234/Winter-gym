import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Basit çubuk grafik. zeroBased: değerler 0'dan ölçeklenir (hacim), değilse min-max aralığı (kilo).
export default function Bars({ items, zeroBased, format = (v) => v, height = 200 }) {
  if (!items.length) return <Text style={st.empty}>Henüz veri yok.</Text>;
  const vals = items.map((i) => i.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const room = height - 50;
  const h = (v) => {
    if (zeroBased) return v <= 0 ? 4 : 12 + (v / max) * (room - 12);
    return max === min ? room * 0.75 : 30 + ((v - min) / (max - min)) * (room - 30);
  };
  return (
    <View style={[st.bars, { height }]}>
      {items.map((i, idx) => (
        <View key={idx} style={st.col}>
          <Text style={st.val} numberOfLines={1}>{format(i.value)}</Text>
          <View style={[st.bar, { height: h(i.value) }, i.highlight && { backgroundColor: colors.accentText }]} />
          <Text style={st.label} numberOfLines={1}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  val: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bar: { width: '100%', maxWidth: 64, backgroundColor: colors.accent, borderRadius: 6 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 8 },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: 20 },
});
