import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type SmartStayTab = 'home' | 'controls' | 'services' | 'profile';

interface SmartStayBottomNavProps {
  activeTab: SmartStayTab;
  onTabChange: (tab: SmartStayTab) => void;
  serviceBadgeCount?: number;
}

export const SmartStayBottomNav: React.FC<SmartStayBottomNavProps> = ({
  activeTab,
  onTabChange,
  serviceBadgeCount = 0,
}) => {
  const tabs: {
    id: SmartStayTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      iconActive: 'home',
    },
    {
      id: 'controls',
      label: 'Controls',
      icon: 'options-outline',
      iconActive: 'options',
    },
    {
      id: 'services',
      label: 'Services',
      icon: 'restaurant-outline',
      iconActive: 'restaurant',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      iconActive: 'person',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={styles.tabButton}
            onPress={() => onTabChange(t.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <Ionicons
                name={isActive ? t.iconActive : t.icon}
                size={22}
                color={isActive ? colors.primaryNavy : '#94A3B8'}
              />
              {t.id === 'services' && serviceBadgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{serviceBadgeCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                typography.labelMd,
                styles.label,
                { color: isActive ? colors.primaryNavy : '#94A3B8' },
                isActive && styles.labelActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#EAB308',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  labelActive: {
    fontWeight: '700',
    color: colors.primaryNavy,
  },
});
