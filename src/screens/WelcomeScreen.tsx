import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { QrScannerModal } from '../components/QrScannerModal';
import * as Haptics from 'expo-haptics';

interface WelcomeScreenProps {
  onOpenFeedback?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  const {
    loginWithPassword,
    registerGuest,
    forgotPassword,
    resetPassword,
    loginWithQr,
    showToast,
    hotelInfo,
    fetchHotelInfo,
    backendOnline,
    apiBaseUrl,
    setCustomApiUrl,
    isBiometricsSupported,
    isBiometricsEnabled,
    biometricTypeLabel,
    savedBiometricEmail,
    loginWithBiometrics,
    enableBiometrics,
  } = useGuestStay();

  const [showBioPromptModal, setShowBioPromptModal] = useState(false);
  const [pendingBioCredentials, setPendingBioCredentials] = useState<{ email: string; password?: string } | null>(null);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);

  useEffect(() => {
    if (savedBiometricEmail && !loginEmail) {
      setLoginEmail(savedBiometricEmail);
    }
  }, [savedBiometricEmail]);

  const handleBiometricLogin = async () => {
    setIsBioAuthenticating(true);
    try {
      await loginWithBiometrics();
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  // Primary mode: Strictly 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Server Connection & URL configuration state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');

  // Forgot & Reset Password Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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

  // Handle Login
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Missing Credentials', 'Please enter your email and password.', 'alert');
      return;
    }
    setLoading(true);
    try {
      const success = await loginWithPassword(loginEmail.trim(), loginPassword);
      if (success && isBiometricsSupported && !isBiometricsEnabled) {
        setPendingBioCredentials({ email: loginEmail.trim(), password: loginPassword });
        setShowBioPromptModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async () => {
    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) {
      showToast('Missing Details', 'First name, last name, and email are required.', 'alert');
      return;
    }
    if (!regPassword.trim()) {
      showToast('Password Required', 'Please enter a password with at least 6 characters.', 'alert');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Weak Password', 'Password must be at least 6 characters long.', 'alert');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('Password Mismatch', 'Passwords do not match. Please verify.', 'alert');
      return;
    }

    setLoading(true);
    try {
      const res = await registerGuest({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || undefined,
        password: regPassword,
      });
      if (res.success) {
        setLoginEmail(regEmail.trim());
        if (isBiometricsSupported && !isBiometricsEnabled) {
          setPendingBioCredentials({ email: regEmail.trim(), password: regPassword });
          setShowBioPromptModal(true);
        }
      } else if (res.code === 'EMAIL_EXISTS') {
        setLoginEmail(regEmail.trim());
        setAuthMode('login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const handleOpenForgotModal = () => {
    setForgotEmail(loginEmail.trim());
    setForgotStep('email');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setIsForgotModalOpen(true);
  };

  // Request Reset Code
  const handleSendResetCode = async () => {
    if (!forgotEmail.trim()) {
      showToast('Missing Email', 'Please enter your account email address.', 'alert');
      return;
    }
    setModalLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        setForgotStep('reset');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async () => {
    if (!resetCode.trim()) {
      showToast('Missing Code', 'Please enter the 6-digit code received via email.', 'alert');
      return;
    }
    if (!resetNewPassword.trim() || resetNewPassword.length < 6) {
      showToast('Invalid Password', 'New password must be at least 6 characters long.', 'alert');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showToast('Password Mismatch', 'New passwords do not match.', 'alert');
      return;
    }

    setModalLoading(true);
    try {
      const res = await resetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
      });
      if (res.success) {
        setIsForgotModalOpen(false);
        setLoginEmail(forgotEmail.trim());
        setAuthMode('login');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleCallFrontDesk = () => {
    if (hotelInfo?.receptionPhone) {
      const clean = hotelInfo.receptionPhone.replace(/[^+\d]/g, '');
      Linking.openURL(`tel:${clean}`).catch(() => {
        showToast('Front Desk', hotelInfo.receptionPhone || 'Front desk concierge', 'info');
      });
    } else {
      showToast('Front Desk Reception', 'Connecting to 24/7 Chief Concierge reception...', 'info');
    }
  };

  const hotelDisplayName = hotelInfo?.hotelName
    ? `${hotelInfo.hotelName.toUpperCase()} • DIGITAL ACCESS`
    : 'DIGITAL KEYLESS ACCESS';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
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
        {/* Top Architectural Hero Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlayTag}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>{hotelDisplayName}</Text>
          </View>
        </View>

        {/* Center Portal Icon & Brand */}
        <View style={styles.brandCenter}>
          <View style={styles.logoBadge}>
            <Ionicons name="key-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={[typography.headlineMd, styles.brandTitle]}>SmartStay</Text>
          <Text style={[typography.labelCaps, styles.portalSubtitle]}>GUEST EXPERIENCE & KEYLESS PORTAL</Text>
        </View>

        {/* Welcome Headline */}
        <View style={styles.headingSection}>
          <Text style={styles.welcomeTitle}>
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.welcomeDesc}>
            {authMode === 'login'
              ? 'Sign in to access your digital room key, smart controls, and past stays.'
              : 'Register your mobile profile to unlock seamless digital hospitality.'}
          </Text>
        </View>

        {/* Auth Card Form */}
        <View style={[styles.card, shadows.card]}>
          {/* Segmented Mode Selector: Strictly Sign In and Register */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, authMode === 'login' && styles.tabButtonActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={16}
                color={authMode === 'login' ? '#0B1F3A' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, authMode === 'register' && styles.tabButtonActive]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={authMode === 'register' ? '#0B1F3A' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, authMode === 'register' && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* ===================== SIGN IN VIEW ===================== */}
          {authMode === 'login' && (
            <>
              {/* Biometric Quick Access Card */}
              {isBiometricsEnabled && (
                <View style={styles.biometricSection}>
                  <TouchableOpacity
                    style={[styles.biometricCard, shadows.card]}
                    onPress={handleBiometricLogin}
                    disabled={isBioAuthenticating || loading}
                    activeOpacity={0.85}
                  >
                    <View style={styles.biometricIconBadge}>
                      <Ionicons name="finger-print-outline" size={26} color="#C9A227" />
                    </View>
                    <View style={styles.biometricInfoCol}>
                      <Text style={styles.biometricCardTitle}>Sign in with {biometricTypeLabel}</Text>
                      <Text style={styles.biometricCardSubtitle}>
                        {savedBiometricEmail ? `Saved profile: ${savedBiometricEmail}` : 'Touch sensor for instant keyless login'}
                      </Text>
                    </View>
                    <View style={styles.biometricArrowBtn}>
                      <Ionicons name="arrow-forward" size={16} color="#0B1F3A" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.biometricDividerRow}>
                    <View style={styles.biometricDividerLine} />
                    <Text style={styles.biometricDividerText}>OR WITH PASSWORD</Text>
                    <View style={styles.biometricDividerLine} />
                  </View>
                </View>
              )}

              <Text style={[typography.labelCaps, styles.fieldLabel]}>EMAIL ADDRESS</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. guest@example.com"
                  placeholderTextColor="#94A3B8"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>PASSWORD</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showLoginPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowLoginPassword(!showLoginPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={handleOpenForgotModal}
                style={styles.forgotPasswordContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In CTA */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Text>
                {!loading && (
                  <Ionicons name="arrow-forward" size={18} color="#1A1C1B" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>

              {/* Switch to Register footer */}
              <View style={styles.switchAuthPrompt}>
                <Text style={styles.switchPromptText}>Don’t have an account yet?</Text>
                <TouchableOpacity onPress={() => setAuthMode('register')} activeOpacity={0.7}>
                  <Text style={styles.switchPromptLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ===================== REGISTER VIEW ===================== */}
          {authMode === 'register' && (
            <>
              <View style={styles.nameRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={[typography.labelCaps, styles.fieldLabel]}>FIRST NAME *</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. John"
                      placeholderTextColor="#94A3B8"
                      value={regFirstName}
                      onChangeText={setRegFirstName}
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={[typography.labelCaps, styles.fieldLabel]}>LAST NAME *</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Vance"
                      placeholderTextColor="#94A3B8"
                      value={regLastName}
                      onChangeText={setRegLastName}
                    />
                  </View>
                </View>
              </View>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>EMAIL ADDRESS *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. guest@example.com"
                  placeholderTextColor="#94A3B8"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>PHONE NUMBER</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#94A3B8"
                  value={regPhone}
                  onChangeText={setRegPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>PASSWORD *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Create password (min 6 chars)"
                  placeholderTextColor="#94A3B8"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry={!showRegPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowRegPassword(!showRegPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>CONFIRM PASSWORD *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94A3B8"
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                  secureTextEntry={!showRegPassword}
                />
              </View>

              <View style={styles.welcomeEmailNote}>
                <Ionicons name="paper-plane-outline" size={16} color="#C9A227" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.welcomeEmailNoteText}>
                  A welcome email with your membership details and stay features will be sent to your email immediately upon signing up.
                </Text>
              </View>

              {/* Create Account CTA */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
                {!loading && (
                  <Ionicons name="person-add" size={17} color="#1A1C1B" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>

              {/* Switch to Login footer */}
              <View style={styles.switchAuthPrompt}>
                <Text style={styles.switchPromptText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => setAuthMode('login')} activeOpacity={0.7}>
                  <Text style={styles.switchPromptLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Optional Scan QR Pass */}
          <TouchableOpacity
            style={styles.scanQrButton}
            onPress={() => setIsScannerOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={16} color={colors.primaryNavy} style={{ marginRight: 8 }} />
            <Text style={styles.scanQrText}>Have an arrival QR pass? Scan to sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Chief Concierge Direct Assistance Footer */}
        <View style={styles.conciergeFooterCard}>
          <View style={styles.conciergeAvatarWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.conciergeAvatar}
            />
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.conciergeTextGroup}>
            <Text style={styles.conciergeName}>Chief Concierge</Text>
            <Text style={styles.conciergeRole}>Available 24/7 for Guest Assistance</Text>
          </View>
          <TouchableOpacity
            style={styles.conciergeCallBtn}
            onPress={handleCallFrontDesk}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.conciergeCallText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Backend Server Status & IP Configuration Pill */}
        <View style={styles.serverStatusContainer}>
          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => {
              setServerUrlInput(apiBaseUrl);
              setIsServerModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.statusDot, { backgroundColor: backendOnline ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.serverPillText} numberOfLines={1}>
              API: {apiBaseUrl.replace('http://', '')}
            </Text>
            <View style={[styles.serverPillBadge, { backgroundColor: backendOnline ? '#ECFDF5' : '#FEF3C7' }]}>
              <Text style={[styles.serverPillBadgeText, { color: backendOnline ? '#059669' : '#D97706' }]}>
                {backendOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={13} color="#64748B" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===================== SERVER CONFIGURATION MODAL ===================== */}
      <Modal
        visible={isServerModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsServerModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBadge}>
                  <Ionicons name="server-outline" size={20} color="#C9A227" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalTitle}>Backend Server</Text>
                  <Text style={styles.modalSubtitle}>API Endpoint Configuration</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsServerModalOpen(false)}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInstructions}>
                Select a preset or enter your backend API URL. Make sure your phone and server can reach each other.
              </Text>

              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 8 }]}>SERVER URL</Text>
              <View style={styles.inputBox}>
                <Ionicons name="globe-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="http://192.168.1.127:5000"
                  placeholderTextColor="#94A3B8"
                  value={serverUrlInput}
                  onChangeText={setServerUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Quick Presets */}
              <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14, marginBottom: 6 }]}>QUICK PRESETS</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setServerUrlInput('http://192.168.1.127:5000')}
                >
                  <Text style={styles.presetChipText}>192.168.1.127:5000</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setServerUrlInput('http://192.168.1.127:6000')}
                >
                  <Text style={styles.presetChipText}>192.168.1.127:6000</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => setServerUrlInput('http://127.0.0.1:5000')}
                >
                  <Text style={styles.presetChipText}>Localhost:5000</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 20 }]}
                onPress={() => {
                  if (serverUrlInput.trim()) {
                    setCustomApiUrl(serverUrlInput.trim());
                    setIsServerModalOpen(false);
                    fetchHotelInfo();
                  }
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>Save & Reconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================== FORGOT & RESET PASSWORD MODAL ===================== */}
      <Modal
        visible={isForgotModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsForgotModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBadge}>
                  <Ionicons
                    name={forgotStep === 'email' ? 'key-outline' : 'shield-checkmark-outline'}
                    size={20}
                    color="#C9A227"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalTitle}>
                    {forgotStep === 'email' ? 'Forgot Password' : 'Reset Password'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {forgotStep === 'email'
                      ? 'Enter your registered email to receive a 6-digit code'
                      : `Enter the 6-digit code sent to ${forgotEmail}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsForgotModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* STEP 1: Enter Email */}
            {forgotStep === 'email' && (
              <View style={styles.modalBody}>
                <Text style={[typography.labelCaps, styles.fieldLabel]}>ACCOUNT EMAIL</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. guest@example.com"
                    placeholderTextColor="#94A3B8"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus={true}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.continueButton, { marginTop: 20 }]}
                  onPress={handleSendResetCode}
                  disabled={modalLoading}
                  activeOpacity={0.88}
                >
                  <Text style={styles.continueButtonText}>
                    {modalLoading ? 'Sending Verification...' : 'Send Reset Code'}
                  </Text>
                  {!modalLoading && (
                    <Ionicons name="paper-plane-outline" size={16} color="#1A1C1B" style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Enter Code & New Password */}
            {forgotStep === 'reset' && (
              <View style={styles.modalBody}>
                <Text style={[typography.labelCaps, styles.fieldLabel]}>6-DIGIT VERIFICATION CODE</Text>
                <View style={[styles.inputBox, styles.codeInputBox]}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="••••••"
                    placeholderTextColor="#94A3B8"
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus={true}
                  />
                </View>

                <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>NEW PASSWORD</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter new password (min 6 chars)"
                    placeholderTextColor="#94A3B8"
                    value={resetNewPassword}
                    onChangeText={setResetNewPassword}
                    secureTextEntry={!showResetPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowResetPassword(!showResetPassword)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showResetPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[typography.labelCaps, styles.fieldLabel, { marginTop: 14 }]}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94A3B8"
                    value={resetConfirmPassword}
                    onChangeText={setResetConfirmPassword}
                    secureTextEntry={!showResetPassword}
                  />
                </View>

                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    style={styles.backStepButton}
                    onPress={() => setForgotStep('email')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={16} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.backStepText}>Change Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.continueButton, { flex: 1, marginTop: 0 }]}
                    onPress={handleResetPassword}
                    disabled={modalLoading}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.continueButtonText}>
                      {modalLoading ? 'Updating...' : 'Save Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Biometric Activation Prompt Modal */}
      <Modal
        visible={showBioPromptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBioPromptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center', paddingVertical: 28 }]}>
            <View style={styles.bioModalEmblem}>
              <Ionicons name="finger-print-outline" size={44} color="#C9A227" />
            </View>
            <Text style={styles.bioModalTitle}>Activate {biometricTypeLabel} Login?</Text>
            <Text style={styles.bioModalDesc}>
              Enjoy faster, keyless access next time without typing your password. Would you like to enable {biometricTypeLabel.toLowerCase()} sign-in on this device?
            </Text>

            <TouchableOpacity
              style={styles.bioModalPrimaryBtn}
              onPress={async () => {
                if (pendingBioCredentials) {
                  await enableBiometrics(pendingBioCredentials.email, pendingBioCredentials.password);
                }
                setShowBioPromptModal(false);
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="finger-print-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.bioModalPrimaryBtnText}>Activate with {biometricTypeLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bioModalSkipBtn}
              onPress={() => setShowBioPromptModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.bioModalSkipBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <QrScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={async (data) => {
          return await loginWithQr(data);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageWrapper: {
    position: 'relative',
    height: 250,
    width: '100%',
    backgroundColor: '#0B1F3A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  imageOverlayTag: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 31, 58, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  tagText: {
    color: '#ECC246',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brandCenter: {
    alignItems: 'center',
    marginTop: -38,
    marginBottom: 16,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0B1F3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C9A227',
    ...shadows.floating,
  },
  brandTitle: {
    marginTop: 8,
    color: '#0B1F3A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  portalSubtitle: {
    color: '#C9A227',
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
    fontWeight: '700',
  },
  headingSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0B1F3A',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
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
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  welcomeEmailNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE047',
    marginTop: 16,
    marginBottom: 4,
  },
  welcomeEmailNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#854D0E',
    lineHeight: 17,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#C9A227',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    ...shadows.card,
  },
  continueButtonText: {
    color: '#1A1C1B',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  switchAuthPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  switchPromptText: {
    fontSize: 13,
    color: '#64748B',
    marginRight: 6,
  },
  switchPromptLink: {
    fontSize: 13,
    color: '#0B1F3A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scanQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scanQrText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B1F3A',
  },
  conciergeFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  conciergeAvatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  conciergeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conciergeTextGroup: {
    flex: 1,
    marginLeft: 12,
  },
  conciergeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  conciergeRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  conciergeCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1F3A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  conciergeCallText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal Styles */
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
  codeInputBox: {
    justifyContent: 'center',
    height: 52,
    borderColor: '#C9A227',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#0B1F3A',
    width: '100%',
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalInstructions: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  serverStatusContainer: {
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 20,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  serverPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    maxWidth: 200,
  },
  serverPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  serverPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  /* Biometric Quick Access Styles */
  biometricSection: {
    marginBottom: 16,
  },
  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  biometricIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  biometricInfoCol: {
    flex: 1,
  },
  biometricCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B1F3A',
    marginBottom: 2,
  },
  biometricCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  biometricArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  biometricDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  biometricDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  biometricDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },

  /* Biometric Activation Modal Styles */
  bioModalEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE047',
  },
  bioModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1F3A',
    marginBottom: 8,
    textAlign: 'center',
  },
  bioModalDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  bioModalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1F3A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 10,
  },
  bioModalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bioModalSkipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bioModalSkipBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
