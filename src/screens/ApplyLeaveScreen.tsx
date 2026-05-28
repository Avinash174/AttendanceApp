import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import AppCard from '../components/AppCard';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Theme } from '../theme/colors';
import { Typography } from '../theme/typography';
import { moderateScale } from '../utils/responsive';
import {
  applyForLeave,
  DEFAULT_LEAVE_TYPES,
  getLeaveHistory,
  LeaveRequest,
  LeaveStatus,
} from '../services/leave';
import { ApiError } from '../services/apiClient';

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
    year: 'numeric',
  });
};

const statusStyles: Record<
  LeaveStatus,
  { backgroundColor: string; color: string; icon: string }
> = {
  Pending: { backgroundColor: 'rgba(255, 179, 0, 0.12)', color: Colors.warningDark, icon: 'time-outline' },
  Approved: { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: Colors.successDark, icon: 'checkmark-circle-outline' },
  Rejected: { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: Colors.errorDark, icon: 'close-circle-outline' },
  Cancelled: { backgroundColor: 'rgba(148, 163, 184, 0.16)', color: Colors.textSecondary, icon: 'ban-outline' },
};

const ApplyLeaveScreen = ({ navigation }: any) => {
  const [leaveType, setLeaveType] = useState(DEFAULT_LEAVE_TYPES[0].id);
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setIsLoadingHistory(true);
    }

    try {
      const rows = await getLeaveHistory();
      setHistory(rows);
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const summary = useMemo(() => {
    return {
      pending: history.filter(item => item.status === 'Pending').length,
      approved: history.filter(item => item.status === 'Approved').length,
      rejected: history.filter(item => item.status === 'Rejected').length,
    };
  }, [history]);

  const selectedDays = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return 0;
    }

    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isHalfDay ? 0.5 : days;
  }, [startDate, endDate, isHalfDay]);

  const applyQuickDate = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const formatted = toDateInput(date);
    setStartDate(formatted);
    setEndDate(formatted);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const selectedType = DEFAULT_LEAVE_TYPES.find(type => type.id === leaveType);
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
      const created = await applyForLeave({
        leaveType: selectedType?.label ?? leaveType,
        startDate,
        endDate,
        reason: trimmedReason,
        isHalfDay,
      });

      setHistory(current => [created, ...current]);
      setReason('');
      setIsHalfDay(false);
      setStartDate(toDateInput(new Date()));
      setEndDate(toDateInput(new Date()));

      Toast.show({
        type: 'success',
        text1: 'Leave submitted',
        text2: 'Your request has been sent for approval.',
        position: 'top',
        topOffset: 60,
      });

      await fetchHistory(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to submit leave request right now.';

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
          colors={['rgba(255, 77, 28, 0.15)', 'rgba(255, 77, 28, 0.0)']}
          style={styles.bannerGradient}
        />
        <View style={styles.bannerBlurOrb1} />
        <View style={styles.bannerBlurOrb2} />
      </View>

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={moderateScale(22)} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply Leave</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.heroIcon}>
            <Ionicons name="calendar-clear-outline" size={moderateScale(32)} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Request Time Off</Text>
          <Text style={styles.heroSubtitle}>
            Submit a leave request and track approval status from one place.
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} />
          }
        >
          <View style={styles.summaryRow}>
            {[
              { label: 'Pending', value: summary.pending, tone: Colors.warning },
              { label: 'Approved', value: summary.approved, tone: Colors.success },
              { label: 'Rejected', value: summary.rejected, tone: Colors.error },
            ].map(item => (
              <AppCard key={item.label} style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: item.tone }]}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </AppCard>
            ))}
          </View>

          <AppCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Leave type</Text>
            <View style={styles.typeGrid}>
              {DEFAULT_LEAVE_TYPES.map(type => {
                const selected = leaveType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                    onPress={() => setLeaveType(type.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={moderateScale(18)}
                      color={selected ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.quickDateRow}>
              {[
                { label: 'Today', offset: 0 },
                { label: 'Tomorrow', offset: 1 },
                { label: 'Next week', offset: 7 },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.quickDateChip}
                  onPress={() => applyQuickDate(item.offset)}
                >
                  <Text style={styles.quickDateText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>From</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
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
                    onChangeText={setEndDate}
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
              style={styles.halfDayRow}
              onPress={() => setIsHalfDay(current => !current)}
              activeOpacity={0.85}
            >
              <View style={[styles.checkbox, isHalfDay && styles.checkboxSelected]}>
                {isHalfDay ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : null}
              </View>
              <View style={styles.halfDayCopy}>
                <Text style={styles.halfDayTitle}>Half day leave</Text>
                <Text style={styles.halfDaySubtitle}>Apply for a single half-day session</Text>
              </View>
              <Text style={styles.daysBadge}>{selectedDays || 0} day(s)</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Reason</Text>
            <View style={styles.reasonBox}>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Briefly explain why you need leave..."
                placeholderTextColor={Colors.textMuted}
                style={styles.reasonInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

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
          </AppCard>

          <AppCard style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent requests</Text>
              {isLoadingHistory ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </View>

            {history.length === 0 && !isLoadingHistory ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={moderateScale(42)} color={Colors.borderStrong} />
                <Text style={styles.emptyTitle}>No leave requests yet</Text>
                <Text style={styles.emptySubtitle}>Your submitted requests will appear here.</Text>
              </View>
            ) : (
              history.slice(0, 8).map(item => {
                const tone = statusStyles[item.status];
                return (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyTopRow}>
                      <View style={styles.historyTitleBlock}>
                        <Text style={styles.historyTitle}>{item.leaveType}</Text>
                        <Text style={styles.historyDates}>
                          {formatDisplayDate(item.startDate)}
                          {item.endDate !== item.startDate
                            ? ` - ${formatDisplayDate(item.endDate)}`
                            : ''}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: tone.backgroundColor }]}>
                        <Ionicons name={tone.icon as any} size={14} color={tone.color} />
                        <Text style={[styles.statusText, { color: tone.color }]}>{item.status}</Text>
                      </View>
                    </View>
                    {item.reason ? <Text style={styles.historyReason}>{item.reason}</Text> : null}
                    <Text style={styles.historyMeta}>
                      {item.days} day(s) • Applied {formatDisplayDate(item.appliedOn.split('T')[0])}
                    </Text>
                  </View>
                );
              })
            )}
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(280),
    overflow: 'hidden',
  },
  bannerGradient: {
    flex: 1,
  },
  bannerBlurOrb1: {
    position: 'absolute',
    top: -moderateScale(50),
    left: -moderateScale(50),
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
  },
  bannerBlurOrb2: {
    position: 'absolute',
    top: moderateScale(40),
    right: -moderateScale(60),
    width: moderateScale(250),
    height: moderateScale(250),
    borderRadius: moderateScale(125),
    backgroundColor: 'rgba(255, 77, 28, 0.1)',
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  backButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.sm,
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: moderateScale(18),
  },
  headerSpacer: {
    width: moderateScale(42),
  },
  headerContent: {
    alignItems: 'center',
    paddingBottom: Theme.spacing.md,
  },
  heroIcon: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: 'rgba(255, 77, 28, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  heroTitle: {
    ...Typography.title,
    fontSize: moderateScale(24),
    marginBottom: Theme.spacing.xs,
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: moderateScale(120),
    gap: Theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  summaryValue: {
    ...Typography.title,
    fontSize: moderateScale(22),
    marginBottom: 4,
  },
  summaryLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
  },
  formCard: {
    gap: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: moderateScale(10),
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  typeChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 77, 28, 0.08)',
  },
  typeChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: moderateScale(12),
  },
  typeChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  quickDateChip: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: moderateScale(8),
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
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
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Theme.spacing.sm,
    minHeight: moderateScale(48),
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
  },
  halfDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
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
  },
  daysBadge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: 'rgba(255, 77, 28, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.pill,
    overflow: 'hidden',
    textTransform: 'none',
    letterSpacing: 0,
  },
  reasonBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Colors.surfaceMuted,
    minHeight: moderateScale(110),
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  reasonInput: {
    ...Typography.body,
    color: Colors.text,
    minHeight: moderateScale(90),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorSoft,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
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
  },
  historyCard: {
    gap: Theme.spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  emptyTitle: {
    ...Typography.subheading,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  historyItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Theme.spacing.sm,
    gap: 6,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  historyTitleBlock: {
    flex: 1,
  },
  historyTitle: {
    ...Typography.subheading,
    fontSize: moderateScale(15),
  },
  historyDates: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.pill,
  },
  statusText: {
    ...Typography.caption,
    fontSize: moderateScale(10),
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
  },
  historyReason: {
    ...Typography.body,
    fontSize: moderateScale(13),
  },
  historyMeta: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
  },
});

export default ApplyLeaveScreen;
