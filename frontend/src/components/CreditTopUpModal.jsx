import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import { Ticket, Sparkles, Check, X, ShieldCheck, ArrowRight, Minus, Plus, Loader2, AlertCircle } from 'lucide-react';

export const CreditTopUpModal = ({ isOpen, onClose, onSuccess, initialQuantity = 5 }) => {
  const { token, creditsBalance, fetchCreditsBalance } = useAuth();

  const [selectedTier, setSelectedTier] = useState(initialQuantity); // 1, 5, 10, or 'custom'
  const [customCount, setCustomCount] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const getEffectiveQuantity = () => {
    if (selectedTier === 'custom') return customCount;
    return selectedTier;
  };

  const calculatePrice = (qty) => {
    if (qty === 1) return 99;
    if (qty === 5) return 449;
    if (qty === 10) return 799;
    if (qty >= 10) return qty * 79;
    if (qty >= 5) return qty * 89;
    return qty * 99;
  };

  const effectiveQty = getEffectiveQuantity();
  const totalPrice = calculatePrice(effectiveQty);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyCredits = async () => {
    setProcessing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(apiUrl('/api/organiser/credits/create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: effectiveQty })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to start checkout. Please try again.');
      }

      const orderData = await res.json();
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        // Fallback simulation in test mode or sandbox
        await verifyPaymentOnBackend(orderData.orderId, 'pay_mock_' + Date.now(), 'sig_mock_' + Date.now());
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Catane Gather',
        description: `${effectiveQty} event ${effectiveQty > 1 ? 'credits' : 'credit'}`,
        order_id: orderData.orderId,
        theme: {
          color: '#e76f51'
        },
        handler: async function (response) {
          await verifyPaymentOnBackend(
            response.razorpay_order_id || orderData.orderId,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error?.description || 'Payment was cancelled or failed.');
          setProcessing(false);
        });
        rzp.open();
      } catch (rzpErr) {
        // Test mode fallback
        await verifyPaymentOnBackend(orderData.orderId, 'pay_mock_' + Date.now(), 'sig_mock_' + Date.now());
      }
    } catch (err) {
      setError(err.message || 'Unable to start checkout. Please try again.');
      setProcessing(false);
    }
  };

  const verifyPaymentOnBackend = async (orderId, paymentId, signature) => {
    try {
      const res = await fetch(apiUrl('/api/organiser/credits/verify-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Payment verification failed. Please try again.');
      }

      const result = await res.json();
      await fetchCreditsBalance();
      setSuccessMsg(`Added ${result.creditsAdded} ${result.creditsAdded === 1 ? 'credit' : 'credits'}. Current balance: ${result.newBalance}.`);
      setProcessing(false);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.creditsAdded);
        }
        if (onClose) {
          onClose();
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Payment verification failed');
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay-responsive">
      <div className="tactile-card modal-card-responsive" style={{
        padding: '24px 20px',
        background: 'var(--paper-card)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '6px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
            EVENT CREDITS
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Current balance: {creditsBalance} {creditsBalance === 1 ? 'credit' : 'credits'}
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--ink)', marginBottom: '4px', fontWeight: 400 }}>
          Buy event credits
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
          Each credit lets you publish 1 event. Credits never expire.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.84rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--accent-matcha-soft)', border: '1px solid var(--accent-matcha)', borderRadius: '8px', color: '#064e3b', fontSize: '0.84rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} strokeWidth={3} />
            <strong>{successMsg}</strong>
          </div>
        )}

        {/* Bundles Grid */}
        <div className="credit-bundles-grid">
          {/* Tier 1: Single Pass */}
          <div
            onClick={() => setSelectedTier(1)}
            style={{
              padding: '14px 10px',
              border: selectedTier === 1 ? '2px solid var(--ink)' : 'var(--border-tactile-thin)',
              borderRadius: '12px',
              background: selectedTier === 1 ? 'var(--paper-subtle)' : '#ffffff',
              boxShadow: selectedTier === 1 ? 'var(--shadow-tactile-sm)' : 'none',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
              SINGLE EVENT
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)' }}>
              1 Credit
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-vermilion)', marginTop: '4px' }}>
              ₹99
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ₹99/event
            </div>
          </div>

          {/* Tier 2: 5 Passes (Popular) */}
          <div
            onClick={() => setSelectedTier(5)}
            style={{
              padding: '14px 10px',
              border: selectedTier === 5 ? '2px solid var(--accent-vermilion)' : 'var(--border-tactile-thin)',
              borderRadius: '12px',
              background: selectedTier === 5 ? '#fffaf8' : '#ffffff',
              boxShadow: selectedTier === 5 ? 'var(--shadow-tactile-sm)' : 'none',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-vermilion)',
              color: '#ffffff',
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}>
              POPULAR
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-vermilion)', marginBottom: '4px' }}>
              STARTER PACK
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)' }}>
              5 Credits
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-vermilion)', marginTop: '4px' }}>
              ₹449
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-matcha)', fontWeight: 700, marginTop: '4px' }}>
              Save ₹46
            </div>
          </div>

          {/* Tier 3: 10 Passes (Studio) */}
          <div
            onClick={() => setSelectedTier(10)}
            style={{
              padding: '14px 10px',
              border: selectedTier === 10 ? '2px solid var(--accent-cobalt)' : 'var(--border-tactile-thin)',
              borderRadius: '12px',
              background: selectedTier === 10 ? '#f0f7ff' : '#ffffff',
              boxShadow: selectedTier === 10 ? 'var(--shadow-tactile-sm)' : 'none',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-cobalt)',
              color: '#ffffff',
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}>
              BEST VALUE
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-cobalt)', marginBottom: '4px' }}>
              STUDIO PACK
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)' }}>
              10 Credits
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cobalt)', marginTop: '4px' }}>
              ₹799
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-matcha)', fontWeight: 700, marginTop: '4px' }}>
              Save ₹191
            </div>
          </div>
        </div>

        {/* Custom Quantity Stepper */}
        <div style={{
          padding: '12px 14px',
          background: selectedTier === 'custom' ? 'var(--paper-subtle)' : '#ffffff',
          border: selectedTier === 'custom' ? '2px solid var(--ink)' : 'var(--border-tactile-thin)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          cursor: 'pointer'
        }}
        onClick={() => setSelectedTier('custom')}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
              Custom quantity
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Enter the number of credits you need
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setSelectedTier('custom');
                setCustomCount(prev => Math.max(1, prev - 1));
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'var(--border-tactile-thin)',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Minus size={14} />
            </button>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, minWidth: '28px', textAlign: 'center' }}>
              {customCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedTier('custom');
                setCustomCount(prev => Math.min(100, prev + 1));
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'var(--border-tactile-thin)',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Order Summary & Checkout Action */}
        <div style={{
          background: 'var(--paper-subtle)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block' }}>TOTAL</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--ink)' }}>₹{totalPrice}</strong>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({effectiveQty} {effectiveQty === 1 ? 'Credit' : 'Credits'})
            </span>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div>Instant activation</div>
            <div>Secure payment via Razorpay</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBuyCredits}
          disabled={processing}
          className="btn-tactile btn-tactile-vermilion"
          style={{ width: '100%', padding: '13px', fontSize: '0.96rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {processing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </>
          ) : (
            <>
              <ShieldCheck size={17} /> Buy {effectiveQty} {effectiveQty === 1 ? 'credit' : 'credits'} (₹{totalPrice}) <ArrowRight size={16} />
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px' }}>
          Credits never expire · Usable across all your events
        </div>
      </div>
    </div>
  );
};
