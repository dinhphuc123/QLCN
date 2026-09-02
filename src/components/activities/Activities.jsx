import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Activities({ activities = [], onRefresh }) {
  const { isTeacher, isStudent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Học tập');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('Tất cả');

  const categories = ['Tất cả', 'Học tập', 'Phong trào', 'Thể thao / Văn nghệ', 'Hoạt động KTX', 'Sinh hoạt lớp'];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setImageUrl(dataUrl);
      setUploading(false);
      toast.success('Đã chọn ảnh kỷ niệm!');

      // Background server upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.uploadFile(formData);
        if (res?.url) setImageUrl(res.url);
      } catch (err) {
        console.warn('Server upload fallback to Base64 Data URL:', err.message);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error('Không thể đọc file ảnh này');
    };
    reader.readAsDataURL(file);
  };


  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isTeacher) { toast.error('Chỉ Cô GVCN mới có quyền đăng hoạt động của lớp!'); return; }
    if (!title.trim()) { toast.error('Vui lòng nhập tên hoạt động!'); return; }
    if (!imageUrl) { toast.error('Vui lòng chọn ảnh!'); return; }

    const newActivity = {
      id: Date.now(),
      title,
      description,
      category,
      image: imageUrl,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    // Instant local persistence
    try {
      const localActivities = JSON.parse(localStorage.getItem('qlcn_activities') || '[]');
      localStorage.setItem('qlcn_activities', JSON.stringify([newActivity, ...localActivities]));
    } catch {}

    toast.success('Đã thêm hoạt động mới!');
    setShowModal(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
    onRefresh();

    // Background sync
    try {
      await api.createActivity(newActivity);
    } catch (err) {
      console.warn('Activity API sync failed, saved locally:', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa hoạt động này?')) {
      try {
        const localActivities = JSON.parse(localStorage.getItem('qlcn_activities') || '[]');
        localStorage.setItem('qlcn_activities', JSON.stringify(localActivities.filter(a => String(a.id) !== String(id))));
      } catch {}
      toast.success('Đã xóa hoạt động!');
      onRefresh();
      try {
        await api.deleteActivity(id);
      } catch (err) {
        console.warn('deleteActivity API failed, removed locally:', err.message);
      }
    }
  };

  const filtered = filterCat === 'Tất cả' 
    ? activities 
    : activities.filter(a => a.category === filterCat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>📸 Nhật Ký Hoạt Động Hàng Ngày — Lớp 12.7</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
              Lưu giữ những khoảnh khắc kỷ niệm, phong trào học tập và sinh hoạt nội trú KTX
            </p>
          </div>
          {isTeacher && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              ➕ Thêm kỷ niệm / hoạt động
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                background: filterCat === cat ? 'var(--color-primary-dark)' : '#f3f4f6',
                color: filterCat === cat ? 'white' : '#4b5563',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🖼️</div>
          <h4 style={{ margin: 0, color: '#4b5563' }}>Chưa có hoạt động nào trong mục này</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Hãy bấm "Thêm kỷ niệm" để lưu hình ảnh đẹp của lớp!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(act => (
            <div key={act.id} className="glass-panel" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '200px', background: '#f3f4f6' }}>
                <img 
                  src={act.image} 
                  alt={act.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80'; }}
                />
                <span style={{
                  position: 'absolute', top: '0.75rem', left: '0.75rem',
                  background: 'rgba(0,0,0,0.65)', color: 'white', backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600
                }}>
                  {act.category || 'Hoạt động'}
                </span>
                {isTeacher && (
                  <button
                    onClick={() => handleDelete(act.id)}
                    style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none',
                      borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                    }}
                    title="Xóa hoạt động"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#111827' }}>{act.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>{act.description}</p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📅 {act.date}</span>
                  <span>📷 Lớp 12.7</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create activity */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>📸 Thêm Kỷ Niệm Hoạt Động Mới</h3>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Tên hoạt động *</label>
              <input 
                type="text" className="form-input" style={{ width: '100%' }}
                placeholder="VD: Buổi cắm trại Đoàn trường..."
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Danh mục</label>
              <select className="form-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.filter(c => c !== 'Tất cả').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Mô tả ngắn</label>
              <textarea 
                className="form-input" style={{ width: '100%', height: '70px' }}
                placeholder="Cảm nghĩ, không khí buổi sinh hoạt..."
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Hình ảnh kỷ niệm</label>
              <input type="file" accept="image/*" className="form-input" style={{ width: '100%' }} onChange={handleFileUpload} />
              {uploading && <p style={{ fontSize: '0.75rem', color: '#2563eb' }}>Đang tải ảnh lên...</p>}
              {imageUrl && (
                <div style={{ marginTop: '0.5rem', height: '120px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button className="btn-primary" onClick={handleCreate} disabled={uploading}>Đăng hoạt động</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
