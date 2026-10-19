import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './ui';
import { colors } from '../theme';

export const TABS = [
  { key: 'home', label: 'Ana Sayfa', icon: 'home' },
  { key: 'plans', label: 'Planlar', icon: 'event' },
  { key: 'progress', label: 'İlerleme', icon: 'show-chart' },
  { key: 'profile', label: 'Profil', icon: 'person-outline' },
];

export default function TabBar({ active, onChange }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const on = t.key === active;
        const c = on ? colors.accent : colors.muted;
        return (
          <Pressable key={t.key} style={st.item} onPress={() => onChange(t.key)}>
            <Icon name={t.icon} size={26} color={c} />
            <Text style={[st.label, { color: c }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#1A1C23', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '700' },
});
