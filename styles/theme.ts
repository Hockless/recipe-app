import { StyleSheet } from 'react-native';

// Centralized shared style tokens and common component styles.
// Gradually migrate existing screen-specific styles here. Keep screen-unique
// layout specifics local to avoid giant unmaintainable sheets.

export const colors = {
  primary: '#FF6B6B',
  primaryDark: '#8B0000',
  bg: '#fff',
  text: '#333',
  subtleText: '#666',
  border: '#ddd',
  mutedBg: '#f9f9f9',
  softPrimaryBg: 'rgba(255, 107, 107, 0.12)',
  softPrimaryBgAlt: 'rgba(255,107,107,0.18)',
  softPrimaryBorder: 'rgba(255, 107, 107, 0.25)',
  pillBg: 'rgba(255,107,107,0.25)',
  pillBorder: 'rgba(255,107,107,0.35)',
  inverted: '#fff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 16,
  pill: 20,
};

export const typography = {
  titleLg: { fontSize: 32, fontWeight: 'bold' as const },
  subtitle: { fontSize: 18, fontWeight: '500' as const },
  badge: { fontSize: 12, fontWeight: '700' as const },
  pill: { fontSize: 13, fontWeight: '600' as const },
};

export const shared = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBar: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.primary,
  },
  backButton: { marginBottom: spacing.sm },
  backButtonText: { color: colors.inverted, fontSize: 16, fontWeight: '600' },
  screenTitle: { ...typography.titleLg, color: colors.inverted },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  pill: {
    backgroundColor: colors.pillBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...typography.badge, color: colors.inverted },
  // Buttons (base)
  buttonPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPillText: { fontSize: 14, fontWeight: '700', color: colors.inverted },
});

export type Theme = typeof colors & typeof spacing & typeof radius;

export const theme = { colors, spacing, radius };
