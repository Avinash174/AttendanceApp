import { API_ENDPOINTS } from '../config/api';
import { apiRequest, ApiError } from './apiClient';
import { getAuthSession } from './auth';

export type LeaveType = {
  id: string;
  label: string;
  icon: string;
};

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveRequest = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  isHalfDay?: boolean;
};

export type ApplyLeavePayload = {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
};

export type LeaveHistoryResponse = {
  success: boolean;
  data?: LeaveRequest[];
  leaves?: LeaveRequest[];
};

export type ApplyLeaveResponse = {
  success: boolean;
  message?: string;
  leave?: LeaveRequest;
};

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'casual', label: 'Casual Leave', icon: 'sunny-outline' },
  { id: 'sick', label: 'Sick Leave', icon: 'medkit-outline' },
  { id: 'earned', label: 'Earned Leave', icon: 'ribbon-outline' },
  { id: 'wfh', label: 'Work From Home', icon: 'home-outline' },
  { id: 'unpaid', label: 'Unpaid Leave', icon: 'wallet-outline' },
];

const normalizeLeaveRequest = (raw: Record<string, unknown>, index: number): LeaveRequest => {
  const startDate = String(raw.startDate ?? raw.fromDate ?? raw.StartDate ?? '');
  const endDate = String(raw.endDate ?? raw.toDate ?? raw.EndDate ?? startDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const computedDays =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? Number(raw.days ?? 1)
      : Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

  const statusRaw = String(raw.status ?? raw.leaveStatus ?? 'Pending');
  const status = (['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(statusRaw)
    ? statusRaw
    : 'Pending') as LeaveStatus;

  return {
    id: String(raw.id ?? raw.pkLeaveId ?? raw.leaveId ?? index),
    leaveType: String(raw.leaveType ?? raw.type ?? raw.LeaveType ?? 'Leave'),
    startDate,
    endDate,
    days: Number(raw.days ?? raw.totalDays ?? computedDays) || computedDays,
    reason: String(raw.reason ?? raw.remarks ?? raw.Remarks ?? ''),
    status,
    appliedOn: String(raw.appliedOn ?? raw.createdAt ?? raw.DateTimeStamp ?? new Date().toISOString()),
    isHalfDay: Boolean(raw.isHalfDay ?? raw.halfDay),
  };
};

export const getLeaveHistory = async (): Promise<LeaveRequest[]> => {
  const session = await getAuthSession();

  if (!session?.token) {
    throw new ApiError('Authentication required. Please log in again.');
  }

  const response = await apiRequest<LeaveHistoryResponse>(API_ENDPOINTS.leaveHistory, {
    method: 'GET',
    token: session.token,
  });

  const rows = response.data ?? response.leaves ?? [];
  return rows.map((row, index) => normalizeLeaveRequest(row as Record<string, unknown>, index));
};

export const applyForLeave = async (payload: ApplyLeavePayload): Promise<LeaveRequest> => {
  const session = await getAuthSession();

  if (!session?.token) {
    throw new ApiError('Authentication required. Please log in again.');
  }

  const response = await apiRequest<ApplyLeaveResponse>(API_ENDPOINTS.leaveApply, {
    method: 'POST',
    token: session.token,
    body: {
      empCode: session.user.UserName,
      fkEmpId: session.user.fkEmpId,
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      fromDate: payload.startDate,
      toDate: payload.endDate,
      reason: payload.reason,
      isHalfDay: payload.isHalfDay ?? false,
    },
  });

  if (!response.success) {
    throw new ApiError(response.message ?? 'Unable to submit leave request.');
  }

  if (response.leave) {
    return normalizeLeaveRequest(response.leave as unknown as Record<string, unknown>, 0);
  }

  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return {
    id: String(Date.now()),
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    days: payload.isHalfDay ? 0.5 : days,
    reason: payload.reason,
    status: 'Pending',
    appliedOn: new Date().toISOString(),
    isHalfDay: payload.isHalfDay,
  };
};
