import { ref } from 'vue';
import { apiFetch } from './api';

const authPin = ref(sessionStorage.getItem('openphonebook_pin') || '');

export function useAuth() {
  function setAuthPin(pin) {
    authPin.value = pin;
    sessionStorage.setItem('openphonebook_pin', pin);
  }

  async function verifyPinAPI(pin) {
    try {
      const data = await apiFetch('/auth', {
        method: 'POST',
        headers: { 'X-Auth-PIN': pin }
      });
      return data.role; // 'admin' or 'dev'
    } catch (e) {
      return null;
    }
  }

  return { authPin, setAuthPin, verifyPinAPI };
}
