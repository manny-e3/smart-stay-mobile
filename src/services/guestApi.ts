import { Platform } from 'react-native';
import { PastStayItem } from '../types';

// Default to the computer's LAN IP so physical Android/iOS phones can reach it over Wi-Fi
const DEFAULT_LAN_IP = '192.168.1.127';
// Port 5000 is safe from browser ERR_UNSAFE_PORT and undici bad port restrictions
const DEFAULT_PORT = '5000';

export const getDefaultApiBase = (): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_PORT}`;
  }
  // For physical devices on local Wi-Fi
  return `http://${DEFAULT_LAN_IP}:${DEFAULT_PORT}`;
};

export interface GuestSessionResponse {
  token: string;
  expiresAt: string;
}

export interface GuestMeResponse {
  hotel: {
    name: string;
    receptionPhone?: string | null;
    acMinTemp?: number;
    acMaxTemp?: number;
  };
  guest: {
    id?: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    language?: string;
  };
  stay: {
    reference?: string | null;
    arrival?: string | null;
    departure?: string | null;
    checkedInAt?: string | null;
    adults?: number;
    children?: number;
  };
  room: {
    number: string;
    floor?: number;
    roomType?: string;
    imageUrl?: string | null;
    dnd?: boolean;
  };
  roomStatus?: {
    dnd: boolean;
    cleaningRequested?: boolean;
  };
  key?: {
    available: boolean;
    validUntil?: string;
  };
}

export interface GuestKeyItem {
  id: number;
  deviceId: number;
  roomId: number;
  status: string;
  doorName?: string;
  credential?: any;
  remoteUnlock?: boolean;
}

export interface GuestKeysResponse {
  methods?: {
    ble?: boolean;
    remote?: boolean;
  };
  validFrom?: string;
  validUntil?: string;
  keys?: GuestKeyItem[];
}

export interface GuestRequestItem {
  id: number | string;
  category: string;
  description?: string;
  priority?: string;
  status: string;
  preferredAt?: string | null;
  room?: {
    number: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackPayload {
  rating: number;
  category?: string;
  comment?: string;
  photos?: string[];
  markAsIssue?: boolean;
}

export interface IssuePayload {
  category: string;
  description: string;
}

class GuestApiService {
  private baseUrl: string = getDefaultApiBase();
  private token: string | null = null;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackEndpoint?: string
  ): Promise<{ success: boolean; data?: T; message?: string; code?: string }> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const executeFetch = async (baseUrlToUse: string, path: string) => {
      const url = `${baseUrlToUse}${path.startsWith('/') ? path : `/${path}`}`;
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw {
          status: res.status,
          code: json.code || `HTTP_${res.status}`,
          message: json.message || `Request failed with status ${res.status}`,
          data: json.data,
        };
      }

      return json;
    };

    try {
      return await executeFetch(this.baseUrl, endpoint);
    } catch (err: any) {
      // If network failure on port 5000/6000, try companion port automatically
      if (!err.status && (this.baseUrl.includes(':5000') || this.baseUrl.includes(':6000'))) {
        const altBase = this.baseUrl.includes(':5000')
          ? this.baseUrl.replace(':5000', ':6000')
          : this.baseUrl.replace(':6000', ':5000');
        try {
          const res = await executeFetch(altBase, endpoint);
          this.baseUrl = altBase; // Auto-update to working port
          return res;
        } catch {
          // continue to fallback handling below
        }
      }

      // If primary endpoint returned 404 or failed and a fallback endpoint exists, try the fallback
      if (fallbackEndpoint && (err.status === 404 || !err.status)) {
        try {
          return await executeFetch(this.baseUrl, fallbackEndpoint);
        } catch (fallbackErr: any) {
          return {
            success: false,
            code: fallbackErr.code || 'REQUEST_FAILED',
            message: fallbackErr.message || `Cannot connect to ${this.baseUrl}. Check server IP or Wi-Fi.`,
          };
        }
      }

      return {
        success: false,
        code: err.code || 'REQUEST_FAILED',
        message: err.message || (err.status ? `Request failed (${err.status})` : `Cannot reach ${this.baseUrl}. Check network.`),
      };
    }
  }

  // 1d. POST /guest/register (Register guest account with password)
  async registerGuest(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; data?: any; message?: string; code?: string }> {
    const res = await this.request<any>(
      '/guest/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (res.success && res.data?.session?.token) {
      this.setToken(res.data.session.token);
    }
    return res;
  }

  // 1e. POST /guest/login (Login with email & password)
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; data?: GuestSessionResponse; message?: string }> {
    const res = await this.request<GuestSessionResponse>(
      '/guest/login',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      }
    );
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  // 1f. POST /guest/link-booking (Link a checked-in booking code or reference to current session)
  async linkBooking(data: {
    bookingCode?: string;
    reference?: string;
    lastName?: string;
    qrToken?: string;
    qrData?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request('/guest/link-booking', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 1e-compat. POST /guest/login (Login with email & lastName)
  async loginWithEmail(
    email: string,
    lastName?: string
  ): Promise<{ success: boolean; data?: GuestSessionResponse; message?: string }> {
    const res = await this.request<GuestSessionResponse>(
      '/guest/login',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), lastName: lastName?.trim() || undefined }),
      }
    );
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  // 1f. POST /guest/forgot-password (Request 6-digit reset code via email)
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    return this.request(
      '/guest/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }
    );
  }

  // 1g. POST /guest/reset-password (Reset password with 6-digit code)
  async resetPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message?: string }> {
    return this.request(
      '/guest/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          code: data.code.trim(),
          newPassword: data.newPassword,
        }),
      }
    );
  }

  // 3b. GET /guest/history (Fetch all stays & rooms across past visits)
  async getStayHistory(): Promise<{ success: boolean; data?: PastStayItem[]; message?: string }> {
    return this.request<PastStayItem[]>('/guest/history', {
      method: 'GET',
    });
  }

  // 1. POST /guest/login (Guest login via room number + code OR reference + lastName)
  async createSession(credentials: {
    roomNumber?: string;
    code?: string;
    bookingCode?: string;
    reference?: string;
    lastName?: string;
    qrToken?: string;
  }): Promise<{ success: boolean; data?: GuestSessionResponse; message?: string; code?: string }> {
    let body: any = {};
    if (credentials.reference && credentials.lastName) {
      body = { reference: credentials.reference.trim(), lastName: credentials.lastName.trim() };
    } else if (credentials.bookingCode || credentials.code) {
      body = { bookingCode: (credentials.bookingCode || credentials.code)!.trim() };
    } else if (credentials.qrToken) {
      body = { qrToken: credentials.qrToken.trim() };
    }

    const res = await this.request<GuestSessionResponse>(
      '/guest/login',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      '/guest/session'
    );

    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }

    return res;
  }

  // 2. POST /guest/logout (Sign out of the mobile session)
  async deleteSession(): Promise<{ success: boolean; message?: string }> {
    const res = await this.request(
      '/guest/logout',
      {
        method: 'POST',
      },
      '/guest/session'
    );

    this.setToken(null);
    return res;
  }

  // 3. GET /guest/me (Fetch current stay information, suite number, and hotel amenities)
  async getMe(): Promise<{ success: boolean; data?: GuestMeResponse; message?: string }> {
    return this.request<GuestMeResponse>('/guest/me', {
      method: 'GET',
    });
  }

  // 4. GET /guest/key (Retrieve digital BLE/NFC/QR mobile keys)
  async getKeys(): Promise<{ success: boolean; data?: GuestKeysResponse | any[]; message?: string }> {
    return this.request<GuestKeysResponse | any[]>(
      '/guest/key',
      {
        method: 'GET',
      },
      '/guest/keys'
    );
  }

  // 5. POST /guest/key/unlock (Door unlock trigger from the guest's mobile phone)
  async unlock(deviceId?: number): Promise<{ success: boolean; data?: { deviceId: number; unlockedAt: string }; message?: string }> {
    return this.request<{ deviceId: number; unlockedAt: string }>(
      '/guest/key/unlock',
      {
        method: 'POST',
        body: JSON.stringify(deviceId ? { deviceId } : {}),
      },
      '/guest/unlock'
    );
  }

  // 6. PUT /guest/room-status (Toggle Do Not Disturb directly from the guest phone)
  async setDnd(on: boolean): Promise<{ success: boolean; data?: { dnd: boolean }; message?: string }> {
    return this.request<{ dnd: boolean }>(
      '/guest/room-status',
      {
        method: 'PUT',
        body: JSON.stringify({ dnd: on }),
      },
      '/guest/dnd'
    );
  }

  // 7. GET /guest/requests (List service requests submitted by the guest)
  async getRequests(): Promise<{ success: boolean; data?: GuestRequestItem[]; message?: string }> {
    return this.request<GuestRequestItem[]>('/guest/requests', {
      method: 'GET',
    });
  }

  // 8. POST /guest/requests (Submit a new guest request: towels, room service, housekeeping)
  async createRequest(
    category: 'housekeeping' | 'amenities' | 'maintenance' | 'food' | 'laundry' | 'other',
    description?: string,
    preferredAt?: Date
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request(
      '/guest/requests',
      {
        method: 'POST',
        body: JSON.stringify({
          category,
          description: description || '',
          preferredAt: preferredAt ? preferredAt.toISOString() : undefined,
        }),
      }
    );
  }

  // 9. POST /guest/feedback (Submit guest stay ratings and reviews)
  async submitFeedback(payload: FeedbackPayload): Promise<{ success: boolean; data?: { id: number }; message?: string }> {
    return this.request<{ id: number }>('/guest/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 10. POST /guest/issues (Report an in-room hardware or maintenance issue)
  async reportIssue(payload: IssuePayload): Promise<{ success: boolean; data?: { id: number; status?: string }; message?: string }> {
    return this.request<{ id: number; status?: string }>(
      '/guest/feedback',
      {
        method: 'POST',
        body: JSON.stringify({
          rating: 1,
          category: payload.category,
          comment: payload.description,
          markAsIssue: true,
        }),
      },
      '/guest/issues'
    );
  }

  // 11. PUT /guest/push-token (Register device token for push notifications)
  async registerDevice(
    pushToken: string,
    platform: 'ios' | 'android' | 'web' = (Platform.OS as any) || 'android'
  ): Promise<{ success: boolean; message?: string }> {
    return this.request(
      '/guest/push-token',
      {
        method: 'PUT',
        body: JSON.stringify({ pushToken, platform }),
      },
      '/guest/devices'
    );
  }

  // GET /guest/info (Public help and welcome info: reception phone, FAQs, privacy notice)
  async getHotelInfo(): Promise<{
    success: boolean;
    data?: {
      hotelName: string;
      receptionPhone: string | null;
      faqs: { question: string; answer: string }[];
      privacyNotice: string | null;
      quickLinks: { title: string; url: string; icon?: string }[];
    };
    message?: string;
  }> {
    return this.request('/guest/info', {
      method: 'GET',
    });
  }

  // GET /guest/devices (Fetch room smart devices & eco status)
  async getRoomDevices(): Promise<{
    success: boolean;
    data?: {
      eco: { active: boolean; since?: string | null; setpoint?: number | null };
      devices: {
        id: number;
        type: 'lock' | 'thermostat' | 'light' | 'curtain' | 'tv' | 'speaker' | 'sensor' | 'meter' | 'other';
        name: string;
        capabilities?: any;
        state?: any;
        eco?: boolean;
        online?: boolean;
        lastSeenAt?: string | null;
      }[];
    };
    message?: string;
  }> {
    return this.request('/guest/devices', {
      method: 'GET',
    });
  }

  // POST /guest/devices/:id/command (Direct device actuation: light on/dim, AC setpoint, curtain open/close, TV)
  async sendDeviceCommand(
    deviceId: number | string,
    command: Record<string, any>
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request(`/guest/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  // GET /guest/requests/:id (Request detail and status timeline)
  async getRequestDetail(requestId: number | string): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request(`/guest/requests/${requestId}`, {
      method: 'GET',
    });
  }

  // POST /guest/requests/:id/cancel (Cancel an active guest request)
  async cancelGuestRequest(requestId: number | string): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request(`/guest/requests/${requestId}/cancel`, {
      method: 'POST',
    });
  }

  // PUT /guest/room-status (Toggle room cleaning request with optional note)
  async setCleaningRequested(
    cleaningRequested: boolean,
    note?: string
  ): Promise<{ success: boolean; data?: { dnd: boolean; cleaningRequested: boolean }; message?: string }> {
    return this.request<{ dnd: boolean; cleaningRequested: boolean }>(
      '/guest/room-status',
      {
        method: 'PUT',
        body: JSON.stringify({ cleaningRequested, note: note || undefined }),
      }
    );
  }

  // POST /guest/feedback (Multipart feedback with photo uploads)
  async submitFeedbackMultipart(formData: FormData): Promise<{ success: boolean; data?: { id: number; photos?: string[]; markedAsIssue?: boolean }; message?: string }> {
    return this.request(
      '/guest/feedback',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  // GET /guest/preferences
  async getPreferences(): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request('/guest/preferences', {
      method: 'GET',
    });
  }

  // PUT /guest/preferences
  async updatePreferences(preferences: any, applyNow: boolean = false): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request('/guest/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences, applyNow }),
    });
  }

  // Health check to verify connection to backend
  async checkHealth(): Promise<{ online: boolean; latencyMs?: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      const json = await res.json().catch(() => ({}));
      return { online: res.ok && json.success === true, latencyMs: Date.now() - start };
    } catch {
      return { online: false };
    }
  }
}

export const guestApi = new GuestApiService();
