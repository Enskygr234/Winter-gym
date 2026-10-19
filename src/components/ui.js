import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, type } from '../theme';

export const Icon = MaterialIcons;
export const DumbbellIcon = ({ size = 22, color = colors.accent }) => (
  <MaterialCommunityIcons name="dumbbell" size={size} color={color} style={{ transform: [{ rotate: '45deg' }] }} />
);

export function Header({ eyebrow, title, subtitle, onBack, right }) {
  return (
    <View style={s.header}>
      <View style={s.headerRow}>
        {onBack && (
          <Pressable onPress={onBack} style={s.back} hitSlop={8}>
            <Icon name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={type.eyebrow}>{eyebrow.toLocaleUpperCase('tr-TR')}</Text> : null}
          <Text style={[type.h1, onBack && { fontSize: 28 }]}>{title}</Text>
        </View>
        {right}
      </View>
      {subtitle ? <Text style={[type.sub, { marginTop: 6 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ label, icon, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.primary, disabled && { opacity: 0.45 }, pressed && { opacity: 0.85 }, style]}
    >
      {icon && <Icon name={icon} size={20} color="#fff" />}
      <Text style={s.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, icon, iconNode, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.outline, pressed && { backgroundColor: colors.card }, style]}>
      {iconNode || (icon && <Icon name={icon} size={22} color={colors.accent} />)}
      <Text style={s.outlineText}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Badge({ label, icon }) {
  return (
    <View style={s.badge}>
      {icon && <Icon name={icon} size={15} color={colors.accent} />}
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  header: { marginBottom: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: {
    width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent, borderRadius: radius.md, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  outline: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, height: 72,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  outlineText: { color: colors.textSoft, fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 20,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7,
  },
  badgeText: { color: colors.accentText, fontWeight: '800', fontSize: 14 },
});
