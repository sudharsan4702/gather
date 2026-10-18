import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, Heart, Wine, Cake, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import { ImageUploader } from './ImageUploader';

export const CreateGatherModal = ({ isOpen, onClose, onCreated }) => {
  const { token } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('wedding');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [customCoverImage, setCustomCoverImage] = useState('');
  const [includeSampleContent, setIncludeSampleContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'wedding',
      name: 'Wedding & Reception',
      type: 'Wedding',
      defaultTitle: 'A & S Wedding Celebration',
      description: 'We request the honor of your presence as we celebrate our marriage.',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      venue: { venueName: 'The Heritage Pavilion & Courtyard', address: '14 Palace Orchards Road, Bengaluru' },
      schedule: [
        { startTime: '17:30:00', title: 'Welcome Refreshments & Sunset Cocktails', location: 'Courtyard Lawn', dressCode: 'Festive / Black Tie Optional' },
        { startTime: '18:45:00', title: 'Wedding Ceremony & Vows', location: 'The Mandap Pavilion', dressCode: 'Festive Traditional' },
        { startTime: '20:15:00', title: 'Celebration Dinner & Toasts', location: 'The Dining Hall', dressCode: 'Cocktail' }
      ],
      notes: [
        { title: 'Attire & Dress Code', content: 'Festive Indian or Black Tie Optional. The ceremony takes place outdoors on grass.' },
        { title: 'A Note on Gifts', content: 'Your presence and love are all that we ask for on our special day.' }
      ]
    },
    {
      id: 'dinner',
      name: 'Intimate Dinner & Cocktails',
      type: 'Dinner',
      defaultTitle: 'Autumn Sunset Dinner Party',
      description: 'Join us for an intimate evening of seasonal food, good wine, and conversation.',
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      venue: { venueName: 'The Glasshouse Terrace', address: '28 Indiranagar 100ft Road, Bengaluru' },
      schedule: [
        { startTime: '19:00:00', title: 'Aperitifs & Welcome Canapés', location: 'Rooftop Lounge', dressCode: 'Smart Casual' },
        { startTime: '20:00:00', title: 'Four-Course Chef Dinner', location: 'Private Dining Room', dressCode: 'Smart Casual' },
        { startTime: '22:00:00', title: 'Digestifs & Vinyl Music', location: 'Terrace Bar', dressCode: 'Relaxed' }
      ],
      notes: [
        { title: 'Dietary Notes', content: 'Please let us know your allergies and dietary preferences in your RSVP.' }
      ]
    },
    {
      id: 'birthday',
      name: 'Milestone Birthday Party',
      type: 'Birthday',
      defaultTitle: "Kabir's 30th Birthday Celebration",
      description: 'Stepping into a new decade with the best people. Come ready for drinks, music, and great memories.',
      coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
      venue: { venueName: 'Botanical Courtyard Lounge', address: '88 MG Road, Bengaluru' },
      schedule: [
        { startTime: '18:30:00', title: 'Arrivals & Cocktails', location: 'Main Bar', dressCode: 'Dress to Celebrate' },
        { startTime: '20:00:00', title: 'Speeches & Cake Cutting', location: 'Garden Deck', dressCode: 'Dress to Celebrate' },
        { startTime: '21:00:00', title: 'DJ & Dancing', location: 'Dance Floor', dressCode: 'Celebration' }
      ],
      notes: [
        { title: 'Dress Code', content: 'Dress to celebrate! Chic & vibrant attire encouraged.' }
      ]
    },
    {
      id: 'custom',
      name: 'Custom Gathering',
      type: 'Other',
      defaultTitle: 'Friends & Family Gathering',
      description: 'We look forward to gathering together. Details and schedule below.',
      coverImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
      venue: { venueName: 'Venue TBA', address: 'Address TBA' },
      schedule: [
        { startTime: '18:00:00', title: 'Arrival & Welcome', location: 'Main Entrance', dressCode: 'Casual' },
        { startTime: '19:30:00', title: 'Dinner & Gathering', location: 'Dining Area', dressCode: 'Casual' }
      ],
      notes: [
        { title: 'Important Notes', content: 'Looking forward to seeing everyone.' }
      ]
    }
  ];

  const currentTemplate = templates.find(t => t.id === selectedTemplate) || templates[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const finalTitle = title.trim() || currentTemplate.defaultTitle;
    setSubmitting(true);

    try {
      const payload = {
        title: finalTitle,
        type: currentTemplate.type,
        eventDate: eventDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        startTime: currentTemplate.schedule[0]?.startTime || '18:00:00',
        description: currentTemplate.description,
        coverImageUrl: customCoverImage || currentTemplate.coverImage,
        venue: includeSampleContent ? currentTemplate.venue : null,
        scheduleItems: (includeSampleContent && currentTemplate.schedule) ? currentTemplate.schedule : null,
        informationBlocks: (includeSampleContent && currentTemplate.notes) ? currentTemplate.notes : null
      };

      const createRes = await fetch(apiUrl('/api/organiser/gathers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to create event. Please try again.');
      }

      const createdGather = await createRes.json();
      onCreated(createdGather);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to create event. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-responsive" style={{ zIndex: 200 }}>
      <div className="stationery-folio modal-card-responsive" style={{
        padding: '28px 22px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--text-secondary)', padding: '6px' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            color: 'var(--accent-sunflower)',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px',
            fontWeight: 700
          }}>
            New event
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 600 }}>
            What are you celebrating?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Choose a theme to get started. You can customize the details and schedule later.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            color: '#dc2626',
            fontSize: '0.86rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Archetype selector cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {templates.map(t => {
              const isSelected = selectedTemplate === t.id;
              const vibeLabels = {
                wedding: 'Romantic & Elegant',
                dinner: 'Warm & Intimate',
                birthday: 'Festive & Vibrant',
                custom: 'Clean & Flexible'
              };
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-subtle)' : '#ffffff',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <p style={{
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {t.name}
                  </p>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {vibeLabels[t.id] || 'Curated theme'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Starter Blueprint vs Clean Slate Option */}
          <div style={{
            background: includeSampleContent ? '#fbf8f1' : 'var(--bg-subtle)',
            border: includeSampleContent ? '1px solid var(--accent-sunflower)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: includeSampleContent ? 'var(--accent-sunflower)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {includeSampleContent ? 'Include sample schedule & notes' : 'Start with empty schedule'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {includeSampleContent 
                  ? 'Adds example itinerary and note blocks you can edit.' 
                  : 'Start with blank schedule and notes. Add your own anytime.'}
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={includeSampleContent}
                onChange={(e) => setIncludeSampleContent(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {includeSampleContent ? 'Samples on' : 'Empty'}
              </span>
            </label>
          </div>

          <div>
            <label style={{ letterSpacing: '0.04em' }}>EVENT TITLE</label>
            <input
              type="text"
              placeholder={`e.g. ${currentTemplate.defaultTitle}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', fontSize: '0.96rem' }}
            />
          </div>

          <div>
            <label style={{ letterSpacing: '0.04em' }}>EVENT DATE</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <ImageUploader
              label="COVER IMAGE (OPTIONAL)"
              value={customCoverImage}
              onChange={setCustomCoverImage}
              placeholder={currentTemplate.coverImage}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold"
            style={{ width: '100%', padding: '14px', marginTop: '6px' }}
          >
            {submitting ? 'Creating event...' : 'Continue to editor'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
