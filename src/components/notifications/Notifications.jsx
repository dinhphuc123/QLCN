import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import NotificationReadTrackerModal from './NotificationReadTrackerModal';

const TAG_COLORS = {
  '🚨 KHẨN': { bg: '#fee2e2', text: '#dc2626' },
  'Học tập': { bg: '#dbeafe', text: '#1e40af' },
  'Nề nếp':  { bg: '#fef3c7', text: '#92400e' },
  'Kế hoạch tuần': { bg: '#e0e7ff', text: '#3730a3' },
  'Kế hoạch tháng': { bg: '#f3e8ff', text: '#6b21a8' },
  'Ký túc xá': { bg: '#dcfce7', text: '#166534' },
};

function NewAnnouncementModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('Học tập');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setFileUrl(dataUrl);
      setFileName(file.name);
      setUploading(false);
      toast.success('Đã đính kèm file!');

      // Try background server upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.uploadFile(formData);
        if (res?.url) {
          setFileUrl(res.url);
          setFileName(res.filename || file.name);
        }
      } catch (apiErr) {
        console.warn('Server upload fallback to Data URL:', apiErr.message);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error('Không thể đọc file này');
    };
    reader.readAsDataURL(file);
  };


  const handleSave = () => {
    if (!title.trim() || !content.trim()) { toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung!'); return; }
    onSave({ 
      title: title.trim(), 
      content: content.trim(), 
      tag, 
      date: new Date().toISOString().split('T')[0],
      attachment: fileUrl ? { url: fileUrl, name: fileName } : null
    });
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.25rem', overflowY: 'auto'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '1.25rem', padding: '1.75rem 2rem',
          width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto',
          margin: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          display: 'flex', flexDirection: 'column', gap: '1.1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
            📢 Đăng Thông Báo / Kế Hoạch Mới
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#334155' }}>Tiêu đề thông báo *</label>
          <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Nhập tiêu đề..." value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#334155' }}>Phân loại (Tag)</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {Object.keys(TAG_COLORS).map(t => (
              <button key={t} onClick={() => setTag(t)} style={{
                padding: '0.35rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', cursor: 'pointer',
                fontWeight: tag === t ? 700 : 500,
                background: tag === t ? TAG_COLORS[t].bg : 'white',
                color: tag === t ? TAG_COLORS[t].text : '#6b7280',
                border: `1.5px solid ${tag === t ? TAG_COLORS[t].text : '#d1d5db'}`,
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#334155' }}>Nội dung chi tiết *</label>
          <textarea className="form-input" style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            placeholder="Viết nội dung chỉ đạo, lưu ý..." value={content} onChange={e => setContent(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#334155' }}>File đính kèm (PDF / Word / Ảnh)</label>
          <input type="file" className="form-input" style={{ width: '100%' }} onChange={handleFileUpload} />
          {uploading && <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.2rem' }}>Đang nạp file...</p>}
          {fileName && <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: '0.2rem' }}>📎 Đã đính kèm: {fileName}</p>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
          <button className="btn-primary" onClick={handleSave} disabled={uploading}>📢 Đăng thông báo</button>
        </div>
      </div>
    </div>
  );
}

export default function Notifications({ announcements = [], students = [], onRefresh }) {
  const { user, isTeacher } = useAuth();
  const [activeTag, setActiveTag] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [trackingAnn, setTrackingAnn] = useState(null);


  // Sort urgent announcements first
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.tag === '🚨 KHẨN' && b.tag !== '🚨 KHẨN') return -1;
    if (a.tag !== '🚨 KHẨN' && b.tag === '🚨 KHẨN') return 1;
    return b.id - a.id;
  });

  const filtered = activeTag === 'All' 
    ? sortedAnnouncements 
    : sortedAnnouncements.filter(a => a.tag === activeTag);

  const currentUserId = user?.id || 1;
  const unreadCount = announcements.filter(a => !(a.readBy || []).includes(currentUserId)).length;

  const handleCreate = async (body) => {
    const newAnn = {
      ...body,
      id: Date.now(),
      readBy: [],
      createdAt: new Date().toISOString()
    };

    // Instant local storage persistence for 100% fail-safe UX
    try {
      const localAnns = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]');
      localStorage.setItem('qlcn_announcements', JSON.stringify([newAnn, ...localAnns]));
    } catch {}

    try {
      await api.createAnnouncement(newAnn);
      toast.success('Thông báo đã được đăng và lưu lên Cloud thành công!');
    } catch (err) {
      console.warn('API sync failover (saved locally):', err.message);
      toast.warning(`Đã lưu trên máy. Đang chờ kết nối Cloud: ${err.message}`);
    }

    setShowModal(false);
    onRefresh();
  };

  const handleMarkRead = async (ann) => {
    if ((ann.readBy || []).includes(currentUserId)) return;
    // Instant local update
    try {
      const localAnns = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]');
      const updated = localAnns.map(a => String(a.id) === String(ann.id)
        ? { ...a, readBy: [...(a.readBy || []), currentUserId] }
        : a
      );
      localStorage.setItem('qlcn_announcements', JSON.stringify(updated));
    } catch {}
    toast.success('Đã xác nhận đã đọc!');
    onRefresh();
    // Background sync
    try {
      await api.markRead(ann.id);
    } catch (err) {
      console.warn('markRead API sync failed, updated locally:', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
      // Instant local removal
      try {
        const localAnns = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]');
        localStorage.setItem('qlcn_announcements', JSON.stringify(localAnns.filter(a => String(a.id) !== String(id))));
      } catch {}
      toast.success('Đã xóa thông báo!');
      onRefresh();
      // Background sync
      try {
        await api.deleteAnnouncement(id);
      } catch (err) {
        console.warn('deleteAnnouncement API failed, removed locally:', err.message);
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>📢 Kênh Thông Báo & Kế Hoạch Lớp 12.7</h3>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
            Tổng số: <strong>{announcements.length}</strong> thông báo
            {unreadCount > 0 && (
              <span style={{ marginLeft: '0.5rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.75rem' }}>
                🔔 {unreadCount} thông báo chưa đọc
              </span>
            )}
          </p>
        </div>
        {isTeacher && (
          <button className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }} onClick={() => setShowModal(true)}>
            ➕ Đăng thông báo / Kế hoạch
          </button>
        )}
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', ...Object.keys(TAG_COLORS)].map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)} style={{
            padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.8rem', cursor: 'pointer',
            fontWeight: activeTag === tag ? 700 : 500,
            background: activeTag === tag ? 'var(--color-primary-dark)' : 'white',
            color: activeTag === tag ? 'white' : '#374151',
            border: '1.5px solid ' + (activeTag === tag ? 'transparent' : '#e5e7eb'),
          }}>
            {tag === 'All' ? '📂 Tất cả' : tag}
          </button>
        ))}
      </div>

      {/* Notifications Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'gray' }}>📭 Chưa có thông báo nào trong danh mục này</div>
        ) : filtered.map(ann => {
          const tc = TAG_COLORS[ann.tag] || TAG_COLORS['Học tập'];
          const alreadyRead = (ann.readBy || []).includes(currentUserId);
          const isUrgent = ann.tag === '🚨 KHẨN';

          return (
            <div key={ann.id} style={{
              padding: '1.5rem', background: isUrgent ? '#fff5f5' : 'white',
              borderRadius: '1rem', border: `1.5px solid ${isUrgent ? '#fca5a5' : '#f3f4f6'}`,
              boxShadow: isUrgent ? '0 4px 16px rgba(220,38,38,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
              borderLeft: `5px solid ${tc.text}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ color: isUrgent ? '#b91c1c' : 'var(--color-primary-dark)', fontFamily: 'var(--font-serif)', fontSize: '1.15rem', margin: 0 }}>
                    {ann.title}
                  </h4>
                  <span style={{ background: tc.bg, color: tc.text, fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                    {ann.tag}
                  </span>
                  {!alreadyRead && (
                    <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>
                      🔔 Mới
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>📅 {ann.date}</span>
                  {isTeacher && (
                    <button onClick={() => handleDelete(ann.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }} title="Xóa">
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.65, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                {ann.content}
              </p>

              {/* Attachment link if exists */}
              {ann.attachment && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📎 File đính kèm:</span>
                  <a href={ann.attachment.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.85rem' }}>
                    {ann.attachment.name} 📥
                  </a>
                </div>
              )}

              {/* Read Receipt Footer */}
              <div style={{ display: 'flex', justifyContent: isTeacher ? 'flex-end' : 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                {!isTeacher && (
                  <button
                    onClick={() => handleMarkRead(ann)}
                    disabled={alreadyRead}
                    style={{
                      padding: '0.45rem 1.1rem', fontSize: '0.8rem', borderRadius: '9999px',
                      background: alreadyRead ? '#f0fdf4' : '#0369a1',
                      color: alreadyRead ? '#166534' : 'white',
                      border: alreadyRead ? '1px solid #86efac' : 'none',
                      cursor: alreadyRead ? 'default' : 'pointer', fontWeight: 800,
                      boxShadow: alreadyRead ? 'none' : '0 2px 8px rgba(3,105,161,0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {alreadyRead ? '✓ Đã Check-in nhận thông báo' : '🔔 Bấm Check-in xác nhận đã đọc'}
                  </button>
                )}

                <button
                  onClick={() => setTrackingAnn(ann)}
                  style={{
                    fontSize: '0.82rem', color: '#0284c7', background: '#e0f2fe',
                    border: '1.5px solid #7dd3fc', padding: '0.4rem 0.95rem',
                    borderRadius: '9999px', fontWeight: 800, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)'
                  }}
                  title="Bấm xem chi tiết tiến độ đọc 4 Tổ"
                >
                  📊 Tiến độ Check-in đọc: <strong>{(ann.readBy || []).length} / {students.length || 40}</strong> HS (Xem chi tiết 4 Tổ)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <NewAnnouncementModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {trackingAnn && (
        <NotificationReadTrackerModal
          announcement={trackingAnn}
          students={students}
          onClose={() => setTrackingAnn(null)}
        />
      )}
    </div>
  );
}
