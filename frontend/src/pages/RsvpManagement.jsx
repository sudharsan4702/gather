import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import { Users, Search, ArrowLeft, Check, X, FileSpreadsheet } from 'lucide-react';

export const RsvpManagement = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRsvps();
  }, [id, token]);

  const fetchRsvps = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/rsvps`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/rsvps/export`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rsvps_gather_${id}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const filteredResponses = summary?.responses?.filter(r => {
    const matchesFilter = filter === 'ALL' || r.attendance === filter;
    const matchesSearch = r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.message && r.message.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading RSVPs...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>RSVPs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
              Track responses, headcounts, and guest notes.
            </p>
          </div>
        </div>

        <button onClick={handleExportCsv} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
          <FileSpreadsheet size={15} /> Export CSV
        </button>
      </div>

      {/* Headcount Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            TOTAL RESPONSES
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px' }}>
            {summary?.totalResponses || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
          <span style={{ color: '#065f46', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            ATTENDING
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: '#065f46' }}>
            {summary?.attendingCount || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
          <span style={{ color: '#991b1b', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            DECLINED
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '2px', color: '#991b1b' }}>
            {summary?.declinedCount || 0}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ATTENDING', label: 'Attending' },
            { id: 'DECLINED', label: 'Declined' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                background: filter === f.id ? 'var(--accent-primary)' : 'transparent',
                color: filter === f.id ? '#ffffff' : 'var(--text-secondary)',
                border: filter === f.id ? 'none' : '1px solid var(--border-subtle)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '180px', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search guests or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px', fontSize: '0.86rem', padding: '8px 12px 8px 34px' }}
          />
        </div>
      </div>

      {/* Guest Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filteredResponses.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No responses match this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>GUEST</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>STATUS</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>GUESTS</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r, i) => (
                  <tr 
                    key={r.id || i}
                    style={{ borderBottom: i === filteredResponses.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                      {r.guestName}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={r.attendance === 'ATTENDING' ? 'badge badge-live' : 'badge badge-neutral'} style={{ fontSize: '0.75rem' }}>
                        {r.attendance === 'ATTENDING' ? 'Attending' : 'Declined'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {r.attendance === 'ATTENDING' ? `${r.guestCount} guest${r.guestCount === 1 ? '' : 's'}` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '300px' }}>
                      {r.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
