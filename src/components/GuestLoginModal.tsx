import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface GuestLoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GuestLoginModal: React.FC<GuestLoginModalProps> = ({ visible, onClose }) => {
  const {
    loginWithCode,
    loginWithReference,
    loginWithEmail,
    logout,
    isAuthenticated,
    reservation,
    backendOnline,
  } = useGuestStay();

  const [tab, setTab] = useState<'ref' | 'code' | 'email'>('ref');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [code, setCode] = useState('');
  const [reference, setReference] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    let success = false;
    if (tab === 'code') {
      success = await loginWithCode(roomNumber, code);
    } else if (tab === 'email') {
      success = await loginWithEmail(email, lastName);
    } else {
      success = await loginWithReference(reference, lastName);
    }
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheet, shadows.floating]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: backendOnline ? colors.statusGreen : colors.statusRed },
                  ]}
                />
                <Text style={[typography.labelCaps, styles.statusLabel]}>
                  {backendOnline ? 'BACKEND API CONNECTED' : 'OFFLINE MODE'}
                </Text>
              </View>
              <Text style={[typography.headlineSm, styles.title]}>
                {isAuthenticated ? 'Active Stay Session' : 'Guest Mobile Sign-In'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryNavy} />
            </TouchableOpacity>
          </View>

          {isAuthenticated ? (
            <View style={styles.authenticatedBox}>
              <View style={styles.activeSessionCard}>
                <Ionicons name="checkmark-circle" size={28} color={colors.statusGreen} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.labelLg, { color: colors.primaryNavy }]}>
                    {reservation.guestName}
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.mutedNeutral }]}>
                    {reservation.suiteNumber} · Token Active
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleLogout}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.statusRed} style={{ marginRight: 8 }} />
                <Text style={[typography.labelLg, { color: colors.statusRed }]}>
                  {loading ? 'Signing Out...' : 'Sign Out of Session (DELETE /guest/session)'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              {/* Login Method Tabs */}
              <View style={styles.tabGroup}>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'code' && styles.tabButtonActive]}
                  onPress={() => setTab('code')}
                >
                  <Text style={[typography.labelMd, tab === 'code' ? styles.tabTextActive : styles.tabText]}>
                    Room + Access Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, tab === 'ref' && styles.tabButtonActive]}
                  onPress={() => setTab('ref')}
                >
                  <Text style={[typography.labelMd, tab === 'ref' ? styles.tabTextActive : styles.tabText]}>
                    Reference + Last Name
                  </Text>
                </TouchableOpacity>
              </View>

              {tab === 'email' ? (
            <View style={styles.inputsCol}>
              <Text style={[typography.labelCaps, styles.inputLabel]}>REGISTERED EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="guest@example.com"
                placeholderTextColor={colors.mutedNeutral}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[typography.labelCaps, styles.inputLabel, { marginTop: 12 }]}>LAST NAME (CONFIRMATION)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vance"
                placeholderTextColor={colors.mutedNeutral}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 15 }}>
                Restores your active digital key and displays your multi-stay room history.
              </Text>
            </View>
          ) : tab === 'code' ? (
                <View style={styles.inputsCol}>
                  <Text style={[typography.labelCaps, styles.inputLabel]}>ROOM NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 101 or 408"
                    placeholderTextColor={colors.mutedNeutral}
                    value={roomNumber}
                    onChangeText={setRoomNumber}
                    keyboardType="number-pad"
                  />

                  <Text style={[typography.labelCaps, styles.inputLabel, { marginTop: 12 }]}>
                    6-DIGIT ACCESS CODE
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 123456"
                    placeholderTextColor={colors.mutedNeutral}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              ) : (
                <View style={styles.inputsCol}>
                  <Text style={[typography.labelCaps, styles.inputLabel]}>BOOKING REFERENCE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. STAY408"
                    placeholderTextColor={colors.mutedNeutral}
                    value={reference}
                    onChangeText={setReference}
                    autoCapitalize="characters"
                  />

                  <Text style={[typography.labelCaps, styles.inputLabel, { marginTop: 12 }]}>
                    LAST NAME
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Guest"
                    placeholderTextColor={colors.mutedNeutral}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={[typography.labelLg, styles.submitBtnText]}>
                  {loading ? 'Authenticating...' : 'Sign In (POST /guest/session)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 31, 58, 0.06)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    color: colors.mutedNeutral,
    fontSize: 10,
    letterSpacing: 0.8,
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
  authenticatedBox: {
    paddingVertical: 20,
    gap: 16,
  },
  activeSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 14,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    backgroundColor: colors.statusRedLight,
  },
  formContent: {
    paddingVertical: 16,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 58, 0.08)',
  },
  tabText: {
    color: colors.mutedNeutral,
  },
  tabTextActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
  inputsCol: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.mutedNeutral,
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderNeutral,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.primaryNavy,
  },
  submitBtn: {
    backgroundColor: colors.accentGold,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickPreset: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
});
