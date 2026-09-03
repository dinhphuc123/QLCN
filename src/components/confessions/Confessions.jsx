import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useClassSettings } from '../../context/ClassSettingsContext';

export default function Confessions({ confessions, isTeacher, onRefresh }) {
  const { settings } = useClassSettings();
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) { toast.error('Vui lòng nhập nội dung!'); return; }
    setSending(true);

    const newConf = {
      id: Date.now(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      anonymous,
      createdAt: new Date().toISOString(),
    };

    // Instant local persistence
    try {
      const localConfessions = JSON.parse(localStorage.getItem('qlcn_confessions') || '[]');
      localStorage.setItem('qlcn_confessions', JSON.stringify([newConf, ...localConfessions]));
    } catch {}

    setContent('');
    toast.success(`Tâm sự đã được gửi an toàn đến GVCN ${settings.teacherName} 💌`, { duration: 4000 });
    setSending(false);
    onRefresh();

    // Background sync
    try {
      await api.createConfession(newConf);
    } catch (err) {
      console.warn('createConfession API background sync failed (saved locally):', err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>💌 Hòm thư tâm sự & Ẩn danh</h3>
      <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '2rem' }}>
        Kênh kết nối an toàn — học sinh nội trú chia sẻ áp lực ôn thi và tâm tư đời sống với GVCN.
      </p>

      {/* Send form (Only visible for Students / non-Teacher) */}
      {!isTeacher && (
        <div style={{ background: 'linear-gradient(135deg, #f9f9f9, #f0fdf4)', padding: '1.75rem', borderRadius: '1rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>✍️ Gửi lời tâm sự của bạn</h4>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="form-input"
            style={{ width: '100%', minHeight: '120px', resize: 'vertical', marginBottom: '1rem' }}
            placeholder={`Bạn đang nghĩ gì? Hãy chia sẻ với cô ${settings.teacherName}...`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <span>🎭 Gửi ẩn danh (không hiện danh tính)</span>
            </label>
            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={sending}
              style={{ padding: '0.6rem 1.75rem', opacity: sending ? 0.7 : 1 }}
            >
              {sending ? '⏳ Đang gửi...' : '💌 Gửi ngay'}
            </button>
          </div>
        </div>
      )}

      {/* Teacher view */}
      {isTeacher ? (
        <div>
          <h4 style={{ marginBottom: '1rem' }}>📬 Hộp thư GVCN nhận được ({confessions.length})</h4>
          {confessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'gray' }}>📭 Chưa có tâm sự nào</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {confessions.map(c => (
                <div key={c.id} style={{
                  padding: '1.25rem', borderRadius: '0.875rem',
                  background: c.anonymous ? 'linear-gradient(135deg, #f9f9f9, #ecfdf5)' : 'linear-gradient(135deg, #f9f9f9, #eff6ff)',
                  border: '1px solid ' + (c.anonymous ? '#a7f3d0' : '#bfdbfe'),
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{c.anonymous ? '🎭' : '👤'}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.anonymous ? '#065f46' : '#1e40af' }}>
                      {c.anonymous ? 'Ẩn danh' : 'Học sinh lớp 12.7'}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: 'auto' }}>
                      {new Date(c.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p style={{ fontStyle: 'italic', color: '#374151', lineHeight: 1.65, margin: 0 }}>"{c.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f9fafb', borderRadius: '0.75rem', color: 'gray' }}>
          🔒 Chỉ GVCN mới có quyền đọc hòm thư tâm sự ẩn danh này.
        </div>
      )}
    </div>
  );
}
