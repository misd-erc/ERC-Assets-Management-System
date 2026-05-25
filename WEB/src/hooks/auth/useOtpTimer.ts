import { useCallback, useEffect, useState } from 'react';
import {
  formatOtpCountdown,
  getOtpExpiresAt,
  getOtpRemainingSeconds,
  OTP_VALIDITY_MS,
  setOtpExpiresAt,
} from '@/utils/otpTimerUtils';

export function useOtpTimer() {
  const [remainingSeconds, setRemainingSeconds] = useState(getOtpRemainingSeconds);

  useEffect(() => {
    const updateRemaining = () => setRemainingSeconds(getOtpRemainingSeconds());
    updateRemaining();

    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const resetTimer = useCallback(() => {
    setOtpExpiresAt(Date.now() + OTP_VALIDITY_MS);
    setRemainingSeconds(getOtpRemainingSeconds());
  }, []);

  return {
    remainingSeconds,
    formattedTime: formatOtpCountdown(remainingSeconds),
    canResend: remainingSeconds === 0,
    hasTimer: getOtpExpiresAt() !== null,
    resetTimer,
  };
}
