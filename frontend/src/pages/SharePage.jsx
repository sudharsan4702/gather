import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import { Check, Copy, Download, Share2, ExternalLink, QrCode, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';

export const SharePage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [gather, setGather] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);
  
  // WhatsApp template & customization state
  const [activeTemplate, setActiveTemplate] = useState('warm');
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    fetchGather();
  }, [id, token]);

  const fetchGather = async () => {
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGather(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const publicFullUrl = gather ? `${window.location.origin}/g/${gather.slug}` : '';
  const qrCodeUrl = gather ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicFullUrl)}` : '';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = gather ? formatDate(gather.eventDate) : 'Date TBA';
  const formattedTime = gather?.startTime 
    ? `${gather.startTime}${gather.endTime ? ` — ${gather.endTime}` : ''}`
    : 'Time TBA';

  const venueText = gather?.venue?.venueName 
    ? `${gather.venue.venueName}${gather.venue.address ? `, ${gather.venue.address}` : ''}`
    : 'Venue details on page';

  // Formatted templates for WhatsApp
  const templates = {
    warm: [
      `✨ *You're invited!*`,
      ``,
      `*${gather?.title || 'Our Gathering'}*`,
      ``,
      `📅 *When:* ${formattedDate}`,
      `⏰ *Time:* ${formattedTime}`,
      `📍 *Where:* ${venueText}`,
      customNote ? `💬 *Note:* ${customNote}` : null,
      ``,
      `View invitation and RSVP:`,
      `👉 ${publicFullUrl}`,
      ``,
      `Looking forward to seeing you! 🥂`
    ].filter(line => line !== null).join('\n'),

    elegant: [
      `💐 *Save the Date*`,
      ``,
      `We would love for you to join us for:`,
      `*${gather?.title || 'Our Gathering'}*`,
      ``,
      `📅 *Date:* ${formattedDate}`,
      `⏰ *Time:* ${formattedTime}`,
      `📍 *Venue:* ${venueText}`,
      customNote ? `📝 *Note:* ${customNote}` : null,
      ``,
      `View invitation and RSVP:`,
      `👉 ${publicFullUrl}`,
      ``,
      `Can't wait to celebrate together! ❤️`
    ].filter(line => line !== null).join('\n'),

    minimal: [
      `*${gather?.title || 'Our Gathering'}*`,
      ``,
      `• *Date:* ${formattedDate} (${formattedTime})`,
      `• *Location:* ${venueText}`,
      customNote ? `• *Note:* ${customNote}` : null,
      `• *RSVP & Details:* ${publicFullUrl}`,
      ``,
      `See you there!`
    ].filter(line => line !== null).join('\n')
  };

  const currentWhatsAppMessage = templates[activeTemplate] || templates.warm;

  const handleCopyLink = () => {
    if (!publicFullUrl) return;
    navigator.clipboard.writeText(publicFullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(currentWhatsAppMessage);
    setCopiedWhatsAppText(true);
    setTimeout(() => setCopiedWhatsAppText(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(currentWhatsAppMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '36px auto', padding: '0 20px 80px' }}>
      
      <div style={{ marginBottom: '18px' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back to dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Status Card */}
        <div className="tactile-card" style={{ padding: '24px 20px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--accent-matcha-soft)',
            color: 'var(--accent-matcha)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            border: '2px solid var(--accent-matcha)'
          }}>
            <Check size={24} strokeWidth={3} />
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', fontWeight: 400, color: 'var(--ink)', marginBottom: '4px' }}>
            Your event is published
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {gather?.title ? `"${gather.title}" is ready for guests.` : 'Your event is ready for guests.'}
          </p>
        </div>

        {/* ============================================================== */}
        {/* 1-TAP FORMATTED WHATSAPP SHARE STUDIO                           */}
        {/* ============================================================== */}
        <div className="tactile-card" style={{ padding: '20px', background: '#ffffff' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <MessageSquare size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>
                Share on WhatsApp
              </h2>
            </div>
            <span className="stamp-tag" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem' }}>
              SHARE
            </span>
          </div>

          {/* Template Selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.74rem', marginBottom: '6px', display: 'block' }}>STYLE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTemplate('warm')}
                className={`btn-tactile ${activeTemplate === 'warm' ? 'btn-tactile-vermilion' : 'btn-tactile-paper'}`}
                style={{ padding: '8px 4px', fontSize: '0.78rem' }}
              >
                ✨ Warm
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('elegant')}
                className={`btn-tactile ${activeTemplate === 'elegant' ? 'btn-tactile-matcha' : 'btn-tactile-paper'}`}
                style={{ padding: '8px 4px', fontSize: '0.78rem' }}
              >
                💐 Formal
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('minimal')}
                className={`btn-tactile ${activeTemplate === 'minimal' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
                style={{ padding: '8px 4px', fontSize: '0.78rem' }}
              >
                ⚡ Direct
              </button>
            </div>
          </div>

          {/* Optional Host Message */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.74rem', marginBottom: '4px', display: 'block' }}>PERSONAL NOTE (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Add an optional note for guests..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              style={{ width: '100%', border: 'var(--border-tactile-thin)', fontSize: '0.84rem' }}
            />
          </div>

          {/* WhatsApp Chat Preview */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.74rem' }}>PREVIEW</label>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>Formatted with event link</span>
            </div>

            <div style={{
              background: '#efeae2',
              backgroundImage: 'radial-gradient(#d5cfc5 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              border: 'var(--border-tactile-thin)',
              borderRadius: '12px',
              padding: '14px',
              position: 'relative'
            }}>
              <div style={{
                background: '#e7ffdb',
                border: '1px solid #c8ecc0',
                borderRadius: '10px 10px 2px 10px',
                padding: '12px 14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '0.84rem',
                lineHeight: '1.5',
                color: '#111b21',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {currentWhatsAppMessage}
              </div>
            </div>
          </div>

          {/* Primary WhatsApp Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSendWhatsApp}
              className="btn-tactile"
              style={{
                flex: 1.2,
                padding: '12px 16px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontSize: '0.94rem'
              }}
            >
              <Share2 size={16} /> Share to WhatsApp
            </button>

            <button
              onClick={handleCopyWhatsAppText}
              className="btn-tactile btn-tactile-paper"
              style={{ flex: 1, padding: '12px 14px', fontSize: '0.88rem' }}
            >
              {copiedWhatsAppText ? (
                <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={16} /> Copied!
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Copy size={15} /> Copy text
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Public URL Box */}
        <div className="tactile-card" style={{ padding: '18px 20px', background: '#ffffff' }}>
          <label style={{ fontSize: '0.74rem', display: 'block', marginBottom: '6px' }}>
            EVENT LINK
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={publicFullUrl}
              style={{
                flex: 1,
                fontSize: '0.86rem',
                background: 'var(--paper-subtle)',
                border: 'var(--border-tactile-thin)'
              }}
            />
            <button onClick={handleCopyLink} className="btn-tactile btn-tactile-dark" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
              {copiedLink ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>

        {/* Printable QR Code Section */}
        {qrCodeUrl && (
          <div className="ticket-stub" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="stamp-tag" style={{ background: 'var(--accent-cobalt)', color: '#ffffff' }}>
                QR CODE
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Print ready
              </span>
            </div>

            <div style={{
              background: '#fff',
              border: 'var(--border-tactile-thin)',
              padding: '12px',
              borderRadius: '10px',
              display: 'inline-block',
              boxShadow: 'var(--shadow-tactile-sm)',
              marginBottom: '12px'
            }}>
              <img
                src={qrCodeUrl}
                alt="Event QR Code"
                style={{ width: '150px', height: '150px', display: 'block' }}
              />
            </div>

            <div className="ticket-perforation-line">
              <div className="ticket-notch-left" />
              <div className="ticket-notch-right" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
              <a
                href={qrCodeUrl}
                download={`gather-qr-${gather?.slug}.png`}
                target="_blank"
                rel="noreferrer"
                className="btn-tactile btn-tactile-paper"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Download size={14} /> Download QR
              </a>
              <Link 
                to={`/g/${gather?.slug}`} 
                target="_blank" 
                className="btn-tactile btn-tactile-sunflower" 
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} /> View event page
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
