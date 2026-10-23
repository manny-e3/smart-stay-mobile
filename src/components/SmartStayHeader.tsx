import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface SmartStayHeaderProps {
  onOpenProfile?: () => void;
}

export const SmartStayHeader: React.FC<SmartStayHeaderProps> = ({
  onOpenProfile,
}) => {
  const { reservation, hasActiveRoom } = useGuestStay();

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'GS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(reservation.guestName);

  return (
    <View style={styles.container}>
      {/* Left Brand with Home Icon */}
      <View style={styles.brandGroup}>
        <View style={styles.logoIconBox}>
          <Ionicons name="home-outline" size={17} color={colors.primaryNavy} />
        </View>
        <Text style={[typography.headlineSm, styles.brandText]}>SmartStay</Text>
      </View>

      {/* Right Actions: Suite Pill + Avatar */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={[styles.suitePill, !hasActiveRoom && styles.pendingSuitePill]}
          onPress={onOpenProfile}
          activeOpacity={0.8}
        >
          {!hasActiveRoom && (
            <Ionicons name="time-outline" size={13} color="#B45309" style={{ marginRight: 4 }} />
          )}
          <Text style={[typography.labelMd, styles.suitePillText, !hasActiveRoom && styles.pendingSuitePillText]}>
            {hasActiveRoom ? (reservation.suiteNumber || 'Room Access') : 'Awaiting Check-In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onOpenProfile}
          activeOpacity={0.8}
        >
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.canvas,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: colors.primaryNavy,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suitePill: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  suitePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  pendingSuitePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pendingSuitePillText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 11,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  initialsCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#0B1F3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FED255',
  },
  initialsText: {
    color: '#FED255',
    fontWeight: '800',
    fontSize: 12,
  },
});
