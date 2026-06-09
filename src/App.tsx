import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { OrderProvider } from './lib/order';
import { SignInProvider } from './lib/ui';
import { TourProvider } from './lib/tour';
import { ToastProvider } from './components/Toast';
import { NavBar } from './components/NavBar';
import { OrderDrawer } from './components/OrderDrawer';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { Account } from './pages/Account';
import { Lists } from './pages/Lists';
import { ListView } from './pages/ListView';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Help } from './pages/Help';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <ToastProvider>
            <SignInProvider>
              <TourProvider>
              <NavBar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/account" element={<Account />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/lists/:id" element={<ListView />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<Home />} />
              </Routes>
              <OrderDrawer />
              <div id="printArea" />
              </TourProvider>
            </SignInProvider>
          </ToastProvider>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
