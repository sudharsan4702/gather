import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, resolveImageUrl } from '../config/api';
import { 
  Calendar, MapPin, Clock, Users, ArrowLeft, ExternalLink, 
  Check, Bell, Image as ImageIcon, Download, Share2, AlertCircle, 
  Sparkles, Plus, Minus, ChevronUp, ChevronDown, Ticket, Navigation, Heart,
  Lock, Key, ShieldCheck, ArrowRight
} from 'lucide-react';

export const PublicGatherPage = () => {
  const { id, slug } = useParams();
  const { token } = useAuth();
  const isPreview = Boolean(id);

  const [gather, setGather] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mobile RSVP Drawer & State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  const [rsvpState, setRsvpState] = useState({
    guestName: '',
    attendance: 'ATTENDING',
    guestCount: 1,
    dietary: '',
    message: '',
    submitting: false,
    submitted: false,
    error: ''
  });

  // Photo Security & Lock State (Public or PIN Passcode only)
  const [photoLockState, setPhotoLockState] = useState({ locked: false, policy: 'PUBLIC', message: '' });
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  useEffect(() => {
    fetchGatherData();
  }, [id, slug, token]);

  const fetchGatherData = async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (id) {
        res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      } else {
        res = await fetch(apiUrl(`/api/public/gathers/${slug}`));
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Event not found or unavailable');
      }

      const data = await res.json();
      setGather(data);

      if (data.announcements && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const queryPin = urlParams.get('pin') || urlParams.get('passcode') || '';

      if (data.photoAccessPolicy === 'PASSCODE') {
        setPhotoLockState({
          locked: true,
          policy: 'PASSCODE',
          message: 'This photo album is protected with a passcode.'
        });
      } else {
        setPhotoLockState({
          locked: false,
          policy: 'PUBLIC',
          message: ''
        });
      }

      if (data.id) {
        fetchAddons(data.id, queryPin || undefined);
      }
    } catch (err) {
      setError(err.message || 'Unable to open event page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddons = async (gatherId, passcodeParam) => {
    try {
      const storedPasscode = passcodeParam !== undefined ? passcodeParam : (sessionStorage.getItem(`gather_pin_${gatherId}`) || localStorage.getItem(`gather_pin_${gatherId}`) || '');

      let mediaUrl = apiUrl(`/api/public/gathers/${gatherId}/media`);
      if (storedPasscode) {
        mediaUrl += `?passcode=${encodeURIComponent(storedPasscode)}`;
      }

      const mediaHeaders = {};
      if (isPreview && token) {
        mediaUrl = apiUrl(`/api/organiser/gathers/${gatherId}/media`);
        mediaHeaders['Authorization'] = `Bearer ${token}`;
      }

      const [annRes, mediaRes] = await Promise.all([
        fetch(apiUrl(`/api/public/gathers/${gatherId}/announcements`)).catch(() => null),
        fetch(mediaUrl, { headers: mediaHeaders }).catch(() => null)
      ]);

      if (annRes && annRes.ok) setAnnouncements(await annRes.json());
      
      if (mediaRes) {
        if (mediaRes.status === 403) {
          const errData = await mediaRes.json().catch(() => ({}));
          setPhotoLockState({
            locked: true,
            policy: 'PASSCODE',
            message: errData.message || 'This photo album is protected with a passcode.'
          });
          setMediaList([]);
        } else if (mediaRes.ok) {
          const data = await mediaRes.json();
          setMediaList(data);
          setPhotoLockState({ locked: false, policy: 'PUBLIC', message: '' });
          if (storedPasscode) sessionStorage.setItem(`gather_pin_${gatherId}`, storedPasscode);
        }
      }
    } catch (e) {
      console.warn('Could not load addons:', e);
    }
  };

  const handleUnlockWithPin = async (e) => {
    e.preventDefault();
    if (!pinCodeInput.trim() || !gather?.id) return;
    setPinSubmitting(true);
    setPinError('');
    try {
      const res = await fetch(apiUrl(`/api/public/gathers/${gather.id}/media?passcode=${encodeURIComponent(pinCodeInput.trim())}`));
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
        setPhotoLockState({ locked: false, policy: 'PUBLIC', message: '' });
        sessionStorage.setItem(`gather_pin_${gather.id}`, pinCodeInput.trim());
        setPinCodeInput('');
      } else {
        setPinError('Incorrect passcode. Please check with your host.');
      }
    } catch (err) {
      setPinError('Could not verify passcode.');
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpState.guestName.trim()) return;

    setRsvpState(prev => ({ ...prev, submitting: true, error: '' }));

    if (gather?.status === 'DRAFT') {
      setTimeout(() => {
        setRsvpState(prev => ({ ...prev, submitted: true, submitting: false }));
        setDrawerOpen(false);
      }, 300);
      return;
    }

    try {
      const targetSlug = slug || gather?.slug;
      const combinedMessage = [
        rsvpState.dietary ? `Dietary: ${rsvpState.dietary}` : '',
        rsvpState.message ? `Note: ${rsvpState.message}` : ''
      ].filter(Boolean).join(' | ');

      const res = await fetch(apiUrl(`/api/public/gathers/${targetSlug}/rsvp`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: rsvpState.guestName.trim(),
          attendance: rsvpState.attendance,
          guestCount: rsvpState.attendance === 'ATTENDING' ? rsvpState.guestCount : 0,
          message: combinedMessage
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Unable to submit RSVP.');
      }

      setRsvpState(prev => ({ ...prev, submitted: true }));
      setDrawerOpen(false);
    } catch (err) {
      setRsvpState(prev => ({ ...prev, error: err.message }));
    } finally {
      setRsvpState(prev => ({ ...prev, submitting: false }));
    }
  };

  const getEventDateParts = (dateStr) => {
    if (!dateStr) return { month: 'DATE', day: 'TBA', weekday: 'TBA', full: 'Date to be announced' };
    try {
      const d = new Date(dateStr);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: d.toLocaleDateString('en-US', { day: 'numeric' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      };
    } catch {
      return { month: 'DATE', day: 'TBA', weekday: 'TBA', full: dateStr };
    }
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    if (isNaN(hour)) return timeStr;
    const min = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${ampm}`;
  };

  const formatPublishedAt = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!gather) return '#';
    const title = encodeURIComponent(gather.title || 'Event');
    const desc = encodeURIComponent(gather.description || '');
    const location = encodeURIComponent(gather.venue ? `${gather.venue.venueName || ''}, ${gather.venue.address || ''}` : '');
    const cleanDate = (gather.eventDate || '').replace(/-/g, '');
    const startHour = (gather.startTime || '18:00').replace(':', '') + '00';
    const endHour = (gather.endTime || '22:00').replace(':', '') + '00';
    const dates = `${cleanDate}T${startHour}/${cleanDate}T${endHour}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${desc}&location=${location}`;
  };

  const downloadIcsFile = () => {
    if (!gather) return;
    const cleanDate = (gather.eventDate || '').replace(/-/g, '');
    const startHour = (gather.startTime || '18:00').replace(':', '') + '00';
    const endHour = (gather.endTime || '22:00').replace(':', '') + '00';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Catane Gather//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${gather.title || 'Event'}`,
      `DESCRIPTION:${(gather.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${gather.venue ? `${gather.venue.venueName || ''}, ${gather.venue.address || ''}` : ''}`,
      `DTSTART:${cleanDate}T${startHour}`,
      `DTEND:${cleanDate}T${endHour}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${(gather.title || 'event').toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="public-gather-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="tactile-card" style={{ maxWidth: '420px', width: '100%', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
            Loading event...
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error || !gather) {
    return (
      <div className="public-gather-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="tactile-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 24px', textAlign: 'center' }}>
          <AlertCircle size={44} style={{ color: 'var(--accent-coral)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>Event unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error || 'This event link is private or does not exist.'}
          </p>
          <Link to="/" className="btn-tactile btn-tactile-dark" style={{ width: '100%' }}>
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  const getEventCountdown = (dateStr) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventD = new Date(dateStr);
      eventD.setHours(0, 0, 0, 0);
      const diffDays = Math.round((eventD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'HAPPENING TODAY';
      if (diffDays === 1) return 'HAPPENING TOMORROW';
      if (diffDays > 1 && diffDays <= 7) return `THIS ${eventD.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}`;
      if (diffDays > 7) return `IN ${diffDays} DAYS`;
      return 'PAST EVENT';
    } catch {
      return null;
    }
  };

  const isConcluded = gather.concluded || gather.status === 'COMPLETED' || gather.status === 'ARCHIVED' || (gather.eventDate && (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventD = new Date(gather.eventDate);
      eventD.setHours(0, 0, 0, 0);
      return eventD < today;
    } catch {
      return false;
    }
  })());

  const countdownText = isConcluded ? 'CONCLUDED' : getEventCountdown(gather.eventDate);
  const dateParts = getEventDateParts(gather.eventDate);

  // Reusable Date & Calendar Pass Card
  const renderDateCard = () => (
    <div className="tactile-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Rubber Stamp Block */}
        <div style={{
          width: '64px',
          flexShrink: 0,
          border: 'var(--border-tactile)',
          borderRadius: '10px',
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow: 'var(--shadow-tactile-sm)',
          background: '#ffffff'
        }}>
          <div style={{
            background: 'var(--accent-vermilion)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            padding: '3px 0'
          }}>
            {dateParts.month}
          </div>
          <div style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--ink)',
            lineHeight: 1.1,
            padding: '4px 0 1px'
          }}>
            {dateParts.day}
          </div>
          <div style={{
            fontSize: '0.66rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            paddingBottom: '4px'
          }}>
            {dateParts.weekday}
          </div>
        </div>

        {/* Date details and Quick Calendar Actions */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>
            {dateParts.full}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {gather.startTime || '6:30 PM'} {gather.endTime ? `— ${gather.endTime}` : ''}
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile btn-tactile-paper"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            >
              Google Calendar
            </a>
            <button
              onClick={downloadIcsFile}
              className="btn-tactile btn-tactile-paper"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            >
              Apple Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Reusable Venue Pass Ticket Stub
  const renderVenueCard = () => {
    if (!gather.venue?.venueName) return null;
    return (
      <div className="ticket-stub" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span className="stamp-tag" style={{ background: 'var(--accent-cobalt)', color: '#ffffff' }}>
            VENUE
          </span>
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
          {gather.venue.venueName}
        </h3>
        {gather.venue.address && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {gather.venue.address}
          </p>
        )}

        {/* Perforation Line with Cutout Notches */}
        <div className="ticket-perforation-line">
          <div className="ticket-notch-left" />
          <div className="ticket-notch-right" />
        </div>

        {/* Direction & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {gather.venue.directions && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--ink)' }}>Directions:</strong> {gather.venue.directions}
            </div>
          )}

          {gather.venue.mapUrl && (
            <a
              href={gather.venue.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile btn-tactile-sunflower"
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
            >
              <Navigation size={14} /> Open Google Maps
            </a>
          )}
        </div>
      </div>
    );
  };

  // Reusable RSVP Card (Interactive Form, Confirmed Pass, or Concluded Keepsake)
  const renderRsvpCard = (isCompact = false) => {
    if (isConcluded) {
      return (
        <div id="rsvp-section" className="tactile-card" style={{ padding: '22px 18px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            <span>🕊️ Celebration Concluded</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
            RSVPs are closed
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            This gathering has concluded. Thank you to everyone who joined us in celebrating!
          </p>
          <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Photos and memories are preserved above for all guests to view.
          </div>
        </div>
      );
    }

    if (rsvpState.submitted) {
      return (
        <div id="rsvp-section" className="ticket-stub" style={{ padding: '18px 16px', background: 'var(--accent-matcha-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-matcha)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <strong style={{ fontSize: '0.94rem', color: 'var(--ink)', display: 'block' }}>
                  Admit {rsvpState.guestCount}: {rsvpState.guestName || 'You'}
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-matcha)', fontWeight: 700 }}>
                  RSVP CONFIRMED
                </span>
              </div>
            </div>
            <button
              onClick={() => setRsvpState(prev => ({ ...prev, submitted: false }))}
              className="btn-tactile btn-tactile-paper"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            >
              Edit
            </button>
          </div>
        </div>
      );
    }

    const formContent = (
      <form onSubmit={handleRsvpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '10px' : '12px' }}>
        {rsvpState.error && (
          <div style={{ padding: '6px 10px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '6px', color: '#991b1b', fontSize: '0.78rem' }}>
            {rsvpState.error}
          </div>
        )}

        {/* Attendance Pill Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setRsvpState({ ...rsvpState, attendance: 'ATTENDING' })}
            className={`btn-tactile ${rsvpState.attendance === 'ATTENDING' ? 'btn-tactile-matcha' : 'btn-tactile-paper'}`}
            style={{ padding: isCompact ? '7px 4px' : '8px 4px', fontSize: '0.78rem' }}
          >
            Going
          </button>
          <button
            type="button"
            onClick={() => setRsvpState({ ...rsvpState, attendance: 'MAYBE' })}
            className={`btn-tactile ${rsvpState.attendance === 'MAYBE' ? 'btn-tactile-sunflower' : 'btn-tactile-paper'}`}
            style={{ padding: isCompact ? '7px 4px' : '8px 4px', fontSize: '0.78rem' }}
          >
            Maybe
          </button>
          <button
            type="button"
            onClick={() => setRsvpState({ ...rsvpState, attendance: 'DECLINED' })}
            className={`btn-tactile ${rsvpState.attendance === 'DECLINED' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
            style={{ padding: isCompact ? '7px 4px' : '8px 4px', fontSize: '0.78rem' }}
          >
            Can't go
          </button>
        </div>

        {/* Name and Headcount */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              required
              placeholder="Your name"
              value={rsvpState.guestName}
              onChange={(e) => setRsvpState({ ...rsvpState, guestName: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', fontSize: '0.86rem', border: 'var(--border-tactile-thin)' }}
            />
          </div>

          {rsvpState.attendance === 'ATTENDING' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: 'var(--border-tactile-thin)', borderRadius: '8px', padding: '2px 6px' }}>
              <button
                type="button"
                onClick={() => setRsvpState(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Decrease headcount"
              >
                <Minus size={13} />
              </button>
              <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                {rsvpState.guestCount}
              </span>
              <button
                type="button"
                onClick={() => setRsvpState(prev => ({ ...prev, guestCount: Math.min(8, prev.guestCount + 1) }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Increase headcount"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>

        {!isCompact && rsvpState.attendance === 'ATTENDING' && (
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>DIETARY NOTES (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Vegetarian, nut allergy, etc."
              value={rsvpState.dietary}
              onChange={(e) => setRsvpState({ ...rsvpState, dietary: e.target.value })}
              style={{ width: '100%', border: 'var(--border-tactile-thin)' }}
            />
          </div>
        )}

        {!isCompact && (
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>NOTE TO HOST (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Add an optional message..."
              value={rsvpState.message}
              onChange={(e) => setRsvpState({ ...rsvpState, message: e.target.value })}
              style={{ width: '100%', border: 'var(--border-tactile-thin)' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={rsvpState.submitting}
          className="btn-tactile btn-tactile-vermilion"
          style={{ width: '100%', padding: '11px', fontSize: '0.92rem', marginTop: '2px' }}
        >
          {rsvpState.submitting ? 'Saving...' : 'Submit RSVP'}
        </button>
      </form>
    );

    if (isCompact) {
      return (
        <div style={{ paddingTop: '4px' }}>
          {formContent}
        </div>
      );
    }

    return (
      <div id="rsvp-section" className="tactile-card" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
            RSVP
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {gather.status === 'DRAFT' ? 'PREVIEW' : 'FREE'}
          </span>
        </div>
        {formContent}
      </div>
    );
  };

  return (
    <div className="public-gather-page">
      
      {/* Floating Host Studio Action (Only when host is previewing from studio) */}
      {/* Host Preview Mode Top Banner */}
      {isPreview && (
        <div className="demo-top-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
            <span className="stamp-tag" style={{ background: 'var(--accent-sunflower)', color: 'var(--ink)', padding: '2px 8px' }}>
              HOST PREVIEW
            </span>
            <span className="demo-banner-text" style={{ color: 'var(--text-secondary)' }}>
              Live preview of your event page.
            </span>
          </div>
          <Link
            to={`/gather/${id}/edit`}
            className="btn-tactile btn-tactile-dark"
            style={{ padding: '5px 12px', fontSize: '0.8rem', boxShadow: '2px 2px 0px var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <ArrowLeft size={14} /> Back to editor
          </Link>
        </div>
      )}

      {/* Main Single-Column Canvas Container (Mobile & Desktop Unified) */}
      <div className="public-gather-container">

        {/* 1. PHYSICAL EVENT FLYER / POSTER HEADER */}
        <div className="tactile-card" style={{ overflow: 'hidden', padding: 0 }}>
          {/* Event Poster Cover */}
          <div className="gather-poster-cover">
            <img
              src={resolveImageUrl(gather.coverImageUrl) || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'}
              alt={gather.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }}
            />
            {/* Category & Status Stamp Tags */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
                {gather.type || 'EVENT'}
              </span>
              {countdownText && (
                <span className="stamp-tag" style={{ background: countdownText === 'HAPPENING TODAY' ? 'var(--accent-matcha)' : 'var(--accent-sunflower)', color: countdownText === 'HAPPENING TODAY' ? '#ffffff' : 'var(--ink)' }}>
                  {countdownText}
                </span>
              )}
            </div>
            {/* Share Pill (only if not preview mode button clash) */}
            {!isPreview && (
              <button
                onClick={copyShareLink}
                className="stamp-tag"
                style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffffff', color: 'var(--ink)', cursor: 'pointer' }}
                title="Copy event link"
              >
                <Share2 size={12} /> {copiedLink ? 'COPIED' : 'SHARE'}
              </button>
            )}
          </div>

          {/* Poster Details Block */}
          <div style={{ padding: '20px 20px 18px' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              lineHeight: 1.15,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: '10px',
              letterSpacing: '-0.01em'
            }}>
              {gather.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                INVITATION
              </span>
            </div>
          </div>
        </div>

        {/* 2. Date Card */}
        {renderDateCard()}

        {/* 3. Venue Pass Card */}
        {renderVenueCard()}

        {/* Top Notice Pill (Surfaces latest update immediately) */}
        {announcements.length > 0 && (
          <div 
            onClick={() => {
              const el = document.getElementById('announcements-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              cursor: 'pointer',
              background: '#fffdf0',
              border: '2px solid #eab308',
              borderRadius: '12px',
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: 'var(--shadow-tactile-sm)',
              transition: 'transform 0.1s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ca8a04',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(202, 138, 4, 0.25)',
                flexShrink: 0
              }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#854d0e', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
                Host Update:
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {announcements[0].title}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#854d0e', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Read →
            </span>
          </div>
        )}

        {/* 4. RSVP Section Card */}
        {renderRsvpCard()}

          {/* 4. HOST BULLETIN BOARD (LIVE ANNOUNCEMENTS) */}
          {announcements.length > 0 && (
            <div id="announcements-section" className="tactile-card" style={{ padding: '18px 16px', background: 'var(--accent-sunflower-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} style={{ color: 'var(--ink)' }} />
                  <span className="stamp-tag" style={{ background: 'var(--accent-sunflower)', color: 'var(--ink)' }}>
                    ANNOUNCEMENTS ({announcements.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  FROM HOST
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map((ann, idx) => (
                  <div key={ann.id || idx} style={{
                    background: '#ffffff',
                    border: 'var(--border-tactile-thin)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: 'var(--shadow-tactile-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {idx === 0 && (
                          <span style={{ 
                            fontSize: '0.66rem', 
                            fontWeight: 800, 
                            background: 'var(--accent-sunflower)', 
                            color: 'var(--ink)', 
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            letterSpacing: '0.5px'
                          }}>
                            LATEST
                          </span>
                        )}
                        <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>{ann.title}</strong>
                      </div>
                      {ann.publishedAt && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {formatPublishedAt(ann.publishedAt)}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px', whiteSpace: 'pre-line' }}>
                      {ann.message || ann.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ABOUT THE GATHER (EDITORIAL NOTE) */}
          {gather.description && (
            <div className="tactile-card" style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                  ABOUT THIS EVENT
                </span>
              </div>
              <p style={{ fontSize: '0.94rem', color: 'var(--ink)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {gather.description}
              </p>
            </div>
          )}

          {/* 6. PRINTED TIMELINE ITINERARY (SCHEDULE) */}
          {gather.schedule && gather.schedule.length > 0 && (
            <div className="tactile-card" style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Clock size={16} />
                <span className="stamp-tag" style={{ background: 'var(--accent-matcha)', color: '#ffffff' }}>
                  SCHEDULE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {gather.schedule.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    borderBottom: idx === gather.schedule.length - 1 ? 'none' : '1px dashed #d1cfc7',
                    paddingBottom: idx === gather.schedule.length - 1 ? '0' : '10px'
                  }}>
                    <div style={{
                      minWidth: '68px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      color: 'var(--accent-vermilion)',
                      paddingTop: '2px'
                    }}>
                      {formatDisplayTime(item.startTime) || item.startTime?.slice(0, 5) || '18:00'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block' }}>{item.title}</strong>
                      {item.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.description}
                        </p>
                      )}
                      {(item.location || item.dressCode) && (
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.location && <span>📍 {item.location}</span>}
                          {item.dressCode && <span>👔 {item.dressCode}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. GUEST ESSENTIALS / PARTICULARS FAQ */}
          {gather.informationBlocks && gather.informationBlocks.length > 0 && (
            <div className="tactile-card" style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                  IMPORTANT INFORMATION
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {gather.informationBlocks.map((block, i) => (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: 'var(--paper-subtle)',
                    border: '1px solid #e5e0d4',
                    borderRadius: '8px'
                  }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{block.title}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.45' }}>
                      {block.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. SCRAPBOOK PHOTO WALL / LOCKED PHOTO VAULT CARD */}
          {photoLockState.locked ? (
            <div className="tactile-card" style={{ 
              padding: '22px 18px', 
              background: '#fdfbf7',
              border: '2px dashed #cbd5e1',
              position: 'relative'
            }}>
              {/* Security Header Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={15} style={{ color: 'var(--accent-terracotta)' }} />
                  <span className="stamp-tag" style={{ 
                    background: 'var(--accent-terracotta)', 
                    color: '#ffffff',
                    letterSpacing: '1px'
                  }}>
                    PASSCODE REQUIRED
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  PRIVATE ALBUM
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                  Passcode required
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                  This photo album is private. Enter the passcode from your invitation or host to view and upload photos.
                </p>

                <form onSubmit={handleUnlockWithPin} style={{ 
                  padding: '14px', 
                  background: '#ffffff', 
                  borderRadius: '10px', 
                  border: 'var(--border-tactile-thin)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="Enter passcode"
                        value={pinCodeInput}
                        onChange={(e) => setPinCodeInput(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '10px 12px 10px 36px', 
                          fontSize: '0.98rem', 
                          fontWeight: 700, 
                          letterSpacing: '2px' 
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pinSubmitting}
                      className="btn-tactile btn-tactile-matcha"
                      style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <ShieldCheck size={16} /> {pinSubmitting ? 'Verifying...' : 'Unlock'}
                    </button>
                  </div>

                  {pinError && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-vermilion)', fontWeight: 600 }}>
                      {pinError}
                    </div>
                  )}
                </form>
              </div>
            </div>
          ) : (
            <div className="tactile-card" style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} />
                  <span className="stamp-tag" style={{ background: 'var(--accent-cobalt)', color: '#ffffff' }}>
                    PHOTOS
                  </span>
                </div>
                {mediaList.length > 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {mediaList.length} {mediaList.length === 1 ? 'photo' : 'photos'}
                  </span>
                ) : (
                  <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--text-muted)', fontSize: '0.66rem' }}>
                    PHOTOS
                  </span>
                )}
              </div>

              {/* Allocated Photo Grid */}
              <div className="gather-photo-grid">
                {mediaList.length > 0 ? (
                  mediaList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setActivePhoto(resolveImageUrl(m.fileUrl))}
                      style={{
                        height: '115px',
                        border: 'var(--border-tactile-thin)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#fff',
                        boxShadow: 'var(--shadow-tactile-sm)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <img
                        src={resolveImageUrl(m.fileUrl)}
                        alt={m.fileName || 'Snapshot'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))
                ) : (
                  [1, 2, 3, 4, 5, 6].map((slot) => (
                    <div
                      key={slot}
                      style={{
                        height: '95px',
                        border: '1.5px dashed var(--border-strong)',
                        borderRadius: '8px',
                        background: 'var(--paper-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <ImageIcon size={18} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.7 }}>
                        Photo {slot}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {mediaList.length === 0 && (
                <p style={{ 
                  fontSize: '0.74rem', 
                  color: 'var(--text-muted)', 
                  textAlign: 'center', 
                  marginTop: '12px', 
                  marginBottom: '2px',
                  fontStyle: 'italic'
                }}>
                  Photos will appear here once uploaded by the host.
                </p>
              )}
            </div>
          )}

        {/* Share Invitation Card */}
        <div className="tactile-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
              SHARE
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Share this event link with guests.
          </p>
          <button
            onClick={copyShareLink}
            className="btn-tactile btn-tactile-paper"
            style={{ width: '100%', padding: '10px' }}
          >
            <Share2 size={15} /> {copiedLink ? 'Link copied' : 'Copy link'}
          </button>
        </div>

        {/* Viral Host Acquisition Card */}
        <div style={{
          marginTop: '28px',
          background: 'linear-gradient(135deg, #181512 0%, #29241e 100%)',
          borderRadius: '18px',
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(24, 21, 18, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle decorative glow */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(255, 77, 46, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '12px' }}>
            <Sparkles size={12} />
            <span>Catane Gather</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.3, color: '#ffffff', letterSpacing: '-0.3px' }}>
            Hosting an event?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            Create an event page in minutes. Collect RSVPs, share schedules, post updates, and share photos.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {[
              'RSVP collection with guest notes',
              'Printable QR code and custom link',
              'Free to design and preview'
            ].map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} style={{ color: '#34d399' }} />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup?ref=viral_footer"
              style={{
                flex: 1,
                minWidth: '180px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--accent-vermilion, #ff4d2e)',
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(255, 77, 46, 0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>Create event</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              View sample
            </Link>
          </div>
        </div>

        {/* Footer brand signature */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0 12px 0',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Link to="/" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.2px' }}>
              Catane Gather
            </Link>
            <span>·</span>
            <span>Modern invitations for every celebration</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Birthdays · Weddings · Dinners · Reunions · Parties
          </span>
        </div>

      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 21, 18, 0.92)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <img
            src={resolveImageUrl(activePhoto)}
            alt="Enlarged"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', border: 'var(--border-tactile)', borderRadius: '14px' }}
          />
        </div>
      )}

    </div>
  );
};

