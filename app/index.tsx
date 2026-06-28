import { sendOtp } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function SendOtpScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMobile = (value) => /^[6-9]\d{9}$/.test(value);
  const isValid = validateMobile(mobile);

  const handleSendOtp = async () => {
    setError('');
    if (!isValid) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(mobile);
      router.push({ pathname: '/verify-otp', params: { mobile } });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Login to Your Account</Text>

        <View style={styles.inputRow}>
          <View style={styles.countryCodeBox}>
            <Text style={styles.countryCodeText}>+91</Text>
            <Text style={styles.chevron}>⌄</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="9999999999"
            placeholderTextColor="#6B6B70"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(text) => {
              setMobile(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
              Send OTP
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don't have account? <Text style={styles.footerLink}>Create Account</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141414' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 50,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 10,
    gap: 4,
  },
  countryCodeText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  chevron: { color: '#8E8E93', fontSize: 12 },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#fff',
  },
  errorText: { color: '#FF453A', marginTop: 10, fontSize: 13 },
  button: {
    backgroundColor: '#2F80ED',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#3A3A3C' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonTextDisabled: { color: '#8E8E93' },
  footerText: { color: '#fff', fontSize: 13, textAlign: 'center', marginTop: 16 },
  footerLink: { color: '#2F80ED', fontWeight: '600' },
});