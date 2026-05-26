import { loadSession } from '@/services/authService';
import { secureStorage } from '@/utils/secureStorage';

export const OTP_VALIDITY_MINUTES = 3;
export const OTP_VALIDITY_MS = OTP_VALIDITY_MINUTES * 60 * 1000;
export const OTP_EXPIRES_AT_KEY = 'otpExpiresAt';

export function setOtpExpiresAt(expiresAtMs: number = Date.now() + OTP_VALIDITY_MS): void {
  sessionStorage.setItem(OTP_EXPIRES_AT_KEY, String(expiresAtMs));
}

export function getOtpExpiresAt(): number | null {
  const raw = sessionStorage.getItem(OTP_EXPIRES_AT_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearOtpExpiresAt(): void {
  sessionStorage.removeItem(OTP_EXPIRES_AT_KEY);
}

export function getOtpRemainingSeconds(): number {
  const expiresAt = getOtpExpiresAt();
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function formatOtpCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function parseStoredSystemUserId(): string | null {
  const raw = secureStorage.getItem('systemUserId');
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed != null ? String(parsed) : null;
  } catch {
    return raw;
  }
}

/** True when the user has started login but not completed MFA. */
export function isMfaPending(): boolean {
  if (loadSession()) {
    return false;
  }

  const systemUserId = parseStoredSystemUserId();
  return !!systemUserId && getOtpExpiresAt() !== null;
}
