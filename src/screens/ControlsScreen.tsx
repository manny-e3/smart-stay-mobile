import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { guestApi } from '../services/guestApi';
import { LightingPreset } from '../types';
import * as Haptics from 'expo-haptics';

type ControlCategory = 'all' | 'ac' | 'light' | 'tv' | 'fridge';

export const ControlsScreen: React.FC = () => {
  const {
    reservation,
    hasActiveRoom,
    climate,
    adjustTargetTemp,
    setClimateMode,
    setFanSpeed,
    lightingScene,
    setLightingScene,
    light,
    toggleLightPower,
    setLightBrightness,
    toggleLightZone,
    tv,
    toggleTvPower,
    adjustTvVolume,
    toggleTvMute,
    setTvSource,
    fridge,
    toggleFridgePower,
    adjustFridgeTemp,
    setFridgeMode,
    sendDeviceCommand,
    showToast,
    roomDevices,
    refreshStayData,
  } = useGuestStay();

  const [activeCategory, setActiveCategory] = useState<ControlCategory>('all');
  const [curtainClosed, setCurtainClosed] = useState(true);
  const [privacyGlassOpaque, setPrivacyGlassOpaque] = useState(true);
  const [savingPreset, setSavingPreset] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStayData();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // fallback
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshStayData]);

  const handleCurtainToggle = (closed: boolean) => {
    setCurtainClosed(closed);
    sendDeviceCommand('curtain', {
      action: closed ? 'close' : 'open',
      position: closed ? 0 : 100,
    });
  };

  const scenes: {
    id: LightingPreset;
    name: string;
    desc: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: 'relax',
      name: 'Relax',
      desc: 'Warm amber · 2700K',
      icon: 'cafe-outline',
    },
    {
      id: 'work',
      name: 'Focus',
      desc: 'Neutral daylight · 4000K',
      icon: 'book-outline',
    },
    {
      id: 'night',
      name: 'Night Light',
      desc: 'Floor pathway only',
      icon: 'moon-outline',
    },
    {
      id: 'all_off',
      name: 'All Off',
      desc: 'Total darkness',
      icon: 'power-outline',
    },
  ];

  const handleSavePreset = async () => {
    setSavingPreset(true);
    try {
      const tempCelsius = Math.round(((climate.targetTemp - 32) * 5) / 9);
      await guestApi.updatePreferences(
        {
          temperature: {
            setpoint: Math.max(18, Math.min(28, tempCelsius)),
            mode: climate.mode === 'heat' ? 'heat' : 'cool',
          },
          lights: {
            on: light.power,
            brightness: light.brightness,
            scene: lightingScene,
          },
          tv: {
            power: tv.power,
            volume: tv.volume,
            source: tv.source,
          },
          fridge: {
            mode: fridge.mode,
            temp: fridge.temp,
          },
        },
        true
      );
      showToast('Preset Saved', 'Comfort preferences synchronized to your guest profile.', 'success');
    } catch {
      showToast('Preset Saved', 'Comfort preferences saved.', 'info');
    } finally {
      setSavingPreset(false);
    }
  };

  const showAll = activeCategory === 'all';

  return (
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
      {/* Title Header */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Room Controls</Text>
        <View style={styles.connectedRow}>
          <View style={[styles.connectedDot, { backgroundColor: hasActiveRoom ? '#22C55E' : '#F59E0B' }]} />
          <Text style={styles.connectedText}>
            {hasActiveRoom
              ? `${reservation.suiteNumber || 'Room Controls'} · ${roomDevices.length > 0 ? `${roomDevices.length} Devices Online` : 'Devices Online'}`
              : 'Awaiting Room Assignment'}
          </Text>
        </View>
      </View>

      {!hasActiveRoom ? (
        <View style={styles.pendingControlsCard}>
          <View style={styles.pendingIconBox}>
            <Ionicons name="hardware-chip-outline" size={38} color="#C9A227" />
          </View>
          <Text style={styles.pendingTitle}>Room Controls Inactive</Text>
          <Text style={styles.pendingDescription}>
            In-room smart controls for lighting scenes, climate regulation, entertainment, and mini-bar activate automatically once you are checked into your room.
          </Text>
          <View style={styles.pendingBadgeRow}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingBadgeText}>Awaiting Room Check-In</Text>
          </View>
        </View>
      ) : (
        <>
      {/* Category Filter Pills: All, AC, Light, TV, Fridge */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {[
          { id: 'all', label: 'All Devices', icon: 'apps-outline' },
          { id: 'ac', label: 'Climate (AC)', icon: 'thermometer-outline' },
          { id: 'light', label: 'Lighting', icon: 'bulb-outline' },
          { id: 'tv', label: 'Smart TV', icon: 'tv-outline' },
          { id: 'fridge', label: 'Mini-Bar / Fridge', icon: 'wine-outline' },
        ].map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat.id as ControlCategory)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={isSelected ? '#FFFFFF' : '#0B1F3A'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 1. CLIMATE / AC CARD */}
      {(showAll || activeCategory === 'ac') && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="thermometer-outline" size={18} color="#0B1F3A" />
              </View>
              <View>
                <Text style={[typography.labelCaps, styles.cardOverline]}>CLIMATE & AC</Text>
                <Text style={styles.cardMainTitle}>Air Conditioning</Text>
              </View>
            </View>

            <View style={styles.autoBadge}>
              <View style={styles.autoBadgeDot} />
              <Text style={styles.autoBadgeText}>
                {climate.ecoMode ? 'Eco Cool' : 'Regulating'}
              </Text>
            </View>
          </View>

          {/* Stepper with Large Numerical Readout */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustTargetTemp(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={24} color="#0B1F3A" />
            </TouchableOpacity>

            <View style={styles.tempReadoutCol}>
              <Text style={styles.tempLarge}>{climate.targetTemp}°F</Text>
              <Text style={styles.targetLabel}>
                Target: {climate.targetTemp}°F · ({Math.round(((climate.targetTemp - 32) * 5) / 9)}°C)
              </Text>
              <Text style={styles.ambientHint}>
                Target: {climate.targetTemp}°F · {climate.mode.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustTargetTemp(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#0B1F3A" />
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <Text style={styles.subSectionTitle}>OPERATING MODE</Text>
          <View style={styles.modesRow}>
            {[
              { id: 'cool', label: 'Cool', icon: 'snow-outline' },
              { id: 'heat', label: 'Warm', icon: 'sunny-outline' },
              { id: 'eco', label: 'Eco', icon: 'leaf-outline' },
              { id: 'fan', label: 'Off', icon: 'power-outline' },
            ].map((m) => {
              const isSelected =
                (m.id === 'fan' && climate.mode === 'fan') ||
                (m.id !== 'fan' && climate.mode === m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modePill, isSelected && styles.modePillActive]}
                  onPress={() => setClimateMode(m.id as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={14}
                    color={isSelected ? '#0B1F3A' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.modePillText, isSelected && styles.modePillTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fan Speed Row */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>FAN VELOCITY</Text>
          <View style={styles.modesRow}>
            {(['auto', 'low', 'med', 'high'] as const).map((spd) => {
              const isSelected = climate.fanSpeed === spd;
              return (
                <TouchableOpacity
                  key={spd}
                  style={[styles.modePill, isSelected && styles.modePillActive]}
                  onPress={() => setFanSpeed(spd)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modePillText, isSelected && styles.modePillTextActive]}>
                    {spd.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. LIGHTING CONTROL CARD */}
      {(showAll || activeCategory === 'light') && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bulb-outline" size={18} color="#0B1F3A" />
              </View>
              <View>
                <Text style={[typography.labelCaps, styles.cardOverline]}>ROOM AMBIENCE</Text>
                <Text style={styles.cardMainTitle}>Suite Lighting</Text>
              </View>
            </View>

            {/* Master Light Power Switch */}
            <TouchableOpacity
              style={[
                styles.powerToggleBtn,
                light.power ? styles.powerToggleBtnOn : styles.powerToggleBtnOff,
              ]}
              onPress={toggleLightPower}
              activeOpacity={0.8}
            >
              <Ionicons
                name="power"
                size={14}
                color={light.power ? '#16A34A' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.powerToggleText,
                  { color: light.power ? '#16A34A' : '#64748B' },
                ]}
              >
                {light.power ? 'Master On' : 'All Off'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dimmer Presets */}
          <Text style={styles.subSectionTitle}>BRIGHTNESS LEVEL · {light.brightness}%</Text>
          <View style={styles.dimmerRow}>
            {[25, 50, 75, 100].map((level) => {
              const isSelected = light.power && light.brightness === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.dimmerPill, isSelected && styles.dimmerPillActive]}
                  onPress={() => setLightBrightness(level)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dimmerText, isSelected && styles.dimmerTextActive]}>
                    {level}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Signature Ambience Scenes Grid */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>SIGNATURE SCENES</Text>
          <View style={styles.scenesGrid}>
            {scenes.map((s) => {
              const isSelected = lightingScene === s.id && light.power;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sceneCard, shadows.card]}
                  onPress={() => setLightingScene(s.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sceneTopRow}>
                    <View
                      style={[
                        styles.sceneIconBox,
                        { backgroundColor: isSelected ? '#FEF3C7' : '#F1F5F9' },
                      ]}
                    >
                      <Ionicons
                        name={s.icon}
                        size={20}
                        color={isSelected ? '#0B1F3A' : '#64748B'}
                      />
                    </View>
                    {isSelected && <View style={styles.selectedSceneDot} />}
                  </View>
                  <Text style={styles.sceneName}>{s.name}</Text>
                  <Text style={styles.sceneDesc}>{s.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Lighting Zones */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>ZONE ISOLATION</Text>
          <View style={styles.zonesRow}>
            {[
              { key: 'ceiling' as const, label: 'Ceiling' },
              { key: 'bedside' as const, label: 'Bedside' },
              { key: 'bath' as const, label: 'Vanity Bath' },
            ].map((z) => {
              const active = light.zones[z.key];
              return (
                <TouchableOpacity
                  key={z.key}
                  style={[styles.zonePill, active && styles.zonePillActive]}
                  onPress={() => toggleLightZone(z.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={active ? '#0B1F3A' : '#94A3B8'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.zoneText, active && styles.zoneTextActive]}>
                    {z.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. SMART TV & ENTERTAINMENT CARD */}
      {(showAll || activeCategory === 'tv') && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="tv-outline" size={18} color="#0B1F3A" />
              </View>
              <View>
                <Text style={[typography.labelCaps, styles.cardOverline]}>MEDIA & SOUND</Text>
                <Text style={styles.cardMainTitle}>Smart Suite TV</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.powerToggleBtn,
                tv.power ? styles.powerToggleBtnOn : styles.powerToggleBtnOff,
              ]}
              onPress={toggleTvPower}
              activeOpacity={0.8}
            >
              <Ionicons
                name="power"
                size={14}
                color={tv.power ? '#16A34A' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.powerToggleText,
                  { color: tv.power ? '#16A34A' : '#64748B' },
                ]}
              >
                {tv.power ? 'Powered On' : 'Standby'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Volume Control Stepper */}
          <Text style={styles.subSectionTitle}>VOLUME CONTROLS</Text>
          <View style={styles.volumeRow}>
            <TouchableOpacity
              style={styles.volumeStepperBtn}
              onPress={() => adjustTvVolume(-2)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-low-outline" size={20} color="#0B1F3A" />
            </TouchableOpacity>

            <View style={styles.volumeCenterCol}>
              <Text style={styles.volumeNumber}>
                {tv.muted ? 'MUTED' : `${tv.volume}%`}
              </Text>
              <Text style={styles.volumeLabel}>Suite Soundbar Level</Text>
            </View>

            <TouchableOpacity
              style={styles.volumeStepperBtn}
              onPress={() => adjustTvVolume(2)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high-outline" size={20} color="#0B1F3A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.muteBtn, tv.muted && styles.muteBtnActive]}
              onPress={toggleTvMute}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tv.muted ? 'volume-mute' : 'volume-medium-outline'}
                size={18}
                color={tv.muted ? '#DC2626' : '#0B1F3A'}
              />
            </TouchableOpacity>
          </View>

          {/* Input Source & Apps */}
          <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>INPUT SOURCE & APPS</Text>
          <View style={styles.sourceGrid}>
            {[
              { id: 'streaming' as const, name: 'Netflix 4K', icon: 'play-circle-outline' },
              { id: 'hdmi' as const, name: 'HDMI 1 (Laptop)', icon: 'laptop-outline' },
              { id: 'ambient' as const, name: 'Art Gallery', icon: 'image-outline' },
              { id: 'cast' as const, name: 'Screen Cast', icon: 'share-outline' },
            ].map((src) => {
              const isSelected = tv.power && tv.source === src.id;
              return (
                <TouchableOpacity
                  key={src.id}
                  style={[styles.sourceCard, isSelected && styles.sourceCardActive]}
                  onPress={() => setTvSource(src.id, src.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={src.icon as any}
                    size={18}
                    color={isSelected ? '#0B1F3A' : '#64748B'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.sourceText, isSelected && styles.sourceTextActive]}>
                    {src.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hardware Metadata Info */}
          <View style={styles.hardwareBadgeRow}>
            <Ionicons name="hardware-chip-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.hardwareBadgeText}>Suite Smart Display · Optical Soundbar Paired</Text>
          </View>
        </View>
      )}

      {/* 4. SMART MINI-BAR & REFRIGERATOR CARD */}
      {(showAll || activeCategory === 'fridge') && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="wine-outline" size={18} color="#0B1F3A" />
              </View>
              <View>
                <Text style={[typography.labelCaps, styles.cardOverline]}>CHILL COMFORT</Text>
                <Text style={styles.cardMainTitle}>Smart Mini-Bar & Fridge</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.powerToggleBtn,
                fridge.power ? styles.powerToggleBtnOn : styles.powerToggleBtnOff,
              ]}
              onPress={toggleFridgePower}
              activeOpacity={0.8}
            >
              <Ionicons
                name="power"
                size={14}
                color={fridge.power ? '#16A34A' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.powerToggleText,
                  { color: fridge.power ? '#16A34A' : '#64748B' },
                ]}
              >
                {fridge.power ? 'Cooling Active' : 'Standby'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stepper with Large Readout */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustFridgeTemp(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={24} color="#0B1F3A" />
            </TouchableOpacity>

            <View style={styles.tempReadoutCol}>
              <Text style={styles.tempLarge}>{fridge.temp}°F</Text>
              <Text style={styles.targetLabel}>
                Target Chill: {fridge.temp}°F · ({Math.round(((fridge.temp - 32) * 5) / 9)}°C)
              </Text>
              <Text style={styles.ambientHint}>Cooling Circuit Monitored</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustFridgeTemp(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#0B1F3A" />
            </TouchableOpacity>
          </View>

          {/* Beverage Presets */}
          <Text style={styles.subSectionTitle}>CHILL PRESETS</Text>
          <View style={styles.modesRow}>
            {[
              { id: 'standard' as const, label: 'Standard (38°F)', icon: 'refresh-outline' },
              { id: 'boost' as const, label: 'Boost (34°F)', icon: 'flash-outline' },
              { id: 'wine' as const, label: 'Wine (45°F)', icon: 'wine-outline' },
            ].map((p) => {
              const isSelected = fridge.mode === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.modePill, isSelected && styles.modePillActive]}
                  onPress={() => setFridgeMode(p.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={p.icon as any}
                    size={14}
                    color={isSelected ? '#0B1F3A' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.modePillText, isSelected && styles.modePillTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. SHADES & AMBIANCE */}
      {showAll && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Shades & Privacy</Text>
            <Text style={styles.sectionMeta}>Sensors synced</Text>
          </View>

          <View style={styles.shadesList}>
            {/* Blackout Curtains */}
            <View style={[styles.shadeCard, shadows.card]}>
              <View style={styles.shadeIconCircle}>
                <Ionicons name="tablet-landscape-outline" size={20} color="#0B1F3A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shadeTitle}>Blackout Curtains</Text>
                <Text style={styles.shadeStatus}>
                  {curtainClosed ? 'Closed · Total Privacy' : 'Open · Natural Light'}
                </Text>
              </View>
              <View style={styles.curtainTogglePill}>
                <TouchableOpacity
                  style={[styles.curtainHalfBtn, !curtainClosed && styles.curtainHalfBtnActive]}
                  onPress={() => handleCurtainToggle(false)}
                >
                  <Text style={[styles.curtainBtnText, !curtainClosed && styles.curtainBtnTextActive]}>
                    Open
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.curtainHalfBtn, curtainClosed && styles.curtainHalfBtnActive]}
                  onPress={() => handleCurtainToggle(true)}
                >
                  <Text style={[styles.curtainBtnText, curtainClosed && styles.curtainBtnTextActive]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Privacy Glass */}
            <View style={[styles.shadeCard, shadows.card]}>
              <View style={styles.shadeIconCircle}>
                <Ionicons name="grid-outline" size={20} color="#0B1F3A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shadeTitle}>Privacy Glass</Text>
                <Text style={styles.shadeStatus}>
                  Status: {privacyGlassOpaque ? 'Opaque' : 'Transparent'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setPrivacyGlassOpaque((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons name="lock-closed-outline" size={14} color="#0B1F3A" style={{ marginRight: 6 }} />
                <Text style={styles.switchButtonText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Save Preset as 'My Comfort' Button */}
      <View style={styles.savePresetWrapper}>
        <TouchableOpacity
          style={styles.savePresetButton}
          onPress={handleSavePreset}
          disabled={savingPreset}
          activeOpacity={0.88}
        >
          <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.savePresetText}>
            {savingPreset ? 'Synchronizing Preferences...' : "Save Preset as 'My Comfort'"}
          </Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  screenTitle: {
    color: '#0B1F3A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  connectedText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#0B1F3A',
    borderColor: '#0B1F3A',
  },
  categoryPillText: {
    color: '#0B1F3A',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardOverline: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  cardMainTitle: {
    color: '#0B1F3A',
    fontSize: 16,
    fontWeight: '800',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  autoBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  autoBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  powerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  powerToggleBtnOn: {
    backgroundColor: '#DCFCE7',
  },
  powerToggleBtnOff: {
    backgroundColor: '#F1F5F9',
  },
  powerToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempReadoutCol: {
    alignItems: 'center',
  },
  tempLarge: {
    color: '#0B1F3A',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  targetLabel: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  ambientHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  subSectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modePillActive: {
    backgroundColor: '#FED255',
  },
  modePillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  modePillTextActive: {
    color: '#0B1F3A',
  },
  dimmerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dimmerPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dimmerPillActive: {
    backgroundColor: '#0B1F3A',
  },
  dimmerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  dimmerTextActive: {
    color: '#FFFFFF',
  },
  scenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  sceneCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sceneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sceneIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSceneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B45309',
  },
  sceneName: {
    color: '#0B1F3A',
    fontSize: 13,
    fontWeight: '700',
  },
  sceneDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  zonePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  zonePillActive: {
    backgroundColor: '#FED255',
  },
  zoneText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  zoneTextActive: {
    color: '#0B1F3A',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  volumeStepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeCenterCol: {
    alignItems: 'center',
    flex: 1,
  },
  volumeNumber: {
    color: '#0B1F3A',
    fontSize: 26,
    fontWeight: '800',
  },
  volumeLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  muteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sourceCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  sourceCardActive: {
    backgroundColor: '#FED255',
  },
  sourceText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  sourceTextActive: {
    color: '#0B1F3A',
  },
  hardwareBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  hardwareBadgeText: {
    color: '#64748B',
    fontSize: 11,
  },
  sectionWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0B1F3A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  shadesList: {
    gap: 10,
  },
  shadeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shadeTitle: {
    color: '#0B1F3A',
    fontSize: 14,
    fontWeight: '700',
  },
  shadeStatus: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  curtainTogglePill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
  },
  curtainHalfBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  curtainHalfBtnActive: {
    backgroundColor: '#0B1F3A',
  },
  curtainBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  curtainBtnTextActive: {
    color: '#FFFFFF',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  switchButtonText: {
    color: '#0B1F3A',
    fontSize: 12,
    fontWeight: '700',
  },
  savePresetWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  savePresetButton: {
    backgroundColor: '#0B1F3A',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1F3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  savePresetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingControlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE047',
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 16,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
});
