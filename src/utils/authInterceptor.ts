import { toast } from 'react-toastify';
import { ORIGIN } from './api';

const API_ORIGIN = ORIGIN || 'https://orion-back-4.onrender.com/api';

function handleAuthError() {
  localStorage.removeItem('token');
  localStorage.removeItem('avatar');
  localStorage.removeItem('username');
  toast.error('Session expired. Please login again.', { autoClose: 4000 });
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
}

export function setupAuthInterceptor() {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isOurApi = url.includes(API_ORIGIN) || url.includes('/api/');

    const response = await originalFetch.call(window, input, init);

    if (isOurApi && (response.status === 401 || response.status === 403)) {
      handleAuthError();
      throw new Error('Session expired');
    }
    return response;
  };
}
