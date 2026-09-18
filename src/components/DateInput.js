// src/components/DateInput.js

import React, { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../theme/theme'

const DateInput = ({
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  label,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [draftValue, setDraftValue] = useState(value)

  useEffect(() => {
    setDraftValue(value)
  }, [value])

  const openModal = () => {
    setDraftValue(value || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setDraftValue(value || '')
  }

  const applyDate = () => {
    onChange?.(draftValue.trim())
    setModalVisible(false)
  }

  return (
    <>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openModal}
        style={[
          containerStyle,
          styles.inputContainer,
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={17}
          color={theme.colors.primary}
        />

        <Text
          style={[
            styles.valueText,
            !value && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {label || 'Select Date'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter the date for the report
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.primary}
              />

              <TextInput
                value={draftValue}
                onChangeText={setDraftValue}
                placeholder={placeholder}
                placeholderTextColor={
                  theme.colors.textSecondary
                }
                style={styles.dateInput}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                autoFocus
              />
            </View>

            <Text style={styles.dateHint}>
              Format: YYYY-MM-DD
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyDate}
              >
                <Text style={styles.applyText}>
                  Apply Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  inputContainer: {
    width: '100%',
    minHeight: 42,
    minWidth: 0,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    gap: 6,
  },


  valueText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },

  placeholderText: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom:
      Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateInputContainer: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
  },

  dateInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginLeft: 10,
  },

  dateHint: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 7,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
})

export default DateInput
