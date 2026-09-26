// src/components/DateInput.js

import React, { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
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

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const pad = (value) => String(value).padStart(2, '0')

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
}

const parseDate = (value) => {
  if (!value) return null

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  const date = new Date(year, month, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const isSameDate = (a, b) => {
  if (!a || !b) return false

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const previousMonthDays = new Date(year, month, 0).getDate()

  const days = []

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: previousMonthDays - i,
      monthOffset: -1,
    })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      monthOffset: 0,
    })
  }

  // Next month's leading days
  while (days.length < 42) {
    days.push({
      day: days.length - firstDay - daysInMonth + 1,
      monthOffset: 1,
    })
  }

  return days
}

const DateInput = ({
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  label,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false)

  const initialDate = parseDate(value) || new Date()

  const [selectedDate, setSelectedDate] = useState(initialDate)

  const [calendarDate, setCalendarDate] = useState(initialDate)

  const [draftValue, setDraftValue] = useState(value)

  useEffect(() => {
    setDraftValue(value)

    const parsed = parseDate(value)

    if (parsed) {
      setSelectedDate(parsed)
      setCalendarDate(parsed)
    }
  }, [value])

  const monthDays = useMemo(() => {
    return getMonthDays(
      calendarDate.getFullYear(),
      calendarDate.getMonth()
    )
  }, [calendarDate])

  const monthName = calendarDate.toLocaleString('default', {
    month: 'long',
  })

  const year = calendarDate.getFullYear()

  const openModal = () => {
    const parsed = parseDate(value)

    const date = parsed || new Date()

    setSelectedDate(date)
    setCalendarDate(date)
    setDraftValue(value || '')

    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setDraftValue(value || '')
  }

  const selectDate = (date) => {
    setSelectedDate(date)
    setCalendarDate(date)

    const formatted = formatDate(date)

    setDraftValue(formatted)
  }

  const goToPreviousMonth = () => {
    setCalendarDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() - 1, 1)
    })
  }

  const goToNextMonth = () => {
    setCalendarDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1)
    })
  }

  const handleManualChange = (text) => {
    setDraftValue(text)

    const parsed = parseDate(text)

    if (parsed) {
      setSelectedDate(parsed)
      setCalendarDate(parsed)
    }
  }

  const applyDate = () => {
    const parsed = parseDate(draftValue.trim())

    if (!parsed) {
      return
    }

    const formatted = formatDate(parsed)

    setSelectedDate(parsed)
    setDraftValue(formatted)

    onChange?.(formatted)

    setModalVisible(false)
  }

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openModal}
        style={[styles.inputContainer, containerStyle]}
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

        <Ionicons
          name="chevron-down"
          size={15}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.bottomSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>
                  {label || 'Select Date'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Choose a date from the calendar
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View style={styles.calendar}>
              {/* Month navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity
                  style={styles.monthArrow}
                  onPress={goToPreviousMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-back"
                    size={19}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                <View style={styles.monthTitleContainer}>
                  <Text style={styles.monthTitle}>
                    {monthName}
                  </Text>

                  <Text style={styles.yearText}>
                    {year}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.monthArrow}
                  onPress={goToNextMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Weekdays */}
              <View style={styles.weekRow}>
                {WEEKDAYS.map((day) => (
                  <View
                    key={day}
                    style={styles.weekdayCell}
                  >
                    <Text style={styles.weekdayText}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Dates */}
              <View style={styles.daysGrid}>
                {monthDays.map((item, index) => {
                  const date = new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() + item.monthOffset,
                    item.day
                  )

                  const selected = isSameDate(
                    date,
                    selectedDate
                  )

                  const today = isSameDate(
                    date,
                    new Date()
                  )

                  const outsideMonth =
                    item.monthOffset !== 0

                  return (
                    <TouchableOpacity
                      key={`${item.day}-${index}`}
                      activeOpacity={0.7}
                      onPress={() => selectDate(date)}
                      style={[
                        styles.dayCell,
                        selected && styles.selectedDayCell,
                        today &&
                          !selected &&
                          styles.todayCell,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          outsideMonth &&
                            styles.outsideMonthText,
                          today &&
                            !selected &&
                            styles.todayText,
                          selected &&
                            styles.selectedDayText,
                        ]}
                      >
                        {item.day}
                      </Text>

                      {today && !selected && (
                        <View style={styles.todayDot} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Selected date preview */}
            <View style={styles.selectedPreview}>
              <View style={styles.previewIcon}>
                <Ionicons
                  name="calendar"
                  size={19}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.previewTextContainer}>
                <Text style={styles.previewLabel}>
                  SELECTED DATE
                </Text>

                <Text style={styles.previewValue}>
                  {draftValue || 'No date selected'}
                </Text>
              </View>
            </View>

            {/* Manual input */}
            <View style={styles.dateInputContainer}>
              <Ionicons
                name="keypad-outline"
                size={19}
                color={theme.colors.primary}
              />

              <TextInput
                value={draftValue}
                onChangeText={handleManualChange}
                placeholder={placeholder}
                placeholderTextColor={
                  theme.colors.textSecondary
                }
                style={styles.dateInput}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />

              {draftValue.length > 0 && (
                <TouchableOpacity
                  onPress={() => setDraftValue('')}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.dateHint}>
              Format: YYYY-MM-DD
            </Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyDate}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={theme.colors.background}
                />

                <Text style={styles.applyText}>
                  Apply Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 7,
  },

  valueText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },

  placeholderText: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  // --------------------------------
  // Modal
  // --------------------------------

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
    paddingBottom: 30,
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
    marginBottom: 18,
  },

  headerTextContainer: {
    flex: 1,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // --------------------------------
  // Calendar
  // --------------------------------

  calendar: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthTitleContainer: {
    alignItems: 'center',
  },

  monthTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  yearText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  weekdayCell: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekdayText: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },

  dayText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  outsideMonthText: {
    color: theme.colors.textDisabled,
  },

  selectedDayCell: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },

  selectedDayText: {
    color: theme.colors.background,
    fontWeight: '900',
  },

  todayCell: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },

  todayText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },

  todayDot: {
    position: 'absolute',
    bottom: 5,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },

  // --------------------------------
  // Selected preview
  // --------------------------------

  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 11,
    marginTop: 12,
  },

  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  previewTextContainer: {
    flex: 1,
  },

  previewLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  previewValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  // --------------------------------
  // Manual input
  // --------------------------------

  dateInputContainer: {
    height: 48,
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
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },

  dateHint: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },

  // --------------------------------
  // Buttons
  // --------------------------------

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 17,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  applyText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
})

export default DateInput
