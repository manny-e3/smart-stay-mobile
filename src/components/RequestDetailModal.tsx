import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { guestApi } from '../services/guestApi';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import * as Haptics from 'expo-haptics';

interface RequestDetailModalProps {
  visible: boolean;
  requestId: string | null;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  visible,
  requestId,
  onClose,
}) => {
  const { requests, cancelRequest, reservation, refreshStayData } = useGuestStay();
  const [cancelling, setCancelling] = useState(false);
  const [prevRequestId, setPrevRequestId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (requestId !== prevRequestId) {
    setPrevRequestId(requestId);
    setDetailData(null);
  }

  const onRefresh = useCallback(async () => {
    if (!requestId) return;
    setRefreshing(true);
    try {
      await refreshStayData();
      const res = await guestApi.getRequestDetail(requestId);
      if (res.success && res.data) {
        setDetailData(res.data);
      }
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // fallback
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [requestId, refreshStayData]);

  const localReq = requests.find((r) => r.id === requestId);
  const isLoading = visible && !!requestId && !detailData;

  useEffect(() => {
    let isSubscribed = true;
    if (visible && requestId) {
      guestApi
        .getRequestDetail(requestId)
        .then((res) => {
          if (isSubscribed && res.success && res.data) {
            setDetailData(res.data);
          } else if (isSubscribed) {
            setDetailData(localReq || {});
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setDetailData(localReq || {});
          }
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [visible, requestId, localReq]);

  const title = detailData?.category
    ? detailData.category.toUpperCase()
    : localReq?.title || 'Guest Request';
  const description = detailData?.description || localReq?.detail || 'In-room service dispatched';
  const status = detailData?.status || localReq?.status || 'in_progress';
  const isDone = status === 'done' || status === 'completed';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'new' || status === 'pending';
  const isInProgress = status === 'in_progress' || (!isDone && !isCancelled && !isPending);

  const handleCancel = async () => {
    if (!requestId) return;
    setCancelling(true);
    await cancelRequest(requestId);
    setCancelling(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, shadows.floating]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelCaps, styles.subHeader]}>
                {reservation.suiteNumber} · SERVICE REQUEST #{requestId}
              </Text>
              <Text style={[typography.headlineSm, styles.title]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#0B1F3A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
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
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#0B1F3A" />
                <Text style={styles.loadingText}>Fetching timeline from concierge...</Text>
              </View>
            ) : null}

            {/* Status Summary Banner */}
            <View style={[styles.statusBanner, shadows.card]}>
              <View style={styles.statusLeft}>
                <View
                  style={[
                    styles.statusIndicatorCircle,
                    {
                      backgroundColor: isDone
                        ? '#DCFCE7'
                        : isCancelled
                        ? '#FEE2E2'
                        : '#FEF3C7',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isDone
                        ? 'checkmark-circle'
                        : isCancelled
                        ? 'close-circle'
                        : 'time-outline'
                    }
                    size={24}
                    color={
                      isDone ? '#16A34A' : isCancelled ? '#DC2626' : '#B45309'
                    }
                  />
                </View>
                <View>
                  <Text style={styles.statusTitle}>
                    {isDone
                      ? 'Service Completed'
                      : isCancelled
                      ? 'Request Cancelled'
                      : isInProgress
                      ? 'In Progress · Floor Attendant'
                      : 'Received & Queued'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {localReq?.timeRequested
                      ? `Placed at ${localReq.timeRequested}`
                      : 'Submitted from guest mobile app'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Timeline Stepper */}
            <View style={[styles.timelineCard, shadows.card]}>
              <Text style={styles.timelineHeader}>Request Timeline</Text>

              {/* Step 1: Received */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineStepLeft}>
                  <View style={[styles.stepDot, styles.stepDotDone]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.stepLineActive} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Request Received</Text>
                  <Text style={styles.stepDesc}>Dispatched to central guest operations.</Text>
                </View>
              </View>

              {/* Step 2: Assigned */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineStepLeft}>
                  <View
                    style={[
                      styles.stepDot,
                      isInProgress || isDone ? styles.stepDotDone : styles.stepDotPending,
                    ]}
                  >
                    {isInProgress || isDone ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <View style={styles.stepInnerDot} />
                    )}
                  </View>
                  <View
                    style={
                      isDone
                        ? styles.stepLineActive
                        : isInProgress
                        ? styles.stepLineActive
                        : styles.stepLineInactive
                    }
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Assigned to Floor Attendant</Text>
                  <Text style={styles.stepDesc}>Staff member assigned to Suite {reservation.suiteNumber}.</Text>
                </View>
              </View>

              {/* Step 3: In Transit / Preparation */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineStepLeft}>
                  <View
                    style={[
                      styles.stepDot,
                      isDone
                        ? styles.stepDotDone
                        : isInProgress
                        ? styles.stepDotCurrent
                        : styles.stepDotPending,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <View style={styles.stepInnerDot} />
                    )}
                  </View>
                  <View style={isDone ? styles.stepLineActive : styles.stepLineInactive} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Preparation & Delivery</Text>
                  <Text style={styles.stepDesc}>Attendant en route or item being prepared.</Text>
                </View>
              </View>

              {/* Step 4: Completed */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineStepLeft}>
                  <View style={[styles.stepDot, isDone ? styles.stepDotDone : styles.stepDotPending]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <View style={styles.stepInnerDot} />
                    )}
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Delivered & Verified</Text>
                  <Text style={styles.stepDesc}>Confirmed delivered to guest suite.</Text>
                </View>
              </View>
            </View>

            {/* Request Details */}
            <View style={[styles.detailsCard, shadows.card]}>
              <Text style={styles.detailsHeader}>Request Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Suite</Text>
                <Text style={styles.detailValue}>{reservation.suiteNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Details</Text>
                <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                  {description}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status Code</Text>
                <Text style={styles.detailValue}>{status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Cancel Button if not yet finished */}
            {!isDone && !isCancelled && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={styles.cancelButtonText}>Cancel Request (POST /guest/requests/:id/cancel)</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 58, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F9F9F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 31, 58, 0.08)',
  },
  subHeader: {
    color: '#64748B',
    marginBottom: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    color: '#0B1F3A',
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEEEEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    marginTop: 14,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  statusBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicatorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusTitle: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  timelineHeader: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineStepLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 14,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#16A34A',
  },
  stepDotCurrent: {
    backgroundColor: '#FED255',
  },
  stepDotPending: {
    backgroundColor: '#E2E8F0',
  },
  stepInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  stepLineActive: {
    width: 2,
    height: 36,
    backgroundColor: '#16A34A',
  },
  stepLineInactive: {
    width: 2,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 22,
  },
  stepTitle: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '700',
  },
  stepDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  detailsHeader: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  detailValue: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
