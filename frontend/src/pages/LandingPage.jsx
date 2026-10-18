import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Image,
  Bell,
  Ticket,
  Sparkles,
  Check
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();
  const ctaLink = user ? '/dashboard' : '/signup';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div style={{ marginBottom: '18px' }}>
          <span
            className="stamp-tag"
            style={{
              background: 'var(--accent-sunflower)',
              color: 'var(--ink)',
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Ticket size={14} />
            <span>PAY-AS-YOU-GO EVENT CREDITS · NO SUBSCRIPTION</span>
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.1rem, 6vw, 4.4rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--ink)',
          marginBottom: '20px'
        }}>
          Digital event invitations your guests will love.
        </h1>

        <p style={{
          fontSize: '1.12rem',
          color: 'var(--text-secondary)',
          maxWidth: '580px',
          margin: '0 auto 32px',
          lineHeight: '1.6'
        }}>
          Mobile-first invitations for dinners, weddings, and celebrations. RSVPs, schedules, directions, and updates in a single link.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link to={ctaLink} className="btn-tactile btn-tactile-vermilion" style={{ padding: '12px 26px', fontSize: '1rem' }}>
            Create event <ArrowRight size={18} />
          </Link>
          <Link to="/demo" className="btn-tactile btn-tactile-paper" style={{ padding: '12px 24px', fontSize: '1rem' }}>
            View sample
          </Link>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '16px' }}>
          Free to create and preview. Use 1 event credit only when you're ready to publish.
        </p>
      </section>

      {/* How It Works */}
      <section style={{ padding: '60px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>How it works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              Simple for hosts. Effortless for guests.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
            {[
              { step: '01', title: 'Add details', desc: 'Set event times, venue location, schedule, and dress codes.' },
              { step: '02', title: 'Preview draft', desc: 'See exactly how your invitation looks on mobile — 100% free.' },
              { step: '03', title: 'Publish with 1 credit', desc: 'Use 1 event credit to take your invitation live. Credits never expire.' },
              { step: '04', title: 'Share & track', desc: 'Send via WhatsApp or download a print QR code. Track RSVPs in real time.' }
            ].map((item, idx) => (
              <div key={idx} className="card feature-card" style={{ padding: '24px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
                  {item.step}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>{item.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Pricing Section */}
      <section style={{ padding: '70px 20px', maxWidth: '1020px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span
              className="stamp-tag"
              style={{
                background: 'var(--accent-matcha-soft)',
                color: 'var(--accent-matcha)',
                border: '1px solid var(--accent-matcha)',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              TRANSPARENT CREDIT SYSTEM
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--ink)', fontWeight: 400, marginBottom: '8px' }}>
            Simple, pay-as-you-go event credits
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
            No subscriptions or hidden fees. Draft and preview every detail for free, and use 1 credit only when you're ready to publish.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          {/* Card 1: 1 Credit */}
          <div className="card feature-card" style={{
            padding: '28px 22px',
            border: 'var(--border-tactile-thin)',
            borderRadius: '16px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                SINGLE EVENT
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', marginBottom: '6px', color: 'var(--ink)' }}>
                1 Credit
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', minHeight: '38px', lineHeight: 1.4, marginBottom: '16px' }}>
                Ideal for a one-off wedding, birthday dinner, or private celebration.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--ink)' }}>₹99</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/ 1 event</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span><strong>1 published event invitation</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Unlimited guest RSVPs & headcount</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Google Maps, schedule & photo gallery</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Credits never expire</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '28px' }}>
              <Link to={ctaLink} className="btn-tactile btn-tactile-paper" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                {user ? 'Go to dashboard' : 'Get started'}
              </Link>
            </div>
          </div>

          {/* Card 2: 5 Credits (Popular) */}
          <div className="card feature-card" style={{
            padding: '28px 22px',
            border: '2px solid var(--accent-vermilion)',
            borderRadius: '16px',
            background: '#fffaf8',
            boxShadow: 'var(--shadow-tactile-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-vermilion)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              MOST POPULAR
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-vermilion)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                STARTER PACK
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', marginBottom: '6px', color: 'var(--ink)' }}>
                5 Credits
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', minHeight: '38px', lineHeight: 1.4, marginBottom: '16px' }}>
                Best for hosts organizing multiple family celebrations and gatherings.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 77, 46, 0.15)' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--ink)' }}>₹449</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  (₹89.8/event)
                </span>
                <span className="stamp-tag" style={{ background: 'var(--accent-matcha-soft)', color: 'var(--accent-matcha)', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 700, marginLeft: 'auto' }}>
                  Save ₹46
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span><strong>5 published event invitations</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Unlimited guest RSVPs across all events</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>WhatsApp sharing & printable QR codes</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Credits never expire · Use anytime</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '28px' }}>
              <Link to={ctaLink} className="btn-tactile btn-tactile-vermilion" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                {user ? 'Go to dashboard' : 'Get 5 Credits'}
              </Link>
            </div>
          </div>

          {/* Card 3: 10 Credits (Best Value) */}
          <div className="card feature-card" style={{
            padding: '28px 22px',
            border: '2px solid var(--accent-cobalt)',
            borderRadius: '16px',
            background: '#f8fbff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-cobalt)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              BEST VALUE
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cobalt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                STUDIO PACK
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', marginBottom: '6px', color: 'var(--ink)' }}>
                10 Credits
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', minHeight: '38px', lineHeight: 1.4, marginBottom: '16px' }}>
                Lowest rate per event for event planners, studios, and organizers.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(29, 78, 216, 0.15)' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--ink)' }}>₹799</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  (₹79.9/event)
                </span>
                <span className="stamp-tag" style={{ background: 'var(--accent-matcha-soft)', color: 'var(--accent-matcha)', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 700, marginLeft: 'auto' }}>
                  Save ₹191
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span><strong>10 published event invitations</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Lowest rate at ₹79.9 per event</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Full access to all present & upcoming tools</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Check size={16} style={{ color: 'var(--accent-matcha)', flexShrink: 0 }} />
                  <span>Credits never expire · Use anytime</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '28px' }}>
              <Link to={ctaLink} className="btn-tactile btn-tactile-paper" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                {user ? 'Go to dashboard' : 'Get 10 Credits'}
              </Link>
            </div>
          </div>

        </div>

        {/* Benefits Ribbon */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '14px',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Ticket size={16} style={{ color: 'var(--accent-vermilion)' }} />
            <span><strong>1 Credit = 1 Published Event</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-sunflower)' }} />
            <span>Free draft creation & mobile preview</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Clock size={16} style={{ color: 'var(--accent-cobalt)' }} />
            <span>Credits never expire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent-matcha)' }} />
            <span>Zero recurring subscription or lock-in</span>
          </div>
        </div>

      </section>

      {/* Core Utilities */}
      <section style={{ padding: '70px 20px', maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Everything guests need in one place</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
            No apps or accounts required. Guests tap the link to view all details.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            {
              icon: <Clock size={20} />,
              title: 'Schedule & Timeline',
              desc: 'Keep everyone on track with clear times, locations, and dress codes.'
            },
            {
              icon: <MapPin size={20} />,
              title: 'Location & Parking',
              desc: 'One-tap navigation in Google Maps, with gate and parking instructions.'
            },
            {
              icon: <Users size={20} />,
              title: 'RSVP Tracking',
              desc: 'Track attendance, headcount, dietary requirements, and guest messages.'
            },
            {
              icon: <Bell size={20} />,
              title: 'Host Updates',
              desc: 'Post last-minute weather updates or schedule changes directly to the page.'
            },
            {
              icon: <Calendar size={20} />,
              title: 'Calendar Sync',
              desc: 'Guests can add the event to Google Calendar or Apple Calendar with one tap.'
            },
            {
              icon: <Image size={20} />,
              title: 'Photo Gallery',
              desc: 'Share portrait galleries, venue photos, and event memories in an elegant lightbox.'
            }
          ].map((f, i) => (
            <div key={i} className="card feature-card" style={{ padding: '24px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                marginBottom: '14px'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '60px 20px', background: 'var(--paper-desk)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', color: 'var(--ink)', fontWeight: 400, marginBottom: '14px' }}>
            Ready to gather your guests?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Draft your complete invitation for free in minutes. Use 1 credit when you're ready to publish and send invitations.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link to={ctaLink} className="btn-tactile btn-tactile-vermilion" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              {user ? 'Create an event' : 'Start creating for free'} <ArrowRight size={18} />
            </Link>
            <Link to="/demo" className="btn-tactile btn-tactile-paper" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              View live demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <p>© Catane Gather. Thoughtful event invitations for real-world gatherings.</p>
      </footer>

    </div>
  );
};
