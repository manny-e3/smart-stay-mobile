import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { GuestStayProvider, useGuestStay } from './src/context/GuestStayContext';
import { SmartStayHeader } from './src/components/SmartStayHeader';
import { SmartStayBottomNav, SmartStayTab } from './src/components/SmartStayBottomNav';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ControlsScreen } from './src/screens/ControlsScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

import { ConciergeChatModal } from './src/components/ConciergeChatModal';
import { GuestLoginModal } from './src/components/GuestLoginModal';
import { FeedbackIssueModal } from './src/components/FeedbackIssueModal';
import { HotelInfoModal } from './src/components/HotelInfoModal';
import { RequestDetailModal } from './src/components/RequestDetailModal';
import { ToastNotification } from './src/components/ToastNotification';
import { colors } from './src/theme/colors';

const MainScreen: React.FC = () => {
  const { isAuthenticated, cart, requests } = useGuestStay();
  const [activeTab, setActiveTab] = useState<SmartStayTab>('home');
  const [chatOpen, setChatOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<'feedback' | 'issue'>('feedback');
  const [hotelInfoOpen, setHotelInfoOpen] = useState(false);
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const openFeedback = (mode: 'feedback' | 'issue') => {
    setFeedbackMode(mode);
    setFeedbackOpen(true);
  };

  const handleOpenRequestDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRequestDetailOpen(true);
  };

  const activeRequestsCount = requests.filter((r) => r.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Floating System / Key Notifications */}
      <ToastNotification />

      {!isAuthenticated ? (
        /* Screen 1: Welcome / Keyless Access Portal */
        <WelcomeScreen />
      ) : (
        /* Authenticated Screens 2-5 */
        <View style={styles.screenContainer}>
          {/* Top Brand & Suite Pill Header */}
          <SmartStayHeader
            onOpenProfile={() => setActiveTab('profile')}
          />

          {/* Active Screen */}
          <View style={styles.tabContent}>
            {activeTab === 'home' && (
              <HomeScreen onNavigateTab={(tab) => setActiveTab(tab)} onOpenChat={() => setChatOpen(true)} />
            )}
            {activeTab === 'controls' && <ControlsScreen />}
            {activeTab === 'services' && (
              <ServicesScreen
                onOpenChat={() => setChatOpen(true)}
                onOpenRequestDetail={handleOpenRequestDetail}
                onOpenHotelInfo={() => setHotelInfoOpen(true)}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                onOpenPreferences={() => setActiveTab('controls')}
                onOpenHotelInfo={() => setHotelInfoOpen(true)}
                onOpenFeedback={(mode) => openFeedback(mode)}
              />
            )}
          </View>

          {/* Bottom 4-Tab Navigation */}
          <SmartStayBottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            serviceBadgeCount={activeRequestsCount}
          />
        </View>
      )}

      {/* Global Modals */}
      <ConciergeChatModal
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <GuestLoginModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      <FeedbackIssueModal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        initialMode={feedbackMode}
      />

      <HotelInfoModal
        visible={hotelInfoOpen}
        onClose={() => setHotelInfoOpen(false)}
      />

      <RequestDetailModal
        visible={requestDetailOpen}
        requestId={selectedRequestId}
        onClose={() => {
          setRequestDetailOpen(false);
          setSelectedRequestId(null);
        }}
      />
    </SafeAreaView>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.splashBrand}>SMARTSTAY</Text>
        <Text style={styles.splashTitle}>Guest Keyless Portal</Text>
        <ActivityIndicator size="small" color="#FED255" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GuestStayProvider>
        <MainScreen />
      </GuestStayProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F7',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F9F9F7',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9F9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBrand: {
    color: '#64748B',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  splashTitle: {
    color: '#0B1F3A',
    fontSize: 22,
    fontWeight: '700',
  },
});
