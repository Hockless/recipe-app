import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


export default function RootLayout() {
  // Force light mode - comment out the line below to re-enable auto theme detection
  // const colorScheme = useColorScheme();
  const colorScheme = 'light'; // Always use light mode
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

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
