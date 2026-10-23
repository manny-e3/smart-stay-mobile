import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import * as Haptics from 'expo-haptics';

interface ProfileScreenProps {
  onOpenInvoiceModal?: () => void;
  onOpenPreferences?: () => void;
  onOpenHotelInfo?: () => void;
  onOpenFeedback?: (mode: 'feedback' | 'issue') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenInvoiceModal,
  onOpenPreferences,
  onOpenHotelInfo,
  onOpenFeedback,
}) => {
  const {
    reservation,
    logout,
    showToast,
    climate,
    adjustTargetTemp,
    requests,
    refreshStayData,
    stayHistory,
    hasActiveRoom,
    fetchStayHistory,
    isBiometricsSupported,
    isBiometricsEnabled,
    biometricTypeLabel,
    savedBiometricEmail,
    enableBiometrics,
    disableBiometrics,
  } = useGuestStay();

  const [isBioSwitching, setIsBioSwitching] = useState(false);

  const handleToggleBiometrics = async (val: boolean) => {
    setIsBioSwitching(true);
    try {
      if (val) {
        await enableBiometrics();
      } else {
        await disableBiometrics();
      }
    } finally {
      setIsBioSwitching(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStayHistory().catch(() => {});
  }, [fetchStayHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshStayData(), fetchStayHistory()]);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // fallback
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshStayData, fetchStayHistory]);

  // Preferences toggles matching Image 5
  const [highFloorQuiet, setHighFloorQuiet] = useState(true);
  const [keyAutoShare, setKeyAutoShare] = useState(true);
  const [turndownService, setTurndownService] = useState(true);

  const handleCheckout = () => {
    Alert.alert(
      'Express Mobile Check-Out',
      `Are you sure you wish to check out of ${reservation.suiteNumber || 'your suite'}? Your digital key will be deactivated and your folio will be finalized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Check-Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast('Checked Out', 'Thank you for staying with SmartStay. Safe travels!', 'success');
          },
        },
      ]
    );
  };

  const handleViewInvoice = () => {
    if (onOpenInvoiceModal) {
      onOpenInvoiceModal();
    } else {
      showToast('Folio Statement', `Itemized folio statement for ${reservation.suiteNumber || 'Suite'}: Dispatched to your registered email.`, 'info');
    }
  };

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'GS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const guestName = reservation.guestName || 'Guest';
  const initials = getInitials(guestName);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#C9A227"
          colors={['#C9A227', '#0B1F3A']}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {/* Title Header */}
      <View style={styles.headerSection}>
        <Text style={[typography.labelCaps, styles.overline]}>ACCOUNT OVERVIEW</Text>
        <Text style={styles.mainTitle}>Profile & Stay Details</Text>
      </View>

      {/* Guest Profile Card (matching Image 5) */}
      <View style={[styles.profileCard, shadows.card]}>
        <View style={styles.profileTopRow}>
          <View style={styles.profileAvatarCircle}>
            <Text style={styles.profileAvatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfoCol}>
            <Text style={styles.profileName}>{guestName}</Text>
            <Text style={styles.profileTier}>{reservation.vipTier || 'Verified Guest'}</Text>
          </View>
        </View>

        {/* Benefits Ribbon Banner */}
        <View style={styles.benefitBanner}>
          <View style={styles.awardCircle}>
            <Ionicons name="ribbon-outline" size={16} color="#854D0E" />
          </View>
          <Text style={styles.benefitText}>
            Digital Keyless Access & Express Concierge Enabled
          </Text>
        </View>
      </View>

      {/* Current Stay Card */}
      {hasActiveRoom ? (
        <View style={[styles.stayCard, shadows.card]}>
          <View style={styles.stayCardHeader}>
            <View>
              <Text style={[typography.labelCaps, styles.stayOverline]}>CURRENT STAY</Text>
              <Text style={styles.staySuiteTitle}>
                {reservation.suiteType} · {reservation.suiteNumber || 'Active Suite'}
              </Text>
            </View>
            <View style={styles.bedIconBadge}>
              <Ionicons name="bed-outline" size={20} color="#0B1F3A" />
            </View>
          </View>

          {/* Check-In / Check-Out 2-Col Grid */}
          <View style={styles.datesRow}>
            {/* Check-In Box */}
            <View style={styles.dateBox}>
              <View style={styles.dateLabelRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                <Text style={styles.dateLabelGreen}>CHECK-IN</Text>
              </View>
              <Text style={styles.dateValue}>{reservation.checkInDate || 'Checked In'}</Text>
              <Text style={styles.dateSubtext}>Verified Check-In</Text>
            </View>

            {/* Check-Out Box */}
            <View style={styles.dateBox}>
              <View style={styles.dateLabelRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.dateLabelGray}>CHECK-OUT</Text>
              </View>
              <Text style={styles.dateValue}>{reservation.checkOutDate || 'Scheduled'}</Text>
              <Text style={styles.dateSubtext}>{reservation.checkOutTime || '11:00 AM'}</Text>
            </View>
          </View>

          {/* Folio Charges to Date */}
          <View style={styles.folioRow}>
            <View>
              <Text style={[typography.labelCaps, styles.folioLabel]}>ACTIVE SERVICE ORDERS</Text>
              <Text style={styles.folioAmount}>{requests.length} {requests.length === 1 ? 'Order' : 'Orders'}</Text>
            </View>

            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={handleViewInvoice}
              activeOpacity={0.8}
            >
              <Text style={styles.invoiceButtonText}>View Folio</Text>
              <Ionicons name="receipt-outline" size={16} color="#0B1F3A" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.stayCard, shadows.card, { borderLeftWidth: 4, borderLeftColor: '#C9A227' }]}>
          <View style={styles.stayCardHeader}>
            <View>
              <Text style={[typography.labelCaps, styles.stayOverline]}>RESERVATION STATUS</Text>
              <Text style={styles.staySuiteTitle}>Checked Out · Awaiting Check-In</Text>
            </View>
            <View style={[styles.bedIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#B45309" />
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 19, marginTop: 4, marginBottom: 12 }}>
            You do not currently have an active checked-in room. All previous stay records, suite numbers, and stay dates are safely preserved in your Stay & Room History below.
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Ionicons name="sparkles-outline" size={16} color="#C9A227" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500', flex: 1 }}>
              Ready for your next visit? Check into your next reservation to unlock room controls & key access.
            </Text>
          </View>
        </View>
      )}

      {/* Stay & Room History Section */}
      <View style={[styles.historyCard, shadows.card]}>
        <View style={styles.historyHeaderRow}>
          <View>
            <Text style={[typography.labelCaps, styles.historyOverline]}>LOYALTY & PASSPORT</Text>
            <Text style={styles.historySectionTitle}>Stay & Room History</Text>
          </View>
          <View style={styles.historyCountBadge}>
            <Text style={styles.historyCountText}>{stayHistory.length} {stayHistory.length === 1 ? 'Stay' : 'Stays'}</Text>
          </View>
        </View>

        {stayHistory.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <Ionicons name="time-outline" size={26} color="#94A3B8" />
            <Text style={styles.emptyHistoryTitle}>No Past Stays Recorded</Text>
            <Text style={styles.emptyHistoryDesc}>
              When you complete check-outs or return for future visits, your past room numbers, dates, and folios will be preserved here.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {stayHistory.map((item, idx) => (
              <View key={item.id || idx} style={styles.historyItemCard}>
                <View style={styles.historyItemTop}>
                  <View style={styles.historySuiteBadge}>
                    <Ionicons name="bed-outline" size={15} color="#C9A227" style={{ marginRight: 6 }} />
                    <Text style={styles.historySuiteText}>Suite {item.suiteNumber}</Text>
                  </View>
                  <View style={[
                    styles.historyStatusBadge,
                    item.status === 'in_house' ? styles.statusInHouse : styles.statusPast
                  ]}>
                    <Text style={[
                      styles.historyStatusText,
                      item.status === 'in_house' ? styles.statusTextInHouse : styles.statusTextPast
                    ]}>
                      {item.status === 'in_house' ? 'ACTIVE' : 'COMPLETED'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyRoomType}>{item.suiteType || 'Deluxe Executive Suite'}</Text>

                <View style={styles.historyDatesRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.historyDatesText}>
                    {item.checkInDate ? new Date(item.checkInDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Previous'} — {item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Stay'}
                  </Text>
                  <Text style={styles.historyNightsDot}>•</Text>
                  <Text style={styles.historyNightsText}>{item.nights || 1} {(item.nights || 1) === 1 ? 'night' : 'nights'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Room Preferences Section */}
      <View style={[styles.preferencesCard, shadows.card]}>
        <View style={styles.prefHeaderRow}>
          <Text style={[typography.labelCaps, styles.prefOverline]}>CUSTOMIZATION</Text>
          <Text style={styles.prefConfigCount}>Active Comfort</Text>
        </View>
        <Text style={styles.prefSectionTitle}>Room Preferences</Text>

        {/* Preference Item 1: Temperature Default */}
        <View style={styles.prefItem}>
          <View style={styles.prefIconBox}>
            <Ionicons name="thermometer-outline" size={20} color="#0B1F3A" />
          </View>
          <View style={styles.prefInfo}>
            <Text style={styles.prefItemTitle}>Temperature Default</Text>
            <Text style={styles.prefItemSubtitle}>{climate.targetTemp}°F on arrival</Text>
          </View>
          <TouchableOpacity
            style={styles.tuneButton}
            onPress={() => adjustTargetTemp(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#0B1F3A" />
          </TouchableOpacity>
        </View>

        {/* Preference Item 2: High Floor & Quiet Room */}
        <View style={styles.prefItem}>
          <View style={styles.prefIconBox}>
            <Ionicons name="trending-up-outline" size={20} color="#0B1F3A" />
          </View>
          <View style={styles.prefInfo}>
            <Text style={styles.prefItemTitle}>High Floor & Quiet Room</Text>
            <Text style={[styles.prefItemSubtitle, { color: highFloorQuiet ? '#16A34A' : '#64748B' }]}>
              {highFloorQuiet ? 'Active' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={highFloorQuiet}
            onValueChange={setHighFloorQuiet}
            trackColor={{ false: '#E2E8F0', true: '#0B1F3A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Preference Item 3: Digital Key Auto-Share */}
        <View style={styles.prefItem}>
          <View style={styles.prefIconBox}>
            <Ionicons name="key-outline" size={20} color="#0B1F3A" />
          </View>
          <View style={styles.prefInfo}>
            <Text style={styles.prefItemTitle}>Digital Key Auto-Share</Text>
            <Text style={styles.prefItemSubtitle}>
              {keyAutoShare ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={keyAutoShare}
            onValueChange={setKeyAutoShare}
            trackColor={{ false: '#E2E8F0', true: '#0B1F3A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Preference Item 4: Daily Turn-down Service */}
        <View style={[styles.prefItem, { borderBottomWidth: 0 }]}>
          <View style={styles.prefIconBox}>
            <Ionicons name="bed-outline" size={20} color="#0B1F3A" />
          </View>
          <View style={styles.prefInfo}>
            <Text style={styles.prefItemTitle}>Daily Turn-down Service</Text>
            <Text style={styles.prefItemSubtitle}>
              {turndownService ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={turndownService}
            onValueChange={setTurndownService}
            trackColor={{ false: '#E2E8F0', true: '#0B1F3A' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Security & Fast Biometric Access Section */}
      <View style={[styles.preferencesCard, shadows.card]}>
        <View style={styles.prefHeaderRow}>
          <Text style={[typography.labelCaps, styles.prefOverline]}>SECURITY & ACCESS</Text>
          <View style={[styles.bioStatusPill, { backgroundColor: isBiometricsEnabled ? '#DCFCE7' : '#F1F5F9' }]}>
            <View style={[styles.bioStatusDot, { backgroundColor: isBiometricsEnabled ? '#16A34A' : '#94A3B8' }]} />
            <Text style={[styles.bioStatusPillText, { color: isBiometricsEnabled ? '#16A34A' : '#64748B' }]}>
              {isBiometricsEnabled ? 'Active' : 'Disabled'}
            </Text>
          </View>
        </View>
        <Text style={styles.prefSectionTitle}>{biometricTypeLabel} Login</Text>

        <View style={[styles.prefItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={[styles.prefIconBox, { backgroundColor: isBiometricsEnabled ? '#FEF3C7' : '#F1F5F9' }]}>
            <Ionicons
              name="finger-print-outline"
              size={22}
              color={isBiometricsEnabled ? '#C9A227' : '#0B1F3A'}
            />
          </View>
          <View style={styles.prefInfo}>
            <Text style={styles.prefItemTitle}>Enable {biometricTypeLabel}</Text>
            <Text style={styles.prefItemSubtitle}>
              {isBiometricsEnabled
                ? `Active for ${savedBiometricEmail || reservation.guestName || 'this device'}`
                : isBiometricsSupported
                ? `Touch sensor to activate instant keyless login`
                : 'Biometric hardware not detected on device'}
            </Text>
          </View>
          <Switch
            value={isBiometricsEnabled}
            onValueChange={handleToggleBiometrics}
            disabled={!isBiometricsSupported || isBioSwitching}
            trackColor={{ false: '#E2E8F0', true: '#0B1F3A' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Hotel Directory & Policies */}
      {onOpenHotelInfo && (
        <TouchableOpacity
          style={[styles.directoryCard, shadows.card]}
          onPress={onOpenHotelInfo}
          activeOpacity={0.85}
        >
          <View style={styles.directoryLeft}>
            <View style={styles.directoryIconCircle}>
              <Ionicons name="business-outline" size={20} color="#0B1F3A" />
            </View>
            <View>
              <Text style={styles.directoryTitle}>Hotel Information & FAQs</Text>
              <Text style={styles.directorySubtitle}>24/7 reception, amenities & policies</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>
      )}

      {/* Report Room Issue & Feedback */}
      {onOpenFeedback && (
        <TouchableOpacity
          style={[styles.directoryCard, shadows.card, { marginTop: 0 }]}
          onPress={() => onOpenFeedback('issue')}
          activeOpacity={0.85}
        >
          <View style={styles.directoryLeft}>
            <View style={[styles.directoryIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color="#0B1F3A" />
            </View>
            <View>
              <Text style={styles.directoryTitle}>Feedback & Room Support</Text>
              <Text style={styles.directorySubtitle}>Report hardware issue or review your stay</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>
      )}

      {/* Golden Amber Action Button: Express Mobile Check-Out */}
      {hasActiveRoom && (
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.88}
        >
          <Ionicons name="exit-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.checkoutButtonText}>Express Mobile Check-Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 20,
  },
  overline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  mainTitle: {
    color: '#0B1F3A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0B1F3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#FED255',
  },
  profileAvatarInitials: {
    color: '#FED255',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    color: '#0B1F3A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileTier: {
    color: '#64748B',
    fontSize: 13,
  },
  benefitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  awardCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  benefitText: {
    color: '#713F12',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  stayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  stayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stayOverline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  staySuiteTitle: {
    color: '#0B1F3A',
    fontSize: 16,
    fontWeight: '700',
  },
  bedIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dateLabelGreen: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  dateLabelGray: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  dateValue: {
    color: '#0B1F3A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateSubtext: {
    color: '#64748B',
    fontSize: 11,
  },
  folioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  folioLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  folioAmount: {
    color: '#0B1F3A',
    fontSize: 20,
    fontWeight: '800',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  invoiceButtonText: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '600',
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  prefHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prefOverline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  prefConfigCount: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  prefSectionTitle: {
    color: '#0B1F3A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prefIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefInfo: {
    flex: 1,
  },
  prefItemTitle: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  prefItemSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  tuneButton: {
    padding: 6,
  },
  directoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  directoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  directoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FED255',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  directoryTitle: {
    color: '#0B1F3A',
    fontSize: 14,
    fontWeight: '700',
  },
  directorySubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#C58C1B',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C58C1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Stay History Card Styles
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyOverline: {
    color: '#C9A227',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  historySectionTitle: {
    fontSize: 18,
    fontFamily: typography.headlineLg.fontFamily,
    color: '#0B1F3A',
    fontWeight: '700',
    marginTop: 2,
  },
  historyCountBadge: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
  },
  historyCountText: {
    color: '#0B1F3A',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1F3A',
    marginTop: 8,
  },
  emptyHistoryDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historySuiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySuiteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1F3A',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusInHouse: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusPast: {
    backgroundColor: '#E2E8F0',
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusTextInHouse: {
    color: '#16A34A',
  },
  statusTextPast: {
    color: '#475569',
  },
  historyRoomType: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  historyDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDatesText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  historyNightsDot: {
    color: '#94A3B8',
    marginHorizontal: 6,
    fontSize: 12,
  },
  historyNightsText: {
    fontSize: 11,
    color: '#0B1F3A',
    fontWeight: '600',
  },
  bioStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bioStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  bioStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
