import * as LocalAuthentication from 'expo-local-authentication';

export async function verifyAttendanceBiometric(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error('Biometric authentication is not available or not set up on this device.');
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verify your identity to mark attendance',
    cancelLabel: 'Cancel',
  });

  return result.success;
}
