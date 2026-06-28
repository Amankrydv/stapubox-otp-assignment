import { resendOtp, verifyOtp } from '@/services/api';
import { useOtpAutoFill } from 'expo-otp-autofill';
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
  // SMS auto-read via Android SMS Retriever API.
  // Note: as of this build, the `expo-otp-autofill` native module does not
  // register correctly under React Native's New Architecture (see README
  // "Known issues" for details). Wrapped defensively so a native-module
  // failure falls back gracefully to manual entry rather than crashing.
  let autoFilledOtp = null;
  let clearAutoFill = () => {};
  try {
    const otpAutoFill = useOtpAutoFill();
    autoFilledOtp = otpAutoFill.otp;
    clearAutoFill = otpAutoFill.clear;
  } catch (e) {
    console.warn('SMS auto-read unavailable, falling back to manual entry:', e?.message);
  }

  useEffect(() => {
    if (autoFilledOtp && autoFilledOtp.length === 4) {
      const digits = autoFilledOtp.split('');
      setOtp(digits);
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
    if (code.length === 4) {
      handleVerify(code);
    }
  }, [otp]);

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (digit.length > 1) {
      // Handles paste of full code
      const chars = digit.slice(0, 4).split('');
      chars.forEach((c, i) => {
        if (newOtp[i] !== undefined) newOtp[i] = c;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((d) => d === '');
      const focusIndex = nextEmpty === -1 ? 3 : nextEmpty;
      inputRefs[focusIndex].current?.focus();
      return;
    }

    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
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
      // Verification successful — navigate to a success state.
      // No "logged in" screen was specified in the assignment scope,
      // so we replace back to the start with a success flag for now.
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
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to +91 {mobile}
        </Text>

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
            <ActivityIndicator color="#2962ff" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
          style={styles.resendWrapper}
        >
          <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
            {resending
              ? 'Resending...'
              : cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.changeNumberWrapper}>
          <Text style={styles.changeNumberText}>Change number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
  },
  otpBoxError: { borderColor: '#e53935' },
  errorText: { color: '#e53935', marginTop: 14, fontSize: 13 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  loadingText: { color: '#2962ff', fontSize: 13 },
  resendWrapper: { marginTop: 28, alignSelf: 'center' },
  resendText: { color: '#2962ff', fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: '#999' },
  changeNumberWrapper: { marginTop: 16, alignSelf: 'center' },
  changeNumberText: { color: '#666', fontSize: 13, textDecorationLine: 'underline' },
});