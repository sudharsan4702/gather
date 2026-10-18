import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DemoGather } from './pages/DemoGather';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { GatherEditor } from './pages/GatherEditor';
import { PaymentPage } from './pages/PaymentPage';
import { SharePage } from './pages/SharePage';
import { RsvpManagement } from './pages/RsvpManagement';
import { PublicGatherPage } from './pages/PublicGatherPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Marketing & Demo Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<DemoGather />} />
              <Route path="/g/:slug" element={<PublicGatherPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Organiser Dashboard & Editor Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/gather/:id/edit" element={<ProtectedRoute><GatherEditor /></ProtectedRoute>} />
              <Route path="/gather/:id/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
              <Route path="/gather/:id/share" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
              <Route path="/gather/:id/manage/rsvps" element={<ProtectedRoute><RsvpManagement /></ProtectedRoute>} />
              <Route path="/gather/:id/preview" element={<PublicGatherPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
