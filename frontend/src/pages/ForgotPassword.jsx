import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, ArrowLeft, Mail, KeyRound, RefreshCw, CheckCircle2, Lock } from 'lucide-react';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { sendForgotPasswordOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email) {
      setError('Enter your email address');
      return;
    }

    setSubmitting(true);
    try {
      await sendForgotPasswordOtp(email);
      setStep(2);
      setResendCooldown(45);
      setInfoMessage(`Reset code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit OTP & new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, otp.trim(), newPassword);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid code or reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await sendForgotPasswordOtp(email);
      setResendCooldown(45);
      setInfoMessage(`New code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '36px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
      }}>
        {/* Step Indicator Header (Steps 1 & 2) */}
        {step < 3 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {step}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Step {step} of 2 &bull; {step === 1 ? 'Email' : 'New password'}
              </span>
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {step === 1 ? 'Reset password' : 'Set new password'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              {step === 1
                ? 'Enter your email to receive a 6-digit reset code.'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            color: '#dc2626',
            fontSize: '0.88rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            color: '#16a34a',
            fontSize: '0.88rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> {infoMessage}
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>EMAIL</label>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            >
              {submitting ? 'Sending code...' : 'Send reset code'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{email}</span>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setInfoMessage(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change
              </button>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>RESET CODE</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Expires in 10m</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  fontSize: '1.3rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '10px'
                }}
              />
            </div>

            <div>
              <label>NEW PASSWORD</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label>CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || submitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94a3b8' : 'var(--text-main)',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={13} className={submitting ? 'spin' : ''} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
            >
              {submitting ? 'Resetting password...' : 'Reset password'} <Lock size={16} />
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setInfoMessage(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              Password reset
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Your password has been updated. You can now sign in with your new credentials.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Sign in <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Back to Login link */}
        {step < 3 && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
