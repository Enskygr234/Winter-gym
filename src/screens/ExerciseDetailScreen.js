import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore, shortDate, formatK } from '../data/store';
import { Header, Icon } from '../components/ui';
import Bars from '../components/Bars';
import { colors, radius } from '../theme';

export default function ExerciseDetailScreen({ nav, params }) {
  const { exercise, prs, workouts, getExerciseHistory } = useStore();
  const e = exercise(params.id);
  const pr = prs[params.id];
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getExerciseHistory(params.id).then(setHistory).catch(() => setHistory([]));
  }, [params.id, workouts.length]);

  if (!e) return null;
  const bodyweight = e.defaultKg === 0;
  const recent = history.slice(-6);

  return (
    <ScrollView contentContainerStyle={st.wrap}>
      <Header eyebrow={e.group} title={e.name} onBack={nav.back} />

      <View style={st.tags}>
        <Tag icon="fitness-center" text={e.equipment} />
        <Tag icon="signal-cellular-alt" text={e.level} />
        <Tag icon="accessibility-new" text={e.muscle} />
      </View>

      <View style={st.targets}>
        <Target label="Hedef" value={`${e.sets} × ${e.reps}`} />
        <Target label="Dinlenme" value={`${e.rest} sn`} />
        <Target label="Yapılan" value={`${history.length} kez`} />
      </View>

      <View style={st.card}>
        <View style={st.cardHead}>
          <Text style={st.kicker}>KİŞİSEL REKORLAR</Text>
          <Icon name="emoji-events" size={24} color={colors.accent} />
        </View>
        {pr ? (
          <View style={st.prRow}>
            {!bodyweight && <Pr label="En ağır" value={`${pr.maxKg} kg`} />}
            {!bodyweight && pr.e1rm ? <Pr label="Tahmini 1RM" value={`${Math.round(pr.e1rm)} kg`} /> : null}
            <Pr label="En çok tekrar" value={pr.maxReps} />
          </View>
        ) : (
          <Text style={st.muted}>Bu hareketi bir antrenmanda yaptığında rekorların burada görünecek.</Text>
        )}
      </View>

      {recent.length > 0 && (
        <View style={st.card}>
          <Text style={[st.kicker, { marginBottom: 16 }]}>{bodyweight ? 'EN ÇOK TEKRAR' : 'EN AĞIR SET'} · SON {recent.length} ANTRENMAN</Text>
          <Bars
            height={170}
            zeroBased={bodyweight}
            items={recent.map((h) => ({ value: bodyweight ? h.top_reps : h.top_kg, label: shortDate(h.date), highlight: !bodyweight && h.top_kg === pr?.maxKg }))}
          />
          {!bodyweight && <Text style={[st.muted, { marginTop: 12 }]}>Toplam hacim: {formatK(history.reduce((s, h) => s + h.volume, 0))} kg</Text>}
        </View>
      )}

      <Text style={st.section}>NASIL YAPILIR</Text>
      <Text style={st.body}>{e.desc}</Text>

      {e.tips.length > 0 && (
        <>
          <Text style={[st.section, { marginTop: 24 }]}>İPUÇLARI</Text>
          {e.tips.map((t, i) => (
            <View key={i} style={st.tip}>
              <Icon name="check" size={18} color={colors.accent} />
              <Text style={[st.body, { flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const Tag = ({ icon, text }) => (
  <View style={st.tag}><Icon name={icon} size={15} color={colors.accentText} /><Text style={st.tagText}>{text}</Text></View>
);
const Target = ({ label, value }) => (
  <View style={st.target}><Text style={st.targetVal}>{value}</Text><Text style={st.muted}>{label}</Text></View>
);
const Pr = ({ label, value }) => (
  <View style={{ flex: 1 }}><Text style={st.prVal}>{value}</Text><Text style={st.muted}>{label}</Text></View>
);

const st = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 40 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8, marginBottom: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  tagText: { color: colors.accentText, fontWeight: '800', fontSize: 13 },
  targets: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  target: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 },
  targetVal: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  kicker: { color: colors.muted, fontWeight: '800', fontSize: 13, letterSpacing: 0.6 },
  prRow: { flexDirection: 'row', gap: 12 },
  prVal: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  section: { color: colors.muted, fontWeight: '800', letterSpacing: 1.4, fontSize: 13, marginBottom: 10 },
  body: { color: colors.textSoft, fontSize: 15, lineHeight: 22 },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 13 },
});
