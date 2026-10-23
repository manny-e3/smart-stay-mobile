import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useGuestStay();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dismissToast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isAlert = toast.type === 'alert';

  const iconName = isSuccess
    ? 'checkmark-circle-outline'
    : isAlert
    ? 'alert-circle-outline'
    : 'information-circle-outline';

  const iconColor = isSuccess
    ? colors.statusGreen
    : isAlert
    ? colors.statusRed
    : colors.primaryNavy;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={dismissToast}
        style={[styles.container, shadows.floating]}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isSuccess
                ? colors.statusGreenLight
                : isAlert
                ? colors.statusRedLight
                : 'rgba(11, 31, 58, 0.06)',
            },
          ]}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[typography.labelLg, styles.title]}>{toast.title}</Text>
          <Text style={[typography.bodySm, styles.message]} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
        <Ionicons name="close" size={16} color={colors.mutedNeutral} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 58, 0.08)',
    maxWidth: 420,
    width: '100%',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: colors.primaryNavy,
  },
  message: {
    color: colors.mutedNeutral,
    marginTop: 2,
  },
});
