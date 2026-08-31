import React from 'react';
import { useAuth } from '../../context/AuthContext';

const TAB_LABELS = {
  dashboard:     'Trang chủ Lớp 12.7',
  students:      'Hồ sơ Danh sách & Phòng KTX',
  attendance:    'Điểm danh 5 Buổi & Đăng ký về nhà',
  requests:      'Đơn xin phép nghỉ học điện tử',
  notifications: 'Bảng tin Thông báo & Đính kèm',
  activities:    'Nhật ký Hoạt động Hàng ngày',
  finance:       'Quản lý Thu - Chi Quỹ Lớp',
  evaluation:    'Thi đua 47 Tiêu chí & Xếp loại',
  exam:          'Góc Ôn thi THPT & Hướng nghiệp',
  ai_assistant:  'AI Trợ Lý GVCN — Tổng Hợp Báo Cáo',
  parent_portal: 'Sổ Liên Lạc Điện Tử Dành Cho Phụ Huynh',
  confessions:   'Hòm thư Tâm sự Ẩn danh',
  reports:       'Xuất Báo cáo Excel 3 Sheet',
};

export default function Header({ activeTab, onMenuClick }) {
  const { user, isTeacher } = useAuth();

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.875rem 1.5rem',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50,
      gap: '1rem',
    }}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="mobile-menu-btn"
        style={{
          display: 'none',
          width: '40px', height: '40px',
          background: 'var(--color-bg-cream)',
          border: '1px solid var(--glass-border)',
          borderRadius: '0.5rem',
          fontSize: '1.25rem',
          cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
          color: 'var(--color-primary-dark)',
          margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {TAB_LABELS[activeTab] || activeTab}
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              backgroundColor: isTeacher ? '#dcfce7' : user.role === 'group_leader' ? '#e0f2fe' : '#f0fdf4',
              color: isTeacher ? '#166534' : user.role === 'group_leader' ? '#0369a1' : '#15803d',
              fontSize: '0.75rem', padding: '0.25rem 0.75rem',
              borderRadius: '9999px', fontWeight: 800,
              border: `1px solid ${isTeacher ? '#86efac' : user.role === 'group_leader' ? '#7dd3fc' : '#86efac'}`,
              whiteSpace: 'nowrap',
            }}>
              {isTeacher ? '👑 GVCN Đỗ Kim Tuyền' : user.role === 'group_leader' ? `⭐ Tổ Trưởng ${user.group} (${user.name})` : `👨‍🎓 ${user.name} (${user.group})`}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
            👁️ Chế độ Xem Khách
          </span>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
