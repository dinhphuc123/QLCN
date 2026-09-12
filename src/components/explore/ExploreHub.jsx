import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

export default function ExploreHub({ setActiveTab, onOpenPinModal }) {
  const { user, logout } = useAuth();
  const { settings } = useClassSettings();

  const features = [
    {
      id: 'requests',
      icon: '✉️',
      title: 'Đơn Xin Nghỉ Phép',
      desc: 'Gửi đơn nghỉ học hoặc xin ra ngoài KTX tới GVCN',
      color: '#7c3aed',
      bg: '#faf5ff',
      border: '#e9d5ff',
      badge: 'Cần thiết'
    },
    {
      id: 'notifications',
      icon: '📢',
      title: 'Thông Báo Lớp',
      desc: 'Xem toàn bộ thông báo, kế hoạch tuần & tài liệu tải về',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      badge: 'Cập nhật'
    },
    {
      id: 'exam',
      icon: '🧭',
      title: 'Hướng Nghiệp & Nguyện Vọng',
      desc: 'Khảo sát nhóm ngành, trắc nghiệm tính cách & chọn trường ĐH',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      badge: 'Lớp 12'
    },
    {
      id: 'confessions',
      icon: '🤫',
      title: 'Hộp Thư Tâm Sự',
      desc: 'Chia sẻ tâm tư, khúc mắc học đường ẩn danh tới Cô GVCN',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badge: 'Ẩn danh'
    },
    {
      id: 'students',
      icon: '👥',
      title: 'Hồ Sơ & Danh Sách Lớp',
      desc: `Xem danh sách 32 thành viên, ban cán sự và các tổ lớp ${settings.className}`,
      color: '#475569',
      bg: '#f8fafc',
      border: '#e2e8f0',
      badge: 'Hồ sơ'
    },
    {
      id: 'activities',
      icon: '📸',
      title: 'Album Hoạt Động',
      desc: 'Khoảnh khắc kỷ niệm, phong trào thi đua và sinh hoạt ngoại khóa',
      color: '#ec4899',
      bg: '#fdf2f8',
      border: '#fbcfe8',
      badge: 'Kỷ niệm'
    },
    {
      id: 'parent_portal',
      icon: '📱',
      title: 'Sổ Liên Lạc Phụ Huynh',
      desc: 'Xem thông tin chuyên cần, điểm rèn luyện định hướng gia đình',
      color: '#0d9488',
      bg: '#f0fdfa',
      border: '#99f6e4',
      badge: 'Gia đình'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header Profile Summary */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #1B4D53, #2D6A70)',
        color: 'white',
        borderRadius: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%',
            background: 'white', color: '#1B4D53',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 900,
            border: '2px solid rgba(255,255,255,0.8)'
          }}>
            {user?.name ? user.name.split(' ').pop()[0] : '🎓'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#e0f2fe', fontWeight: 600 }}>
              Trung Tâm Tiện Ích & Mở Rộng
            </div>
            <h2 style={{ margin: '0.15rem 0', fontSize: '1.35rem', fontWeight: 900, color: 'white' }}>
              {user?.name || 'Học sinh 12.7'}
            </h2>
            <div style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 600 }}>
              Lớp {settings.className} • {user?.group || 'Tổ 1'} • KTX {user?.dormRoom || 'A1-07'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onOpenPinModal && (
            <button
              onClick={onOpenPinModal}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                color: 'white', fontSize: '0.78rem', fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              🔑 Đổi PIN
            </button>
          )}
          <button
            onClick={logout}
            style={{
              padding: '0.45rem 0.9rem', borderRadius: '9999px',
              background: '#ef4444', border: 'none',
              color: 'white', fontSize: '0.78rem', fontWeight: 800,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
            }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Grid of Extended Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
        {features.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="glass-panel"
            style={{
              padding: '1.1rem 1.25rem',
              background: item.bg,
              border: `1.5px solid ${item.border}`,
              borderRadius: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `1px solid ${item.border}`
            }}>
              {item.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: item.color }}>
                  {item.title}
                </h4>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, background: 'white',
                  color: item.color, padding: '0.1rem 0.45rem', borderRadius: '9999px',
                  border: `1px solid ${item.border}`
                }}>
                  {item.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
            
            <div style={{ fontSize: '1rem', color: item.color, fontWeight: 900 }}>
              ›
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', padding: '1rem 0', color: '#94a3b8', fontSize: '0.74rem' }}>
        Sổ Chủ Nhiệm Số — Lớp {settings.className} • GVCN {settings.teacherName}
      </div>

    </div>
  );
}
