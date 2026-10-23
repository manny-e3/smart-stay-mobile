import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface FeedbackIssueModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'feedback' | 'issue';
}

export const FeedbackIssueModal: React.FC<FeedbackIssueModalProps> = ({
  visible,
  onClose,
  initialMode = 'feedback',
}) => {
  const { submitFeedbackWithPhotos, reservation } = useGuestStay();

  const [mode, setMode] = useState<'feedback' | 'issue'>(initialMode);
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('cleanliness');
  const [comment, setComment] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('maintenance');
  const [issueDesc, setIssueDesc] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    if (photos.length >= 3) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      // Cancelled or image picker unavailable
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const isIssue = mode === 'issue';
    const textDesc = isIssue ? issueDesc : comment;
    const cat = isIssue ? issueCategory : category;

    if (isIssue && !textDesc.trim()) return;

    setSubmitting(true);
    await submitFeedbackWithPhotos(
      isIssue ? 1 : rating,
      cat,
      textDesc,
      photos,
      isIssue
    );
    setSubmitting(false);
    setComment('');
    setIssueDesc('');
    setPhotos([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheet, shadows.floating]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelCaps, styles.subHeader]}>
                {reservation.suiteNumber} · GUEST CONCIERGE DESK
              </Text>
              <Text style={[typography.headlineSm, styles.title]}>
                {mode === 'feedback' ? 'Stay Experience & Feedback' : 'Report Room Hardware Issue'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryNavy} />
            </TouchableOpacity>
          </View>

          {/* Segment Selector */}
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'feedback' && styles.segmentBtnActive]}
              onPress={() => setMode('feedback')}
            >
              <Ionicons
                name="star-outline"
                size={16}
                color={mode === 'feedback' ? '#FFFFFF' : colors.primaryNavy}
                style={{ marginRight: 6 }}
              />
              <Text style={[typography.labelMd, mode === 'feedback' ? styles.segTextActive : styles.segText]}>
                Rating & Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'issue' && styles.segmentBtnActive]}
              onPress={() => setMode('issue')}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={mode === 'issue' ? '#FFFFFF' : colors.primaryNavy}
                style={{ marginRight: 6 }}
              />
              <Text style={[typography.labelMd, mode === 'issue' ? styles.segTextActive : styles.segText]}>
                Room Issue (Defects)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {mode === 'feedback' ? (
              <View style={styles.formCol}>
                <Text style={[typography.labelCaps, styles.fieldLabel]}>EXPERIENCE RATING</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={styles.starTouch}
                      onPress={() => setRating(star)}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? colors.accentGold : colors.borderNeutral}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>
                  EXPERIENCE CATEGORY
                </Text>
                <View style={styles.chipRow}>
                  {['cleanliness', 'climate', 'service', 'dining', 'overall'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, category === cat && styles.catChipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[typography.labelMd, category === cat ? styles.chipTextActive : styles.chipText]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>
                  COMMENTS & OBSERVATIONS
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Share details regarding your stay, service quality, or suggestions..."
                  placeholderTextColor={colors.mutedNeutral}
                  value={comment}
                  onChangeText={setComment}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            ) : (
              <View style={styles.formCol}>
                <Text style={[typography.labelCaps, styles.fieldLabel]}>ISSUE CLASSIFICATION</Text>
                <View style={styles.chipRow}>
                  {['maintenance', 'plumbing', 'electrical', 'door_lock', 'noise'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, issueCategory === cat && styles.catChipActive]}
                      onPress={() => setIssueCategory(cat)}
                    >
                      <Text style={[typography.labelMd, issueCategory === cat ? styles.chipTextActive : styles.chipText]}>
                        {cat.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>
                  PROBLEM DESCRIPTION
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe the issue (e.g., balcony latch stiff, reading lamp flickering)..."
                  placeholderTextColor={colors.mutedNeutral}
                  value={issueDesc}
                  onChangeText={setIssueDesc}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            )}

            {/* Photo Attachments (Multipart POST /guest/feedback) */}
            <View style={{ marginTop: 16 }}>
              <View style={styles.photoHeaderRow}>
                <Text style={[typography.labelCaps, styles.fieldLabel]}>PHOTO ATTACHMENTS (UP TO 3)</Text>
                <Text style={styles.photoLimitText}>{photos.length}/3 attached</Text>
              </View>

              <View style={styles.photosRow}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.photoThumbWrapper}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => removePhoto(idx)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {photos.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoBtn}
                    onPress={handlePickPhoto}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={24} color="#0B1F3A" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={[
                styles.submitCta,
                mode === 'issue' && { backgroundColor: colors.primaryNavy },
              ]}
              onPress={handleSubmit}
              disabled={submitting || (mode === 'issue' && !issueDesc.trim())}
              activeOpacity={0.88}
            >
              <Text style={[typography.labelLg, styles.submitCtaText]}>
                {submitting
                  ? 'Submitting...'
                  : mode === 'feedback'
                  ? 'Submit Feedback (POST /guest/feedback)'
                  : 'Dispatch Priority Issue (POST /guest/feedback)'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.cardSurface,
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
    borderBottomColor: 'rgba(11, 31, 58, 0.06)',
  },
  subHeader: {
    color: colors.mutedNeutral,
    marginBottom: 2,
  },
  title: {
    color: colors.primaryNavy,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 12,
    marginVertical: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryNavy,
  },
  segText: {
    color: colors.primaryNavy,
    fontWeight: '600',
    fontSize: 12,
  },
  segTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scroll: {
    marginTop: 4,
  },
  formCol: {
    marginBottom: 8,
  },
  fieldLabel: {
    color: colors.mutedNeutral,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  starTouch: {
    padding: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.accentGold,
  },
  chipText: {
    color: colors.primaryNavy,
  },
  chipTextActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    color: colors.primaryNavy,
    fontSize: 14,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoLimitText: {
    fontSize: 12,
    color: '#64748B',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#0B1F3A',
    fontWeight: '600',
    marginTop: 2,
  },
  submitCta: {
    backgroundColor: colors.accentGold,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitCtaText: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
});
