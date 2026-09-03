import React from 'react';
import toast from 'react-hot-toast';

export default function NotificationReadTrackerModal({ announcement, students = [], onClose }) {
  if (!announcement) return null;

  const readBySet = new Set(announcement.readBy || []);
  const groups = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

  const groupStats = groups.map(groupName => {
    const groupStudents = students.filter(s => s.group === groupName);
    const readStudents = groupStudents.filter(s => readBySet.has(s.id));
    const unreadStudents = groupStudents.filter(s => !readBySet.has(s.id));
    const total = groupStudents.length || 10;
    const readCount = readStudents.length;
    const percentage = Math.round((readCount / total) * 100);

    return {
      groupName,
      total,
      readCount,
      percentage,
      readStudents,
      unreadStudents
    };
  });

  const totalRead = Array.from(readBySet).length;
  const totalStudents = students.length || 40;
  const allUnreadStudents = students.filter(s => !readBySet.has(s.id));

  const handleCopyUnreadSMS = () => {
    const names = allUnreadStudents.map(s => `${s.name} (${s.group || 'Lớp'})`).join(', ');
    const text = `[NHẮC NHỞ XÁC NHẬN THÔNG BÁO]
GVCN nhắc các em học sinh sau chưa xác nhận đã đọc thông báo "${announcement.title}":
${names || 'Đã đọc đủ 100%!'}
Đề nghị các em đăng nhập Sổ Chủ Nhiệm Số và bấm nút "Đã đọc".`;

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép tin nhắn nhắc nhở Zalo/SMS!');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1.25rem', overflowY: 'auto'
    }} onClick={onClose}>
      <div className="modal-inner" style={{
        background: '#ffffff',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '88vh',
        overflowY: 'auto',
        margin: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1px solid rgba(0,0,0,0.1)'
      }} onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
              📊 THỐNG KÊ ĐÃ ĐỌC CHI TIẾT
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.1rem', color: '#0f172a' }}>
              {announcement.title}
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        {/* Overall Progress */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.85rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <span>Tiến độ đọc toàn lớp:</span>
            <span style={{ color: '#0284c7' }}>{totalRead} / {totalStudents} HS ({Math.round((totalRead / totalStudents) * 100)}%)</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${(totalRead / totalStudents) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* 4 Groups Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {groupStats.map(stat => (
            <div key={stat.groupName} style={{
              background: stat.percentage === 100 ? '#f0fdf4' : '#fff8f6',
              border: `1px solid ${stat.percentage === 100 ? '#bbf7d0' : '#ffedd5'}`,
              borderRadius: '0.75rem',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>{stat.groupName}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: stat.percentage === 100 ? '#16a34a' : '#ea580c', margin: '0.2rem 0' }}>
                {stat.percentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {stat.readCount}/{stat.total} HS đã đọc
              </div>
            </div>
          ))}
        </div>

        {/* Unread Students List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626' }}>
              ⚠️ Học sinh chưa xác nhận đã đọc ({allUnreadStudents.length})
            </h4>
            {allUnreadStudents.length > 0 && (
              <button onClick={handleCopyUnreadSMS} style={{
                fontSize: '0.75rem', background: '#2563eb', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer'
              }}>
                📋 Copy tin nhắn Zalo nhắc nhở
              </button>
            )}
          </div>

          {allUnreadStudents.length === 0 ? (
            <div style={{ padding: '1rem', background: '#f0fdf4', color: '#166534', borderRadius: '0.75rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
              🎉 Tuyệt vời! 100% học sinh trong lớp đã đọc thông báo này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              {allUnreadStudents.map(s => (
                <span key={s.id} style={{
                  fontSize: '0.78rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.25rem 0.55rem', borderRadius: '9999px', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  <strong>{s.name}</strong> <small style={{ color: '#0284c7' }}>({s.group})</small>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
