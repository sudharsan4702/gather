import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [token, setToken] = useState(localStorage.getItem('catane_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCreditsBalance = async () => {
    const curToken = token || localStorage.getItem('catane_token');
    if (!curToken) return 0;
    try {
      const response = await fetch(apiUrl('/api/organiser/credits/balance'), {
        headers: { 'Authorization': `Bearer ${curToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCreditsBalance(data.creditsBalance ?? 0);
        return data.creditsBalance ?? 0;
      }
    } catch (err) {
      console.error('Failed to refresh credits balance:', err);
    }
    return creditsBalance;
  };

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCreditsBalance(userData.creditsBalance ?? 0);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // In offline/dev mock mode, keep session intact if desired
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Unable to sign in. Check your email and password.');
    }

    const data = await response.json();
    localStorage.setItem('catane_token', data.token);
    setToken(data.token);
    setUser({ id: data.id, name: data.name, email: data.email });
    setCreditsBalance(data.creditsBalance ?? 0);
    return data;
  };

  const sendSignupOtp = async (email) => {
    const response = await fetch(apiUrl('/api/auth/signup/send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to send code. Please try again.');
    }

    return await response.json();
  };

  const signUpWithOtp = async (name, email, password, otp) => {
    const response = await fetch(apiUrl('/api/auth/signup/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, otp })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid or expired code. Please try again.');
    }

    const data = await response.json();
    localStorage.setItem('catane_token', data.token);
    setToken(data.token);
    setUser({ id: data.id, name: data.name, email: data.email });
    setCreditsBalance(data.creditsBalance ?? 0);
    return data;
  };

  const sendForgotPasswordOtp = async (email) => {
    const response = await fetch(apiUrl('/api/auth/forgot-password/send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to send reset code. Please try again.');
    }

    return await response.json();
  };

  const verifyForgotPasswordOtp = async (email, otp) => {
    const response = await fetch(apiUrl('/api/auth/forgot-password/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid or expired code. Please try again.');
    }

    return await response.json();
  };

  const resetPassword = async (email, otp, newPassword) => {
    const response = await fetch(apiUrl('/api/auth/forgot-password/reset'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to reset password. Please try again.');
    }

    return await response.json();
  };

  const signUp = async (name, email, password) => {
    const response = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to create account. Please try again.');
    }

    const data = await response.json();
    localStorage.setItem('catane_token', data.token);
    setToken(data.token);
    setUser({ id: data.id, name: data.name, email: data.email });
    setCreditsBalance(data.creditsBalance ?? 0);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('catane_token');
    setToken(null);
    setUser(null);
    setCreditsBalance(0);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      creditsBalance,
      setCreditsBalance,
      fetchCreditsBalance,
      login,
      signUp,
      sendSignupOtp,
      signUpWithOtp,
      sendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
