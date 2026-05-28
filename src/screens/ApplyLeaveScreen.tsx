import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import Ionicons from '../icons/Ionicons';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Theme } from '../theme/colors';
import { Typography } from '../theme/typography';
import { moderateScale } from '../utils/responsive';
import { applyForLeave, DEFAULT_LEAVE_TYPES } from '../services/leave';
import { ApiError } from '../services/apiClient';

const QUICK_DATE_OPTIONS = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'Next week', offset: 7 },
] as const;

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return 'Select date';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const FormSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.formSection}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const ApplyLeaveScreen = ({ navigation }: any) => {
  const [leaveType, setLeaveType] = useState(DEFAULT_LEAVE_TYPES[0].id);
  const [isLeaveTypePickerOpen, setIsLeaveTypePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQuickOffset, setActiveQuickOffset] = useState<number | null>(0);

  const selectedDays = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return 0;
    }

    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isHalfDay ? 0.5 : days;
  }, [startDate, endDate, isHalfDay]);

  const selectedLeaveType = useMemo(
    () => DEFAULT_LEAVE_TYPES.find(type => type.id === leaveType) ?? DEFAULT_LEAVE_TYPES[0],
    [leaveType],
  );

  const applyQuickDate = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const formatted = toDateInput(date);
    setStartDate(formatted);
    setEndDate(formatted);
    setActiveQuickOffset(offsetDays);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const trimmedReason = reason.trim();

    if (!startDate || !endDate) {
      setErrorMessage('Please select start and end dates.');
      return;
    }

    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      setErrorMessage('End date cannot be before start date.');
      return;
    }

    if (trimmedReason.length < 5) {
      setErrorMessage('Please enter a reason (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      await applyForLeave({
        leaveType: selectedLeaveType?.label ?? leaveType,
        startDate,
        endDate,
        reason: trimmedReason,
        isHalfDay,
      });

      Toast.show({
        type: 'success',
        text1: 'Leave submitted',
        text2: 'Your request has been sent for approval.',
        position: 'top',
        topOffset: 60,
      });

      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to submit leave request right now.';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={styles.bannerContainer}>
        <LinearGradient
          colors={['rgba(255, 77, 28, 0.12)', 'rgba(255, 77, 28, 0.0)']}
          style={styles.bannerGradient}
        />
        <View style={styles.bannerBlurOrb1} />
        <View style={styles.bannerBlurOrb2} />
      </View>

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back-outline" size={moderateScale(22)} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply Leave</Text>
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>{selectedDays || 0}d</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <View style={styles.previewTop}>
              <View style={styles.previewIconWrap}>
                <Ionicons
                  name={(selectedLeaveType?.icon ?? 'calendar-outline') as any}
                  size={moderateScale(22)}
                  color={Colors.white}
                />
              </View>
              <View style={styles.previewCopy}>
                <Text style={styles.previewLabel}>Request summary</Text>
                <Text style={styles.previewTitle}>{selectedLeaveType?.label ?? 'Leave'}</Text>
              </View>
            </View>
            <View style={styles.previewMetaRow}>
              <View style={styles.previewMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.previewMetaText}>
                  {formatDisplayDate(startDate)}
                  {endDate !== startDate ? ` → ${formatDisplayDate(endDate)}` : ''}
                </Text>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.previewMetaText}>
                  {selectedDays || 0} day{selectedDays === 1 ? '' : 's'}
                  {isHalfDay ? ' (half day)' : ''}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <FormSection title="Leave type" subtitle="Choose the category for your request">
            <TouchableOpacity
              style={styles.selectorTrigger}
              activeOpacity={0.85}
              onPress={() => setIsLeaveTypePickerOpen(true)}
            >
              <View style={styles.selectorLeft}>
                <View style={styles.selectorIconWrap}>
                  <Ionicons
                    name={(selectedLeaveType?.icon ?? 'list-outline') as any}
                    size={moderateScale(18)}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.selectorCopy}>
                  <Text style={styles.selectorLabel}>Selected type</Text>
                  <Text style={styles.selectorValue}>{selectedLeaveType?.label ?? 'Select leave type'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down-outline" size={moderateScale(18)} color={Colors.textMuted} />
            </TouchableOpacity>
          </FormSection>

          <FormSection title="Duration" subtitle="Pick dates or use quick shortcuts">
            <View style={styles.quickDateRow}>
              {QUICK_DATE_OPTIONS.map(item => {
                const selected = activeQuickOffset === item.offset;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.quickDateChip, selected && styles.quickDateChipActive]}
                    onPress={() => applyQuickDate(item.offset)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.quickDateText, selected && styles.quickDateTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>From</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <TextInput
                    value={startDate}
                    onChangeText={value => {
                      setStartDate(value);
                      setActiveQuickOffset(null);
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.dateInput}
                    autoCapitalize="none"
                  />
                </View>
                <Text style={styles.dateHint}>{formatDisplayDate(startDate)}</Text>
              </View>

              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>To</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <TextInput
                    value={endDate}
                    onChangeText={value => {
                      setEndDate(value);
                      setActiveQuickOffset(null);
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.dateInput}
                    autoCapitalize="none"
                  />
                </View>
                <Text style={styles.dateHint}>{formatDisplayDate(endDate)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.halfDayCard, isHalfDay && styles.halfDayCardActive]}
              onPress={() => setIsHalfDay(current => !current)}
              activeOpacity={0.85}
            >
              <View style={[styles.checkbox, isHalfDay && styles.checkboxSelected]}>
                {isHalfDay ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
              </View>
              <View style={styles.halfDayCopy}>
                <Text style={styles.halfDayTitle}>Half day leave</Text>
                <Text style={styles.halfDaySubtitle}>Apply for a single half-day session</Text>
              </View>
              <Ionicons
                name={isHalfDay ? 'sunny' : 'sunny-outline'}
                size={moderateScale(18)}
                color={isHalfDay ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </FormSection>

          <FormSection title="Reason" subtitle="Briefly explain why you need leave">
            <View style={styles.reasonBox}>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Write your reason here..."
                placeholderTextColor={Colors.textMuted}
                style={styles.reasonInput}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>
            <Text style={styles.charCount}>{reason.trim().length}/300 characters</Text>
          </FormSection>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label="Submit leave request"
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isLeaveTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLeaveTypePickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsLeaveTypePickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select leave type</Text>
              <TouchableOpacity onPress={() => setIsLeaveTypePickerOpen(false)} style={styles.modalClose}>
                <Ionicons name="close-outline" size={moderateScale(22)} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {DEFAULT_LEAVE_TYPES.map(type => {
                const selected = type.id === leaveType;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                    onPress={() => {
                      setLeaveType(type.id);
                      setIsLeaveTypePickerOpen(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={[styles.dropdownIconWrap, selected && styles.dropdownIconWrapActive]}>
                        <Ionicons
                          name={type.icon as any}
                          size={moderateScale(18)}
                          color={selected ? Colors.primary : Colors.textMuted}
                        />
                      </View>
                      <Text style={[styles.dropdownItemLabel, selected && styles.dropdownItemLabelSelected]}>
                        {type.label}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={moderateScale(20)} color={Colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(180),
    overflow: 'hidden',
  },
  bannerGradient: {
    flex: 1,
  },
  bannerBlurOrb1: {
    position: 'absolute',
    top: -moderateScale(40),
    left: -moderateScale(40),
    width: moderateScale(160),
    height: moderateScale(160),
    borderRadius: moderateScale(80),
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
  },
  bannerBlurOrb2: {
    position: 'absolute',
    top: moderateScale(20),
    right: -moderateScale(50),
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(255, 77, 28, 0.08)',
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
  },
  backButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.floating,
    shadowOpacity: 0.06,
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: moderateScale(18),
    color: Colors.text,
  },
  daysBadge: {
    minWidth: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: 'rgba(255, 77, 28, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 28, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  daysBadgeText: {
    ...Typography.subheading,
    color: Colors.primary,
    fontSize: moderateScale(13),
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: moderateScale(40),
    gap: moderateScale(22),
  },
  previewCard: {
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.md,
    ...Theme.shadow.floating,
    shadowOpacity: 0.14,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  previewIconWrap: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
  },
  previewLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  previewTitle: {
    ...Typography.heading,
    color: Colors.white,
    fontSize: moderateScale(18),
  },
  previewMetaRow: {
    gap: Theme.spacing.xs,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetaText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.92)',
    fontSize: moderateScale(12),
    flex: 1,
  },
  formSection: {
    gap: Theme.spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: moderateScale(4),
    gap: 2,
  },
  sectionHeading: {
    ...Typography.label,
    fontSize: moderateScale(13),
    color: Colors.textMuted,
    letterSpacing: 1.1,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: moderateScale(11),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Theme.shadow.floating,
    shadowOpacity: 0.04,
    gap: Theme.spacing.sm,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Theme.spacing.sm,
    minHeight: moderateScale(64),
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
    paddingRight: 8,
  },
  selectorIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 77, 28, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorCopy: {
    flex: 1,
  },
  selectorLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
    marginBottom: 2,
  },
  selectorValue: {
    ...Typography.subheading,
    fontSize: moderateScale(14),
    color: Colors.text,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  quickDateChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateChipActive: {
    backgroundColor: 'rgba(255, 77, 28, 0.10)',
    borderColor: 'rgba(255, 77, 28, 0.28)',
  },
  quickDateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '600',
  },
  quickDateTextActive: {
    color: Colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Colors.white,
    paddingHorizontal: Theme.spacing.sm,
    minHeight: moderateScale(50),
  },
  dateInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Platform.OS === 'ios' ? moderateScale(12) : moderateScale(8),
  },
  dateHint: {
    ...Typography.caption,
    marginTop: 4,
    textTransform: 'none',
    letterSpacing: 0,
    color: Colors.textSecondary,
  },
  halfDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Colors.white,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  halfDayCardActive: {
    borderColor: 'rgba(255, 77, 28, 0.28)',
    backgroundColor: 'rgba(255, 77, 28, 0.05)',
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  halfDayCopy: {
    flex: 1,
  },
  halfDayTitle: {
    ...Typography.subheading,
    fontSize: moderateScale(14),
  },
  halfDaySubtitle: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    color: Colors.textMuted,
  },
  reasonBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Colors.white,
    minHeight: moderateScale(120),
    padding: Theme.spacing.sm,
  },
  reasonInput: {
    ...Typography.body,
    color: Colors.text,
    minHeight: moderateScale(100),
    lineHeight: moderateScale(20),
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: -4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorSoft,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
    textTransform: 'none',
    letterSpacing: 0,
  },
  submitButton: {
    marginTop: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
    justifyContent: 'flex-end',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xxl,
    maxHeight: '72%',
    overflow: 'hidden',
    ...Theme.shadow.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.subheading,
    fontSize: moderateScale(15),
  },
  modalClose: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(255, 77, 28, 0.05)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  dropdownIconWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(11),
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownIconWrapActive: {
    backgroundColor: 'rgba(255, 77, 28, 0.10)',
  },
  dropdownItemLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  dropdownItemLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default ApplyLeaveScreen;
