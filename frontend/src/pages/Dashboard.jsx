import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, resolveImageUrl } from '../config/api';
import { CreateGatherModal } from '../components/CreateGatherModal';
import { WhatsAppShareModal } from '../components/WhatsAppShareModal';
import { CreditTopUpModal } from '../components/CreditTopUpModal';
import { Plus, Calendar, Eye, Share2, Edit3, Users, ExternalLink, ArrowUpRight, MessageSquare, Ticket, Copy } from 'lucide-react';

export const Dashboard = () => {
  const { user, token, creditsBalance, fetchCreditsBalance } = useAuth();
  const navigate = useNavigate();
  const [gathers, setGathers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [targetPublishId, setTargetPublishId] = useState(null);
  const [whatsAppModalGather, setWhatsAppModalGather] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    if (token) {
      fetchGathers();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handlePublishFromDashboard = async (gatherId) => {
    if ((creditsBalance || 0) < 1) {
      setTargetPublishId(gatherId);
      setIsTopUpOpen(true);
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${gatherId}/publish-with-credit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        if (fetchCreditsBalance) await fetchCreditsBalance();
        await fetchGathers();
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.message && err.message.toLowerCase().includes('insufficient')) {
          setTargetPublishId(gatherId);
          setIsTopUpOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGathers = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/organiser/gathers'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGathers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newGather) => {
    setGathers([newGather, ...gathers]);
    navigate(`/gather/${newGather.id}/edit`);
  };

  const isConcludedGather = (g) => {
    if (g.concluded || g.status === 'COMPLETED' || g.status === 'ARCHIVED') return true;
    if (g.eventDate) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventD = new Date(g.eventDate);
        eventD.setHours(0, 0, 0, 0);
        return eventD < today;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleDuplicate = async (gatherId, e) => {
    if (e) e.stopPropagation();
    try {
      setDuplicatingId(gatherId);
      const res = await fetch(apiUrl(`/api/organiser/gathers/${gatherId}/duplicate`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newGather = await res.json();
        navigate(`/gather/${newGather.id}/edit`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not duplicate event');
      }
    } catch (err) {
      console.error('Error duplicating event:', err);
    } finally {
      setDuplicatingId(null);
    }
  };

  // Metrics
  const totalEvents = gathers.length;
  const concludedEvents = gathers.filter(isConcludedGather).length;
  const liveEvents = gathers.filter(g => (g.status === 'PUBLISHED' || g.status === 'LIVE') && !isConcludedGather(g)).length;
  const draftEvents = gathers.filter(g => g.status === 'DRAFT' && !isConcludedGather(g)).length;
  const totalViews = gathers.reduce((acc, g) => acc + (g.pageViews || 0), 0);

  const filteredGathers = gathers.filter(g => {
    if (activeTab === 'LIVE') return (g.status === 'PUBLISHED' || g.status === 'LIVE') && !isConcludedGather(g);
    if (activeTab === 'DRAFT') return g.status === 'DRAFT' && !isConcludedGather(g);
    if (activeTab === 'CONCLUDED') return isConcludedGather(g);
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* SaaS Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Events
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Manage your events, guest RSVPs, and updates.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
          <Plus size={16} /> Create event
        </button>
      </div>

      {/* SaaS KPI Metric Summary Bar */}
      <div className="dashboard-metrics-grid">
        <div className="saas-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total events
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {totalEvents}
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--status-success-text)', textTransform: 'uppercase' }}>
            Published events
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: 'var(--status-success-text)' }}>
            {liveEvents}
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total views
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {totalViews}
          </div>
        </div>

        <div className="saas-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Credits
            </span>
            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="stamp-tag"
              style={{ background: 'var(--accent-vermilion)', color: '#ffffff', cursor: 'pointer', border: 'none', padding: '2px 8px', fontSize: '0.66rem' }}
            >
              Top up
            </button>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: 'var(--ink)' }}>
            🎟️ {creditsBalance || 0}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-md)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'ALL', label: `All (${totalEvents})` },
            { id: 'LIVE', label: `Published (${liveEvents})` },
            { id: 'DRAFT', label: `Drafts (${draftEvents})` },
            { id: 'CONCLUDED', label: `Concluded (${concludedEvents})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`segment-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading events...
        </div>
      ) : filteredGathers.length === 0 ? (
        <div className="saas-card" style={{ textAlign: 'center', padding: '56px 20px', maxWidth: '480px', margin: '40px auto' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '14px'
          }}>
            <Calendar size={20} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '6px' }}>No events yet</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
            Create your first event to collect RSVPs, share schedules, and post updates.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={15} /> Create event
          </button>
        </div>
      ) : (
        <div className="dashboard-events-grid">
          {filteredGathers.map(gather => {
            const isConcluded = isConcludedGather(gather);
            const isLive = (gather.status === 'PUBLISHED' || gather.status === 'LIVE') && !isConcluded;
            return (
              <div key={gather.id} className="saas-card" style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {/* Event Cover Banner */}
                {gather.coverImageUrl && (
                  <div style={{ height: '130px', position: 'relative', background: '#e2e8f0' }}>
                    <img 
                      src={resolveImageUrl(gather.coverImageUrl)} 
                      alt={gather.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }} 
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      {isConcluded ? (
                        <span className="badge badge-neutral" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                          Concluded
                        </span>
                      ) : (
                        <span className={isLive ? 'badge badge-live' : 'badge badge-draft'}>
                          {isLive ? 'Published' : 'Draft'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ padding: '20px' }}>
                  {!gather.coverImageUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                        {gather.type || 'Event'}
                      </span>
                      {isConcluded ? (
                        <span className="badge badge-neutral" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                          Concluded
                        </span>
                      ) : (
                        <span className={isLive ? 'badge badge-live' : 'badge badge-draft'}>
                          {isLive ? 'Published' : 'Draft'}
                        </span>
                      )}
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {gather.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <Calendar size={14} />
                    <span>{formatDate(gather.eventDate)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span>{gather.pageViews || 0} views</span>
                  </div>

                  {/* SaaS Action Buttons */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/gather/${gather.id}/edit`}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '7px', fontSize: '0.82rem' }}
                      >
                        <Edit3 size={13} /> {isConcluded ? 'Memories' : 'Edit'}
                      </Link>
                      <Link
                        to={`/gather/${gather.id}/manage/rsvps`}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '7px', fontSize: '0.82rem' }}
                      >
                        <Users size={13} /> RSVPs
                      </Link>
                      <Link
                        to={`/gather/${gather.id}/preview`}
                        className="btn-secondary"
                        style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                        title="Preview event"
                      >
                        <Eye size={13} />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(gather.id, e)}
                        disabled={duplicatingId === gather.id}
                        className="btn-secondary"
                        style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                        title="Duplicate as new event draft"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    {isConcluded ? (
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(gather.id, e)}
                        disabled={duplicatingId === gather.id}
                        className="btn-secondary"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'var(--bg-subtle)'
                        }}
                      >
                        <Copy size={13} />
                        {duplicatingId === gather.id ? 'Duplicating...' : 'Duplicate as New Event'}
                      </button>
                    ) : isLive ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setWhatsAppModalGather(gather)}
                          className="btn-tactile"
                          style={{
                            flex: 1.2,
                            padding: '7px 10px',
                            fontSize: '0.82rem',
                            backgroundColor: '#25D366',
                            color: '#ffffff'
                          }}
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </button>
                        <Link
                          to={`/gather/${gather.id}/share`}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                        >
                          <Share2 size={13} /> Share & QR
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePublishFromDashboard(gather.id)}
                        className={(creditsBalance || 0) >= 1 ? "btn-tactile btn-tactile-matcha" : "btn-accent"}
                        style={{ width: '100%', padding: '7px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Ticket size={14} />
                        {(creditsBalance || 0) >= 1 ? 'Publish (1 credit)' : 'Publish (get credits)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateGatherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* 1-Tap Formatted WhatsApp Share Modal */}
      <WhatsAppShareModal
        gather={whatsAppModalGather}
        isOpen={Boolean(whatsAppModalGather)}
        onClose={() => setWhatsAppModalGather(null)}
      />

      {/* Wallet Credits Top-Up Modal */}
      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          setTargetPublishId(null);
        }}
        onSuccess={() => {
          setIsTopUpOpen(false);
          if (targetPublishId) {
            handlePublishFromDashboard(targetPublishId);
            setTargetPublishId(null);
          }
        }}
      />
    </div>
  );
};
