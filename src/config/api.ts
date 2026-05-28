export const API_BASE_URL = 'https://tionix-hrm-backend.onrender.com';
export const API_ENDPOINTS = {
  login: '/api/login',
  attendance: '/attendance/punch-in',
  checkout: '/attendance/checkout',
  history: '/attendance/history',
  profile: (fkEmpId: number) => `/api/profile/emp/${fkEmpId}`,
  status: (fkEmpId: number) => `/api/attendance/status/${fkEmpId}`,
  liveLocation: '/api/attendance/live-location',
  liveLocationConfig: '/api/attendance/live-location/config',
  profileImage: '/api/profile/image',
  config: '/attendance/config',
  geolocations: '/api/hrm/admin/hl-geolocations',
  leaveApply: '/api/leave/apply',
  leaveHistory: '/api/leave/history',
  leaveTypes: '/api/leave/types',
};

