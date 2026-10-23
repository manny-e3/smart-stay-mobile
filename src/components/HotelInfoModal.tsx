import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import * as Haptics from 'expo-haptics';

interface HotelInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HotelInfoModal: React.FC<HotelInfoModalProps> = ({ visible, onClose }) => {
  const { hotelInfo, reservation, fetchHotelInfo } = useGuestStay();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchHotelInfo();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // fallback
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchHotelInfo]);

  const receptionPhone = hotelInfo?.receptionPhone || reservation.conciergePhone || '';
  const faqs = hotelInfo?.faqs && Array.isArray(hotelInfo.faqs) ? hotelInfo.faqs : [];
  const hotelName = hotelInfo?.hotelName || reservation.hotelName || 'SmartStay Hotel';
  const privacyNotice =
    hotelInfo?.privacyNotice ||
    'SmartStay is committed to safeguarding your privacy and guest room security. Cryptographic door tokens are single-occupant authorized and access telemetry is encrypted end-to-end.';

  const handleCallReception = () => {
    if (!receptionPhone) return;
    const cleanNumber = receptionPhone.replace(/[^+\d]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {});
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, shadows.floating]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelCaps, styles.subHeader]}>
                HOTEL DIRECTORY & AMENITIES
              </Text>
              <Text style={[typography.headlineSm, styles.title]} numberOfLines={1}>
                {hotelName}
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
            {/* Quick Contact Card */}
            <View style={[styles.contactCard, shadows.card]}>
              <View style={styles.contactLeft}>
                <View style={styles.phoneIconBox}>
                  <Ionicons name="call-outline" size={20} color="#0B1F3A" />
                </View>
                <View>
                  <Text style={styles.contactLabel}>24/7 Front Desk Reception</Text>
                  <Text style={styles.contactPhone}>{receptionPhone}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallReception}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={14} color="#0B1F3A" style={{ marginRight: 4 }} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Links Section */}
            {hotelInfo?.quickLinks && hotelInfo.quickLinks.length > 0 && (
              <View style={styles.quickLinksRow}>
                {hotelInfo.quickLinks.map((link, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.quickLinkPill, shadows.card]}
                    onPress={() => Linking.openURL(link.url).catch(() => {})}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={(link.icon as any) || 'open-outline'}
                      size={14}
                      color="#0B1F3A"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.quickLinkText}>{link.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* FAQs Accordion */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionSubtitle}>
                {faqs.length > 0 ? `${faqs.length} answers` : 'Reception assistance'}
              </Text>
            </View>

            <View style={styles.faqList}>
              {faqs.length > 0 ? (
                faqs.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <View key={index} style={[styles.faqCard, shadows.card]}>
                      <TouchableOpacity
                        style={styles.faqQuestionRow}
                        onPress={() => toggleFaq(index)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={styles.faqAnswerContainer}>
                          <Text style={styles.faqAnswer}>{faq.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={[styles.faqCard, shadows.card, { padding: 18, alignItems: 'center' }]}>
                  <Ionicons name="help-circle-outline" size={24} color="#64748B" style={{ marginBottom: 6 }} />
                  <Text style={[styles.faqQuestion, { textAlign: 'center', marginBottom: 4 }]}>
                    24/7 Front Desk Directory
                  </Text>
                  <Text style={[styles.faqAnswer, { textAlign: 'center' }]}>
                    For questions regarding property policies, check-out hours, or dining reservations, please contact front desk reception.
                  </Text>
                </View>
              )}
            </View>

            {/* Privacy Notice Card */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#0B1F3A" style={{ marginRight: 6 }} />
                <Text style={styles.privacyTitle}>Security & Privacy Commitment</Text>
              </View>
              <Text style={styles.privacyBody}>{privacyNotice}</Text>
            </View>
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
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phoneIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FED255',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  contactPhone: {
    color: '#0B1F3A',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#FED255',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButtonText: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '700',
  },
  quickLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickLinkPill: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickLinkText: {
    color: '#0B1F3A',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#0B1F3A',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  faqList: {
    gap: 10,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: '#0B1F3A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  faqAnswerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswer: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  privacyCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyTitle: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '700',
  },
  privacyBody: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
});
