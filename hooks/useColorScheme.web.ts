// Force light theme on web to keep colors consistent with the app design
// (header red, dark text on light backgrounds) regardless of OS preference.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
