import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { OrderProvider } from './lib/order';
import { ToastProvider } from './components/Toast';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { Account } from './pages/Account';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Help } from './pages/Help';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </ToastProvider>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
