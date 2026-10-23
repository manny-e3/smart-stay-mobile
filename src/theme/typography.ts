import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const typography: Record<string, TextStyle> = {
  headlineDisplay: {
    fontFamily: fontFamilies.bold,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  headlineDisplayMobile: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  headlineLg: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headlineMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  headlineSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelLg: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelCaps: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
};
