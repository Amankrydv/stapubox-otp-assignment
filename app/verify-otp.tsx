import { resendOtp, verifyOtp } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// SMS auto-read via Android SMS Retriever API.
// Guarded with require() + try/catch — see README "Known issues".
let useOtpAutoFill: any = () => ({ otp: null, message: null, clear: () => {} });
try {
  useOtpAutoFill = require('expo-otp-autofill').useOtpAutoFill;
} catch (e) {
  console.warn('SMS auto-read unavailable, falling back to manual entry:', (e as Error)?.message);
}

const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const { otp: autoFilledOtp, clear: clearAutoFill } = useOtpAutoFill();

  useEffect(() => {
    if (autoFilledOtp && autoFilledOtp.length === 4) {
      setOtp(autoFilledOtp.split(''));
      clearAutoFill();
    }
  }, [autoFilledOtp]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const code = otp.join('');
    if (code.length === 4) handleVerify(code);
  }, [otp]);

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (digit.length > 1) {
      const chars = digit.slice(0, 4).split('');
      chars.forEach((c, i) => {
        if (newOtp[i] !== undefined) newOtp[i] = c;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((d) => d === '');
      inputRefs[nextEmpty === -1 ? 3 : nextEmpty].current?.focus();
      return;
    }

    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (code) => {
    setError('');
    setLoading(true);
    try {
      await verifyOtp(mobile, code);
      router.replace({ pathname: '/', params: { verified: '1' } });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setResending(true);
    try {
      await resendOtp(mobile);
      setCooldown(RESEND_COOLDOWN);
      setOtp(['', '', '', '']);
      inputRefs[0].current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Verification</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Enter 4 digit OTP sent to your phone number</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[styles.otpBox, error ? styles.otpBoxError : null]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 4 : 1}
              textAlign="center"
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#2F80ED" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
          style={styles.resendWrapper}
        >
          <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
            {resending ? 'Resending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141414' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: { color: '#fff', fontSize: 20, marginTop: -2 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  instruction: { fontSize: 17, fontWeight: '500', color: '#fff', marginBottom: 24, lineHeight: 24 },
  otpRow: { flexDirection: 'row', gap: 14 },
  otpBox: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  otpBoxError: { borderColor: '#FF453A' },
  errorText: { color: '#FF453A', marginTop: 14, fontSize: 13 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  loadingText: { color: '#2F80ED', fontSize: 13 },
  resendWrapper: { marginTop: 24, alignSelf: 'flex-start' },
  resendText: { color: '#2F80ED', fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: '#6B6B70' },
});