import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
