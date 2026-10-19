import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/data/store';
import TabBar from './src/components/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import PlansScreen from './src/screens/PlansScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PlanEditorScreen from './src/screens/PlanEditorScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import { colors } from './src/theme';

const TAB_SCREENS = { home: HomeScreen, plans: PlansScreen, progress: ProgressScreen, profile: ProfileScreen };
const STACK_SCREENS = {
  planEditor: PlanEditorScreen,
  workout: WorkoutScreen,
  exercises: ExercisesScreen,
  exerciseDetail: ExerciseDetailScreen,
  history: HistoryScreen,
  workoutDetail: WorkoutDetailScreen,
  records: RecordsScreen,
};

let keySeq = 0;

function Root() {
  const { ready, error } = useStore();
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // [{ key, name, params }]
  const backHandlers = useRef({}); // ekran key → geri tuşu işleyicisi

  const go = (name, params = {}) => setStack((s) => [...s, { key: `s${++keySeq}`, name, params }]);
  const back = () => setStack((s) => s.slice(0, -1));

  // Her ekran kendi nav nesnesini alır; geri işleyicisi o ekrana bağlı kalır
  const navFor = (key) => ({
    go,
    back,
    tab: (k) => setTab(k),
    setBackHandler: (fn) => { backHandlers.current[key] = fn; },
  });

  useEffect(() => {
    const live = new Set(stack.map((s) => s.key));
    for (const k of Object.keys(backHandlers.current)) if (!live.has(k)) delete backHandlers.current[k];
  }, [stack]);

  // Android donanım geri tuşu
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const top = stack[stack.length - 1];
      if (top) {
        const h = backHandlers.current[top.key];
        h ? h() : back();
        return true;
      }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack, tab]);

  if (error) {
    return (
      <View style={[st.root, st.center]}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, marginBottom: 8 }}>Veritabanı açılamadı</Text>
        <Text style={{ color: colors.muted, textAlign: 'center', paddingHorizontal: 30 }}>{error}</Text>
      </View>
    );
  }
  if (!ready) {
    return <View style={[st.root, st.center]}><ActivityIndicator color={colors.accent} /></View>;
  }

  const TabScreen = TAB_SCREENS[tab];
  const top = stack[stack.length - 1];

  return (
    <SafeAreaView style={st.root} edges={['top', 'left', 'right']}>
      {/* Alttaki ekranlar canlı kalır (durum kaybolmaz), sadece en üstteki görünür */}
      <View style={[st.layer, top && st.hidden]}>
        <TabScreen key={tab} nav={navFor('tab')} params={{}} />
      </View>
      {stack.map((s) => {
        const Screen = STACK_SCREENS[s.name];
        return (
          <View key={s.key} style={[st.layer, s !== top && st.hidden]}>
            <Screen nav={navFor(s.key)} params={s.params} />
          </View>
        );
      })}
      {!top && <TabBar active={tab} onChange={setTab} />}
      {top && <SafeAreaView edges={['bottom']} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  layer: { flex: 1 },
  hidden: { display: 'none' },
});
