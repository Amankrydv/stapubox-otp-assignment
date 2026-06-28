const BASE_URL = 'https://stapubox.com/trial';
const API_TOKEN = 'trial_41992449_ea51165ab543078a756d5dcf4ccc0662';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.status === 'failed') {
    const message = data?.msg || data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function sendOtp(mobile) {
  const response = await fetch(`${BASE_URL}/sendOtp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Token': API_TOKEN,
    },
    body: JSON.stringify({ mobile }),
  });

  return handleResponse(response);
}

export async function resendOtp(mobile) {
  const response = await fetch(`${BASE_URL}/resendOtp?mobile=${mobile}`, {
    method: 'POST',
    headers: {
      'X-Api-Token': API_TOKEN,
    },
  });

  return handleResponse(response);
}

export async function verifyOtp(mobile, otp) {
  const response = await fetch(`${BASE_URL}/verifyOtp?mobile=${mobile}&otp=${otp}`, {
    method: 'POST',
    headers: {
      'X-Api-Token': API_TOKEN,
    },
  });

  return handleResponse(response);
}