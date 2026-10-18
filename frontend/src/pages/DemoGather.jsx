import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, Users, ArrowRight, ExternalLink, 
  Check, Bell, Image as ImageIcon, Download, Share2, Sparkles, 
  Plus, Minus, ChevronDown, Ticket, Navigation, Heart,
  Lock, Key, ShieldCheck
} from 'lucide-react';

export const DemoGather = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  const [rsvpState, setRsvpState] = useState({
    guestName: '',
    attendance: 'ATTENDING',
    guestCount: 2,
    dietary: '',
    message: '',
    submitted: false
  });

  // Demo Photo Access Control States
  const [photoPolicy, setPhotoPolicy] = useState('PUBLIC'); // 'PUBLIC' | 'PASSCODE'
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [demoPin, setDemoPin] = useState('');
  const [demoPinError, setDemoPinError] = useState('');
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  const demoEvent = {
    title: "Summer Rooftop Social & Dinner",
    type: "Dinner",
    eventDate: "Saturday, November 28, 2026",
    startTime: "6:30 PM",
    endTime: "11:30 PM",
    coverImageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    venue: {
      venueName: "The Glasshouse Terrace & Lounge",
      address: "42 Indiranagar 100ft Road, Bengaluru",
      parkingInfo: "Complimentary valet parking available at Main Gate.",
      directions: "Take the private elevator to the 5th floor terrace.",
      mapUrl: "https://maps.google.com"
    },
    description: "Join us for an intimate evening of seasonal chef-crafted dinner, curated cocktails, and conversation overlooking the city skyline.",
    schedule: [
      { startTime: "6:30 PM", title: "Aperitifs & Sunset Canapés", location: "Terrace Lounge", dressCode: "Smart Casual", description: "Welcome drinks and light bites." },
      { startTime: "8:00 PM", title: "Four-Course Seated Dinner", location: "Glass Dining Room", dressCode: "Smart Casual", description: "Seasonal culinary experience." },
      { startTime: "10:00 PM", title: "Cocktails & Vinyl Music", location: "Rooftop Bar", dressCode: "Relaxed", description: "Drinks and music under the stars." }
    ],
    announcements: [
      { id: 1, title: "Weather & Covered Terrace", content: "The terrace is climate-controlled with indoor dining in case of evening breeze.", publishedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 2, title: "Complimentary Valet Parking", content: "Valet attendants will be stationed at the Gate 1 entrance on Indiranagar 100ft Road.", publishedAt: new Date(Date.now() - 3600000 * 26).toISOString() }
    ],
    informationBlocks: [
      { title: "Dietary Options", content: "Vegetarian and vegan options prepared by the chef. Please indicate in RSVP." },
      { title: "Dress Code", content: "Smart casual or cocktail attire encouraged." }
    ],
    photos: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80"
    ]
  };

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    if (!rsvpState.guestName.trim()) return;
    setRsvpState(prev => ({ ...prev, submitted: true }));
    setDrawerOpen(false);
  };

  const handleDemoPinUnlock = (e) => {
    e.preventDefault();
    if (demoPin.trim() === '2026') {
      setIsPinUnlocked(true);
      setDemoPinError('');
    } else {
      setDemoPinError('Incorrect PIN. Try 2026 for this demo.');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  // Reusable Date & Calendar Pass Card
  const renderDateCard = () => (
    <div className="tactile-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            NOV
          </div>
          <div style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--ink)',
            lineHeight: 1.1,
            padding: '4px 0 1px'
          }}>
            28
          </div>
          <div style={{
            fontSize: '0.66rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            paddingBottom: '4px'
          }}>
            SAT
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>
            {demoEvent.eventDate}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {demoEvent.startTime} — {demoEvent.endTime}
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => alert('Calendar event (.ics) ready in live event.')}
              className="btn-tactile btn-tactile-paper"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            >
              Google Calendar
            </button>
            <button
              onClick={() => alert('Apple Calendar (.ics) ready in live event.')}
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
  const renderVenueCard = () => (
    <div className="ticket-stub" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span className="stamp-tag" style={{ background: 'var(--accent-cobalt)', color: '#ffffff' }}>
          VENUE
        </span>
      </div>

      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
        {demoEvent.venue.venueName}
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        {demoEvent.venue.address}
      </p>

      <div className="ticket-perforation-line">
        <div className="ticket-notch-left" />
        <div className="ticket-notch-right" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--ink)' }}>Parking:</strong> {demoEvent.venue.parkingInfo}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--ink)' }}>Directions:</strong> {demoEvent.venue.directions}
        </div>

        <a
          href={demoEvent.venue.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-tactile btn-tactile-sunflower"
          style={{ width: '100%', marginTop: '4px', padding: '8px' }}
        >
          <Navigation size={14} /> Open Google Maps
        </a>
      </div>
    </div>
  );

  // Reusable RSVP Card
  const renderRsvpCard = () => {
    if (rsvpState.submitted) {
      return (
        <div id="rsvp-section" className="ticket-stub" style={{ padding: '18px 16px', background: 'var(--accent-matcha-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-matcha)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={20} strokeWidth={3} />
              </div>
              <div>
                <strong style={{ fontSize: '0.96rem', color: 'var(--ink)', display: 'block' }}>
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
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            >
              Edit
            </button>
          </div>
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
            FREE
          </span>
        </div>

        <form onSubmit={handleRsvpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Attendance Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setRsvpState({ ...rsvpState, attendance: 'ATTENDING' })}
              className={`btn-tactile ${rsvpState.attendance === 'ATTENDING' ? 'btn-tactile-matcha' : 'btn-tactile-paper'}`}
              style={{ padding: '8px 4px', fontSize: '0.78rem' }}
            >
              Going
            </button>
            <button
              type="button"
              onClick={() => setRsvpState({ ...rsvpState, attendance: 'MAYBE' })}
              className={`btn-tactile ${rsvpState.attendance === 'MAYBE' ? 'btn-tactile-sunflower' : 'btn-tactile-paper'}`}
              style={{ padding: '8px 4px', fontSize: '0.78rem' }}
            >
              Maybe
            </button>
            <button
              type="button"
              onClick={() => setRsvpState({ ...rsvpState, attendance: 'DECLINED' })}
              className={`btn-tactile ${rsvpState.attendance === 'DECLINED' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
              style={{ padding: '8px 4px', fontSize: '0.78rem' }}
            >
              Can't go
            </button>
          </div>

          {/* Name & Headcount */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: 'var(--border-tactile-thin)', borderRadius: '8px', padding: '2px 8px' }}>
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

          <button
            type="submit"
            className="btn-tactile btn-tactile-vermilion"
            style={{ width: '100%', padding: '12px', fontSize: '0.94rem' }}
          >
            Submit RSVP
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="public-gather-page">
      
      {/* Demo Notification Banner (Clean top bar, zero mobile overlap) */}
      <div className="demo-top-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
          <span className="stamp-tag" style={{ background: 'var(--accent-sunflower)', color: 'var(--ink)', padding: '2px 8px' }}>
            DEMO PREVIEW
          </span>
          <span className="demo-banner-text" style={{ color: 'var(--text-secondary)' }}>
            This is how your guests experience your invitation.
          </span>
        </div>
        <Link
          to="/signup"
          className="btn-tactile btn-tactile-dark"
          style={{ padding: '5px 12px', fontSize: '0.8rem', boxShadow: '2px 2px 0px var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Create event →
        </Link>
      </div>

      {/* Main Responsive Canvas Container */}
      {/* Main Single-Column Canvas Container (Mobile & Desktop Unified) */}
      <div className="public-gather-container">

        {/* 1. PHYSICAL EVENT FLYER / POSTER HEADER */}
        <div className="tactile-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="gather-poster-cover">
            <img
              src={demoEvent.coverImageUrl}
              alt={demoEvent.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }}
            />
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
              <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
                {demoEvent.type.toUpperCase()}
              </span>
              <span className="stamp-tag" style={{ background: 'var(--accent-matcha)', color: '#ffffff' }}>
                THIS SATURDAY
              </span>
            </div>
            <button
              onClick={copyShareLink}
              className="stamp-tag"
              style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffffff', color: 'var(--ink)', cursor: 'pointer' }}
            >
              <Share2 size={12} /> {copiedLink ? 'COPIED' : 'SHARE'}
            </button>
          </div>

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
              {demoEvent.title}
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
        {demoEvent.announcements.length > 0 && (
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
                {demoEvent.announcements[0].title}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#854d0e', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Read →
            </span>
          </div>
        )}

        {/* 4. RSVP Section Card */}
        {renderRsvpCard()}

          {/* 4. Host Broadcast */}
          {demoEvent.announcements.length > 0 && (
            <div id="announcements-section" className="tactile-card" style={{ padding: '18px 16px', background: 'var(--accent-sunflower-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} style={{ color: 'var(--ink)' }} />
                  <span className="stamp-tag" style={{ background: 'var(--accent-sunflower)', color: 'var(--ink)' }}>
                    ANNOUNCEMENTS ({demoEvent.announcements.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  FROM HOST
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {demoEvent.announcements.map((ann, idx) => (
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

          {/* 5. Editorial Note */}
          <div className="tactile-card" style={{ padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                ABOUT THIS EVENT
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {demoEvent.description}
            </p>
          </div>

          {/* 6. Run of Show (Schedule) */}
          <div className="tactile-card" style={{ padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <Clock size={16} />
              <span className="stamp-tag" style={{ background: 'var(--accent-matcha)', color: '#ffffff' }}>
                SCHEDULE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {demoEvent.schedule.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  borderBottom: idx === demoEvent.schedule.length - 1 ? 'none' : '1px dashed #d1cfc7',
                  paddingBottom: idx === demoEvent.schedule.length - 1 ? '0' : '10px'
                }}>
                  <div style={{
                    minWidth: '65px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: 'var(--accent-vermilion)',
                    paddingTop: '2px'
                  }}>
                    {item.startTime}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block' }}>{item.title}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>📍 {item.location}</span>
                      <span>👔 {item.dressCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Essentials */}
          <div className="tactile-card" style={{ padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                IMPORTANT INFORMATION
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {demoEvent.informationBlocks.map((block, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--paper-subtle)', border: '1px solid #e5e0d4', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{block.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.45' }}>
                    {block.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Photo Scrapbook with Access Control Showcase */}
          {(() => {
            const isLocked = photoPolicy === 'PASSCODE' && !isPinUnlocked;

            return (
              <div className="tactile-card" style={{ padding: '20px 18px', background: isLocked ? '#fdfbf7' : '#ffffff', border: isLocked ? '2px dashed #cbd5e1' : 'var(--border-tactile)' }}>
                {/* Policy Switcher Bar for Demo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isLocked ? <Lock size={15} style={{ color: 'var(--accent-terracotta)' }} /> : <ImageIcon size={15} />}
                    <span className="stamp-tag" style={{ background: isLocked ? 'var(--accent-terracotta)' : 'var(--accent-cobalt)', color: '#ffffff' }}>
                      {isLocked ? 'PASSCODE REQUIRED' : 'PHOTOS'}
                    </span>
                  </div>

                  {/* Demo Interactive Switcher */}
                  <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    <button
                      type="button"
                      onClick={() => setPhotoPolicy('PASSCODE')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: photoPolicy === 'PASSCODE' ? '#ffffff' : 'transparent',
                        fontWeight: photoPolicy === 'PASSCODE' ? 700 : 500,
                        boxShadow: photoPolicy === 'PASSCODE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🔑 PIN Protected
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhotoPolicy('PUBLIC'); setShowEmptyDemo(false); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: (photoPolicy === 'PUBLIC' && !showEmptyDemo) ? '#ffffff' : 'transparent',
                        fontWeight: (photoPolicy === 'PUBLIC' && !showEmptyDemo) ? 700 : 500,
                        boxShadow: (photoPolicy === 'PUBLIC' && !showEmptyDemo) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🖼️ Public Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhotoPolicy('PUBLIC'); setShowEmptyDemo(true); }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: showEmptyDemo ? '#ffffff' : 'transparent',
                        fontWeight: showEmptyDemo ? 700 : 500,
                        boxShadow: showEmptyDemo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      📷 Empty State
                    </button>
                  </div>
                </div>

                {/* Locked State: PASSCODE */}
                {isLocked && (
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Passcode required
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                      Enter the passcode from your invitation to view photos (sample: <strong>2026</strong>).
                    </p>

                    <form onSubmit={handleDemoPinUnlock} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Key size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Passcode: 2026"
                          value={demoPin}
                          onChange={(e) => setDemoPin(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px 9px 34px', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '2px' }}
                        />
                      </div>
                      <button type="submit" className="btn-tactile btn-tactile-matcha" style={{ padding: '9px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <ShieldCheck size={15} /> Unlock
                      </button>
                    </form>
                    {demoPinError && (
                      <div style={{ marginTop: '6px', fontSize: '0.76rem', color: 'var(--accent-vermilion)', fontWeight: 600 }}>
                        {demoPinError}
                      </div>
                    )}
                  </div>
                )}

                {/* Unlocked State: Photo Grid */}
                {!isLocked && (
                  <div>
                    {photoPolicy === 'PASSCODE' && (
                      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--accent-matcha)', fontWeight: 700 }}>
                        <ShieldCheck size={14} />
                        <span>Unlocked with PIN 2026</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {!showEmptyDemo ? (
                        demoEvent.photos.map((url, i) => (
                          <div
                            key={i}
                            onClick={() => setActivePhoto(url)}
                            style={{
                              height: '85px',
                              border: 'var(--border-tactile-thin)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: '#fff',
                              boxShadow: 'var(--shadow-tactile-sm)'
                            }}
                          >
                            <img src={url} alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))
                      ) : (
                        [1, 2, 3, 4, 5, 6].map(slot => (
                          <div
                            key={slot}
                            style={{
                              height: '85px',
                              borderRadius: '8px',
                              border: '1.5px dashed var(--border-strong)',
                              background: 'var(--paper-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
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

                    {showEmptyDemo && (
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
              </div>
            );
          })()}

        {/* Share Invitation Card */}
        <div className="tactile-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
              SHARE
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Share this sample event link with others.
          </p>
          <button
            onClick={copyShareLink}
            className="btn-tactile btn-tactile-paper"
            style={{ width: '100%', padding: '10px' }}
          >
            <Share2 size={15} /> {copiedLink ? 'Link copied' : 'Copy link'}
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600 }}>Catane Gather</span> · Modern event invitations
        </div>

      </div>

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
            src={activePhoto}
            alt="Enlarged"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', border: 'var(--border-tactile)', borderRadius: '14px' }}
          />
        </div>
      )}

    </div>
  );
};
