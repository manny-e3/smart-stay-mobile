import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIO_ENABLED_KEY = 'smartstay_biometric_enabled';
const BIO_EMAIL_KEY = 'smartstay_bio_email';
const BIO_PASSWORD_KEY = 'smartstay_bio_password';
const BIO_TOKEN_KEY = 'smartstay_bio_token';

// Safe wrapper for SecureStore (handles Web fallback)
const setSecure = async (key: string, val: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
      return;
    }
    await SecureStore.setItemAsync(key, val);
  } catch (err) {
    console.warn(`SecureStore set error for ${key}:`, err);
  }
};

const getSecure = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`SecureStore get error for ${key}:`, err);
    return null;
  }
};

const removeSecure = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`SecureStore remove error for ${key}:`, err);
  }
};

export interface BiometricStatus {
  available: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'biometric';
  label: string;
}

export const biometricsService = {
  /**
   * Check if device has biometric hardware and enrolled fingerprints/face
   */
  async checkBiometricsStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const hasFacial = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

      let biometricType: 'fingerprint' | 'facial' | 'biometric' = 'fingerprint';
      let label = 'Fingerprint';

      if (hasFingerprint && hasFacial) {
        label = 'Fingerprint / Face ID';
        biometricType = 'biometric';
      } else if (hasFacial) {
        label = 'Face ID';
        biometricType = 'facial';
      } else if (hasFingerprint) {
        label = 'Fingerprint';
        biometricType = 'fingerprint';
      }

      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometricType,
        label,
      };
    } catch (err) {
      console.warn('Error checking biometric status:', err);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'fingerprint',
        label: 'Fingerprint',
      };
    }
  },

  /**
   * Check if user has biometric login activated
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    const val = await getSecure(BIO_ENABLED_KEY);
    return val === 'true';
  },

  /**
   * Prompt biometric authentication with system dialog
   */
  async authenticate(promptMessage: string = 'Scan your fingerprint to authenticate'): Promise<boolean> {
    try {
      const status = await this.checkBiometricsStatus();
      if (!status.available) {
        return false;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return res.success;
    } catch (err) {
      console.warn('Biometric authentication error:', err);
      return false;
    }
  },

  /**
   * Save credentials securely when biometric login is enabled
   */
  async enableBiometricLogin(credentials: {
    email: string;
    password?: string;
    token?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.checkBiometricsStatus();
      if (!status.hasHardware) {
        return { success: false, error: 'No biometric hardware detected on this device.' };
      }
      if (!status.isEnrolled) {
        return { success: false, error: 'No fingerprints or biometrics enrolled in device security settings.' };
      }

      // Verify biometric presence
      const authenticated = await this.authenticate(
        `Confirm your ${status.label} to activate SmartStay Biometric Login`
      );

      if (!authenticated) {
        return { success: false, error: 'Biometric verification cancelled or failed.' };
      }

      // Store in secure storage
      await setSecure(BIO_ENABLED_KEY, 'true');
      await setSecure(BIO_EMAIL_KEY, credentials.email.trim().toLowerCase());
      if (credentials.password) {
        await setSecure(BIO_PASSWORD_KEY, credentials.password);
      }
      if (credentials.token) {
        await setSecure(BIO_TOKEN_KEY, credentials.token);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to activate biometric login.' };
    }
  },

  /**
   * Disable biometric login and wipe saved biometric credentials
   */
  async disableBiometricLogin(): Promise<void> {
    await removeSecure(BIO_ENABLED_KEY);
    await removeSecure(BIO_EMAIL_KEY);
    await removeSecure(BIO_PASSWORD_KEY);
    await removeSecure(BIO_TOKEN_KEY);
  },

  /**
   * Retrieve saved credentials for biometric login
   */
  async getSavedBiometricCredentials(): Promise<{
    email: string | null;
    password: string | null;
    token: string | null;
  }> {
    const isEnabled = await this.isBiometricLoginEnabled();
    if (!isEnabled) {
      return { email: null, password: null, token: null };
    }

    const email = await getSecure(BIO_EMAIL_KEY);
    const password = await getSecure(BIO_PASSWORD_KEY);
    const token = await getSecure(BIO_TOKEN_KEY);

    return { email, password, token };
  },
};
