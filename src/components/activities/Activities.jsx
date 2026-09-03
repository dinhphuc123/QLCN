import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Activities({ activities = [], onRefresh }) {
  const { isTeacher } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Học tập');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

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

    try {
      await api.createActivity(newActivity);
    } catch (err) {
      console.warn('Activity API sync failed, saved locally:', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!isTeacher) return;
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

  const filtered = activities.filter(a => {
    const matchCategory = filterCat === 'Tất cả' || a.category === filterCat;
    const matchSearch = !searchTerm.trim() ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 3-Stat Metric Cards Header Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* Stat Card 1 */}
        <div className="glass-panel" style={{ padding: '1.15rem 1.35rem', borderLeft: '5px solid #0284c7', background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📸 Tổng Kỷ Niệm Hoạt Động
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0c4a6e', marginTop: '0.2rem' }}>
            {activities.length} Khoảnh Khắc
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
            Lưu giữ hình ảnh phong trào lớp 12.7
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-panel" style={{ padding: '1.15rem 1.35rem', borderLeft: '5px solid #16a34a', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏆 Phong Trào & Thi Đua
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#14532d', marginTop: '0.2rem' }}>
            Top 1 Phong Trào Đoàn
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
            Xuất sắc toàn diện cấp trường
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-panel" style={{ padding: '1.15rem 1.35rem', borderLeft: '5px solid #d97706', background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏡 Sinh Hoạt Nội Trú KTX
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#78350f', marginTop: '0.2rem' }}>
            100% Đạt Chuẩn Văn Minh
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
            Kỷ luật nếp sống phòng ở KTX
          </div>
        </div>

      </div>

      {/* Filter & Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '1.15rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.55rem 0.85rem', fontSize: '0.82rem', borderRadius: '0.65rem' }}
              placeholder="🔍 Tìm kiếm tên hoặc nội dung hoạt động..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Button - GVCN only */}
          {isTeacher && (
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', background: '#0284c7', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}
            >
              ➕ Thêm kỷ niệm / hoạt động
            </button>
          )}

        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginRight: '0.2rem' }}>
            Danh mục:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '0.35rem 0.8rem', borderRadius: '9999px', border: '1.5px solid transparent', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s ease',
                background: filterCat === cat ? '#0284c7' : '#f1f5f9',
                color: filterCat === cat ? 'white' : '#475569',
                borderColor: filterCat === cat ? '#0284c7' : '#e2e8f0'
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
          <h4 style={{ margin: 0, color: '#4b5563', fontWeight: 800 }}>Chưa có hoạt động nào trong mục này</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: '#64748b' }}>
            {isTeacher ? 'Hãy bấm "Thêm kỷ niệm" để lưu hình ảnh đẹp của lớp!' : 'Hình ảnh hoạt động mới nhất từ Cô GVCN sẽ hiển thị tại đây.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                  background: 'rgba(0,0,0,0.68)', color: 'white', backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700
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
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>{act.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.45' }}>{act.description}</p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.75rem', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0c4a6e' }}>📸 Thêm Kỷ Niệm Hoạt Động Mới (GVCN)</h3>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tên hoạt động *</label>
              <input 
                type="text" className="form-input" style={{ width: '100%', fontSize: '0.88rem' }}
                placeholder="VD: Buổi cắm trại Đoàn trường..."
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Danh mục</label>
              <select className="form-input" style={{ width: '100%', fontSize: '0.88rem' }} value={category} onChange={e => setCategory(e.target.value)}>
                {categories.filter(c => c !== 'Tất cả').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Mô tả ngắn</label>
              <textarea 
                className="form-input" style={{ width: '100%', height: '70px', fontSize: '0.88rem' }}
                placeholder="Cảm nghĩ, không khí buổi sinh hoạt..."
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Hình ảnh kỷ niệm *</label>
              <input type="file" accept="image/*" className="form-input" style={{ width: '100%', fontSize: '0.85rem' }} onChange={handleFileUpload} />
              {uploading && <p style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '0.3rem' }}>Đang tải ảnh lên...</p>}
              {imageUrl && (
                <div style={{ marginTop: '0.5rem', height: '120px', borderRadius: '0.65rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.55rem 1.2rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>Hủy</button>
              <button className="btn-primary" onClick={handleCreate} disabled={uploading} style={{ padding: '0.55rem 1.4rem', background: '#0284c7', fontSize: '0.82rem' }}>Đăng hoạt động</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
