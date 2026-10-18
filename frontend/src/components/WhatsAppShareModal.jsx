import React, { useState } from 'react';
import { Share2, Copy, Check, X, MessageSquare, Sparkles, ExternalLink } from 'lucide-react';

export const WhatsAppShareModal = ({ gather, isOpen, onClose }) => {
  if (!isOpen || !gather) return null;

  const [activeTemplate, setActiveTemplate] = useState('warm');
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const publicUrl = `${window.location.origin}/g/${gather.slug}`;

  // Date & Time formatting
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

  const formattedDate = formatDate(gather.eventDate);
  const formattedTime = gather.startTime 
    ? `${gather.startTime}${gather.endTime ? ` — ${gather.endTime}` : ''}`
    : 'Time TBA';

  const venueText = gather.venue?.venueName 
    ? `${gather.venue.venueName}${gather.venue.address ? `, ${gather.venue.address}` : ''}`
    : 'Venue details on page';

  // Template builders with WhatsApp Markdown (*bold*, line breaks, emojis)
  const templates = {
    warm: [
      `✨ *You're invited!*`,
      ``,
      `*${gather.title || 'Our Gathering'}*`,
      ``,
      `📅 *When:* ${formattedDate}`,
      `⏰ *Time:* ${formattedTime}`,
      `📍 *Where:* ${venueText}`,
      customNote ? `💬 *Note:* ${customNote}` : null,
      ``,
      `View invitation and RSVP:`,
      `👉 ${publicUrl}`,
      ``,
      `Looking forward to seeing you! 🥂`
    ].filter(line => line !== null).join('\n'),

    elegant: [
      `💐 *Save the Date*`,
      ``,
      `We would love for you to join us for:`,
      `*${gather.title || 'Our Gathering'}*`,
      ``,
      `📅 *Date:* ${formattedDate}`,
      `⏰ *Time:* ${formattedTime}`,
      `📍 *Venue:* ${venueText}`,
      customNote ? `📝 *Note:* ${customNote}` : null,
      ``,
      `View details and RSVP:`,
      `👉 ${publicUrl}`,
      ``,
      `Can't wait to celebrate together! ❤️`
    ].filter(line => line !== null).join('\n'),

    minimal: [
      `*${gather.title || 'Our Gathering'}*`,
      ``,
      `• *Date:* ${formattedDate} (${formattedTime})`,
      `• *Location:* ${venueText}`,
      customNote ? `• *Note:* ${customNote}` : null,
      `• *RSVP & Details:* ${publicUrl}`,
      ``,
      `See you there!`
    ].filter(line => line !== null).join('\n')
  };

  const currentMessage = templates[activeTemplate] || templates.warm;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(currentMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="modal-overlay-responsive">
      <div className="modal-card-responsive" style={{
        backgroundColor: '#ffffff',
        border: 'var(--border-tactile)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-tactile-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: 'var(--border-tactile-thin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--paper-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <MessageSquare size={16} />
            </div>
            <strong style={{ fontSize: '0.98rem', color: 'var(--ink)' }}>
              Share on WhatsApp
            </strong>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ink)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Template Selection Tabs */}
          <div>
            <label style={{ fontSize: '0.74rem', marginBottom: '6px' }}>STYLE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTemplate('warm')}
                className={`btn-tactile ${activeTemplate === 'warm' ? 'btn-tactile-vermilion' : 'btn-tactile-paper'}`}
                style={{ padding: '7px 4px', fontSize: '0.78rem' }}
              >
                Warm
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('elegant')}
                className={`btn-tactile ${activeTemplate === 'elegant' ? 'btn-tactile-matcha' : 'btn-tactile-paper'}`}
                style={{ padding: '7px 4px', fontSize: '0.78rem' }}
              >
                Formal
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('minimal')}
                className={`btn-tactile ${activeTemplate === 'minimal' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
                style={{ padding: '7px 4px', fontSize: '0.78rem' }}
              >
                Direct
              </button>
            </div>
          </div>

          {/* Optional Host Personalization Note */}
          <div>
            <label style={{ fontSize: '0.74rem' }}>PERSONAL NOTE (OPTIONAL)</label>
            <input
              type="text"
              placeholder="e.g. Can't wait to see you!"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              style={{ width: '100%', border: 'var(--border-tactile-thin)', fontSize: '0.84rem', padding: '8px 12px' }}
            />
          </div>

          {/* Realistic WhatsApp Chat Bubble Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.74rem' }}>MESSAGE PREVIEW</label>
              <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>Formatted for WhatsApp</span>
            </div>

            <div style={{
              background: '#e5ddd5',
              backgroundImage: 'radial-gradient(#d1c7bc 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              border: 'var(--border-tactile-thin)',
              borderRadius: '12px',
              padding: '14px',
              position: 'relative'
            }}>
              {/* Green WhatsApp Message Bubble */}
              <div style={{
                background: '#e7ffdb',
                border: '1px solid #c2e9b8',
                borderRadius: '10px 10px 2px 10px',
                padding: '12px 14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                fontSize: '0.84rem',
                lineHeight: '1.5',
                color: '#111b21',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {currentMessage}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--paper-subtle)',
          borderTop: 'var(--border-tactile-thin)',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={handleOpenWhatsApp}
            className="btn-tactile"
            style={{
              flex: 1.2,
              padding: '12px 16px',
              backgroundColor: '#25D366',
              color: '#ffffff',
              fontSize: '0.92rem'
            }}
          >
            <Share2 size={16} /> Share to WhatsApp
          </button>
          
          <button
            onClick={handleCopy}
            className="btn-tactile btn-tactile-paper"
            style={{ flex: 1, padding: '12px 14px', fontSize: '0.88rem' }}
          >
            {copied ? (
              <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={16} /> Copied
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Copy size={15} /> Copy text
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
