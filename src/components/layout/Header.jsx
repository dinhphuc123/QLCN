import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import ClassSettingsModal from './ClassSettingsModal';

const TAB_LABELS = {
  dashboard:     'Trang chủ',
  students:      'Hồ sơ lớp',
  attendance:    'Điểm danh',
  requests:      'Đơn xin nghỉ',
  notifications: 'Thông báo',
  activities:    'Hoạt động',
  finance:       'Quỹ lớp',
  evaluation:    'Thi đua 47',
  exam:          'Ôn thi THPT',
  ai_assistant:  'Trợ lý AI',
  parent_portal: 'Sổ phụ huynh',
  confessions:   'Hòm tâm sự',
  reports:       'Biểu mẫu & Excel',
  cms_admin:     'Quản trị CMS',
};

export default function Header({ activeTab, onMenuClick, onLoginClick }) {
  const { user, isTeacher } = useAuth();
  const { settings } = useClassSettings();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'var(--color-primary-dark)',
          margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {TAB_LABELS[activeTab] || activeTab}
        </h2>
        <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
          Lớp {settings.className} • {settings.currentWeek}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
        {isTeacher && (
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '9999px',
              background: '#f3f4f6', border: '1px solid #d1d5db',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#374151'
            }}
          >
            ⚙️ Cấu hình lớp
          </button>
        )}
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
              {isTeacher ? `👑 GVCN ${settings.teacherName}` : user.role === 'group_leader' ? `⭐ Tổ Trưởng ${user.group}` : `👨‍🎓 ${user.name}`}
            </span>
          </div>
        ) : (
          <button
            onClick={onLoginClick || onMenuClick}
            style={{
              fontSize: '0.75rem', background: '#7c3aed', color: 'white',
              padding: '0.3rem 0.85rem', borderRadius: '9999px', fontWeight: 700,
              border: 'none', cursor: 'pointer'
            }}
          >
            🔑 Đăng nhập
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
      {showSettingsModal && <ClassSettingsModal onClose={() => setShowSettingsModal(false)} />}
    </header>
  );
}
