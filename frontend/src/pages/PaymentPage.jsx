import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import { CreditTopUpModal } from '../components/CreditTopUpModal';
import { Check, ArrowRight, ArrowLeft, Lock, AlertCircle, Ticket, Sparkles } from 'lucide-react';

export const PaymentPage = () => {
  const { id } = useParams();
  const { token, creditsBalance, fetchCreditsBalance } = useAuth();
  const navigate = useNavigate();

  const [gather, setGather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    fetchGatherDetails();
  }, [id, token]);

  const fetchGatherDetails = async () => {
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGather(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishWithCredit = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/publish-with-credit`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to publish event with credit');
      }

      await fetchCreditsBalance();
      navigate(`/gather/${id}/share`);
    } catch (err) {
      setError(err.message || 'Error publishing with credit');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // 1. Create order on backend
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/checkout`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Order creation failed');
      const orderData = await res.json();

      // 2. Check if Razorpay script is present, else load dynamically
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => script.onload = resolve);
      }

      // 3. Launch Razorpay modal or fallback
      const options = {
        key: orderData.keyId || 'rzp_test_samplekeyid123',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Catane Gather',
        description: `Publish Event: ${orderData.gatherTitle}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          await verifyOnBackend(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        theme: { color: '#1c1917' }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error.description || 'Payment failed');
          setProcessing(false);
        });
        rzp.open();
      } catch (e) {
        // Mock Sandbox confirmation fallback
        const proceedMock = window.confirm(
          "Test Mode: Razorpay test keys active. Proceed with simulated successful payment?"
        );
        if (proceedMock) {
          await verifyOnBackend(
            orderData.orderId,
            'pay_mock_' + Date.now(),
            'sig_mock_' + Date.now()
          );
        } else {
          setProcessing(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment initiation failed.');
      setProcessing(false);
    }
  };

  const verifyOnBackend = async (orderId, paymentId, signature) => {
    try {
      const verifyRes = await fetch(apiUrl(`/api/organiser/gathers/${id}/verify-payment`), {
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

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || 'Payment verification failed');
      }

      navigate(`/gather/${id}/share`);
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading checkout...
      </div>
    );
  }

  const hasCredits = (creditsBalance || 0) >= 1;

  return (
    <div style={{ maxWidth: '580px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '18px' }}>
        <Link to={`/gather/${id}/edit`} style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
          <ArrowLeft size={16} /> Back to editor
        </Link>
      </div>

      <div className="card" style={{ padding: '36px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-neutral">
              Publish event
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '999px',
              background: hasCredits ? '#ecfdf5' : '#f4f4f5',
              color: hasCredits ? '#047857' : '#71717a'
            }}>
              <Ticket size={14} /> {creditsBalance || 0} credit{creditsBalance === 1 ? '' : 's'} available
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '8px' }}>
            Publish event
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
            <strong>{gather?.title || 'Untitled event'}</strong>
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            color: '#dc2626',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Feature inclusions */}
        <div style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '10px' }}>
            Includes:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Custom public link (/g/' + (gather?.slug || 'event') + ')',
              'Printable QR code',
              'RSVP collection with guest notes',
              'Host announcements',
              'Shared photo gallery'
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <Check size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment / Publishing Choice */}
        {hasCredits ? (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '1rem', color: '#065f46' }}>Use event credit</strong>
                <p style={{ fontSize: '0.82rem', color: '#047857' }}>
                  {creditsBalance} credit{creditsBalance === 1 ? '' : 's'} available
                </p>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>1 Credit</div>
            </div>

            <button
              onClick={handlePublishWithCredit}
              disabled={processing}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.98rem',
                background: '#059669',
                borderColor: '#059669'
              }}
            >
              {processing ? 'Publishing...' : 'Publish (1 credit)'} <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {/* Option A: Buy Credit Pack (Recommended) */}
            <div style={{
              border: '2px solid #1c1917',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              background: '#fafafa',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                right: '16px',
                background: '#1c1917',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} /> RECOMMENDED
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>Buy credit pack</strong>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Save up to 20% with credit packs. Credits never expire.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>₹79<span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/event</span></div>
                </div>
              </div>

              <button
                onClick={() => setShowTopUpModal(true)}
                disabled={processing}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '0.92rem' }}
              >
                Buy credits & publish <ArrowRight size={15} />
              </button>
            </div>

            {/* Option B: Pay one-off ₹99 */}
            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>Single event pass</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>One-time payment for this event only</p>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>₹99</div>
              </div>

              <button
                onClick={handleRazorpayPayment}
                disabled={processing}
                className="btn-secondary"
                style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
              >
                {processing ? 'Processing...' : 'Pay ₹99'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <Lock size={13} /> Secured with Razorpay (UPI, cards, net banking)
        </div>
      </div>

      {showTopUpModal && (
        <CreditTopUpModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={() => {
            setShowTopUpModal(false);
            handlePublishWithCredit();
          }}
        />
      )}
    </div>
  );
};

