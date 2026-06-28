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

  const handleSendOtp = async () => {
    setError('');

    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }
    if (!validateMobile(mobile)) {
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
        <Text style={styles.title}>Login with Mobile</Text>
        <Text style={styles.subtitle}>
          We'll send you a one-time password to verify your number
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 54,
  },
  countryCode: { fontSize: 16, color: '#333', marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 16, color: '#111' },
  errorText: { color: '#e53935', marginTop: 10, fontSize: 13 },
  button: {
    backgroundColor: '#2962ff',
    borderRadius: 10,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});