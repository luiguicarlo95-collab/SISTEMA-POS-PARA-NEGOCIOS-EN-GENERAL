
export interface FetchOptions extends RequestInit {
  silent?: boolean;
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (!url.includes('/api/auth/') && token) {
      window.dispatchEvent(new Event('unauthorized'));
    }
  }

  // Handle potential HTML responses for API calls gracefully
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    let details = null;

    if (isJson) {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
      details = data.details;
    } else {
      const text = await response.text();
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        errorMsg = "Error del servidor. Intente más tarde.";
      }
    }

    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).details = details;

    // Emit global error for centralized notification, unless silent is requested
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message: errorMsg, details } }));
    }
    
    throw error;
  }

  return response;
}

export const api = {
  get: async (url: string, options: FetchOptions = {}) => {
    const res = await apiFetch(url, { ...options, method: 'GET' });
    return res.json();
  },
  post: async (url: string, body: any, options: FetchOptions = {}) => {
    const res = await apiFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) });
    return res.json();
  },
  put: async (url: string, body: any, options: FetchOptions = {}) => {
    const res = await apiFetch(url, { ...options, method: 'PUT', body: JSON.stringify(body) });
    return res.json();
  },
  delete: async (url: string, options: FetchOptions = {}) => {
    const res = await apiFetch(url, { ...options, method: 'DELETE' });
    return res.json();
  },
};
