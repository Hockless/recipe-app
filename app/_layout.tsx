import { ensureSeeded } from '@/utils/seed';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Pre-seed recipes on first run or when seed version increases
  useEffect(() => {
    // Bump this number when adding new built-in recipes
    // Bumped from 5 to 6 to force reseeding after ingredient/name updates
    // Bumped to 9 to add Keto tags to recipes
    void SplashScreen.preventAutoHideAsync();
    void ensureSeeded(9);
  }, []);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="add-recipe" options={{ headerShown: false }} />
          <Stack.Screen
            name="browse-recipes"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="meal-plan" options={{ headerShown: false }} />
          <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
          <Stack.Screen
            name="random-meal-plan"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="homepage" options={{ headerShown: false }} />
          <Stack.Screen name="my-sports" options={{ headerShown: false }} />
          <Stack.Screen
            name="weight-tracker"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
