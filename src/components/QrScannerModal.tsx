import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => Promise<boolean | void>;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [prevVisible, setPrevVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setScanned(false);
      setProcessing(false);
      setErrorMessage(null);
      setManualCode('');
    }
  }

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission?.granted, requestPermission]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    setErrorMessage(null);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // safe fallback
    }

    try {
      const ok = await onScan(result.data);
      if (ok === false) {
        setProcessing(false);
        setScanned(false);
        setErrorMessage('QR Code not recognized. Please try again.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setProcessing(false);
      setScanned(false);
      setErrorMessage(err?.message || 'Verification failed. Try again.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim() || processing) return;
    setProcessing(true);
    setErrorMessage(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ok = await onScan(manualCode.trim());
      if (ok === false) {
        setProcessing(false);
        setErrorMessage('Code invalid. Please check and retry.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err?.message || 'Verification failed.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Scan Arrival QR</Text>
            <Text style={styles.headerSubtitle}>Point at your reservation pass</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setTorch((t) => !t)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={torch ? 'flash' : 'flash-off-outline'}
              size={22}
              color={torch ? '#C9A227' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Camera / Manual Body */}
        {manualMode ? (
          <View style={styles.manualContainer}>
            <View style={styles.manualCard}>
              <View style={styles.manualIconBox}>
                <Ionicons name="keypad-outline" size={28} color="#C9A227" />
              </View>
              <Text style={styles.manualTitle}>Manual Code Entry</Text>
              <Text style={styles.manualDesc}>
                Enter the 8-character access code or digital QR token from your booking email.
              </Text>

              <TextInput
                style={styles.manualInput}
                placeholder="e.g. K7Q2MPX4 or token..."
                placeholderTextColor="#94A3B8"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.submitButton, processing && { opacity: 0.7 }]}
                onPress={handleManualSubmit}
                disabled={processing || !manualCode.trim()}
                activeOpacity={0.88}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#0B1F3A" />
                ) : (
                  <Text style={styles.submitButtonText}>Authenticate Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : !permission ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color="#C9A227" />
            <Text style={styles.messageText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerMessage}>
            <Ionicons name="camera-reverse-outline" size={48} color="#C9A227" />
            <Text style={styles.deniedTitle}>Camera Access Required</Text>
            <Text style={styles.deniedDesc}>
              SmartStay needs camera access to scan your digital arrival QR code and activate your room key.
            </Text>
            <TouchableOpacity style={styles.grantButton} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.grantButtonText}>Allow Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setManualMode(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.switchButtonText}>Or enter code manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing={facing}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Viewfinder Overlay Reticle */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.unfocusedTop} />
              <View style={styles.middleRow}>
                <View style={styles.unfocusedSide} />
                <View style={styles.reticleBox}>
                  {/* Top-left corner */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  {/* Top-right corner */}
                  <View style={[styles.corner, styles.cornerTR]} />
                  {/* Bottom-left corner */}
                  <View style={[styles.corner, styles.cornerBL]} />
                  {/* Bottom-right corner */}
                  <View style={[styles.corner, styles.cornerBR]} />

                  {processing ? (
                    <View style={styles.processingIndicator}>
                      <ActivityIndicator size="large" color="#C9A227" />
                      <Text style={styles.processingText}>Verifying pass...</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.unfocusedSide} />
              </View>
              <View style={styles.unfocusedTop} />
            </View>

            {/* Error Message Toast */}
            {errorMessage ? (
              <View style={styles.floatingErrorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.floatingErrorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Scanner Controls Floating Toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolButton}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-reverse-outline" size={20} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Flip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolButton}
                onPress={() => setManualMode(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="keypad-outline" size={20} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Type Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Switcher */}
        {manualMode ? (
          <TouchableOpacity
            style={styles.bottomSwitchBtn}
            onPress={() => setManualMode(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={18} color="#C9A227" style={{ marginRight: 6 }} />
            <Text style={styles.bottomSwitchText}>Switch back to Camera Scanner</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071220',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0B1F3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...typography.labelSm,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedTop: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 32, 0.65)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 270,
  },
  unfocusedSide: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 32, 0.65)',
  },
  reticleBox: {
    width: 270,
    height: 270,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#C9A227',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  processingIndicator: {
    backgroundColor: 'rgba(11, 31, 58, 0.88)',
    paddingVertical: 18,
    paddingHorizontal: 26,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    ...typography.labelMd,
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: '600',
  },
  floatingErrorBanner: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  floatingErrorText: {
    ...typography.bodySm,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(11, 31, 58, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  toolButtonText: {
    ...typography.labelSm,
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
  },
  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: '#071220',
  },
  messageText: {
    ...typography.bodyMd,
    color: '#CBD5E1',
    marginTop: 14,
  },
  deniedTitle: {
    ...typography.headlineMd,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 18,
    textAlign: 'center',
  },
  deniedDesc: {
    ...typography.bodyMd,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  grantButton: {
    backgroundColor: '#C9A227',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    ...shadows.card,
  },
  grantButtonText: {
    ...typography.labelLg,
    color: '#0B1F3A',
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 18,
    paddingVertical: 8,
  },
  switchButtonText: {
    ...typography.labelMd,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  manualContainer: {
    flex: 1,
    backgroundColor: '#071220',
    padding: 24,
    justifyContent: 'center',
  },
  manualCard: {
    backgroundColor: '#0B1F3A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.2)',
    ...shadows.floating,
  },
  manualIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  manualTitle: {
    ...typography.headlineMd,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  manualDesc: {
    ...typography.bodySm,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  manualInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#132845',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.4)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  errorText: {
    ...typography.bodySm,
    fontSize: 12,
    color: '#F87171',
    marginTop: 10,
  },
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#C9A227',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    ...shadows.card,
  },
  submitButtonText: {
    ...typography.labelLg,
    color: '#0B1F3A',
    fontWeight: '700',
  },
  bottomSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#0B1F3A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  bottomSwitchText: {
    ...typography.labelMd,
    color: '#C9A227',
    fontWeight: '600',
  },
});
