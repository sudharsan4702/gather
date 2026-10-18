import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, ArrowLeft, Mail, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SignUp = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { sendSignupOtp, signUpWithOtp } = useAuth();
  const navigate = useNavigate();

  // Handle resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit details and trigger OTP email
  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await sendSignupOtp(email);
      setStep(2);
      setResendCooldown(45);
      setInfoMessage(`Verification code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Unable to send code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithOtp(name, email, password, otp.trim());
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await sendSignupOtp(email);
      setResendCooldown(45);
      setInfoMessage(`New verification code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Unable to resend code. Please try again.');
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
      padding: '24px 14px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '28px 20px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
      }}>
        {/* Step Indicator Header */}
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
              Step {step} of 2 &bull; {step === 1 ? 'Account details' : 'Email verification'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {step === 1 ? 'Create account' : 'Verify email'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            {step === 1
              ? 'Create an account to start hosting events.'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

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

        {/* STEP 1: Basic Info Form */}
        {step === 1 && (
          <form onSubmit={handleInitiateSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label>EMAIL</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label>PASSWORD</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label>CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            >
              {submitting ? 'Sending code...' : 'Continue'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '12px 14px',
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
                <span>VERIFICATION CODE</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Expires in 10 minutes</span>
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
                  fontSize: '1.4rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '12px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Didn't receive a code?</span>
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
              style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            >
              {submitting ? 'Verifying...' : 'Create account'} <ShieldCheck size={16} />
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

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
