import { useState, useCallback } from 'react';
import { env } from '@/config/env';

const BLING_AUTH_URL = 'https://www.bling.com.br/Api/v3/oauth/authorize';
const BLING_REDIRECT_URI = `${window.location.origin}/integracoes/bling/callback`;

export function useOAuth() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const authorize = useCallback(() => {
    const clientId = env.BLING_CLIENT_ID || '';
    if (!clientId) {
      console.warn('[Bling OAuth] VITE_BLING_CLIENT_ID não configurado.');
      return;
    }
    setIsAuthorizing(true);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: BLING_REDIRECT_URI,
      state: crypto.randomUUID(),
    });
    window.location.href = `${BLING_AUTH_URL}?${params}`;
  }, []);

  return { authorize, isAuthorizing };
}
