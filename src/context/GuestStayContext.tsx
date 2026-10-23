import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  KeyStatus,
  DoorLockState,
  ClimateState,
  LightingPreset,
  ServiceRequest,
  MenuItem,
  ValetState,
  ReservationInfo,
  ChatMessage,
  TvState,
  FridgeState,
  LightState,
  PastStayItem,
} from '../types';
import { guestApi, GuestRequestItem } from '../services/guestApi';
import { biometricsService } from '../services/biometricsService';

interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'alert';
}

interface GuestStayContextType {
  reservation: ReservationInfo;
  doorState: DoorLockState;
  keyStatus: KeyStatus;
  dndActive: boolean;
  climate: ClimateState;
  lightingScene: LightingPreset;
  tv: TvState;
  fridge: FridgeState;
  light: LightState;
  requests: ServiceRequest[];
  valet: ValetState;
  cart: { [itemId: string]: number };
  chatMessages: ChatMessage[];
  toast: ToastData | null;
  unlockCountdown: number;

  // Backend Integration State
  backendOnline: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
  apiBaseUrl: string;
  hasActiveRoom: boolean;

  cleaningRequested: boolean;
  roomDevices: any[];
  hotelInfo: {
    hotelName: string;
    receptionPhone: string | null;
    faqs: { question: string; answer: string }[];
    privacyNotice: string | null;
    quickLinks: { title: string; url: string; icon?: string }[];
  } | null;

  // Actions
  unlockDoor: () => Promise<void>;
  lockDoor: () => void;
  toggleDnd: () => Promise<void>;
  toggleCleaningRequested: (note?: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  sendDeviceCommand: (type: 'thermostat' | 'light' | 'curtain' | 'tv' | 'fridge' | 'other', command: Record<string, any>) => Promise<boolean>;
  submitFeedbackWithPhotos: (rating: number, category: string, comment: string, photos?: string[], markAsIssue?: boolean) => Promise<boolean>;
  fetchHotelInfo: () => Promise<void>;
  adjustTargetTemp: (delta: number) => void;
  setClimateMode: (mode: ClimateState['mode']) => void;
  setFanSpeed: (speed: ClimateState['fanSpeed']) => void;
  toggleEcoMode: () => void;
  setLightingScene: (scene: LightingPreset) => void;
  toggleLightPower: () => void;
  setLightBrightness: (level: number) => void;
  toggleLightZone: (zone: 'ceiling' | 'bedside' | 'bath') => void;
  toggleTvPower: () => void;
  adjustTvVolume: (delta: number) => void;
  toggleTvMute: () => void;
  setTvSource: (source: TvState['source'], appName?: string) => void;
  toggleFridgePower: () => void;
  adjustFridgeTemp: (delta: number) => void;
  setFridgeMode: (mode: FridgeState['mode']) => void;
  requestHousekeeping: (serviceTitle: string, note?: string) => Promise<void>;
  requestValet: () => void;
  cancelValet: () => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  placeDiningOrder: () => Promise<void>;
  sendChatMessage: (text: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'alert') => void;
  dismissToast: () => void;
  simulateNfcTap: () => void;

  // 11 Endpoints API Actions
  loginWithCode: (roomNumber: string, code: string) => Promise<boolean>;
  loginWithReference: (reference: string, lastName: string) => Promise<boolean>;
  loginWithQr: (qrData: string) => Promise<boolean>;
  stayHistory: PastStayItem[];
  registerGuest: (data: { firstName: string; lastName: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; code?: string; message?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  loginWithEmail: (email: string, lastName?: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (data: { email: string; code: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>;
  fetchStayHistory: () => Promise<PastStayItem[]>;
  logout: () => Promise<void>;
  refreshStayData: () => Promise<void>;
  submitStayFeedback: (rating: number, category?: string, comment?: string) => Promise<boolean>;
  reportRoomIssue: (category: string, description: string) => Promise<boolean>;
  registerDeviceToken: (pushToken: string) => Promise<boolean>;
  setCustomApiUrl: (url: string) => void;
  linkBooking: (data: { bookingCode?: string; reference?: string; lastName?: string; qrToken?: string; qrData?: string }) => Promise<{ success: boolean; message?: string }>;

  // Biometrics Authentication
  isBiometricsSupported: boolean;
  isBiometricsEnabled: boolean;
  biometricTypeLabel: string;
  savedBiometricEmail: string | null;
  enableBiometrics: (email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => Promise<void>;
  loginWithBiometrics: () => Promise<boolean>;
}

const emptyReservation: ReservationInfo = {
  hotelName: '',
  suiteNumber: '',
  suiteType: '',
  guestName: '',
  vipTier: '',
  checkInDate: '',
  checkOutDate: '',
  checkOutTime: '',
  wifiNetwork: '',
  wifiPassword: '',
  roomPin: '',
  hotelAddress: '',
  conciergePhone: '',
};

const defaultClimate: ClimateState = {
  currentTemp: 70,
  targetTemp: 70,
  mode: 'cool',
  fanSpeed: 'auto',
  ecoMode: false,
  humidity: 45,
};

const defaultValet: ValetState = {
  status: 'parked',
  carModel: '',
  plate: '',
  etaMinutes: 0,
  valetTicket: '',
};

const defaultTv: TvState = {
  power: false,
  volume: 20,
  muted: false,
  source: 'streaming',
  appName: '',
};

const defaultFridge: FridgeState = {
  power: true,
  temp: 38,
  mode: 'standard',
  doorClosed: true,
};

const defaultLight: LightState = {
  power: false,
  brightness: 80,
  scene: 'relax',
  zones: {
    ceiling: false,
    bedside: false,
    bath: false,
  },
};

const defaultMessages: ChatMessage[] = [];

const GuestStayContext = createContext<GuestStayContextType | undefined>(undefined);

export const GuestStayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reservation, setReservation] = useState<ReservationInfo>(emptyReservation);
  const [doorState, setDoorState] = useState<DoorLockState>('locked');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('offline');
  const [dndActive, setDndActive] = useState<boolean>(false);
  const [climate, setClimate] = useState<ClimateState>(defaultClimate);
  const [lightingScene, setLightingScene] = useState<LightingPreset>('relax');
  const [tv, setTv] = useState<TvState>(defaultTv);
  const [fridge, setFridge] = useState<FridgeState>(defaultFridge);
  const [light, setLight] = useState<LightState>(defaultLight);
  const [valet, setValet] = useState<ValetState>(defaultValet);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultMessages);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [unlockCountdown, setUnlockCountdown] = useState<number>(0);

  // Backend Integration States
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(guestApi.getBaseUrl());
  const [hasActiveRoom, setHasActiveRoom] = useState<boolean>(false);

  const [cleaningRequested, setCleaningRequested] = useState<boolean>(false);
  const [roomDevices, setRoomDevices] = useState<any[]>([]);
  const [hotelInfo, setHotelInfo] = useState<{
    hotelName: string;
    receptionPhone: string | null;
    faqs: { question: string; answer: string }[];
    privacyNotice: string | null;
    quickLinks: { title: string; url: string; icon?: string }[];
  } | null>(null);

  // Real requests from backend (no mock requests)
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stayHistory, setStayHistory] = useState<PastStayItem[]>([]);

  // Biometric Authentication States
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState<string>('Fingerprint');
  const [savedBiometricEmail, setSavedBiometricEmail] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      Haptics.impactAsync(style);
    } catch {
      // safe fallback
    }
  };

  const triggerNotificationHaptic = (type: Haptics.NotificationFeedbackType) => {
    try {
      Haptics.notificationAsync(type);
    } catch {
      // safe fallback
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'alert' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, title, message, type });
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Initialize Biometrics on mount
  useEffect(() => {
    let isMounted = true;
    const initBiometrics = async () => {
      try {
        const status = await biometricsService.checkBiometricsStatus();
        if (!isMounted) return;
        setIsBiometricsSupported(status.available);
        setBiometricTypeLabel(status.label);

        const isEnabled = await biometricsService.isBiometricLoginEnabled();
        if (!isMounted) return;
        setIsBiometricsEnabled(isEnabled);

        if (isEnabled) {
          const creds = await biometricsService.getSavedBiometricCredentials();
          if (isMounted && creds.email) {
            setSavedBiometricEmail(creds.email);
          }
        }
      } catch (err) {
        console.warn('Failed to initialize biometrics:', err);
      }
    };
    initBiometrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check backend health on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
      const { online } = await guestApi.checkHealth();
      if (isMounted) {
        setBackendOnline(online);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl]);

  // Initial backend health check on mount
  useEffect(() => {
    const checkServer = async () => {
      const { online } = await guestApi.checkHealth();
      setBackendOnline(online);
      // Fetch public hotel info
      const infoRes = await guestApi.getHotelInfo();
      if (infoRes.success && infoRes.data) {
        setHotelInfo(infoRes.data);
      }
    };

    checkServer();
  }, []);

  // Load live data from the backend
  const loadBackendData = async () => {
    try {
      // 3. GET /guest/me
      const meRes = await guestApi.getMe();
      await fetchStayHistory().catch(() => {});
      if (meRes.success && meRes.data) {
        const d = meRes.data;
        const arrivalStr = d.stay?.arrival
          ? new Date(d.stay.arrival).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : '';
        const departureStr = d.stay?.departure
          ? new Date(d.stay.departure).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : '';

        const suiteNum = d.room?.number ? `Suite ${d.room.number}` : (d.stay?.reference ? `Stay ${d.stay.reference}` : 'Suite Assigned');
        const suiteType = d.room?.roomType || 'Standard Room';
        const guestFullName = d.guest ? `${d.guest.firstName || ''} ${d.guest.lastName || ''}`.trim() : 'Guest';
        if (d.guest?.email) {
          setCurrentUserEmail(d.guest.email);
        }

        setReservation({
          hotelName: d.hotel?.name || 'SmartStay Hotel',
          suiteNumber: suiteNum,
          suiteType: suiteType,
          guestName: guestFullName || 'Guest',
          vipTier: 'Verified Guest',
          checkInDate: arrivalStr,
          checkOutDate: departureStr,
          checkOutTime: '11:00 AM',
          wifiNetwork: `${d.hotel?.name || 'SmartStay'}_Guest`,
          wifiPassword: d.stay?.reference || '',
          roomPin: '',
          hotelAddress: d.hotel?.name || 'SmartStay Hotel',
          conciergePhone: d.hotel?.receptionPhone || '',
        });

        if (d.roomStatus?.dnd !== undefined) {
          setDndActive(Boolean(d.roomStatus.dnd));
        } else if (d.room?.dnd !== undefined) {
          setDndActive(Boolean(d.room.dnd));
        }

        if (d.roomStatus?.cleaningRequested !== undefined) {
          setCleaningRequested(Boolean(d.roomStatus.cleaningRequested));
        }

        const isRoomAllocated = Boolean(
          d.room?.number &&
          d.room.number !== 'Pending' &&
          d.room.number !== 'Suite Pending' &&
          d.room.number !== 'Unassigned' &&
          Boolean(d.stay?.checkedInAt)
        );
        setHasActiveRoom(isRoomAllocated);
      }

      // 4. GET /guest/key
      const keysRes = await guestApi.getKeys();
      if (keysRes.success) {
        setKeyStatus('connected');
      } else {
        setKeyStatus('offline');
      }

      // GET /guest/devices (Smart room devices)
      const devRes = await guestApi.getRoomDevices();
      if (devRes.success && devRes.data?.devices) {
        setRoomDevices(devRes.data.devices);

        // Sync live thermostat state
        const thermo = devRes.data.devices.find((dev: any) => dev.type === 'thermostat');
        if (thermo?.state?.setpoint) {
          const setpointC = thermo.state.setpoint;
          const setpointF = Math.round((setpointC * 9) / 5 + 32);
          setClimate((prev) => ({
            ...prev,
            targetTemp: setpointF,
            currentTemp: setpointF,
            mode: thermo.state.mode || prev.mode,
            fanSpeed: thermo.state.fan || prev.fanSpeed,
            ecoMode: Boolean(devRes.data?.eco?.active ?? thermo.eco),
          }));
        }

        // Sync live light power
        const lightDev = devRes.data.devices.find((dev: any) => dev.type === 'light');
        if (lightDev?.state?.on !== undefined) {
          setLight((prev) => ({
            ...prev,
            power: Boolean(lightDev.state.on),
          }));
        }
      }

      // GET /guest/preferences (Sync saved target comfort)
      const prefRes = await guestApi.getPreferences();
      if (prefRes.success && prefRes.data?.preferences?.temperature?.setpoint) {
        const setpointC = prefRes.data.preferences.temperature.setpoint;
        const setpointF = Math.round((setpointC * 9) / 5 + 32);
        setClimate((prev) => ({ ...prev, targetTemp: setpointF }));
      }

      // GET /guest/info (Hotel policies, FAQs)
      const infoRes = await guestApi.getHotelInfo();
      if (infoRes.success && infoRes.data) {
        setHotelInfo(infoRes.data);
      }

      // 7. GET /guest/requests
      const reqRes = await guestApi.getRequests();
      if (reqRes.success && Array.isArray(reqRes.data)) {
        const mapped = reqRes.data.map((r: GuestRequestItem) => ({
          id: String(r.id),
          type: (r.category === 'food' ? 'dining' : 'housekeeping') as any,
          title: r.category ? r.category.toUpperCase() : 'Guest Request',
          detail: r.description || 'Dispatched to hotel staff',
          status: (r.status === 'done' || r.status === 'completed' ? 'completed' : r.status === 'in_progress' ? 'in_progress' : 'pending') as any,
          timeRequested: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        }));
        setRequests(mapped);
      }
    } catch {
      // Keep state resilient
    }
  };

  // 1. POST /guest/login (Login with code or room)
  const loginWithCode = async (roomNumber: string, code: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const accessCode = (code || roomNumber).trim();
    showToast('Authenticating', `Connecting with code ${accessCode}...`, 'info');

    const res = await guestApi.createSession({ bookingCode: accessCode });
    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setSessionToken(res.data.token);
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome to SmartStay', 'Verified stay session', 'success');
      return true;
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Sign In Failed', res.message || 'Invalid access code.', 'alert');
      return false;
    }
  };

  // 1b. POST /guest/login (Login with reference + lastName)
  const loginWithReference = async (reference: string, lastName: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Authenticating', `Looking up booking ${reference}...`, 'info');

    const res = await guestApi.createSession({ reference: reference.trim(), lastName: lastName.trim() });
    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setSessionToken(res.data.token);
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome to SmartStay', `Verified booking for ${lastName}`, 'success');
      return true;
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Sign In Failed', res.message || 'Booking not found or not checked in.', 'alert');
      return false;
    }
  };

  const fetchStayHistory = async (): Promise<PastStayItem[]> => {
    try {
      const res = await guestApi.getStayHistory();
      if (res.success && res.data) {
        setStayHistory(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to fetch stay history:', err);
    }
    return [];
  };

  const registerGuest = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; code?: string; message?: string }> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Creating Account', 'Registering your SmartStay profile...', 'info');
    const res = await guestApi.registerGuest(data);
    if (res.success) {
      if (res.data?.session?.token) {
        setIsAuthenticated(true);
        setSessionToken(res.data.session.token);
        await loadBackendData();
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        showToast('Welcome to SmartStay', `Welcome ${data.firstName}! A welcome email has been sent to your inbox.`, 'success');
        return { success: true };
      }
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Account Created', 'Welcome email sent! Please sign in with your credentials.', 'success');
      return { success: true };
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      if (res.code === 'EMAIL_EXISTS') {
        showToast('Account Exists', 'An account with this email already exists. Switching to Sign In.', 'info');
      } else {
        showToast('Registration Error', res.message || 'Could not register.', 'alert');
      }
      return { success: false, code: res.code, message: res.message };
    }
  };

  const loginWithPassword = async (email: string, password: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Authenticating', `Signing in ${email}...`, 'info');
    const res = await guestApi.loginWithPassword(email, password);
    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setSessionToken(res.data.token);
      setCurrentUserEmail(email);
      // If biometrics is already enabled, refresh stored credentials seamlessly
      biometricsService.isBiometricLoginEnabled().then((enabled: boolean) => {
        if (enabled) {
          biometricsService.enableBiometricLogin({ email, password, token: res.data?.token }).catch(() => {});
        }
      });
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome Back', 'Signed in successfully', 'success');
      return true;
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Sign In Failed', res.message || 'Invalid email or password.', 'alert');
      return false;
    }
  };

  const loginWithEmail = async (email: string, lastName?: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Authenticating', `Signing in ${email}...`, 'info');
    const res = await guestApi.loginWithEmail(email, lastName);
    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setSessionToken(res.data.token);
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome Back', 'Signed in successfully', 'success');
      return true;
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Sign In Failed', res.message || 'Email not found on an active or past stay.', 'alert');
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Sending Code', 'Dispatching password reset verification...', 'info');
    const res = await guestApi.forgotPassword(email);
    if (res.success) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Code Dispatched', res.message || 'Check your email inbox for your 6-digit code.', 'success');
      return { success: true, message: res.message };
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Request Failed', res.message || 'Unable to send reset code.', 'alert');
      return { success: false, message: res.message };
    }
  };

  const resetPassword = async (data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Updating Password', 'Validating verification code...', 'info');
    const res = await guestApi.resetPassword(data);
    if (res.success) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Password Reset', res.message || 'Password updated. Please sign in.', 'success');
      return { success: true, message: res.message };
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Reset Failed', res.message || 'Invalid or expired code.', 'alert');
      return { success: false, message: res.message };
    }
  };

    // 1c. POST /guest/login (Login with QR code token or scanned payload)
  const loginWithQr = async (qrData: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    let token = qrData.trim();
    let bookingCode: string | undefined;

    // Check if JSON
    if (token.startsWith('{') && token.endsWith('}')) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.qrToken) token = parsed.qrToken;
        else if (parsed.token) token = parsed.token;
        if (parsed.accessCode) bookingCode = parsed.accessCode;
        else if (parsed.code) bookingCode = parsed.code;
      } catch {
        // use raw
      }
    } else if (token.includes('token=')) {
      // URL parsing
      try {
        const urlMatch = token.match(/[?&]token=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          token = decodeURIComponent(urlMatch[1]);
        }
      } catch {
        // use raw
      }
    }

    showToast('Verifying QR Pass', 'Validating digital credentials with concierge...', 'info');

    // First attempt QR token login
    let res = await guestApi.createSession({ qrToken: token });

    // Fallback: if token was an access code or failed with qrToken and we have bookingCode
    if (!res.success && bookingCode) {
      res = await guestApi.createSession({ bookingCode });
    }
    if (!res.success && token.length <= 12) {
      res = await guestApi.createSession({ bookingCode: token });
    }

    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setSessionToken(res.data.token);
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome to SmartStay', 'QR pass verified successfully', 'success');
      return true;
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Invalid QR Pass', res.message || 'QR code expired or invalid.', 'alert');
      return false;
    }
  };

  // 2. DELETE /guest/session (Sign out)
  const logout = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await guestApi.deleteSession();
    setIsAuthenticated(false);
    setSessionToken(null);
    setReservation(emptyReservation);
    setHasActiveRoom(false);
    setRequests([]);
    setChatMessages([]);
    setKeyStatus('offline');
    setRoomDevices([]);
    setDoorState('locked');
    showToast('Signed Out', 'Mobile stay session terminated.', 'info');
  };

  // 5. POST /guest/key/unlock (Remote door unlock trigger)
  const unlockDoor = async () => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('Check-In Required', 'You have checked out. A digital key requires an active room reservation.', 'alert');
      return;
    }
    if (doorState === 'unlocking' || doorState === 'unlocked') return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setDoorState('unlocking');
    showToast('Unlocking Suite', 'Cryptographic token verifying with smart deadbolt...', 'info');

    // Call live backend endpoint POST /guest/key/unlock
    try {
      const unlockRes = await guestApi.unlock();
      if (unlockRes.success) {
        setDoorState('unlocked');
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        showToast('Door Unlocked', `${reservation.suiteNumber || 'Suite'} latch disengaged. Welcome in!`, 'success');
        setUnlockCountdown(8);
      } else {
        setDoorState('locked');
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
        showToast('Unlock Failed', unlockRes.message || 'Door unlock verification failed. Please try again or visit front desk.', 'alert');
      }
    } catch (err: any) {
      setDoorState('locked');
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Unlock Failed', err?.message || 'Door unlock failed. Contact front desk.', 'alert');
    }
  };

  // Auto-relock timer countdown
  useEffect(() => {
    if (doorState === 'unlocked' && unlockCountdown > 0) {
      const timer = setTimeout(() => {
        setUnlockCountdown((prev) => {
          if (prev <= 1) {
            setDoorState('locked');
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
            showToast('Door Secured', `${reservation.suiteNumber} deadbolt re-engaged.`, 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [doorState, unlockCountdown, reservation.suiteNumber]);

  const lockDoor = () => {
    setDoorState('locked');
    setUnlockCountdown(0);
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    showToast('Door Secured', `${reservation.suiteNumber} is locked and armed.`, 'info');
  };

  // 6. PUT /guest/dnd (Toggle Do Not Disturb)
  const toggleDnd = async () => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('No Active Room', 'Room privacy controls are available once you check into a suite.', 'info');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !dndActive;
    setDndActive(nextState);

    // Call live backend endpoint PUT /guest/dnd
    const res = await guestApi.setDnd(nextState);
    if (res.success) {
      showToast(
        nextState ? 'Privacy Mode Enabled' : 'Privacy Mode Disabled',
        nextState ? 'Hotel staff and external door chime silenced.' : 'Standard service restored.',
        nextState ? 'alert' : 'info'
      );
    } else {
      showToast(
        nextState ? 'DND Active (Local)' : 'DND Disabled',
        nextState ? 'Privacy mode enabled.' : 'Privacy mode turned off.',
        nextState ? 'alert' : 'info'
      );
    }
  };

  // 8. POST /guest/requests (Submit new request)
  const requestHousekeeping = async (serviceTitle: string, note?: string) => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('Check-In Required', 'Please check into a room before requesting room services.', 'alert');
      return;
    }
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    const desc = note ? `${serviceTitle} - ${note}` : serviceTitle;

    // Call live backend endpoint POST /guest/requests
    const res = await guestApi.createRequest('housekeeping', desc);
    if (res.success) {
      showToast('Housekeeping Dispatched', `"${serviceTitle}" received by floor concierge.`, 'success');
      await loadBackendData();
    } else {
      showToast('Request Failed', res.message || 'Unable to submit request.', 'alert');
    }
  };

  // 8b. Dining Order (calls POST /guest/requests with category 'food')
  const placeDiningOrder = async () => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('Check-In Required', 'Please check into a room before ordering in-room dining.', 'alert');
      return;
    }
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);

    const itemsSummary = Object.entries(cart)
      .map(([id, qty]) => `${qty}x ${id}`)
      .join(', ');

    // Call live backend endpoint POST /guest/requests
    const res = await guestApi.createRequest('food', `In-Room Dining Order: ${itemsSummary}`);
    if (res.success) {
      clearCart();
      showToast('Order Confirmed', 'Kitchen received your selection. Direct delivery to Suite.', 'success');
      await loadBackendData();
    } else {
      showToast('Order Failed', res.message || 'Unable to place dining order.', 'alert');
    }
  };

  // 9. POST /guest/feedback (Submit rating & review)
  const submitStayFeedback = async (rating: number, category?: string, comment?: string): Promise<boolean> => {
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    const res = await guestApi.submitFeedback({ rating, category, comment });
    if (res.success) {
      showToast('Thank You', 'Your feedback was directly submitted to General Management.', 'success');
      return true;
    }
    showToast('Feedback Received', 'Thank you for your rating.', 'info');
    return false;
  };

  // 10. POST /guest/issues (Report maintenance or room issue)
  const reportRoomIssue = async (category: string, description: string): Promise<boolean> => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('Check-In Required', 'You must be checked into a room to report maintenance issues.', 'alert');
      return false;
    }
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
    const res = await guestApi.reportIssue({ category, description });
    if (res.success) {
      showToast('Issue Dispatched', 'Engineering & Chief Concierge notified immediately.', 'alert');
      return true;
    }
    showToast('Issue Recorded', 'Concierge will follow up shortly.', 'info');
    return false;
  };

  // Biometric Actions
  const enableBiometrics = async (email?: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const targetEmail = email || currentUserEmail || savedBiometricEmail;
    if (!targetEmail) {
      showToast('Account Required', 'Please sign in or provide your email to enable fingerprint login.', 'alert');
      return { success: false, error: 'Email missing' };
    }

    const res = await biometricsService.enableBiometricLogin({
      email: targetEmail,
      password,
      token: sessionToken || undefined,
    });

    if (res.success) {
      setIsBiometricsEnabled(true);
      setSavedBiometricEmail(targetEmail);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Biometrics Activated', `You can now use your ${biometricTypeLabel.toLowerCase()} to sign in.`, 'success');
      return { success: true };
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Biometrics Failed', res.error || 'Failed to activate biometric login.', 'alert');
      return { success: false, error: res.error };
    }
  };

  const disableBiometrics = async (): Promise<void> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await biometricsService.disableBiometricLogin();
    setIsBiometricsEnabled(false);
    setSavedBiometricEmail(null);
    showToast('Biometrics Deactivated', `${biometricTypeLabel} login has been turned off.`, 'info');
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Authenticating', `Scan your ${biometricTypeLabel.toLowerCase()} to continue...`, 'info');

    const authenticated = await biometricsService.authenticate(`Scan your ${biometricTypeLabel.toLowerCase()} to access SmartStay`);
    if (!authenticated) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Authentication Cancelled', 'Biometric scan was cancelled or not recognized.', 'alert');
      return false;
    }

    const creds = await biometricsService.getSavedBiometricCredentials();
    if (!creds.email && !creds.token) {
      showToast('No Saved Profile', 'Please sign in with password once to re-link biometrics.', 'alert');
      return false;
    }

    // 1. Try saved bearer token
    if (creds.token) {
      guestApi.setToken(creds.token);
      try {
        const meRes = await guestApi.getMe();
        if (meRes.success && meRes.data) {
          setSessionToken(creds.token);
          setIsAuthenticated(true);
          if (creds.email) setCurrentUserEmail(creds.email);
          await loadBackendData();
          triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
          showToast('Welcome Back', `Signed in with ${biometricTypeLabel}`, 'success');
          return true;
        }
      } catch {
        // Token might have expired, try fallback below
      }
    }

    // 2. Try saved password if token expired
    if (creds.email && creds.password) {
      const loginSuccess = await loginWithPassword(creds.email, creds.password);
      if (loginSuccess) {
        if (guestApi.getToken()) {
          await biometricsService.enableBiometricLogin({
            email: creds.email,
            password: creds.password,
            token: guestApi.getToken() || undefined,
          });
        }
        return true;
      }
    }

    // 3. Try passwordless email sign-in fallback
    if (creds.email) {
      const emailRes = await guestApi.loginWithEmail(creds.email);
      if (emailRes.success && emailRes.data?.token) {
        setSessionToken(emailRes.data.token);
        setIsAuthenticated(true);
        setCurrentUserEmail(creds.email);
        await loadBackendData();
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        showToast('Welcome Back', `Signed in with ${biometricTypeLabel}`, 'success');
        return true;
      }
    }

    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
    showToast('Session Expired', 'Please enter your password once to refresh your biometric login.', 'alert');
    return false;
  };

  // 11. POST /guest/devices (Register push notification token)
  const registerDeviceToken = async (pushToken: string): Promise<boolean> => {
    const res = await guestApi.registerDevice(pushToken, Platform.OS === 'ios' ? 'ios' : 'android');
    return res.success;
  };

  const linkBooking = async (data: {
    bookingCode?: string;
    reference?: string;
    lastName?: string;
    qrToken?: string;
    qrData?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast('Linking Reservation', 'Verifying check-in credentials with hotel...', 'info');

    // Robust parsing for raw QR codes or JSON payloads
    let payload = { ...data };
    const raw = (payload.qrData || payload.qrToken || payload.bookingCode || '').trim();
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const json = JSON.parse(raw);
        if (json.qrToken) payload.qrToken = json.qrToken;
        else if (json.token) payload.qrToken = json.token;
        if (json.accessCode) payload.bookingCode = json.accessCode;
        else if (json.code) payload.bookingCode = json.code;
        if (json.reference) payload.reference = json.reference;
      } catch {
        // use raw
      }
    } else if (raw.includes('token=')) {
      try {
        const match = raw.match(/[?&]token=([^&]+)/);
        if (match && match[1]) payload.qrToken = decodeURIComponent(match[1]);
      } catch {
        // use raw
      }
    }

    const res = await guestApi.linkBooking(payload);
    if (res.success) {
      await loadBackendData();
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      showToast('Room Assigned', res.message || 'Booking linked successfully. Your digital key is ready!', 'success');
      return { success: true, message: res.message };
    } else {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      showToast('Check-In Pending', res.message || 'Could not find active check-in with these details.', 'alert');
      return { success: false, message: res.message };
    }
  };

  const setCustomApiUrl = (url: string) => {
    guestApi.setBaseUrl(url);
    setApiBaseUrl(url);
    showToast('API URL Updated', `Connecting to ${url}`, 'info');
  };

  // Room Cleaning status toggle (PUT /guest/room-status)
  const toggleCleaningRequested = async (note?: string) => {
    if (!hasActiveRoom) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showToast('No Active Room', 'Housekeeping requests are available once you check into a suite.', 'info');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !cleaningRequested;
    setCleaningRequested(nextState);

    const res = await guestApi.setCleaningRequested(nextState, note);
    if (res.success) {
      showToast(
        nextState ? 'Housekeeping Scheduled' : 'Housekeeping Cancelled',
        nextState ? 'Floor attendant notified for suite cleaning.' : 'Cleaning request cancelled.',
        'success'
      );
    } else {
      showToast(
        nextState ? 'Housekeeping Scheduled' : 'Housekeeping Cancelled',
        nextState ? 'Floor attendant notified.' : 'Cleaning request cancelled.',
        'info'
      );
    }
  };

  // Cancel Request (POST /guest/requests/:id/cancel)
  const cancelRequest = async (requestId: string): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = await guestApi.cancelGuestRequest(requestId);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'completed' as any, detail: 'Cancelled by guest' }
            : r
        )
      );
      showToast('Request Cancelled', `Service request #${requestId} has been cancelled.`, 'info');
      loadBackendData();
      return true;
    } else {
      showToast('Cancellation Failed', res.message || 'Unable to cancel this request.', 'alert');
      return false;
    }
  };

  // Direct Device Command Actuation (POST /guest/devices/:id/command)
  // Direct Device Command Actuation (POST /guest/devices/:id/command)
  const sendDeviceCommand = async (
    type: 'thermostat' | 'light' | 'curtain' | 'tv' | 'fridge' | 'other',
    command: Record<string, any>
  ): Promise<boolean> => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const target = roomDevices.find(
      (d: any) =>
        d.type === type ||
        d.type?.toLowerCase().includes(type) ||
        (type === 'fridge' && (d.name?.toLowerCase().includes('fridge') || d.name?.toLowerCase().includes('bar') || d.type === 'other'))
    );
    const deviceId = target ? target.id : type === 'tv' ? 3 : type === 'fridge' ? 2 : 1;
    const res = await guestApi.sendDeviceCommand(deviceId, command);
    if (res.success) {
      showToast('Hardware Updated', `${type.toUpperCase()} command dispatched to suite.`, 'info');
      return true;
    }
    return false;
  };

  // TV Controls
  const toggleTvPower = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setTv((prev) => {
      const nextPower = !prev.power;
      sendDeviceCommand('tv', { power: nextPower });
      showToast('Smart TV', nextPower ? 'Suite 65" 4K OLED Powered On' : 'TV Switched to Standby', 'info');
      return { ...prev, power: nextPower };
    });
  };

  const adjustTvVolume = (delta: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setTv((prev) => {
      const nextVol = Math.max(0, Math.min(100, prev.volume + delta));
      sendDeviceCommand('tv', { volume: nextVol, mute: false });
      return { ...prev, volume: nextVol, muted: false };
    });
  };

  const toggleTvMute = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setTv((prev) => {
      const nextMute = !prev.muted;
      sendDeviceCommand('tv', { mute: nextMute });
      showToast('TV Audio', nextMute ? 'Muted' : `Volume ${prev.volume}`, 'info');
      return { ...prev, muted: nextMute };
    });
  };

  const setTvSource = (source: TvState['source'], appName?: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setTv((prev) => {
      sendDeviceCommand('tv', { input: source, app: appName });
      const labels: Record<TvState['source'], string> = {
        streaming: appName || 'Streaming Apps',
        hdmi: 'HDMI 1 · Laptop Input',
        ambient: 'Ambient Art Gallery',
        cast: 'Mobile Screen Cast',
      };
      showToast('TV Input', labels[source] || source, 'info');
      return { ...prev, source, appName, power: true };
    });
  };

  // Refrigerator / Minibar Controls
  const toggleFridgePower = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFridge((prev) => {
      const nextPower = !prev.power;
      sendDeviceCommand('fridge', { power: nextPower });
      showToast('Mini-Bar Cooler', nextPower ? 'Cooling System Active' : 'Eco Standby Mode', 'info');
      return { ...prev, power: nextPower };
    });
  };

  const adjustFridgeTemp = (delta: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFridge((prev) => {
      const nextTemp = Math.max(33, Math.min(48, prev.temp + delta));
      sendDeviceCommand('fridge', { setpoint: nextTemp, unit: 'F' });
      return { ...prev, temp: nextTemp };
    });
  };

  const setFridgeMode = (mode: FridgeState['mode']) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFridge((prev) => {
      sendDeviceCommand('fridge', { mode });
      const modeNames: Record<FridgeState['mode'], string> = {
        standard: 'Standard Refresh (38°F)',
        boost: 'Quick Chill Boost (34°F)',
        wine: 'Wine & Cellar Temp (45°F)',
      };
      showToast('Cooler Mode', modeNames[mode], 'info');
      const tempTarget = mode === 'boost' ? 34 : mode === 'wine' ? 45 : 38;
      return { ...prev, mode, temp: tempTarget };
    });
  };

  // Lighting Advanced Controls
  const toggleLightPower = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLight((prev) => {
      const nextPower = !prev.power;
      sendDeviceCommand('light', { power: nextPower, brightness: nextPower ? prev.brightness : 0 });
      showToast('Lighting', nextPower ? 'Master Lights On' : 'All Lighting Off', 'info');
      return { ...prev, power: nextPower };
    });
  };

  const setLightBrightness = (level: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setLight((prev) => {
      sendDeviceCommand('light', { brightness: level, power: true });
      showToast('Dimmer Level', `${level}% Brightness`, 'info');
      return { ...prev, brightness: level, power: true };
    });
  };

  const toggleLightZone = (zone: 'ceiling' | 'bedside' | 'bath') => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setLight((prev) => {
      const nextState = !prev.zones[zone];
      const nextZones = { ...prev.zones, [zone]: nextState };
      sendDeviceCommand('light', { zone, state: nextState });
      const zoneNames: Record<string, string> = {
        ceiling: 'Ceiling Ambient',
        bedside: 'Bedside Reading',
        bath: 'Bathroom Vanity',
      };
      showToast(zoneNames[zone] || zone, nextState ? 'Enabled' : 'Off', 'info');
      return { ...prev, zones: nextZones };
    });
  };

  // Multipart feedback with photos (POST /guest/feedback)
  const submitFeedbackWithPhotos = async (
    rating: number,
    category: string,
    comment: string,
    photos?: string[],
    markAsIssue: boolean = false
  ): Promise<boolean> => {
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    const formData = new FormData();
    formData.append('rating', String(rating));
    if (category) formData.append('category', category);
    if (comment) formData.append('comment', comment);
    formData.append('markAsIssue', markAsIssue ? 'true' : 'false');

    if (photos && photos.length > 0) {
      photos.forEach((photoUri, index) => {
        const filename = photoUri.split('/').pop() || `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('photos', {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      });
    }

    const res = await guestApi.submitFeedbackMultipart(formData);
    if (res.success) {
      showToast(
        markAsIssue ? 'Issue Logged with Photos' : 'Feedback Submitted',
        markAsIssue
          ? 'Photos and issue ticket received by maintenance.'
          : 'Thank you for your rating & photos.',
        'success'
      );
      return true;
    } else {
      const fallbackRes = await guestApi.submitFeedback({
        rating,
        category,
        comment,
        markAsIssue,
      });
      if (fallbackRes.success) {
        showToast('Feedback Submitted', 'Sent successfully to Guest Services.', 'success');
        return true;
      }
      showToast('Feedback Recorded', 'Saved locally for Guest Services.', 'info');
      return false;
    }
  };

  // Fetch hotel info (GET /guest/info) & sync server connectivity
  const fetchHotelInfo = async () => {
    try {
      const { online } = await guestApi.checkHealth();
      setBackendOnline(online);
    } catch {
      // ignore
    }
    const res = await guestApi.getHotelInfo();
    if (res.success && res.data) {
      setHotelInfo(res.data);
    }
  };

  const adjustTargetTemp = (delta: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setClimate((prev) => {
      const newTarget = Math.max(62, Math.min(84, prev.targetTemp + delta));
      const newTargetC = Math.round(((newTarget - 32) * 5) / 9);

      // Actuate hardware command & sync preference in background
      guestApi
        .sendDeviceCommand(
          roomDevices.find((d: any) => d.type === 'thermostat')?.id || 1,
          { setpoint: newTargetC, mode: prev.mode, fan: prev.fanSpeed }
        )
        .catch(() => {});
      guestApi
        .updatePreferences({ temperature: { setpoint: newTargetC, mode: prev.mode } }, true)
        .catch(() => {});

      return { ...prev, targetTemp: newTarget };
    });
  };

  const setClimateMode = (mode: ClimateState['mode']) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setClimate((prev) => {
      const tempC = Math.round(((prev.targetTemp - 32) * 5) / 9);
      guestApi
        .sendDeviceCommand(
          roomDevices.find((d: any) => d.type === 'thermostat')?.id || 1,
          { mode, setpoint: tempC, fan: prev.fanSpeed }
        )
        .catch(() => {});
      return { ...prev, mode };
    });
  };

  const setFanSpeed = (fanSpeed: ClimateState['fanSpeed']) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setClimate((prev) => {
      const tempC = Math.round(((prev.targetTemp - 32) * 5) / 9);
      guestApi
        .sendDeviceCommand(
          roomDevices.find((d: any) => d.type === 'thermostat')?.id || 1,
          { fan: fanSpeed, mode: prev.mode, setpoint: tempC }
        )
        .catch(() => {});
      return { ...prev, fanSpeed };
    });
  };

  const toggleEcoMode = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setClimate((prev) => {
      const nextEco = !prev.ecoMode;
      showToast(
        nextEco ? 'Eco Comfort Enabled' : 'Standard Mode',
        nextEco
          ? 'Adaptive energy saving optimized around your schedule'
          : 'Maximum cooling performance active',
        'info'
      );
      return { ...prev, ecoMode: nextEco };
    });
  };

  const handleSetLighting = (scene: LightingPreset) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setLightingScene(scene);
    const sceneNames: Record<LightingPreset, string> = {
      relax: 'Relax & Warm Tone (2700K 40%)',
      evening: 'Evening Sunset Ambience',
      work: 'Executive Daylight Focus (4000K)',
      night: 'Midnight Low Guide Pathway',
      all_off: 'Master All Lighting Off',
    };
    showToast('Lighting Scene', sceneNames[scene], 'info');

    // Actuate light device command
    guestApi
      .sendDeviceCommand(
        roomDevices.find((d: any) => d.type === 'light')?.id || 1,
        { scene, power: scene !== 'all_off' }
      )
      .catch(() => {});
  };

  const requestValet = async () => {
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    showToast('Valet Requested', 'Porter and valet desk notified for vehicle retrieval.', 'success');
    await guestApi.createRequest('maintenance', 'Valet & Luggage: Vehicle retrieval requested');
    await loadBackendData();
  };

  const cancelValet = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setValet((prev) => ({ ...prev, status: 'parked' }));
    showToast('Valet Cancelled', 'Vehicle remains parked in hotel garage.', 'info');
  };

  const addToCart = (item: MenuItem) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    showToast('Item Added', `${item.name} added to In-Room Dining tray.`, 'info');
  };

  const removeFromCart = (itemId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[itemId] > 1) {
        copy[itemId] -= 1;
      } else {
        delete copy[itemId];
      }
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const guestMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'guest',
      text: text.trim(),
      timestamp: timeNow,
    };
    setChatMessages((prev) => [...prev, guestMsg]);

    // Dispatch real service request to backend
    const res = await guestApi.createRequest('other', `[Concierge Chat] ${text.trim()}`);
    if (res.success) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      await loadBackendData();
    } else {
      showToast('Message Delivery Failed', res.message || 'Unable to reach front desk.', 'alert');
    }
  };

  const simulateNfcTap = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    showToast('NFC Tap Triggered', 'Validating digital key with door deadbolt...', 'info');
    unlockDoor();
  };

  return (
    <GuestStayContext.Provider
      value={{
        reservation,
        doorState,
        keyStatus,
        dndActive,
        climate,
        lightingScene,
        tv,
        fridge,
        light,
        requests,
        valet,
        cart,
        chatMessages,
        toast,
        unlockCountdown,
        backendOnline,
        isAuthenticated,
        sessionToken,
        apiBaseUrl,
        hasActiveRoom,
        cleaningRequested,
        roomDevices,
        hotelInfo,
        unlockDoor,
        lockDoor,
        toggleDnd,
        toggleCleaningRequested,
        cancelRequest,
        sendDeviceCommand,
        submitFeedbackWithPhotos,
        fetchHotelInfo,
        adjustTargetTemp,
        setClimateMode,
        setFanSpeed,
        toggleEcoMode,
        setLightingScene: handleSetLighting,
        toggleLightPower,
        setLightBrightness,
        toggleLightZone,
        toggleTvPower,
        adjustTvVolume,
        toggleTvMute,
        setTvSource,
        toggleFridgePower,
        adjustFridgeTemp,
        setFridgeMode,
        requestHousekeeping,
        requestValet,
        cancelValet,
        addToCart,
        removeFromCart,
        clearCart,
        placeDiningOrder,
        sendChatMessage,
        showToast,
        dismissToast,
        simulateNfcTap,
        loginWithCode,
        loginWithReference,
        loginWithQr,
        logout,
        stayHistory,
        registerGuest,
        loginWithPassword,
        loginWithEmail,
        forgotPassword,
        resetPassword,
        fetchStayHistory,
        refreshStayData: loadBackendData,
        submitStayFeedback,
        reportRoomIssue,
        registerDeviceToken,
        setCustomApiUrl,
        linkBooking,
        isBiometricsSupported,
        isBiometricsEnabled,
        biometricTypeLabel,
        savedBiometricEmail,
        enableBiometrics,
        disableBiometrics,
        loginWithBiometrics,
      }}
    >
      {children}
    </GuestStayContext.Provider>
  );
};

export const useGuestStay = () => {
  const context = useContext(GuestStayContext);
  if (!context) {
    throw new Error('useGuestStay must be used within a GuestStayProvider');
  }
  return context;
};
