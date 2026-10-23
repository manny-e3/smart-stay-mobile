import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStay } from '../context/GuestStayContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface ConciergeChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ConciergeChatModal: React.FC<ConciergeChatModalProps> = ({ visible, onClose }) => {
  const { chatMessages, sendChatMessage, reservation } = useGuestStay();
  const [inputText, setInputText] = useState('');

  const quickPrompts = [
    'Can I request 2:00 PM late check-out?',
    'Please send an ice bucket and sparkling water',
    'Turndown service scheduled for 8:00 PM',
    'Have valet bring my car to the portico',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendChatMessage(prompt);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalSheet, shadows.floating]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.conciergeAvatar}>
              <Ionicons name="person-circle-outline" size={36} color={colors.primaryNavy} />
              <View style={styles.onlineBadge} />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.labelLg, styles.conciergeName]}>
                Chief Concierge Desk
              </Text>
              <Text style={[typography.bodySm, styles.conciergeStatus]}>
                Active 24/7 · Direct link to {reservation.suiteNumber || 'your suite'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryNavy} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
            {chatMessages.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#64748B" />
                </View>
                <Text style={[typography.headlineSm, { color: colors.primaryNavy, fontSize: 16, textAlign: 'center', marginBottom: 6 }]}>
                  Front Desk & Concierge
                </Text>
                <Text style={[typography.bodySm, { color: colors.mutedNeutral, textAlign: 'center', lineHeight: 20 }]}>
                  Direct line to hotel operations. Send requests, dining inquiries, or personalized assistance.
                </Text>
              </View>
            ) : (
              chatMessages.map((msg) => {
                const isGuest = msg.sender === 'guest';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleWrapper,
                      isGuest ? styles.guestMsgWrapper : styles.conciergeMsgWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isGuest ? styles.guestBubble : styles.conciergeBubble,
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodyMd,
                          isGuest ? styles.guestText : styles.conciergeText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={[typography.bodySm, styles.timestamp]}>{msg.timestamp}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Prompts */}
          <View style={styles.quickPromptsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickPrompts.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => handleQuickPrompt(p)}
                >
                  <Text style={[typography.labelMd, styles.quickChipText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your request to Chief Concierge..."
              placeholderTextColor={colors.mutedNeutral}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputText.trim() ? 1 : 0.6 },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
  modalSheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 31, 58, 0.06)',
  },
  conciergeAvatar: {
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.statusGreen,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conciergeName: {
    color: colors.primaryNavy,
  },
  conciergeStatus: {
    color: colors.mutedNeutral,
    fontSize: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    paddingHorizontal: 20,
    maxHeight: 320,
  },
  chatContent: {
    paddingVertical: 16,
    gap: 12,
  },
  messageBubbleWrapper: {
    maxWidth: '82%',
  },
  guestMsgWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  conciergeMsgWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  guestBubble: {
    backgroundColor: colors.primaryNavy,
    borderBottomRightRadius: 4,
  },
  conciergeBubble: {
    backgroundColor: colors.surfaceContainerLow,
    borderBottomLeftRadius: 4,
  },
  guestText: {
    color: '#FFFFFF',
  },
  conciergeText: {
    color: colors.primaryNavy,
  },
  timestamp: {
    color: colors.mutedNeutral,
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },
  quickPromptsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11, 31, 58, 0.05)',
  },
  quickChip: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.borderNeutral,
  },
  quickChipText: {
    color: colors.primaryNavy,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderNeutral,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.primaryNavy,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
