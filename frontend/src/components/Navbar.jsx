import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, LogOut, ExternalLink, Ticket } from 'lucide-react';
import { CreditTopUpModal } from './CreditTopUpModal';

export const Navbar = () => {
  const { user, creditsBalance, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Public invite pages and full-screen studio editors have their own dedicated headers
  const isPublicEventHome = location.pathname.startsWith('/g/') ||
                            location.pathname === '/demo' ||
                            location.pathname.endsWith('/preview') ||
                            location.pathname.endsWith('/edit');

  if (isPublicEventHome) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <nav className="navbar-container">
        {/* Brand & Workspace */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              <Calendar size={16} strokeWidth={2.5} />
            </div>
            <span className="brand-title-full" style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Catane Gather
            </span>
            <span className="brand-title-short" style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Catane
            </span>
          </Link>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
              <Link to="/dashboard" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Events
              </Link>
              <Link to="/demo" className="navbar-link-desktop-only" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Sample Event
              </Link>
            </div>
          )}
        </div>

        {/* Right User & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              {/* Wallet Credits Badge */}
              <button
                type="button"
                onClick={() => setIsTopUpOpen(true)}
                className="btn-tactile btn-tactile-paper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Top up credits"
              >
                <Ticket size={14} style={{ color: 'var(--accent-vermilion)' }} />
                <span className="navbar-credits-label" style={{ fontWeight: 800, color: 'var(--ink)' }}>
                  {creditsBalance} {creditsBalance === 1 ? 'Credit' : 'Credits'}
                </span>
                <span className="brand-title-short" style={{ fontWeight: 800, color: 'var(--ink)' }}>
                  {creditsBalance}
                </span>
                <span style={{
                  background: 'var(--accent-vermilion)',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  borderRadius: '4px',
                  padding: '1px 5px',
                  marginLeft: '2px'
                }}>
                  +
                </span>
              </button>

              <Link to="/dashboard" className="btn-primary navbar-link-desktop-only" style={{ padding: '7px 14px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                <Plus size={15} /> Create event
              </Link>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '10px',
              marginLeft: '2px'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                flexShrink: 0
              }}>
                {getInitials(user.name)}
              </div>
              <span className="navbar-user-name">
                {user.name}
              </span>
              <button 
                onClick={handleLogout} 
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/demo" className="navbar-link-desktop-only" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500, marginRight: '4px' }}>
              Sample Event
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>

    {/* Top Up Wallet Modal */}
    <CreditTopUpModal
      isOpen={isTopUpOpen}
      onClose={() => setIsTopUpOpen(false)}
    />
  </>
  );
};
