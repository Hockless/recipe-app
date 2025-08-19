import { ensureSeeded } from '@/utils/seed';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Pre-seed recipes on first run or when seed version increases
  useEffect(() => {
    // Bump this number when adding new built-in recipes
  void ensureSeeded(5);
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="add-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="browse-recipes" options={{ headerShown: false }} />
        <Stack.Screen name="meal-plan" options={{ headerShown: false }} />
        <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
        <Stack.Screen name="ingredient-manager" options={{ headerShown: false }} />
        <Stack.Screen name="receipts" options={{ headerShown: false }} />
        <Stack.Screen name="random-meal-plan" options={{ headerShown: false }} />
        <Stack.Screen name="fridge" options={{ headerShown: false }} />
        <Stack.Screen name="homepage" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
