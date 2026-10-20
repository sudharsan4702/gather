import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl, resolveImageUrl } from '../config/api';
import { WhatsAppShareModal } from '../components/WhatsAppShareModal';
import { CreditTopUpModal } from '../components/CreditTopUpModal';
import { ImageUploader } from '../components/ImageUploader';
import { compressImages } from '../utils/imageCompressor';
import { 
  Calendar, MapPin, Clock, Save, Trash2, Plus, Minus, Navigation, ArrowLeft, 
  Eye, Check, Bell, Image as ImageIcon, Share2, Users, Settings, 
  ExternalLink, FileSpreadsheet, Search, AlertCircle, MessageSquare,
  Lock, Key, Shield, Edit2, Edit3, Sparkles, X, Smartphone, Monitor, Upload, Loader2, Ticket, Copy
} from 'lucide-react';

const MAX_PHOTOS_LIMIT = 20;

export const GatherEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, creditsBalance, fetchCreditsBalance } = useAuth();

  const [activeTab, setActiveTab] = useState('designer'); // 'designer' | 'guests' | 'broadcast' | 'gallery' | 'settings'
  const [designerMobileTab, setDesignerMobileTab] = useState('form'); // 'form' | 'preview'
  const [gather, setGather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [publishingWithCredit, setPublishingWithCredit] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile' | 'desktop'
  const [previewAttendance, setPreviewAttendance] = useState('ATTENDING');
  const [previewHeadcount, setPreviewHeadcount] = useState(1);

  const isConcluded = Boolean(gather?.concluded || gather?.status === 'COMPLETED' || gather?.status === 'ARCHIVED' || (gather?.eventDate && (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventD = new Date(gather.eventDate);
      eventD.setHours(0, 0, 0, 0);
      return eventD < today;
    } catch {
      return false;
    }
  })()));

  const isPublished = (gather?.status === 'PUBLISHED' || gather?.status === 'LIVE') && !isConcluded;

  // Designer Form States
  const [details, setDetails] = useState({
    title: '', type: 'Dinner', description: '', coverImageUrl: '', eventDate: '', startTime: '18:00', endTime: '22:00'
  });
  const [venue, setVenue] = useState({
    venueName: '', address: '', mapUrl: '', directions: '', parkingInfo: ''
  });
  const [scheduleItems, setScheduleItems] = useState([]);
  const [infoBlocks, setInfoBlocks] = useState([]);

  // Schedule Item Interactive State
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [showMilestoneMoreDetails, setShowMilestoneMoreDetails] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    startTime: '18:00',
    location: '',
    dressCode: '',
    description: ''
  });

  // Guest Information Interactive State
  const [showParticularForm, setShowParticularForm] = useState(false);
  const [editingParticularId, setEditingParticularId] = useState(null);
  const [particularForm, setParticularForm] = useState({
    title: '',
    content: ''
  });

  // Guests State
  const [rsvpSummary, setRsvpSummary] = useState(null);
  const [guestSearch, setGuestSearch] = useState('');

  // Announcements & Media
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', content: '' });
  const [mediaList, setMediaList] = useState([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [photoAccessPolicy, setPhotoAccessPolicy] = useState('PUBLIC');
  const [photoPasscode, setPhotoPasscode] = useState('');

  // Quick milestone inspiration presets
  const milestoneInspirations = [
    { title: 'Welcome Refreshments & Drinks', startTime: '18:00', location: 'Lounge / Courtyard' },
    { title: 'Ceremony & Vows', startTime: '18:45', location: 'Main Stage' },
    { title: 'Dinner & Food Stations', startTime: '19:30', location: 'Dining Hall' },
    { title: 'Speeches & Toasts', startTime: '20:30', location: 'Center Stage' },
    { title: 'Cake Cutting Celebration', startTime: '21:00', location: 'Dining Hall' },
    { title: 'DJ, Music & Dancing', startTime: '21:30', location: 'Dance Floor' },
    { title: 'Sparkler Send-Off', startTime: '23:00', location: 'Main Entrance' }
  ];

  // Quick guest essentials inspiration presets
  const particularInspirations = [
    { title: 'Dress Code & Attire', content: 'Smart casual or cocktail attire encouraged. Bring warm layers for the evening outdoors.' },
    { title: 'Parking & Arrival', content: 'Valet parking and dedicated guest slots are available at the main gate.' },
    { title: 'Dietary Options & Allergies', content: 'Vegetarian, vegan, and nut-free choices will be served. Note dietary needs in your RSVP.' },
    { title: 'Wishing Well / Gifts', content: 'Your presence and love are all that we ask for on our special day!' },
    { title: 'Children & Plus-Ones', content: 'Please refer to your personalized pass for allocated seats and plus-ones.' },
    { title: 'Travel & Shuttle', content: 'Complementary shuttle vans will run between the venue and central metro station every 30 mins.' }
  ];

  const getEventDateParts = (dateStr) => {
    if (!dateStr) return { month: 'DATE', day: 'TBA', weekday: 'TBA', full: 'Date to be announced' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { month: 'DATE', day: 'TBA', weekday: 'TBA', full: dateStr };
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return {
        month: months[d.getMonth()],
        day: String(d.getDate()).padStart(2, '0'),
        weekday: weekdays[d.getDay()],
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      };
    } catch {
      return { month: 'DATE', day: 'TBA', weekday: 'TBA', full: dateStr };
    }
  };

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

  useEffect(() => {
    fetchGather();
  }, [id, token]);

  const showSync = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const fetchGather = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGather(data);
        const parseTimeVal = (t) => {
          if (!t) return '18:00';
          if (Array.isArray(t)) return `${String(t[0]).padStart(2, '0')}:${String(t[1] || 0).padStart(2, '0')}`;
          return String(t).slice(0, 5);
        };
        setDetails({
          title: data.title || '',
          type: data.type || 'Dinner',
          description: data.description || '',
          coverImageUrl: data.coverImageUrl || '',
          eventDate: data.eventDate || '',
          startTime: parseTimeVal(data.startTime),
          endTime: parseTimeVal(data.endTime || '22:00')
        });
        if (data.venue) {
          setVenue({
            venueName: data.venue.venueName || '',
            address: data.venue.address || '',
            mapUrl: data.venue.mapUrl || '',
            directions: data.venue.directions || '',
            parkingInfo: data.venue.parkingInfo || ''
          });
        }
        setScheduleItems(data.schedule || []);
        setInfoBlocks(data.informationBlocks || []);
        setPhotoAccessPolicy(data.photoAccessPolicy || 'PUBLIC');
        setPhotoPasscode(data.photoPasscode || '');
        if (data.announcements && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }

        fetchSubModules(data.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubModules = async (gatherId) => {
    try {
      const [annRes, mediaRes, rsvpRes] = await Promise.all([
        fetch(apiUrl(`/api/public/gathers/${gatherId}/announcements`)).catch(() => null),
        fetch(apiUrl(`/api/organiser/gathers/${gatherId}/media`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(apiUrl(`/api/organiser/gathers/${gatherId}/rsvps`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);
      if (annRes && annRes.ok) setAnnouncements(await annRes.json());
      if (mediaRes && mediaRes.ok) setMediaList(await mediaRes.json());
      if (rsvpRes && rsvpRes.ok) setRsvpSummary(await rsvpRes.json());
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePublishWithCredit = async () => {
    if ((creditsBalance || 0) < 1) {
      setIsTopUpOpen(true);
      return;
    }
    setPublishingWithCredit(true);
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/publish-with-credit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setGather(prev => ({ ...prev, status: 'LIVE' }));
        if (fetchCreditsBalance) await fetchCreditsBalance();
        showSync('Event published');
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.message && err.message.toLowerCase().includes('insufficient')) {
          setIsTopUpOpen(true);
        } else {
          showSync(err.message || 'Publishing failed');
        }
      }
    } catch (e) {
      console.error(e);
      showSync('Publishing failed. Check connection.');
    } finally {
      setPublishingWithCredit(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/duplicate`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newGather = await res.json();
        navigate(`/gather/${newGather.id}/edit`);
      } else {
        const err = await res.json().catch(() => ({}));
        showSync(err.message || 'Could not duplicate event');
      }
    } catch (err) {
      console.error(err);
      showSync('Could not duplicate event');
    } finally {
      setDuplicating(false);
    }
  };

  const handleConcludeEarly = async () => {
    if (!window.confirm('Are you sure you want to conclude this event? RSVPs will close and details will be locked as a read-only memory keepsake.')) {
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/conclude`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setGather(prev => ({ ...prev, ...updated }));
        showSync('Celebration concluded and locked as keepsake');
      } else {
        const err = await res.json().catch(() => ({}));
        showSync(err.message || 'Could not conclude event');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDetails = async (updatedDetails) => {
    if (isConcluded) return;
    const toSave = {
      ...(updatedDetails || details),
      photoAccessPolicy,
      photoPasscode
    };
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(toSave)
      });
      if (res.ok) {
        const data = await res.json();
        setGather(prev => ({ ...prev, ...data }));
        showSync('Details saved');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhotoSecurity = async (newPolicy, newPasscode) => {
    if (isConcluded) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...details,
          photoAccessPolicy: newPolicy !== undefined ? newPolicy : photoAccessPolicy,
          photoPasscode: newPasscode !== undefined ? newPasscode : photoPasscode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGather(prev => ({ ...prev, ...data }));
        if (newPolicy !== undefined) setPhotoAccessPolicy(newPolicy);
        if (newPasscode !== undefined) setPhotoPasscode(newPasscode);
        showSync('Photo privacy updated');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVenue = async (updatedVenue) => {
    if (isConcluded) return;
    const toSave = updatedVenue || venue;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/venue`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(toSave)
      });
      if (res.ok) {
        showSync('Venue saved');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Schedule Handlers & Helpers
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    let hour, min;
    if (Array.isArray(timeStr)) {
      hour = Number(timeStr[0]);
      min = String(timeStr[1] || 0).padStart(2, '0');
    } else if (typeof timeStr === 'string') {
      const parts = timeStr.split(':');
      if (parts.length < 2) return timeStr;
      hour = parseInt(parts[0], 10);
      min = parts[1];
    } else {
      return String(timeStr);
    }
    if (isNaN(hour)) return String(timeStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${ampm}`;
  };

  const handleSeedStarterTimeline = async () => {
    const starters = [
      { title: 'Welcome Drinks & Arrivals', startTime: '18:00:00', location: venue.venueName || 'Lounge Area', dressCode: 'Smart Casual' },
      { title: 'Dinner & Food Stations', startTime: '19:30:00', location: 'Dining Hall', dressCode: '' },
      { title: 'Speeches, Music & Celebration', startTime: '21:00:00', location: 'Main Deck', dressCode: '' }
    ];
    try {
      for (const s of starters) {
        const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/schedule`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...s, eventDate: details.eventDate || new Date().toISOString().split('T')[0] })
        });
        if (res.ok) {
          const created = await res.json();
          setScheduleItems(prev => [...prev, created]);
        }
      }
      showSync('Sample schedule added');
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartAddMilestone = (preset = null) => {
    setEditingMilestoneId(null);
    if (preset) {
      setMilestoneForm({
        title: preset.title || '',
        startTime: preset.startTime || '18:00',
        location: preset.location || '',
        dressCode: preset.dressCode || '',
        description: preset.description || ''
      });
      setShowMilestoneMoreDetails(Boolean(preset.location || preset.dressCode || preset.description));
    } else {
      setMilestoneForm({
        title: '',
        startTime: details.startTime || '18:00',
        location: venue.venueName || '',
        dressCode: '',
        description: ''
      });
      setShowMilestoneMoreDetails(false);
    }
    setShowMilestoneForm(true);
  };

  const handleStartEditMilestone = (item) => {
    setEditingMilestoneId(item.id);
    let timeStr = '18:00';
    if (item.startTime) {
      if (Array.isArray(item.startTime)) {
        timeStr = `${String(item.startTime[0]).padStart(2, '0')}:${String(item.startTime[1] || 0).padStart(2, '0')}`;
      } else {
        timeStr = String(item.startTime).slice(0, 5);
      }
    }
    setMilestoneForm({
      title: item.title || '',
      startTime: timeStr,
      location: item.location || '',
      dressCode: item.dressCode || '',
      description: item.description || ''
    });
    setShowMilestoneMoreDetails(Boolean(item.location || item.dressCode || item.description));
    setShowMilestoneForm(true);
  };

  const handleCancelMilestoneForm = () => {
    setShowMilestoneForm(false);
    setEditingMilestoneId(null);
    setShowMilestoneMoreDetails(false);
    setMilestoneForm({ title: '', startTime: '18:00', location: '', dressCode: '', description: '' });
  };

  const handleSaveMilestone = async (e) => {
    if (e) e.preventDefault();
    if (isConcluded) return;
    if (!milestoneForm.title.trim()) return;

    try {
      let timeVal = milestoneForm.startTime || '18:00';
      if (timeVal.length === 5) timeVal = `${timeVal}:00`;

      const payload = {
        title: milestoneForm.title.trim(),
        startTime: timeVal,
        location: milestoneForm.location ? milestoneForm.location.trim() : '',
        dressCode: milestoneForm.dressCode ? milestoneForm.dressCode.trim() : '',
        description: milestoneForm.description ? milestoneForm.description.trim() : '',
        eventDate: details.eventDate || new Date().toISOString().split('T')[0]
      };

      if (editingMilestoneId) {
        const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/schedule/${editingMilestoneId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setScheduleItems(scheduleItems.map(i => i.id === editingMilestoneId ? updated : i));
          showSync(`Updated "${payload.title}"`);
          handleCancelMilestoneForm();
        }
      } else {
        const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/schedule`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setScheduleItems([...scheduleItems, created]);
          showSync(`Added "${payload.title}"`);
          handleCancelMilestoneForm();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMilestone = async (itemId) => {
    if (isConcluded) return;
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/schedule/${itemId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setScheduleItems(scheduleItems.filter(i => i.id !== itemId));
        if (editingMilestoneId === itemId) handleCancelMilestoneForm();
        showSync('Item removed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Guest Essentials (Particulars) Handlers
  const handleStartAddParticular = (preset = null) => {
    setEditingParticularId(null);
    if (preset) {
      setParticularForm({
        title: preset.title || '',
        content: preset.content || ''
      });
    } else {
      setParticularForm({
        title: '',
        content: ''
      });
    }
    setShowParticularForm(true);
  };

  const handleStartEditParticular = (block) => {
    setEditingParticularId(block.id);
    setParticularForm({
      title: block.title || '',
      content: block.content || ''
    });
    setShowParticularForm(true);
  };

  const handleCancelParticularForm = () => {
    setShowParticularForm(false);
    setEditingParticularId(null);
    setParticularForm({ title: '', content: '' });
  };

  const handleSaveParticular = async (e) => {
    if (e) e.preventDefault();
    if (isConcluded) return;
    if (!particularForm.title.trim() || !particularForm.content.trim()) return;

    try {
      const payload = {
        title: particularForm.title.trim(),
        content: particularForm.content.trim()
      };

      if (editingParticularId) {
        const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/info-blocks/${editingParticularId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setInfoBlocks(infoBlocks.map(b => b.id === editingParticularId ? updated : b));
          showSync('Note updated');
          handleCancelParticularForm();
        }
      } else {
        const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/info-blocks`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setInfoBlocks([...infoBlocks, created]);
          showSync('Note added');
          handleCancelParticularForm();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteParticular = async (blockId) => {
    if (isConcluded) return;
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/info-blocks/${blockId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setInfoBlocks(infoBlocks.filter(b => b.id !== blockId));
        if (editingParticularId === blockId) handleCancelParticularForm();
        showSync('Note removed');
      }
    } catch (e) {
      console.error(e);
    }
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

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    const title = newAnnouncement.title.trim();
    const message = (newAnnouncement.message || newAnnouncement.content || '').trim();
    if (!title || !message) return;
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/announcements`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, message, content: message })
      });
      if (res.ok) {
        const created = await res.json();
        setAnnouncements([created, ...announcements]);
        setNewAnnouncement({ title: '', message: '', content: '' });
        showSync('Announcement posted');
      } else {
        const err = await res.json().catch(() => ({}));
        showSync(err.message || 'Failed to post announcement');
      }
    } catch (e) {
      console.error(e);
      showSync('Error posting announcement');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/announcements/${annId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== annId));
        showSync('Announcement deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    if (mediaList.length >= MAX_PHOTOS_LIMIT) {
      setGalleryUploadError(`Maximum limit of ${MAX_PHOTOS_LIMIT} photos reached for this event.`);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/media`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fileUrl: newMediaUrl.trim(), fileName: 'Photo' })
      });
      if (res.ok) {
        const created = await res.json();
        setMediaList([...mediaList, created]);
        setNewMediaUrl('');
        setGalleryUploadError('');
        showSync('Photo added');
      } else {
        const errData = await res.json().catch(() => ({}));
        setGalleryUploadError(errData.message || 'Failed to add photo');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const galleryFileInputRef = useRef(null);

  const handleUploadGalleryFiles = async (files) => {
    if (!files || files.length === 0) return;

    if (mediaList.length >= MAX_PHOTOS_LIMIT) {
      setGalleryUploadError(`Maximum limit of ${MAX_PHOTOS_LIMIT} photos reached for this event. Please remove some photos to add new ones.`);
      return;
    }

    const remainingSlots = MAX_PHOTOS_LIMIT - mediaList.length;
    let filesToProcess = Array.from(files);

    if (filesToProcess.length > remainingSlots) {
      setGalleryUploadError(`Only ${remainingSlots} photo${remainingSlots === 1 ? '' : 's'} can be added to stay within the ${MAX_PHOTOS_LIMIT}-photo limit.`);
      filesToProcess = filesToProcess.slice(0, remainingSlots);
    } else {
      setGalleryUploadError('');
    }

    setGalleryUploading(true);

    try {
      // Silently and automatically compress high-res camera photos in browser (e.g. 15MB -> 400KB)
      const optimizedFiles = await compressImages(filesToProcess, { maxDimension: 1920, quality: 0.85 });

      const formData = new FormData();
      for (let i = 0; i < optimizedFiles.length; i++) {
        formData.append('files', optimizedFiles[i]);
      }

      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/media/upload`), {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || (data.errors && data.errors.join(', ')) || 'Failed to upload photos');
      }

      const data = await res.json();
      if (data.media && data.media.length > 0) {
        setMediaList(prev => [...prev, ...data.media]);
        showSync(`Uploaded ${data.media.length} photos`);
      }
    } catch (err) {
      setGalleryUploadError(err.message || 'Photo upload failed');
    } finally {
      setGalleryUploading(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (mediaId) => {
    try {
      const res = await fetch(apiUrl(`/api/organiser/gathers/${id}/media/${mediaId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMediaList(mediaList.filter(m => m.id !== mediaId));
        showSync('Photo deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '120px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading editor...
      </div>
    );
  }

  const renderMilestoneForm = (isEditing) => (
    <form
      onSubmit={handleSaveMilestone}
      style={{
        background: '#ffffff',
        border: isEditing ? '1.5px solid var(--accent-vermilion)' : '1px solid var(--border-strong)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: isEditing ? '0 0 0 2px rgba(255, 77, 46, 0.1), var(--shadow-sm)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Form Top Row: Title & Close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} style={{ color: 'var(--accent-vermilion)' }} />
          {isEditing ? 'Edit item' : 'Add item'}
        </span>
        <button
          type="button"
          onClick={handleCancelMilestoneForm}
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex' }}
          title="Cancel"
        >
          <X size={15} />
        </button>
      </div>

      {/* Quick Idea Pills (Clean & compact, only when creating new) */}
      {!isEditing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {[
            { label: 'Welcome Drinks', time: '18:00', icon: '🍸' },
            { label: 'Ceremony / Keynote', time: '18:45', icon: '✨' },
            { label: 'Dinner & Feast', time: '19:30', icon: '🍽️' },
            { label: 'Speeches & Toasts', time: '20:30', icon: '🥂' },
            { label: 'Music & Dancing', time: '21:30', icon: '🎵' }
          ].map((s, idx) => {
            const isSelected = milestoneForm.title === s.label;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setMilestoneForm(prev => ({ ...prev, title: s.label, startTime: s.time }))}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid var(--accent-vermilion)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--accent-vermilion-soft)' : '#f8fafc',
                  color: isSelected ? 'var(--accent-vermilion)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Primary Row: Time + Title */}
      <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px', letterSpacing: '0.02em' }}>
            TIME
          </label>
          <input
            type="time"
            value={milestoneForm.startTime}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, startTime: e.target.value })}
            required
            style={{
              width: '100%',
              fontSize: '0.84rem',
              fontWeight: 700,
              padding: '7px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: '#ffffff',
              color: 'var(--ink)'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px', letterSpacing: '0.02em' }}>
            ITEM TITLE
          </label>
          <input
            type="text"
            placeholder="e.g. Welcome Drinks & Arrivals"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            required
            style={{
              width: '100%',
              fontSize: '0.84rem',
              fontWeight: 600,
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: '#ffffff',
              color: 'var(--ink)'
            }}
          />
        </div>
      </div>

      {/* Progressive Disclosure Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowMilestoneMoreDetails(!showMilestoneMoreDetails)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--accent-vermilion)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {showMilestoneMoreDetails ? '− Less details' : '+ More details (location, dress code, notes)'}
        </button>
      </div>

      {/* Expandable Secondary Details */}
      {showMilestoneMoreDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                LOCATION
              </label>
              <input
                type="text"
                placeholder="e.g. Courtyard Lawn"
                value={milestoneForm.location}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, location: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                DRESS CODE
              </label>
              <input
                type="text"
                placeholder="e.g. Cocktail Attire"
                value={milestoneForm.dressCode}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, dressCode: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              NOTES
            </label>
            <textarea
              rows="2"
              placeholder="What should guests know? (e.g. Canapés, drinks, or seating arrangements)"
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              style={{
                width: '100%',
                fontSize: '0.78rem',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                lineHeight: 1.4,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '2px' }}>
        <button
          type="button"
          onClick={handleCancelMilestoneForm}
          style={{
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-tactile btn-tactile-vermilion"
          style={{ padding: '6px 16px', fontSize: '0.8rem', fontWeight: 700 }}
        >
          {isEditing ? 'Save changes' : 'Add item'}
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ height: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Universal Hidden File Input for Scrapbook Photo Uploads (Available from all tabs and Live Preview) */}
      <input
        ref={galleryFileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadGalleryFiles(e.target.files);
          }
        }}
      />
      
      {/* SaaS Studio Top Bar (Luma Studio Architecture) */}
      <header className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0 }} title="Back to Events">
            <ArrowLeft size={18} />
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              <Calendar size={15} strokeWidth={2.5} />
            </div>
            <span className="editor-brand-text" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Catane
            </span>
          </Link>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={isConcluded ? 'badge badge-neutral' : isPublished ? 'badge badge-live' : 'badge badge-draft'} style={isConcluded ? { background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' } : {}}>
                {isConcluded ? 'Concluded' : isPublished ? 'Published' : 'Draft'}
              </span>
              {feedback && (
                <span style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> {feedback}
                </span>
              )}
            </div>
            <h1 className="editor-header-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {details.title || 'Untitled Event'}
            </h1>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="editor-header-actions">
          {/* Quick Wallet Credits pill */}
          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="btn-tactile btn-tactile-paper"
            style={{ fontSize: '0.78rem', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            title="Credits · Click to top up"
          >
            <Ticket size={14} style={{ color: 'var(--accent-vermilion)' }} />
            <span className="editor-credits-text" style={{ fontWeight: 800 }}>{creditsBalance || 0} {(creditsBalance || 0) === 1 ? 'Credit' : 'Credits'}</span>
            <span className="editor-credits-short" style={{ fontWeight: 800 }}>{creditsBalance || 0}</span>
            <span style={{ background: 'var(--accent-vermilion)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>+</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Duplicate as new event draft"
          >
            <Copy size={13} /> <span className="editor-btn-text">{duplicating ? 'Duplicating...' : 'Duplicate'}</span>
          </button>

          <Link
            to={`/gather/${id}/preview`}
            target="_blank"
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
            title="Preview invitation"
          >
            <Eye size={14} /> <span className="editor-btn-text">Preview</span>
          </Link>

          {isConcluded ? (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="btn-tactile btn-tactile-sunflower"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              <Copy size={13} /> <span className="editor-btn-text">{duplicating ? 'Duplicating...' : 'Duplicate as New Event'}</span>
            </button>
          ) : isPublished ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="btn-tactile"
                style={{ fontSize: '0.8rem', padding: '6px 10px', backgroundColor: '#25D366', color: '#fff', whiteSpace: 'nowrap' }}
                title="Share on WhatsApp"
              >
                <MessageSquare size={13} /> <span className="editor-btn-text">WhatsApp</span>
              </button>
              <Link to={`/gather/${id}/share`} className="btn-primary" style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}>
                <Share2 size={13} /> <span className="editor-btn-text">Share</span>
              </Link>
            </div>
          ) : (creditsBalance || 0) >= 1 ? (
            <button
              type="button"
              onClick={handlePublishWithCredit}
              disabled={publishingWithCredit}
              className="btn-tactile btn-tactile-matcha"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              {publishingWithCredit ? <Loader2 size={13} className="animate-spin" /> : <Ticket size={13} />}
              {publishingWithCredit ? 'Publishing...' : <><span className="editor-btn-text">Publish </span><span>(1 cr)</span></>}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="btn-accent"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              <Ticket size={13} /> <span className="editor-btn-text">Publish </span><span>(Buy)</span>
            </button>
          )}
        </div>
      </header>

      {/* Memory Keepsake Notice Banner */}
      {isConcluded && (
        <div style={{
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.16)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              MEMORY KEEPSAKE
            </span>
            <span style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
              This celebration has concluded and is preserved in read-only mode.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="btn-tactile btn-tactile-sunflower"
            style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={13} />
            {duplicating ? 'Duplicating...' : 'Duplicate as New Event'}
          </button>
        </div>
      )}

      {/* SaaS Sub-Navigation Tabs */}
      <div className="editor-subnav-tabs">
        {[
          { id: 'designer', label: 'Designer' },
          { id: 'guests', label: `RSVPs (${rsvpSummary?.totalResponses || 0})` },
          { id: 'broadcast', label: `Announcements (${announcements.length})` },
          { id: 'gallery', label: `Photos (${mediaList.length}/${MAX_PHOTOS_LIMIT})` },
          { id: 'settings', label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 14px',
              fontSize: '0.86rem',
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-accent)' : '2px solid transparent',
              background: 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: activeTab === 'designer' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* TAB 1: PAGE DESIGNER (Split Screen: Controls on Left, Live Preview on Right) */}
        {activeTab === 'designer' && (
          <>
            {/* Mobile View Toggle between Form and Live Preview */}
            <div className="editor-mobile-designer-toggle">
              <button
                type="button"
                onClick={() => setDesignerMobileTab('form')}
                className={`btn-tactile ${designerMobileTab === 'form' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
              >
                <Edit3 size={14} /> Edit Form
              </button>
              <button
                type="button"
                onClick={() => setDesignerMobileTab('preview')}
                className={`btn-tactile ${designerMobileTab === 'preview' ? 'btn-tactile-vermilion' : 'btn-tactile-paper'}`}
              >
                <Eye size={14} /> Live Preview
              </button>
            </div>

            <div className="editor-designer-grid">
            
            {/* Controls Panel */}
            <div className={`editor-controls-column ${designerMobileTab !== 'form' ? 'mobile-hidden' : ''}`}>

            {isConcluded && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569' }}>
                  <Lock size={15} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span>Celebration concluded. Details are locked as a keepsake.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  <Copy size={12} /> Duplicate
                </button>
              </div>
            )}
            
            {/* Event Details Card */}
            <div className="saas-card" style={{ padding: '20px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 600, marginBottom: '14px' }}>Event Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label>EVENT TITLE</label>
                  <input
                    type="text"
                    value={details.title}
                    onChange={(e) => setDetails({ ...details, title: e.target.value })}
                    onBlur={() => handleSaveDetails()}
                    placeholder="e.g. Summer Sunset Gathering"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label>EVENT DATE</label>
                    <input
                      type="date"
                      value={details.eventDate}
                      onChange={(e) => {
                        const u = { ...details, eventDate: e.target.value };
                        setDetails(u);
                        handleSaveDetails(u);
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>START TIME</label>
                    <input
                      type="time"
                      value={details.startTime}
                      onChange={(e) => setDetails({ ...details, startTime: e.target.value })}
                      onBlur={() => handleSaveDetails()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <ImageUploader
                    label="COVER IMAGE"
                    value={details.coverImageUrl}
                    onChange={(url) => {
                      setDetails({ ...details, coverImageUrl: url });
                      handleSaveDetails({ ...details, coverImageUrl: url });
                    }}
                  />
                </div>

                <div>
                  <label>ABOUT THIS EVENT</label>
                  <textarea
                    rows="3"
                    value={details.description}
                    onChange={(e) => setDetails({ ...details, description: e.target.value })}
                    onBlur={() => handleSaveDetails()}
                    placeholder="Add details or a welcome note for guests..."
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Venue & Location Card */}
            <div className="saas-card" style={{ padding: '20px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 600, marginBottom: '14px' }}>Venue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label>VENUE NAME</label>
                  <input
                    type="text"
                    value={venue.venueName}
                    onChange={(e) => setVenue({ ...venue, venueName: e.target.value })}
                    onBlur={() => handleSaveVenue()}
                    placeholder="e.g. The Glasshouse"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label>ADDRESS</label>
                  <input
                    type="text"
                    value={venue.address}
                    onChange={(e) => setVenue({ ...venue, address: e.target.value })}
                    onBlur={() => handleSaveVenue()}
                    placeholder="e.g. 42 Main Street, Indiranagar"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label>GOOGLE MAPS LINK</label>
                  <input
                    type="url"
                    value={venue.mapUrl}
                    onChange={(e) => setVenue({ ...venue, mapUrl: e.target.value })}
                    onBlur={() => handleSaveVenue()}
                    placeholder="https://maps.app.goo.gl/..."
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Schedule Timeline Section */}
            <div className="saas-card" style={{ padding: '22px', flexShrink: 0 }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 240px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--accent-matcha-soft)',
                    border: '1px solid var(--accent-matcha)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-matcha)',
                    flexShrink: 0
                  }}>
                    <Clock size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)' }}>
                        Schedule
                      </h3>
                      <span className="stamp-tag" style={{
                        background: scheduleItems.length > 0 ? 'var(--accent-vermilion)' : 'var(--bg-muted)',
                        color: scheduleItems.length > 0 ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.66rem'
                      }}>
                        {scheduleItems.length > 0 ? `${scheduleItems.length} ITEMS` : 'OPTIONAL'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      Add timeline items in chronological order. Omitted if left empty.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (showMilestoneForm && !editingMilestoneId) {
                      handleCancelMilestoneForm();
                    } else {
                      handleStartAddMilestone();
                    }
                  }}
                  className={showMilestoneForm && !editingMilestoneId ? 'btn-tactile' : 'btn-tactile btn-tactile-vermilion'}
                  style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                >
                  {showMilestoneForm && !editingMilestoneId ? (
                    <>
                      <X size={14} /> Close
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add Item
                    </>
                  )}
                </button>
              </div>

              {/* Milestone Timeline / Composer Body */}
              {scheduleItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Top Composer: Only when creating a NEW milestone */}
                  {showMilestoneForm && !editingMilestoneId && (
                    <div style={{ marginBottom: '16px' }}>
                      {renderMilestoneForm(false)}
                    </div>
                  )}

                  {/* Clean Vertical Itinerary Timeline */}
                  {[...scheduleItems]
                    .sort((a, b) => {
                      const tA = a.startTime ? (Array.isArray(a.startTime) ? `${String(a.startTime[0]).padStart(2, '0')}:${String(a.startTime[1] || 0).padStart(2, '0')}` : String(a.startTime)) : '';
                      const tB = b.startTime ? (Array.isArray(b.startTime) ? `${String(b.startTime[0]).padStart(2, '0')}:${String(b.startTime[1] || 0).padStart(2, '0')}` : String(b.startTime)) : '';
                      return tA.localeCompare(tB);
                    })
                    .map((item, index, arr) => {
                      const isEditing = editingMilestoneId === item.id;
                      const isLast = index === arr.length - 1;

                      // Inline Editor when editing this specific milestone
                      if (isEditing) {
                        return (
                          <div key={item.id} style={{ marginBottom: isLast ? '0' : '12px' }}>
                            {renderMilestoneForm(true)}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            position: 'relative',
                            paddingBottom: isLast ? '0' : '12px'
                          }}
                        >
                          {/* Timeline Left: Time Stamp & Vertical Connector Line */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '68px',
                            flexShrink: 0
                          }}>
                            <div style={{
                              background: 'var(--accent-vermilion-soft)',
                              border: '1px solid rgba(255, 77, 46, 0.2)',
                              color: 'var(--accent-vermilion)',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              width: '100%',
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap'
                            }}>
                              {formatDisplayTime(item.startTime) || (typeof item.startTime === 'string' ? item.startTime.slice(0, 5) : '18:00')}
                            </div>
                            {!isLast && (
                              <div style={{
                                width: '2px',
                                flex: 1,
                                background: 'var(--border-subtle)',
                                marginTop: '4px',
                                minHeight: '16px'
                              }} />
                            )}
                          </div>

                          {/* Timeline Right: Item Content Card */}
                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              transition: 'border-color 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <h4 style={{
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                color: 'var(--ink)',
                                margin: 0,
                                lineHeight: 1.3
                              }}>
                                {item.title}
                              </h4>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditMilestone(item)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}
                                >
                                  <Edit2 size={11} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMilestone(item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    padding: '3px 5px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                                  title="Delete item"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {(item.location || item.dressCode) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '5px' }}>
                                {item.location && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--paper-subtle)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}>
                                    <MapPin size={9} /> {item.location}
                                  </span>
                                )}
                                {item.dressCode && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--paper-subtle)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}>
                                    👔 {item.dressCode}
                                  </span>
                                )}
                              </div>
                            )}

                            {item.description && (
                              <p style={{
                                fontSize: '0.76rem',
                                color: 'var(--text-secondary)',
                                marginTop: '5px',
                                lineHeight: 1.4,
                                whiteSpace: 'pre-line'
                              }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Add Next Item Quick Button */}
                  {!showMilestoneForm && (
                    <button
                      type="button"
                      onClick={() => handleStartAddMilestone()}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        padding: '9px 14px',
                        border: '1.5px dashed var(--border-strong)',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-vermilion)'; e.currentTarget.style.color = 'var(--accent-vermilion)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  )}
                </div>
              ) : (
                /* Empty state when 0 milestones added */
                showMilestoneForm ? (
                  renderMilestoneForm(false)
                ) : (
                  <div style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    background: 'var(--paper-subtle)',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      margin: '0 auto 10px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: 'var(--border-tactile-thin)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink)',
                      boxShadow: 'var(--shadow-tactile-sm)'
                    }}>
                      <Clock size={20} />
                    </div>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--ink)' }}>
                      No schedule yet
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '4px auto 14px', lineHeight: 1.45 }}>
                      Timeline items are optional and appear on your event page in order of time.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleStartAddMilestone()}
                        className="btn-tactile btn-tactile-vermilion"
                        style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                      <button
                        type="button"
                        onClick={handleSeedStarterTimeline}
                        style={{
                          padding: '7px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'var(--border-tactile-thin)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-tactile-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--ink)'
                        }}
                      >
                        <Sparkles size={13} style={{ color: 'var(--accent-sunflower)' }} />
                        Use sample schedule
                      </button>
                    </div>
                  </div>
                )
              )}

            </div>

            {/* Important Information Section */}
            <div className="saas-card" style={{ padding: '22px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 240px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--accent-cobalt-soft)',
                    border: '1px solid var(--accent-cobalt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cobalt)',
                    flexShrink: 0
                  }}>
                    <MessageSquare size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)' }}>
                        Important Information
                      </h3>
                      <span className="stamp-tag" style={{
                        background: infoBlocks.length > 0 ? 'var(--accent-cobalt)' : 'var(--bg-muted)',
                        color: infoBlocks.length > 0 ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.66rem'
                      }}>
                        {infoBlocks.length > 0 ? `${infoBlocks.length} ITEMS` : 'OPTIONAL'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      Add dress codes, gift policies, or FAQs. Omitted if left empty.
                    </p>
                  </div>
                </div>

                {!showParticularForm && (
                  <button
                    type="button"
                    onClick={() => handleStartAddParticular()}
                    className="btn-tactile"
                    style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                  >
                    <Plus size={14} /> Add Note
                  </button>
                )}
              </div>

              {/* Add / Edit Note Interactive Form */}
              {showParticularForm && (
                <form 
                  onSubmit={handleSaveParticular}
                  style={{
                    background: '#ffffff',
                    border: 'var(--border-tactile)',
                    borderRadius: '14px',
                    padding: '18px',
                    marginBottom: '18px',
                    boxShadow: 'var(--shadow-tactile-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} style={{ color: 'var(--accent-cobalt)' }} />
                      {editingParticularId ? 'Edit Note' : 'New Note'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelParticularForm}
                      style={{ color: 'var(--text-muted)', padding: '2px', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Quick Topics */}
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Suggestions:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        { title: 'Dress Code & Attire', content: 'Smart casual or cocktail attire encouraged. Bring warm layers for the evening outdoors.', icon: '👔' },
                        { title: 'Parking & Arrival', content: 'Valet parking and dedicated guest slots are available at the main gate.', icon: '🚗' },
                        { title: 'Dietary & Allergies', content: 'Vegetarian, vegan, and nut-free choices will be served. Note dietary needs in your RSVP.', icon: '🥗' },
                        { title: 'Wishing Well / Gifts', content: 'Your presence and love are all that we ask for on our special day!', icon: '🎁' },
                        { title: 'Children & Plus-Ones', content: 'Please refer to your personalized pass for allocated seats and plus-ones.', icon: '👶' },
                        { title: 'Travel & Shuttle', content: 'Complementary shuttle vans will run between the venue and central metro station every 30 mins.', icon: '🚌' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setParticularForm({
                              title: item.title,
                              content: item.content
                            });
                          }}
                          style={{
                            fontSize: '0.74rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-strong)',
                            background: particularForm.title === item.title ? 'var(--ink)' : '#ffffff',
                            color: particularForm.title === item.title ? '#ffffff' : 'var(--ink)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{item.icon}</span> {item.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      TITLE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dress Code"
                      value={particularForm.title}
                      onChange={(e) => setParticularForm({ ...particularForm, title: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        fontSize: '0.96rem',
                        fontWeight: 600,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'var(--border-tactile-thin)',
                        background: '#ffffff',
                        color: 'var(--ink)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      DETAILS
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Add details for your guests..."
                      value={particularForm.content}
                      onChange={(e) => setParticularForm({ ...particularForm, content: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        fontSize: '0.86rem',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-strong)',
                        background: '#ffffff',
                        lineHeight: 1.5,
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleCancelParticularForm}
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-tactile"
                      style={{ padding: '7px 18px', fontSize: '0.84rem', fontWeight: 700 }}
                    >
                      {editingParticularId ? 'Save Note' : 'Add Note'}
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Notes List */}
              {infoBlocks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {infoBlocks.map(block => (
                    <div
                      key={block.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '14px 16px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: 'var(--border-tactile-thin)',
                        boxShadow: 'var(--shadow-tactile-sm)',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--ink)', display: 'block', fontWeight: 700 }}>
                          {block.title}
                        </strong>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                          {block.content}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditParticular(block)}
                          title="Edit note"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteParticular(block.id)}
                          title="Delete note"
                          style={{
                            color: '#ef4444',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Next Note Button */}
                  {!showParticularForm && (
                    <button
                      type="button"
                      onClick={() => handleStartAddParticular()}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        padding: '11px 16px',
                        border: '1.5px dashed var(--border-strong)',
                        borderRadius: '10px',
                        background: '#ffffff',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cobalt)'; e.currentTarget.style.color = 'var(--accent-cobalt)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Plus size={15} /> Add Note
                    </button>
                  )}
                </div>
              ) : (
                !showParticularForm && (
                  <div style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'var(--paper-subtle)',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 12px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: 'var(--border-tactile-thin)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink)',
                      boxShadow: 'var(--shadow-tactile-sm)'
                    }}>
                      <MessageSquare size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)' }}>
                      No notes yet
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 18px', lineHeight: 1.5 }}>
                      Share dress codes, arrival notes, or gift policies with guests.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartAddParticular()}
                        className="btn-tactile"
                        style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                      >
                        <Plus size={15} /> Add Note
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartAddParticular({ title: 'Dress Code & Attire', content: 'Smart casual or cocktail attire encouraged. Bring warm layers for the evening outdoors.' })}
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'var(--border-tactile-thin)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-tactile-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--ink)'
                        }}
                      >
                        + Sample Note
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Photos Card */}
            <div className="saas-card" style={{ padding: '20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--accent-cobalt-soft)',
                    border: '1px solid var(--accent-cobalt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cobalt)',
                    flexShrink: 0
                  }}>
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)' }}>
                        Photos
                      </h3>
                      <span className="stamp-tag" style={{
                        background: mediaList.length > 0 ? (mediaList.length >= MAX_PHOTOS_LIMIT ? 'var(--accent-vermilion)' : 'var(--accent-cobalt)') : 'var(--bg-muted)',
                        color: mediaList.length > 0 ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.66rem'
                      }}>
                        {mediaList.length}/{MAX_PHOTOS_LIMIT} PHOTOS
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Upload photos, paste image links, or manage gallery privacy.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className="btn-tactile"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Manage Photos →
                </button>
              </div>
            </div>

            {/* Mobile button to jump to Live Preview */}
            <div className="editor-mobile-switch-to-preview" style={{ display: 'none', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setDesignerMobileTab('preview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-tactile btn-tactile-vermilion"
                style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
              >
                <Eye size={16} /> Switch to Live Preview →
              </button>
            </div>

          </div>

          {/* Right Live Preview Frame: Mobile Canvas Studio */}
          <div className={`editor-preview-column ${designerMobileTab !== 'preview' ? 'mobile-hidden' : ''}`}>

            {/* Mobile button to return to Edit Form */}
            <div className="editor-mobile-switch-to-form" style={{ display: 'none', width: '100%', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setDesignerMobileTab('form');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-tactile btn-tactile-dark"
                style={{ width: '100%', padding: '9px', fontSize: '0.84rem' }}
              >
                <Edit3 size={14} /> ← Back to Edit Form
              </button>
            </div>
            
            {/* Top Studio Preview Toolbar */}
            <div style={{
              width: '100%',
              maxWidth: previewDevice === 'mobile' ? '410px' : '480px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              border: 'var(--border-tactile-thin)',
              borderRadius: '12px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              boxShadow: 'var(--shadow-tactile-sm)',
              flexShrink: 0
            }}>
              {/* Left: Device Mode Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: previewDevice === 'mobile' ? 'var(--ink)' : 'transparent',
                    color: previewDevice === 'mobile' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.74rem'
                  }}
                >
                  <Smartphone size={13} /> Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: previewDevice === 'desktop' ? 'var(--ink)' : 'transparent',
                    color: previewDevice === 'desktop' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.74rem'
                  }}
                >
                  <Monitor size={13} /> Desktop
                </button>
              </div>

              {/* Center: Live Sync indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                }} />
                <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.74rem', letterSpacing: '0.3px' }}>
                  LIVE PREVIEW
                </span>
              </div>

              {/* Right: Pop out to separate tab */}
              <Link
                to={`/gather/${id}/preview`}
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--accent-vermilion)',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  textDecoration: 'none'
                }}
              >
                Preview <ExternalLink size={12} />
              </Link>
            </div>

            {/* PREVIEW CANVAS: TACTILE PHYSICAL INVITATION (AUTHENTIC CATANE DESIGN) */}
            {(() => {
              const dateParts = getEventDateParts(details.eventDate);
              const countdown = getEventCountdown(details.eventDate);

              return (
                <div
                  className="canvas-phone-frame"
                  style={{
                    width: '100%',
                    maxWidth: previewDevice === 'mobile' ? '410px' : '480px',
                    height: 'calc(100% - 48px)',
                    minHeight: '480px',
                    backgroundColor: 'var(--paper-canvas)',
                    border: 'var(--border-tactile)',
                    borderRadius: '24px',
                    boxShadow: '6px 6px 0px var(--ink)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'max-width 0.25s ease'
                  }}
                >
                  {/* Subtle Invitation Header Strip */}
                  <div style={{
                    background: 'var(--paper-card)',
                    borderBottom: 'var(--border-tactile-thin)',
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    zIndex: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)', fontSize: '0.68rem', padding: '2px 8px' }}>
                        INVITATION
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {details.type || 'Event'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-matcha)', fontWeight: 700, letterSpacing: '0.5px' }}>
                      ● PREVIEW
                    </span>
                  </div>

                  {/* Scrollable Canvas Body */}
                  <div style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: previewDevice === 'mobile' ? '16px 14px 40px' : '20px 16px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>

                    {/* 1. PHYSICAL EVENT FLYER / POSTER HEADER */}
                    <div className="tactile-card" style={{ flexShrink: 0, overflow: 'hidden', padding: 0 }}>
                      {/* Event Poster Cover */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        maxHeight: previewDevice === 'mobile' ? '240px' : '280px',
                        minHeight: '180px',
                        background: '#e2e8f0',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={resolveImageUrl(details.coverImageUrl) || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80'}
                          alt={details.title || 'Event Cover'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }}
                        />
                        {/* Stamp Tags */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
                            {(details.type || 'EVENT').toUpperCase()}
                          </span>
                          {countdown && (
                            <span className="stamp-tag" style={{
                              background: countdown === 'HAPPENING TODAY' ? 'var(--accent-matcha)' : 'var(--accent-sunflower)',
                              color: countdown === 'HAPPENING TODAY' ? '#ffffff' : 'var(--ink)'
                            }}>
                              {countdown}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Poster Details Block */}
                      <div style={{ padding: '16px 14px 14px' }}>
                        <h1 style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: previewDevice === 'mobile' ? '1.8rem' : '2.1rem',
                          lineHeight: 1.15,
                          fontWeight: 400,
                          color: 'var(--ink)',
                          marginBottom: '8px',
                          letterSpacing: '-0.01em'
                        }}>
                          {details.title || 'Untitled Gathering'}
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)', padding: '2px 6px', fontSize: '0.66rem', fontWeight: 700 }}>
                            INVITATION
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. PHYSICAL DATE & TIME STAMP BLOCK */}
                    <div className="tactile-card" style={{ flexShrink: 0, padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Tangible Rubber Stamp Block */}
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
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>
                            {dateParts.full}
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            {formatDisplayTime(details.startTime) || '6:30 PM'} {details.endTime ? `— ${formatDisplayTime(details.endTime)}` : ''}
                          </p>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => showSync('Calendar links are active on the published event page.')}
                              className="btn-tactile btn-tactile-paper"
                              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                            >
                              Google Calendar
                            </button>
                            <button
                              type="button"
                              onClick={() => showSync('Calendar links are active on the published event page.')}
                              className="btn-tactile btn-tactile-paper"
                              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                            >
                              Apple Calendar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. PHYSICAL VENUE TICKET STUB */}
                    {venue.venueName ? (
                      <div className="ticket-stub" style={{ flexShrink: 0, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="stamp-tag" style={{ background: 'var(--accent-cobalt)', color: '#ffffff' }}>
                            VENUE
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                          {venue.venueName}
                        </h3>
                        {venue.address && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {venue.address}
                          </p>
                        )}

                        {/* Perforation Line with Cutout Notches */}
                        <div className="ticket-perforation-line">
                          <div className="ticket-notch-left" />
                          <div className="ticket-notch-right" />
                        </div>

                        {/* Direction & Navigation */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                          {venue.directions && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--ink)' }}>Directions:</strong> {venue.directions}
                            </div>
                          )}

                          {venue.mapUrl && (
                            <a
                              href={venue.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-tactile btn-tactile-sunflower"
                              style={{ width: '100%', marginTop: '4px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                            >
                              <Navigation size={14} /> Open Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Top Notice Pill (Preview) */}
                    {announcements.length > 0 && (
                      <div 
                        style={{
                          background: '#fffdf0',
                          border: '2px solid #eab308',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          boxShadow: 'var(--shadow-tactile-sm)',
                          flexShrink: 0
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
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#854d0e', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
                            Host Update:
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {announcements[0].title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#854d0e', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Read →
                        </span>
                      </div>
                    )}

                    {/* 4. INLINE RSVP PASS CARD (MATCHES PUBLIC OUTCOME 1:1) */}
                    <div id="rsvp-section" className="tactile-card" style={{ flexShrink: 0, padding: '20px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span className="stamp-tag" style={{ background: 'var(--accent-vermilion)', color: '#ffffff' }}>
                          RSVP
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          PREVIEW MODE
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Attendance Pill Selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewAttendance('ATTENDING')}
                            className={`btn-tactile ${previewAttendance === 'ATTENDING' ? 'btn-tactile-matcha' : 'btn-tactile-paper'}`}
                            style={{ padding: '8px 4px', fontSize: '0.78rem' }}
                          >
                            Going
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewAttendance('MAYBE')}
                            className={`btn-tactile ${previewAttendance === 'MAYBE' ? 'btn-tactile-sunflower' : 'btn-tactile-paper'}`}
                            style={{ padding: '8px 4px', fontSize: '0.78rem' }}
                          >
                            Maybe
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewAttendance('DECLINED')}
                            className={`btn-tactile ${previewAttendance === 'DECLINED' ? 'btn-tactile-dark' : 'btn-tactile-paper'}`}
                            style={{ padding: '8px 4px', fontSize: '0.78rem' }}
                          >
                            Can't go
                          </button>
                        </div>

                        {/* Name and Headcount */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              disabled
                              placeholder="Your name *"
                              value="Guest name (preview)"
                              style={{ width: '100%', padding: '9px 12px', fontSize: '0.86rem', border: 'var(--border-tactile-thin)', background: '#fff' }}
                            />
                          </div>

                          {previewAttendance === 'ATTENDING' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: 'var(--border-tactile-thin)', borderRadius: '8px', padding: '2px 6px' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewHeadcount(prev => Math.max(1, prev - 1))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                title="Decrease headcount"
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                {previewHeadcount}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewHeadcount(prev => Math.min(8, prev + 1))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                title="Increase headcount"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        {previewAttendance === 'ATTENDING' && (
                          <div>
                            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                              DIETARY NOTES (OPTIONAL)
                            </label>
                            <input
                              type="text"
                              disabled
                              placeholder="Vegetarian, vegan, nut allergy, etc."
                              style={{ width: '100%', border: 'var(--border-tactile-thin)', padding: '8px 10px', fontSize: '0.84rem', background: '#fff' }}
                            />
                          </div>
                        )}

                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            NOTE TO HOST (OPTIONAL)
                          </label>
                          <input
                            type="text"
                            disabled
                            placeholder="Can't wait to see you!"
                            style={{ width: '100%', border: 'var(--border-tactile-thin)', padding: '8px 10px', fontSize: '0.84rem', background: '#fff' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => showSync('This is a preview. Guests submit RSVPs on the published page.')}
                          className="btn-tactile btn-tactile-vermilion"
                          style={{ width: '100%', padding: '11px', fontSize: '0.92rem', marginTop: '2px' }}
                        >
                          Submit RSVP
                        </button>
                      </div>
                    </div>

                    {/* 5. HOST BROADCAST BOARD (LIVE ANNOUNCEMENTS) */}
                    {announcements.length > 0 && (
                      <div className="tactile-card" style={{ flexShrink: 0, padding: '18px 16px', background: 'var(--accent-sunflower-soft)' }}>
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
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {idx === 0 && (
                                    <span style={{ 
                                      fontSize: '0.64rem', 
                                      fontWeight: 800, 
                                      background: 'var(--accent-sunflower)', 
                                      color: 'var(--ink)', 
                                      padding: '1px 5px', 
                                      borderRadius: '4px',
                                      letterSpacing: '0.5px'
                                    }}>
                                      LATEST
                                    </span>
                                  )}
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{ann.title}</strong>
                                </div>
                                {ann.publishedAt && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {formatPublishedAt(ann.publishedAt)}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                                {ann.message || ann.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. ABOUT THE GATHER (EDITORIAL NOTE) */}
                    {details.description && (
                      <div className="tactile-card" style={{ flexShrink: 0, padding: '18px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                            ABOUT THIS EVENT
                          </span>
                        </div>
                        <p style={{ fontSize: '0.94rem', color: 'var(--ink)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                          {details.description}
                        </p>
                      </div>
                    )}

                    {/* 7. PRINTED TIMELINE ITINERARY (SCHEDULE) */}
                    {scheduleItems.length > 0 && (
                      <div className="tactile-card" style={{ flexShrink: 0, padding: '18px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                          <Clock size={16} />
                          <span className="stamp-tag" style={{ background: 'var(--accent-matcha)', color: '#ffffff' }}>
                            SCHEDULE
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[...scheduleItems]
                            .sort((a, b) => {
                              const tA = a.startTime ? (Array.isArray(a.startTime) ? `${a.startTime[0]}:${a.startTime[1]}` : String(a.startTime)) : '';
                              const tB = b.startTime ? (Array.isArray(b.startTime) ? `${b.startTime[0]}:${b.startTime[1]}` : String(b.startTime)) : '';
                              return tA.localeCompare(tB);
                            })
                            .map((item, idx, arr) => (
                              <div
                                key={item.id || idx}
                                style={{
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'flex-start',
                                  borderBottom: idx === arr.length - 1 ? 'none' : '1px dashed #d1cfc7',
                                  paddingBottom: idx === arr.length - 1 ? '0' : '10px'
                                }}
                              >
                                <div style={{
                                  minWidth: '68px',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  color: 'var(--accent-vermilion)',
                                  paddingTop: '2px'
                                }}>
                                  {formatDisplayTime(item.startTime) || (typeof item.startTime === 'string' ? item.startTime.slice(0, 5) : '18:00')}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block' }}>
                                    {item.title}
                                  </strong>
                                  {item.description && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                                      {item.description}
                                    </p>
                                  )}
                                  {(item.location || item.dressCode) && (
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
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

                    {/* 8. GUEST ESSENTIALS / PARTICULARS FAQ */}
                    {infoBlocks.length > 0 && (
                      <div className="tactile-card" style={{ flexShrink: 0, padding: '18px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                          <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                            IMPORTANT INFORMATION
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {infoBlocks.map(block => (
                            <div key={block.id} style={{
                              padding: '10px 12px',
                              background: 'var(--paper-subtle)',
                              border: '1px solid #e5e0d4',
                              borderRadius: '8px'
                            }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block' }}>{block.title}</strong>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
                                {block.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 9. PHOTO SCRAPBOOK (Live Preview) */}
                    <div className="tactile-card" style={{ flexShrink: 0, padding: '18px 16px' }}>
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
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px'
                      }}>
                        {mediaList.length > 0 ? (
                          mediaList.map(photo => (
                            <div key={photo.id} style={{
                              height: '92px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: 'var(--border-tactile-thin)',
                              background: '#fff',
                              boxShadow: 'var(--shadow-tactile-sm)'
                            }}>
                              <img src={photo.fileUrl} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))
                        ) : (
                          [1, 2, 3, 4, 5, 6].map(slot => (
                            <div key={slot} style={{
                              height: '92px',
                              borderRadius: '8px',
                              border: '1.5px dashed var(--border-strong)',
                              background: 'var(--paper-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              color: 'var(--text-muted)'
                            }}>
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
                          Photos will appear here once uploaded.
                        </p>
                      )}
                    </div>

                    {/* 10. SHARE INVITATION */}
                    <div className="tactile-card" style={{ flexShrink: 0, padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="stamp-tag" style={{ background: 'var(--paper-subtle)', color: 'var(--ink)' }}>
                          SHARE
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Share this event link with your guests.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/gather/${id}`);
                          showSync('Link copied');
                        }}
                        className="btn-tactile btn-tactile-paper"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        <Share2 size={15} /> Copy link
                      </button>
                    </div>

                    {/* 11. FOOTER NOTE */}
                    <div style={{ textAlign: 'center', padding: '16px 0 8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 600 }}>Catane Gather</span> · Modern event invitations
                    </div>

                  </div>

                </div>
              );
            })()}

            <div style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              Live preview
            </div>
          </div>

        </div>
        </>
      )}

      {/* TAB 2: RSVPS ROSTER */}
      {activeTab === 'guests' && (
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>RSVPs</h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Track responses, headcounts, and guest notes.</p>
            </div>
            <button
              onClick={async () => {
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
                  console.error('Export CSV failed:', err);
                }
              }}
              className="btn-secondary"
            >
              <FileSpreadsheet size={15} /> Export CSV
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div className="saas-card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL RESPONSES</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>{rsvpSummary?.totalResponses || 0}</div>
            </div>
            <div className="saas-card" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>ATTENDING</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px', color: '#065f46' }}>{rsvpSummary?.attendingCount || 0}</div>
            </div>
            <div className="saas-card" style={{ padding: '16px', borderLeft: '3px solid #dc2626' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>DECLINED</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px', color: '#991b1b' }}>{rsvpSummary?.declinedCount || 0}</div>
            </div>
          </div>

          {/* Guest Search and Table */}
          <div className="saas-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search guests or notes..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                style={{ border: 'none', padding: '4px', width: '100%', outline: 'none' }}
              />
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '420px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px 18px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GUEST</th>
                    <th style={{ padding: '10px 18px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</th>
                    <th style={{ padding: '10px 18px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GUESTS</th>
                    <th style={{ padding: '10px 18px', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {(rsvpSummary?.responses || [])
                    .filter(r => r.guestName.toLowerCase().includes(guestSearch.toLowerCase()))
                    .map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 600 }}>{r.guestName}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span className={r.attendance === 'ATTENDING' ? 'badge badge-live' : 'badge badge-neutral'}>
                            {r.attendance === 'ATTENDING' ? 'Attending' : 'Declined'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                          {r.attendance === 'ATTENDING' ? `${r.guestCount} guest(s)` : '—'}
                        </td>
                        <td style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                          {r.message || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'broadcast' && (
        <div style={{ maxWidth: '740px', margin: '0 auto', padding: '24px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Bell size={20} style={{ color: 'var(--accent-terracotta)' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Host Announcements</h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Broadcast real-time updates directly to your guest event page (weather changes, room relocations, parking updates).
            </p>
          </div>

          {/* Quick Presets / Starter Chips */}
          <div className="saas-card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Templates
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { label: '📍 Venue Change', title: 'Venue Location Update', message: 'Please note the reception / ceremony has moved to...' },
                { label: '🌦️ Weather Plan', title: 'Weather & Rain Plan', message: 'Due to weather, dinner and cocktails will be hosted indoors at...' },
                { label: '🚗 Parking & Valet', title: 'Parking & Arrival Directions', message: 'Complimentary valet parking is available at the main gate. Please arrive 15 minutes early.' },
                { label: '⏰ Schedule Shift', title: 'Schedule Time Update', message: 'Our starting time has been adjusted by 30 minutes. We look forward to seeing you at...' },
                { label: '👔 Dress Code', title: 'Dress Code Reminder', message: 'Friendly reminder that the attire for tonight is cocktail / smart casual.' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewAnnouncement({ title: preset.title, message: preset.message, content: preset.message })}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-terracotta)'; e.currentTarget.style.background = 'rgba(217, 119, 6, 0.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = '#ffffff'; }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* New Announcement Form */}
          <div className="saas-card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '14px' }}>Draft new update</h3>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.5px' }}>TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cocktail Hour Moving Indoors"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.5px' }}>MESSAGE</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Due to breeze, drinks and appetizers are now being served in the Garden Lounge."
                  value={newAnnouncement.message || newAnnouncement.content || ''}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value, content: e.target.value }))}
                  style={{ width: '100%', resize: 'none', marginTop: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Announcements appear immediately at the top of your public event page.
                </span>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} /> Post update
                </button>
              </div>
            </form>
          </div>

          {/* Published Announcements List */}
          <div className="saas-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Published Announcements</h3>
              <span className="badge" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                {announcements.length} {announcements.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <Bell size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.6 }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>No announcements posted yet</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
                  When plans change or you have a reminder for guests, post an announcement here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {announcements.map((ann, idx) => (
                  <div key={ann.id || idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    padding: '14px 16px', 
                    background: '#ffffff', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    position: 'relative'
                  }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                        {ann.publishedAt && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            • {formatPublishedAt(ann.publishedAt)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {ann.message || ann.content}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this announcement?')) {
                          handleDeleteAnnouncement(ann.id);
                        }
                      }} 
                      style={{ 
                        color: 'var(--text-muted)', 
                        padding: '6px', 
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PHOTO GALLERY & PRIVACY */}
      {activeTab === 'gallery' && (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Photos & Privacy</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Upload event photos and manage privacy settings.</p>
          </div>

          {/* Photo Access Control Card */}
          <div className="saas-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: 'var(--accent-terracotta)' }} />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Photo privacy</h3>
              </div>
              <span className="badge" style={{ 
                fontSize: '0.74rem', 
                fontWeight: 600,
                background: photoAccessPolicy === 'PASSCODE' ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-tertiary)', 
                color: photoAccessPolicy === 'PASSCODE' ? 'var(--accent-terracotta)' : 'var(--text-secondary)' 
              }}>
                {photoAccessPolicy === 'PASSCODE' ? '🔑 Passcode PIN required' : '🌍 Public gallery'}
              </span>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Choose who can view photos on your event page.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {/* Option 1: PUBLIC */}
              <div
                onClick={() => {
                  setPhotoAccessPolicy('PUBLIC');
                  handleSavePhotoSecurity('PUBLIC', photoPasscode);
                }}
                style={{
                  border: photoAccessPolicy === 'PUBLIC' ? '2px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                  background: photoAccessPolicy === 'PUBLIC' ? 'rgba(217, 119, 6, 0.05)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Eye size={16} style={{ color: photoAccessPolicy === 'PUBLIC' ? 'var(--accent-terracotta)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Public</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Anyone with the event link can view photos immediately.
                </div>
              </div>

              {/* Option 2: PASSCODE */}
              <div
                onClick={() => {
                  const initialPin = photoPasscode || '2026';
                  setPhotoAccessPolicy('PASSCODE');
                  setPhotoPasscode(initialPin);
                  handleSavePhotoSecurity('PASSCODE', initialPin);
                }}
                style={{
                  border: photoAccessPolicy === 'PASSCODE' ? '2px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                  background: photoAccessPolicy === 'PASSCODE' ? 'rgba(217, 119, 6, 0.05)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Lock size={16} style={{ color: photoAccessPolicy === 'PASSCODE' ? 'var(--accent-terracotta)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Passcode required</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Guests must enter a PIN code to view photos.
                </div>
              </div>
            </div>

            {/* PIN Configuration Box */}
            {photoAccessPolicy === 'PASSCODE' && (
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '14px 18px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={16} style={{ color: 'var(--accent-terracotta)' }} />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Passcode:</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Share this passcode with guests to view photos.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. 2026"
                    value={photoPasscode}
                    onChange={(e) => setPhotoPasscode(e.target.value)}
                    style={{ 
                      width: '120px', 
                      padding: '8px 12px', 
                      fontSize: '1rem', 
                      letterSpacing: '3px', 
                      fontWeight: 700, 
                      textAlign: 'center',
                      background: '#fff' 
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSavePhotoSecurity('PASSCODE', photoPasscode)}
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    Save passcode
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="saas-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Upload photos</h4>
                  <span className="stamp-tag" style={{
                    background: mediaList.length >= MAX_PHOTOS_LIMIT ? 'var(--accent-vermilion-soft)' : 'var(--accent-cobalt-soft)',
                    color: mediaList.length >= MAX_PHOTOS_LIMIT ? 'var(--accent-vermilion)' : 'var(--accent-cobalt)',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {mediaList.length} / {MAX_PHOTOS_LIMIT}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Upload camera photos or paste image links. Large camera photos are automatically optimized.
                </p>
              </div>

              {/* Hidden File Picker Input */}
              <input
                type="file"
                ref={galleryFileInputRef}
                onChange={(e) => handleUploadGalleryFiles(e.target.files)}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: 'none' }}
                disabled={mediaList.length >= MAX_PHOTOS_LIMIT}
              />

              {/* Upload from Device CTA */}
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                disabled={galleryUploading || mediaList.length >= MAX_PHOTOS_LIMIT}
                className="btn-tactile btn-tactile-vermilion"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  opacity: mediaList.length >= MAX_PHOTOS_LIMIT ? 0.6 : 1,
                  cursor: mediaList.length >= MAX_PHOTOS_LIMIT ? 'not-allowed' : 'pointer'
                }}
              >
                {galleryUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {galleryUploading ? 'Optimizing & uploading...' : (mediaList.length >= MAX_PHOTOS_LIMIT ? `Limit reached (${MAX_PHOTOS_LIMIT}/${MAX_PHOTOS_LIMIT})` : 'Upload photos')}
              </button>
            </div>

            {galleryUploadError && (
              <div style={{ fontSize: '0.78rem', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                {galleryUploadError}
              </div>
            )}

            {/* URL input fallback */}
            <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                OR ADD VIA LINK:
              </span>
              <form onSubmit={handleAddPhoto} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  placeholder="Image link (https://...)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  disabled={mediaList.length >= MAX_PHOTOS_LIMIT}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  disabled={mediaList.length >= MAX_PHOTOS_LIMIT}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px', opacity: mediaList.length >= MAX_PHOTOS_LIMIT ? 0.6 : 1 }}
                >
                  <Plus size={14} /> Add link
                </button>
              </form>
            </div>
          </div>

          <div className="saas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 600, marginBottom: '14px' }}>Photos ({mediaList.length} / {MAX_PHOTOS_LIMIT})</h3>
            {mediaList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No photos yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {mediaList.map(m => (
                  <div key={m.id} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '130px', background: '#e2e8f0' }}>
                    <img src={resolveImageUrl(m.fileUrl)} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => handleDeletePhoto(m.id)}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Settings</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Manage your event status and options.</p>
          </div>

          <div className="saas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 600, marginBottom: '6px' }}>Status</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Status: <strong>{isConcluded ? 'Concluded (Memory Keepsake)' : isPublished ? 'Published' : 'Draft'}</strong>
            </p>
            {isConcluded ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                This celebration concluded on {details.eventDate || 'its scheduled date'}. All event memories, RSVPs, and guest photos are preserved in read-only mode.
              </p>
            ) : isPublished ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/gather/${id}/share`} className="btn-secondary">
                  <Share2 size={14} /> Share & QR
                </Link>
                <button
                  type="button"
                  onClick={handleConcludeEarly}
                  className="btn-secondary"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Conclude event and lock into read-only memory keepsake"
                >
                  Conclude event early
                </button>
              </div>
            ) : (creditsBalance || 0) >= 1 ? (
              <button
                type="button"
                onClick={handlePublishWithCredit}
                disabled={publishingWithCredit}
                className="btn-tactile btn-tactile-matcha"
                style={{ padding: '8px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {publishingWithCredit ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
                {publishingWithCredit ? 'Publishing...' : 'Publish (1 credit)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsTopUpOpen(true)}
                className="btn-accent"
                style={{ padding: '8px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Ticket size={14} /> Top up credits to publish
              </button>
            )}
          </div>

          <div className="saas-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 600, margin: 0 }}>Event Blueprint & Duplication</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Hosting another celebration? Duplicate this event to copy its venue, schedule, notes, and custom styling into a fresh draft.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={14} />
                {duplicating ? 'Duplicating...' : 'Duplicate as New Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* 1-Tap Formatted WhatsApp Share Modal */}
      <WhatsAppShareModal
        gather={gather}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      {/* Credit Top-Up Wallet Modal */}
      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          setIsTopUpOpen(false);
          handlePublishWithCredit();
        }}
      />

    </div>
  );
};
