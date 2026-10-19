import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/data/store';
import TabBar from './src/components/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import PlansScreen from './src/screens/PlansScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreatePlanScreen from './src/screens/CreatePlanScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import { colors } from './src/theme';

const TAB_SCREENS = { home: HomeScreen, plans: PlansScreen, progress: ProgressScreen, profile: ProfileScreen };
const STACK_SCREENS = { createPlan: CreatePlanScreen, workout: WorkoutScreen, exercises: ExercisesScreen };

function Root() {
  const { ready } = useStore();
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // [{ name, params }]
  const backHandler = useRef(null);

  const back = useCallback(() => {
    backHandler.current = null;
    setStack((s) => s.slice(0, -1));
  }, []);

  const nav = {
    go: (name, params = {}) => {
      backHandler.current = null;
      setStack((s) => [...s, { name, params }]);
    },
    back,
    tab: (key) => setTab(key),
    setBackHandler: (fn) => {
      backHandler.current = fn;
    },
  };

  // Android donanım geri tuşu
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) {
        backHandler.current ? backHandler.current() : back();
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, back]);

  if (!ready) {
    return (
      <View style={[st.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const top = stack[stack.length - 1];
  const Screen = top ? STACK_SCREENS[top.name] : TAB_SCREENS[tab];

  return (
    <SafeAreaView style={st.root} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <Screen key={top ? `${top.name}-${stack.length}` : tab} nav={nav} params={top?.params || {}} />
      </View>
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
});
