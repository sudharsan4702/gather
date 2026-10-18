import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, resolveImageUrl } from '../config/api';
import { compressImage } from '../utils/imageCompressor';

export const ImageUploader = ({
  value = '',
  onChange,
  label = 'Cover Image',
  placeholder = 'https://images.unsplash.com/...',
  aspectRatio = '16/9'
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Quick aesthetic inspiration covers
  const presets = [
    { label: 'Dinner & Wine', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Wedding Floral', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Celebration Confetti', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Sunset Rooftop', url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80' }
  ];

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Select a valid image file (JPEG, PNG, WEBP, GIF, or SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size cannot exceed 15MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const optimizedFile = await compressImage(file, { maxDimension: 1920, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', optimizedFile);

      const res = await fetch(apiUrl('/api/organiser/upload'), {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Upload failed. Please try again.');
      }

      const data = await res.json();
      const uploadedUrl = data.url;
      setUrlInput(uploadedUrl);
      if (onChange) {
        onChange(uploadedUrl);
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    if (onChange) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    setUrlInput('');
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}

      {/* When an image is already set */}
      {value ? (
        <div style={{
          position: 'relative',
          borderRadius: '12px',
          border: 'var(--border-tactile-thin)',
          overflow: 'hidden',
          background: 'var(--paper-subtle)',
          boxShadow: 'var(--shadow-tactile-sm)'
        }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio, maxHeight: '200px', background: '#e2e8f0' }}>
            {!imageLoadError ? (
              <img
                src={resolveImageUrl(value)}
                alt="Cover preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }}
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                textAlign: 'center',
                background: '#fef2f2',
                color: '#991b1b',
                gap: '4px'
              }}>
                <strong style={{ fontSize: '0.82rem' }}>Image failed to load</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Check the URL or choose a different image file.</span>
              </div>
            )}
            {/* Quick Actions Overlay */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="stamp-tag"
                style={{
                  background: 'rgba(24, 21, 18, 0.85)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Upload size={12} /> {uploading ? 'Uploading...' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="stamp-tag"
                style={{
                  background: 'rgba(225, 29, 72, 0.9)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '4px 8px'
                }}
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.includes('/uploads/') ? '📁 Uploaded from Device' : value}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveMode(activeMode === 'url' ? 'upload' : 'url');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cobalt)', fontWeight: 600, cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Edit URL
            </button>
          </div>
        </div>
      ) : (
        /* Empty State: Choice between Device Upload or Web URL */
        <div style={{
          border: isDragOver ? '2px dashed var(--accent-vermilion)' : '1.5px dashed var(--border-strong)',
          borderRadius: '12px',
          background: isDragOver ? 'var(--accent-vermilion-soft)' : '#ffffff',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'all 0.15s ease'
        }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Top Toggle Switch */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeMode === 'upload' ? '#ffffff' : 'transparent',
                color: activeMode === 'upload' ? 'var(--ink)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'upload' ? 700 : 500,
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: activeMode === 'upload' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Upload size={13} /> Upload file
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: activeMode === 'url' ? '#ffffff' : 'transparent',
                color: activeMode === 'url' ? 'var(--ink)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'url' ? 700 : 500,
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: activeMode === 'url' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <LinkIcon size={13} /> Image link
            </button>
          </div>

          {/* Mode 1: Device File Upload */}
          {activeMode === 'upload' ? (
            <div style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--paper-subtle)',
                border: 'var(--border-tactile-thin)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                color: 'var(--ink)'
              }}>
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              </div>

              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '3px' }}>
                {uploading ? 'Uploading...' : 'Drop image here or browse'}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                Best: Landscape 16:9 photo (e.g. 1200×675px)
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                JPG, PNG, or WEBP · Vertical photos crop to fit the header
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-tactile btn-tactile-paper"
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
              >
                <ImageIcon size={14} /> Browse files
              </button>
            </div>
          ) : (
            /* Mode 2: Paste Web URL */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  placeholder={placeholder}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '8px 10px' }}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="btn-tactile btn-tactile-matcha"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  <Check size={14} /> Apply
                </button>
              </div>

              {/* Sample Cover Presets */}
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Sample covers:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setUrlInput(p.url);
                        if (onChange) onChange(p.url);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: '#ffffff',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {uploadError && (
        <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
          {uploadError}
        </div>
      )}
    </div>
  );
};
