import { ViewStyle, Platform } from 'react-native';

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F3A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#0B1F3A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
  }) as ViewStyle,

  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F3A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#0B1F3A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  }) as ViewStyle,

  hairlineBorder: {
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 58, 0.07)',
  },
};
