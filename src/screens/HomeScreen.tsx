import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { SmartStayTab } from '../components/SmartStayBottomNav';
import { QrScannerModal } from '../components/QrScannerModal';
import * as Haptics from 'expo-haptics';

interface HomeScreenProps {
  onNavigateTab: (tab: SmartStayTab) => void;
  onOpenChat?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab, onOpenChat }) => {
  const {
    reservation,
    doorState,
    keyStatus,
    dndActive,
    toggleDnd,
    unlockDoor,
    lockDoor,
    climate,
    cleaningRequested,
    toggleCleaningRequested,
    light,
    tv,
    fridge,
    unlockCountdown,
    requests,
    refreshStayData,
    hasActiveRoom,
    linkBooking,
    hotelInfo,
    stayHistory,
    showToast,
  } = useGuestStay();

  const [refreshing, setRefreshing] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStayData();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // fallback
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshStayData]);

  const handleCallFrontDesk = () => {
    const phone = reservation.conciergePhone || hotelInfo?.receptionPhone || '+15550192';
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      showToast('Front Desk', `Reception Phone: ${phone}`, 'info');
    });
  };

  const handleLinkBookingSubmit = async () => {
    if (!checkInCode.trim()) {
      showToast('Missing Code', 'Please enter your 8-digit check-in code or reservation reference.', 'alert');
      return;
    }
    setCheckInLoading(true);
    try {
      const res = await linkBooking({ bookingCode: checkInCode.trim(), reference: checkInCode.trim() });
      if (res.success) {
        setIsCheckInModalOpen(false);
        setCheckInCode('');
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const isUnlocked = doorState === 'unlocked';
  const isUnlocking = doorState === 'unlocking';
  const guestFirstName = reservation.guestName ? reservation.guestName.split(' ')[0] : 'Guest';

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
      {/* Greeting Header */}
      <View style={styles.greetingSection}>
        <Text style={[typography.labelCaps, styles.welcomeOverline]}>
          {hasActiveRoom ? 'WELCOME BACK' : 'WELCOME TO SMARTSTAY'}
        </Text>
        <Text style={styles.greetingTitle}>Good evening, {guestFirstName}</Text>
        <Text style={styles.suiteSubtitle}>
          {hasActiveRoom
            ? `${reservation.suiteType} · ${reservation.suiteNumber}`
            : 'Mobile Account Active · Awaiting Room Assignment'}
        </Text>
      </View>

      {/* ========================================================================= */}
      {/* STATE A: ACTIVE CHECKED-IN ROOM (Hero Key & Room Controls)               */}
      {/* ========================================================================= */}
      {hasActiveRoom ? (
        <>
          {/* Hero Digital Key Card */}
          <View style={[styles.keyCard, shadows.card]}>
            <View style={styles.keyCardTopRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: isUnlocked ? '#DCFCE7' : '#F1F5F9' },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isUnlocked ? '#16A34A' : '#64748B' },
                  ]}
                />
                <Text
                  style={[
                    typography.labelMd,
                    { color: isUnlocked ? '#16A34A' : '#475569', fontWeight: '700' },
                  ]}
                >
                  {isUnlocked ? 'Unlocked & Paired' : 'Locked & Secured'}
                </Text>
              </View>

              <Text style={[typography.labelCaps, styles.bleStatusText]}>
                {keyStatus === 'connected' ? 'DIGITAL KEY · ACTIVE' : 'DIGITAL KEY · OFFLINE'}
              </Text>
            </View>

            {/* Central Key Circle Target */}
            <View style={styles.centerTargetWrapper}>
              <TouchableOpacity
                style={[
                  styles.circleTarget,
                  {
                    backgroundColor: isUnlocked ? '#DCFCE7' : '#FEF3C7',
                    borderColor: isUnlocked ? '#16A34A' : '#FDE68A',
                  },
                ]}
                onPress={isUnlocked ? lockDoor : unlockDoor}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isUnlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={32}
                  color="#0B1F3A"
                />
              </TouchableOpacity>
              <Text style={styles.protocolText}>Secured via Guest Access Protocol</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.unlockActionButton,
                { backgroundColor: isUnlocked ? '#0B1F3A' : '#705908' },
              ]}
              onPress={isUnlocked ? lockDoor : unlockDoor}
              disabled={isUnlocking}
              activeOpacity={0.88}
            >
              <Ionicons
                name={isUnlocked ? 'lock-closed-outline' : 'key-outline'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.unlockActionText}>
                {isUnlocking
                  ? 'Authenticating Lock...'
                  : isUnlocked
                  ? `Tap to Lock (${unlockCountdown}s)`
                  : 'Hold to Unlock Door'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nfcHintButton}
              onPress={isUnlocked ? lockDoor : unlockDoor}
              activeOpacity={0.7}
            >
              <Ionicons name="radio-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.nfcHintText}>Or tap phone to door handle</Text>
            </TouchableOpacity>
          </View>

          {/* Room Quick Actions (2x2 Grid) */}
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Room Quick Actions</Text>
              <Text style={[typography.labelCaps, styles.liveStateText]}>LIVE STATE</Text>
            </View>

            <View style={styles.quickActionsGrid}>
              {/* 1. Climate (AC) */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={() => onNavigateTab('controls')}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="thermometer-outline" size={24} color="#0B1F3A" />
                  <View style={[styles.tileDot, { backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.tileTitle}>Climate (AC)</Text>
                <Text style={styles.tileSubtitle}>
                  {climate.targetTemp}°F · {climate.ecoMode ? 'Eco Cool' : 'Regulating'}
                </Text>
              </TouchableOpacity>

              {/* 2. Master Lights */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={() => onNavigateTab('controls')}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="bulb-outline" size={24} color="#0B1F3A" />
                  <View
                    style={[
                      styles.tileDot,
                      { backgroundColor: light.power ? '#EAB308' : '#94A3B8' },
                    ]}
                  />
                </View>
                <Text style={styles.tileTitle}>Master Lights</Text>
                <Text style={styles.tileSubtitle}>
                  {light.power
                    ? `${light.scene.charAt(0).toUpperCase() + light.scene.slice(1)} · ${light.brightness}%`
                    : 'All Lights Off'}
                </Text>
              </TouchableOpacity>

              {/* 3. Smart TV */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={() => onNavigateTab('controls')}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="tv-outline" size={24} color="#0B1F3A" />
                  <View
                    style={[
                      styles.tileDot,
                      { backgroundColor: tv.power ? '#16A34A' : '#94A3B8' },
                    ]}
                  />
                </View>
                <Text style={styles.tileTitle}>Smart TV</Text>
                <Text style={styles.tileSubtitle}>
                  {tv.power ? `${tv.appName || 'On'} · Vol ${tv.volume}%` : 'Standby Mode'}
                </Text>
              </TouchableOpacity>

              {/* 4. Mini-Bar Fridge */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={() => onNavigateTab('controls')}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="wine-outline" size={24} color="#0B1F3A" />
                  <View
                    style={[
                      styles.tileDot,
                      { backgroundColor: fridge.power ? '#16A34A' : '#94A3B8' },
                    ]}
                  />
                </View>
                <Text style={styles.tileTitle}>Mini-Bar Fridge</Text>
                <Text style={styles.tileSubtitle}>
                  {fridge.power ? `${fridge.temp}°F · ${fridge.mode.toUpperCase()}` : 'Eco Off'}
                </Text>
              </TouchableOpacity>

              {/* 5. Do Not Disturb */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={toggleDnd}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="remove-circle-outline" size={24} color="#0B1F3A" />
                  <View
                    style={[
                      styles.tileDot,
                      { backgroundColor: dndActive ? '#DC2626' : '#94A3B8' },
                    ]}
                  />
                </View>
                <Text style={styles.tileTitle}>Do Not Disturb</Text>
                <Text
                  style={[
                    styles.tileSubtitle,
                    { color: dndActive ? '#DC2626' : '#64748B' },
                  ]}
                >
                  {dndActive ? 'Active · Privacy' : 'Standard'}
                </Text>
              </TouchableOpacity>

              {/* 6. Housekeeping */}
              <TouchableOpacity
                style={[styles.quickTile, shadows.card]}
                onPress={() => toggleCleaningRequested()}
                activeOpacity={0.8}
              >
                <View style={styles.tileTopRow}>
                  <Ionicons name="brush-outline" size={24} color="#0B1F3A" />
                  <View
                    style={[
                      styles.tileDot,
                      { backgroundColor: cleaningRequested ? '#16A34A' : '#94A3B8' },
                    ]}
                  />
                </View>
                <Text style={styles.tileTitle}>Housekeeping</Text>
                <Text
                  style={[
                    styles.tileSubtitle,
                    cleaningRequested && { color: '#16A34A', fontWeight: '700' },
                  ]}
                >
                  {cleaningRequested ? 'Requested · Scheduled' : 'Tap to Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        /* ========================================================================= */
        /* STATE B: NEW USER / AWAITING CHECK-IN (Welcoming Hospitality State)     */
        /* ========================================================================= */
        <>
          {/* Hero Awaiting Check-In Card */}
          <View style={[styles.pendingHeroCard, shadows.card]}>
            <View style={styles.keyCardTopRow}>
              <View style={styles.pendingStatusPill}>
                <View style={styles.pendingStatusDot} />
                <Text style={styles.pendingStatusPillText}>Awaiting Room Check-In</Text>
              </View>
              <Text style={[typography.labelCaps, styles.bleStatusText]}>DIGITAL CONCIERGE</Text>
            </View>

            <View style={styles.pendingEmblemWrapper}>
              <View style={styles.pendingEmblemCircle}>
                <Ionicons name="bed-outline" size={36} color="#0B1F3A" />
              </View>
              <Text style={styles.pendingHeroTitle}>Ready for Your Arrival</Text>
              <Text style={styles.pendingHeroDesc}>
                Welcome, {guestFirstName}! Your mobile profile is active. Once the front desk checks you in or your room is assigned, your digital door key and in-room smart controls will appear right here.
              </Text>
            </View>

            <View style={styles.hotelPolicyStrip}>
              <View style={styles.policyCol}>
                <Text style={styles.policyLabel}>STANDARD CHECK-IN</Text>
                <Text style={styles.policyValue}>3:00 PM</Text>
              </View>
              <View style={styles.policyDivider} />
              <View style={styles.policyCol}>
                <Text style={styles.policyLabel}>CHECK-OUT</Text>
                <Text style={styles.policyValue}>11:00 AM</Text>
              </View>
              <View style={styles.policyDivider} />
              <View style={styles.policyCol}>
                <Text style={styles.policyLabel}>FRONT DESK</Text>
                <Text style={styles.policyValue}>Open 24/7</Text>
              </View>
            </View>
          </View>

          {/* Action Card: Check In with Booking Code or QR Pass */}
          <View style={[styles.checkInActionCard, shadows.card]}>
            <View style={styles.actionHeaderRow}>
              <View style={styles.actionIconBadge}>
                <Ionicons name="key-outline" size={22} color="#C9A227" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionCardTitle}>Have a Booking Code or Pass?</Text>
                <Text style={styles.actionCardSubtitle}>
                  Enter the 8-digit check-in code received by email or scan your arrival QR pass to activate your digital room key immediately.
                </Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setIsCheckInModalOpen(true)}
                activeOpacity={0.88}
              >
                <Ionicons name="key" size={16} color="#1A1C1B" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>Enter Check-In Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setIsQrScannerOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={16} color="#0B1F3A" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionText}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Direct Concierge Contact Buttons */}
          <View style={styles.conciergeContactRow}>
            <TouchableOpacity
              style={[styles.contactTile, shadows.card]}
              onPress={handleCallFrontDesk}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="call" size={20} color="#2563EB" />
              </View>
              <Text style={styles.contactTileTitle}>Call Front Desk</Text>
              <Text style={styles.contactTileSubtitle}>Request Room or Early Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactTile, shadows.card]}
              onPress={onOpenChat ? onOpenChat : () => onNavigateTab('services')}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: '#FEF9C3' }]}>
                <Ionicons name="chatbubbles" size={20} color="#CA8A04" />
              </View>
              <Text style={styles.contactTileTitle}>Chat Concierge</Text>
              <Text style={styles.contactTileSubtitle}>24/7 Messaging Assistance</Text>
            </TouchableOpacity>
          </View>

          {/* Hotel Amenities & Dining Preview Card */}
          <View style={[styles.amenitiesCard, shadows.card]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Hotel Experience & Dining</Text>
              <TouchableOpacity onPress={() => onNavigateTab('services')}>
                <Text style={styles.viewAllLink}>Browse All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.amenityRowItem}
              onPress={() => onNavigateTab('services')}
              activeOpacity={0.7}
            >
              <View style={styles.amenityIconBox}>
                <Ionicons name="restaurant-outline" size={20} color="#0B1F3A" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.amenityItemTitle}>In-Room Dining & Bar</Text>
                <Text style={styles.amenityItemDesc}>Explore chef specialties, drinks, and breakfast service</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.amenityRowItem}>
              <View style={styles.amenityIconBox}>
                <Ionicons name="wifi-outline" size={20} color="#0B1F3A" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.amenityItemTitle}>Complimentary Guest Wi-Fi</Text>
                <Text style={styles.amenityItemDesc}>
                  Network: {reservation.hotelName || 'SmartStay'}_Guest · Password at Reception
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            </View>

            {stayHistory && stayHistory.length > 0 && (
              <TouchableOpacity
                style={styles.amenityRowItem}
                onPress={() => onNavigateTab('profile')}
                activeOpacity={0.7}
              >
                <View style={styles.amenityIconBox}>
                  <Ionicons name="time-outline" size={20} color="#0B1F3A" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.amenityItemTitle}>Your Stay History</Text>
                  <Text style={styles.amenityItemDesc}>
                    {stayHistory.length} past visit{stayHistory.length === 1 ? '' : 's'} recorded on your profile
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Active Service Requests & Schedule */}
      <View style={styles.scheduleSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Requests & Schedule</Text>
          <Text style={[typography.labelCaps, styles.liveStateText]}>
            {requests.length > 0 ? `${requests.length} ACTIVE` : 'ALL CLEAR'}
          </Text>
        </View>

        <View style={styles.scheduleList}>
          {requests.length > 0 ? (
            requests.slice(0, 4).map((req) => (
              <TouchableOpacity
                key={req.id}
                style={[styles.scheduleCard, shadows.card]}
                onPress={() => onNavigateTab('services')}
                activeOpacity={0.85}
              >
                <View style={styles.scheduleIconCircle}>
                  <Ionicons
                    name={
                      req.type === 'dining'
                        ? 'restaurant-outline'
                        : req.type === 'concierge'
                        ? 'chatbubbles-outline'
                        : req.type === 'valet'
                        ? 'car-outline'
                        : 'sparkles-outline'
                    }
                    size={20}
                    color="#0B1F3A"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleItemTitle}>{req.title}</Text>
                  <Text style={styles.scheduleItemLocation} numberOfLines={1}>{req.detail}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.scheduleItemTime}>{req.timeRequested}</Text>
                  <Text
                    style={[
                      typography.labelSm,
                      {
                        color: req.status === 'completed' ? '#16A34A' : '#D97706',
                        textTransform: 'uppercase',
                        fontSize: 10,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {req.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={[styles.scheduleCard, shadows.card]}
              onPress={() => onNavigateTab('services')}
              activeOpacity={0.85}
            >
              <View style={styles.scheduleIconCircle}>
                <Ionicons name="notifications-outline" size={20} color="#0B1F3A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleItemTitle}>No Active Requests</Text>
                <Text style={styles.scheduleItemLocation}>Tap to order dining, housekeeping, or amenities</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ===================== CHECK-IN / LINK BOOKING MODAL ===================== */}
      <Modal
        visible={isCheckInModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCheckInModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBadge}>
                  <Ionicons name="key" size={20} color="#C9A227" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalTitle}>Check In to Your Room</Text>
                  <Text style={styles.modalSubtitle}>Link Booking & Activate Key</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsCheckInModalOpen(false)}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInstructions}>
                Enter the 8-character check-in code from your arrival card, confirmation email, or front desk.
              </Text>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 8 }]}>CHECK-IN / BOOKING CODE</Text>
              <View style={[styles.inputBox, styles.codeInputBox]}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. SSCH55WU"
                  placeholderTextColor="#94A3B8"
                  value={checkInCode}
                  onChangeText={setCheckInCode}
                  autoCapitalize="characters"
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 20 }]}
                onPress={handleLinkBookingSubmit}
                disabled={checkInLoading}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {checkInLoading ? 'Activating Room Key...' : 'Activate Digital Room Key'}
                </Text>
                {!checkInLoading && (
                  <Ionicons name="arrow-forward" size={18} color="#1A1C1B" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanQrAlternativeBtn}
                onPress={() => {
                  setIsCheckInModalOpen(false);
                  setIsQrScannerOpen(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={16} color="#0B1F3A" style={{ marginRight: 6 }} />
                <Text style={styles.scanQrAlternativeText}>Or Scan Arrival QR Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QR Scanner Modal for Instant Arrival Pass */}
      <QrScannerModal
        visible={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={async (qrData) => {
          let token = qrData.trim();
          let bookingCode: string | undefined;
          let reference: string | undefined;

          if (token.startsWith('{') && token.endsWith('}')) {
            try {
              const parsed = JSON.parse(token);
              if (parsed.qrToken) token = parsed.qrToken;
              else if (parsed.token) token = parsed.token;
              if (parsed.accessCode) bookingCode = parsed.accessCode;
              else if (parsed.code) bookingCode = parsed.code;
              if (parsed.reference) reference = parsed.reference;
            } catch {
              // ignore
            }
          } else if (token.includes('token=')) {
            try {
              const urlMatch = token.match(/[?&]token=([^&]+)/);
              if (urlMatch && urlMatch[1]) {
                token = decodeURIComponent(urlMatch[1]);
              }
            } catch {
              // ignore
            }
          }

          const res = await linkBooking({
            qrData,
            qrToken: token,
            bookingCode: bookingCode || (token.length <= 10 ? token : undefined),
            reference: reference,
          });

          if (res.success) {
            setIsQrScannerOpen(false);
            return true;
          }
          return false;
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  welcomeOverline: {
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0B1F3A',
    letterSpacing: -0.5,
  },
  suiteSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },

  /* Active Room Key Card Styles */
  keyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bleStatusText: {
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  centerTargetWrapper: {
    alignItems: 'center',
    marginVertical: 22,
  },
  circleTarget: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...shadows.card,
  },
  protocolText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  unlockActionButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.card,
  },
  unlockActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  nfcHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  nfcHintText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Pending Check-In Hero Card */
  pendingHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pendingStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  pendingStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingEmblemWrapper: {
    alignItems: 'center',
    marginVertical: 18,
    paddingHorizontal: 12,
  },
  pendingEmblemCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF9C3',
    borderWidth: 2,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.card,
  },
  pendingHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingHeroDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  hotelPolicyStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    marginTop: 6,
  },
  policyCol: {
    flex: 1,
    alignItems: 'center',
  },
  policyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  policyValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B1F3A',
  },
  policyDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },

  /* Action Card: Check In with Code or QR */
  checkInActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C9A227',
    paddingVertical: 12,
    borderRadius: 10,
    ...shadows.card,
  },
  primaryActionText: {
    color: '#1A1C1B',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Contact Concierge & Reception Row */
  conciergeContactRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  contactTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  contactTileSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },

  /* Amenities & Dining Card */
  amenitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  amenityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  amenityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  amenityItemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  /* Room Quick Actions Section */
  quickActionsSection: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1F3A',
  },
  liveStateText: {
    color: '#64748B',
    fontSize: 10,
    letterSpacing: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1F3A',
    marginBottom: 3,
  },
  tileSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Requests Section */
  scheduleSection: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  scheduleList: {
    gap: 10,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1F3A',
  },
  scheduleItemLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  scheduleItemTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1F3A',
  },

  /* Check In Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalInstructions: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 48,
  },
  codeInputBox: {
    justifyContent: 'center',
    height: 52,
    borderColor: '#C9A227',
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#0B1F3A',
    width: '100%',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#C9A227',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  continueButtonText: {
    color: '#1A1C1B',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scanQrAlternativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  scanQrAlternativeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B1F3A',
  },
});
