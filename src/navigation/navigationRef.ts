import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  PersonalDetails: undefined;
  MyAttendance: undefined;
  MyLeave: undefined;
  ApplyLeave: undefined;
  AccountSettings: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const resetToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};
