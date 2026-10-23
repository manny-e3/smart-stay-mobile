export type KeyStatus = 'connected' | 'offline' | 'calibrating';
export type DoorLockState = 'locked' | 'unlocking' | 'unlocked';

export type ClimateMode = 'cool' | 'heat' | 'eco' | 'fan';
export type FanSpeed = 'auto' | 'low' | 'med' | 'high';

export interface ClimateState {
  currentTemp: number;
  targetTemp: number;
  mode: ClimateMode;
  fanSpeed: FanSpeed;
  ecoMode: boolean;
  humidity: number;
}

export type LightingPreset = 'relax' | 'evening' | 'work' | 'night' | 'all_off';

export interface ServiceRequest {
  id: string;
  type: 'housekeeping' | 'dining' | 'valet' | 'concierge';
  title: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed';
  timeRequested: string;
  eta?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'All-Day' | 'Evening & Wine' | 'Refreshment';
  description: string;
  price: number;
  calories?: string;
  dietary?: string;
}

export interface ValetState {
  status: 'parked' | 'requested' | 'retrieving' | 'ready';
  carModel: string;
  plate: string;
  etaMinutes: number;
  valetTicket: string;
}

export interface ReservationInfo {
  hotelName: string;
  suiteNumber: string;
  suiteType: string;
  guestName: string;
  vipTier: string;
  checkInDate: string;
  checkOutDate: string;
  checkOutTime: string;
  wifiNetwork: string;
  wifiPassword: string;
  roomPin: string;
  hotelAddress: string;
  conciergePhone: string;
}

export interface ChatMessage {
  id: string;
  sender: 'guest' | 'concierge';
  text: string;
  timestamp: string;
}

export interface TvState {
  power: boolean;
  volume: number;
  muted: boolean;
  source: 'streaming' | 'hdmi' | 'ambient' | 'cast';
  appName?: string;
}

export interface FridgeState {
  power: boolean;
  temp: number;
  mode: 'standard' | 'boost' | 'wine';
  doorClosed: boolean;
}

export interface LightState {
  power: boolean;
  brightness: number;
  scene: LightingPreset;
  zones: {
    ceiling: boolean;
    bedside: boolean;
    bath: boolean;
  };
}

export interface PastStayItem {
  id: string | number;
  reference?: string;
  suiteNumber: string;
  suiteType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: 'checked_out' | 'in_house' | 'reserved' | 'cancelled';
  totalAmount?: number;
  currency?: string;
}
