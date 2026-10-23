import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import * as Haptics from 'expo-haptics';

interface ServicesScreenProps {
  onOpenChat: () => void;
  onOpenDiningMenu?: () => void;
  onOpenRequestDetail?: (requestId: string) => void;
  onOpenHotelInfo?: () => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onOpenChat,
  onOpenDiningMenu,
  onOpenRequestDetail,
  onOpenHotelInfo,
}) => {
  const {
    reservation,
    requests,
    requestHousekeeping,
    refreshStayData,
    hasActiveRoom,
    showToast,
  } = useGuestStay();

  const [dispatchingCard, setDispatchingCard] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Active or pending requests
  const activeRequests = requests.filter((r) => r.status !== 'completed');
  const latestActiveRequest = activeRequests[0] || requests[0];
  const inProgressCount = activeRequests.length;

  const handleQuickRequest = async (type: string, title: string, subtitle: string) => {
    if (!hasActiveRoom) {
      showToast('Check-In Required', 'Please check into a room before requesting room services.', 'alert');
      return;
    }
    setDispatchingCard(type);
    try {
      if (type === 'dining') {
        if (onOpenDiningMenu) {
          onOpenDiningMenu();
        } else {
          await requestHousekeeping('In-Room Dining Order', 'Requested priority dining menu assistance');
        }
      } else if (type === 'towels') {
        await requestHousekeeping('Fresh Towels & Toiletries', 'Delivering to suite');
      } else if (type === 'valet') {
        await requestHousekeeping('Luggage & Valet Porter', 'Vehicle retrieval & porter dispatch');
      } else if (type === 'late_checkout') {
        await requestHousekeeping('Late Checkout Request', 'Requested extension until 2:00 PM');
      }
    } finally {
      setDispatchingCard(null);
    }
  };

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
        <View style={styles.headerTopRow}>
          <Text style={[typography.labelCaps, styles.overline]}>CONCIERGE & COMFORT</Text>
          {onOpenHotelInfo && (
            <TouchableOpacity style={styles.hotelInfoBtn} onPress={onOpenHotelInfo} activeOpacity={0.8}>
              <Ionicons name="information-circle-outline" size={14} color="#0B1F3A" style={{ marginRight: 4 }} />
              <Text style={styles.hotelInfoBtnText}>Hotel Info & FAQs</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.mainTitle}>Guest Services</Text>
        <Text style={styles.subtitle}>
          Instant hotel assistance & on-demand amenities
        </Text>
      </View>

      {!hasActiveRoom ? (
        <View style={[styles.pendingServicesCard, shadows.card]}>
          <View style={styles.pendingServicesIconBox}>
            <Ionicons name="sparkles-outline" size={38} color="#C9A227" />
          </View>
          <Text style={styles.pendingServicesTitle}>Room Services Inactive</Text>
          <Text style={styles.pendingServicesDesc}>
            In-room dining, fresh towels & toiletries, luggage valet, and late check-out requests activate automatically once you are checked into a suite.
          </Text>
          <View style={styles.pendingBadgeRow}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingBadgeText}>Awaiting Room Check-In</Text>
          </View>

          <TouchableOpacity
            style={styles.pendingChatButton}
            onPress={onOpenChat}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#0B1F3A" style={{ marginRight: 8 }} />
            <Text style={styles.pendingChatButtonText}>Message Front Desk & Concierge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
      {/* Active Requests Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Active Requests</Text>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activePillText}>
            {inProgressCount > 0 ? `${inProgressCount} In Progress` : '0 Active'}
          </Text>
        </View>
      </View>

      {/* Active Request Card */}
      {latestActiveRequest ? (
        <TouchableOpacity
          style={[styles.activeCard, shadows.card]}
          onPress={() => onOpenRequestDetail?.(latestActiveRequest.id)}
          activeOpacity={0.85}
        >
          <View style={styles.activeCardTopRow}>
            <View style={styles.requestIconBox}>
              <Ionicons
                name={
                  latestActiveRequest.type === 'dining'
                    ? 'restaurant-outline'
                    : latestActiveRequest.type === 'concierge'
                    ? 'chatbubbles-outline'
                    : latestActiveRequest.type === 'valet'
                    ? 'car-outline'
                    : 'bed-outline'
                }
                size={22}
                color="#0B1F3A"
              />
            </View>

            <View style={styles.requestInfoCol}>
              <Text style={styles.requestTitle} numberOfLines={1}>
                {latestActiveRequest.title}
              </Text>
              <Text style={styles.requestSubtitle}>
                Placed {latestActiveRequest.timeRequested} {reservation.suiteNumber ? `· ${reservation.suiteNumber}` : ''}
              </Text>
            </View>

            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>
                {latestActiveRequest.status === 'completed'
                  ? 'Completed'
                  : latestActiveRequest.eta
                  ? `ETA · ${latestActiveRequest.eta}`
                  : 'In Progress'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: latestActiveRequest.status === 'completed' ? '100%' : '55%' },
              ]}
            />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.activeCard, shadows.card, { paddingVertical: 18, alignItems: 'center' }]}>
          <Ionicons name="sparkles-outline" size={26} color="#94A3B8" style={{ marginBottom: 6 }} />
          <Text style={[styles.requestTitle, { fontSize: 15, color: '#475569' }]}>No Pending Service Requests</Text>
          <Text style={[styles.requestSubtitle, { textAlign: 'center', marginTop: 2 }]}>
            Use the quick requests below or message Concierge to request room services.
          </Text>
        </View>
      )}

      {/* Quick Requests Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
        <Text style={styles.sectionTitle}>Quick Requests</Text>
        <Text style={styles.sectionActionText}>Tap to dispatch</Text>
      </View>

      {/* 2x2 Quick Requests Grid */}
      <View style={styles.grid}>
        {/* 1. In-Room Dining */}
        <TouchableOpacity
          style={[styles.gridCard, shadows.card]}
          onPress={() => handleQuickRequest('dining', 'In-Room Dining', 'Breakfast & all-day menu')}
          activeOpacity={0.8}
          disabled={dispatchingCard !== null}
        >
          <View style={styles.gridIconBox}>
            {dispatchingCard === 'dining' ? (
              <ActivityIndicator size="small" color="#0B1F3A" />
            ) : (
              <Ionicons name="restaurant-outline" size={22} color="#0B1F3A" />
            )}
          </View>
          <Text style={styles.gridCardTitle}>In-Room Dining</Text>
          <Text style={styles.gridCardDesc}>Breakfast & all-day menu</Text>
        </TouchableOpacity>

        {/* 2. Fresh Towels & Toiletries */}
        <TouchableOpacity
          style={[styles.gridCard, shadows.card]}
          onPress={() => handleQuickRequest('towels', 'Fresh Towels & Toiletries', 'Average delivery 12 mins')}
          activeOpacity={0.8}
          disabled={dispatchingCard !== null}
        >
          <View style={styles.gridIconBox}>
            {dispatchingCard === 'towels' ? (
              <ActivityIndicator size="small" color="#0B1F3A" />
            ) : (
              <Ionicons name="shirt-outline" size={22} color="#0B1F3A" />
            )}
          </View>
          <Text style={styles.gridCardTitle}>Fresh Towels & Toiletries</Text>
          <Text style={styles.gridCardDesc}>Average delivery 12 mins</Text>
        </TouchableOpacity>

        {/* 3. Luggage & Valet */}
        <TouchableOpacity
          style={[styles.gridCard, shadows.card]}
          onPress={() => handleQuickRequest('valet', 'Luggage & Valet', 'Vehicle retrieval & porter')}
          activeOpacity={0.8}
          disabled={dispatchingCard !== null}
        >
          <View style={styles.gridIconBox}>
            {dispatchingCard === 'valet' ? (
              <ActivityIndicator size="small" color="#0B1F3A" />
            ) : (
              <Ionicons name="briefcase-outline" size={22} color="#0B1F3A" />
            )}
          </View>
          <Text style={styles.gridCardTitle}>Luggage & Valet</Text>
          <Text style={styles.gridCardDesc}>Vehicle retrieval & porter</Text>
        </TouchableOpacity>

        {/* 4. Late Checkout Request */}
        <TouchableOpacity
          style={[styles.gridCard, shadows.card]}
          onPress={() => handleQuickRequest('late_checkout', 'Late Checkout Request', 'Available until 2:00 PM')}
          activeOpacity={0.8}
          disabled={dispatchingCard !== null}
        >
          <View style={styles.gridIconBox}>
            {dispatchingCard === 'late_checkout' ? (
              <ActivityIndicator size="small" color="#0B1F3A" />
            ) : (
              <Ionicons name="time-outline" size={22} color="#0B1F3A" />
            )}
          </View>
          <Text style={styles.gridCardTitle}>Late Checkout Request</Text>
          <Text style={styles.gridCardDesc}>Available until 2:00 PM</Text>
        </TouchableOpacity>
      </View>

        </>
      )}

      {/* Thoughtful Hospitality Banner */}
      <View style={[styles.bannerContainer, shadows.card]}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80',
          }}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTag}>THOUGHTFUL HOSPITALITY</Text>
            <Text style={styles.bannerSubtitle}>
              Need something customized? We curate bespoke experiences 24/7.
            </Text>
          </View>
        </ImageBackground>
      </View>

      {/* Big Golden Yellow Button: Chat with Front Desk Concierge */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={onOpenChat}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#1A1C1B" style={{ marginRight: 8 }} />
        <Text style={styles.chatButtonText}>Chat with Front Desk Concierge</Text>
      </TouchableOpacity>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hotelInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEEC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  hotelInfoBtnText: {
    color: '#0B1F3A',
    fontSize: 12,
    fontWeight: '700',
  },
  overline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  mainTitle: {
    color: '#0B1F3A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  pendingServicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  pendingServicesIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FDE047',
  },
  pendingServicesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingServicesDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
    marginBottom: 16,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  pendingBadgeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pendingChatButtonText: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0B1F3A',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionActionText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activePillText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  requestSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  etaBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBar: {
    width: '72%',
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: 145,
    justifyContent: 'space-between',
  },
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  gridCardDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  bannerContainer: {
    marginTop: 22,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bannerTag: {
    color: '#FED255',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  chatButton: {
    marginTop: 20,
    backgroundColor: '#FED255',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FED255',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  chatButtonText: {
    color: '#1A1C1B',
    fontSize: 15,
    fontWeight: '700',
  },
});
