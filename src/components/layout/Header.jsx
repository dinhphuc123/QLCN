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
  const { user, isTeacher, logout } = useAuth();
  const { settings } = useClassSettings();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // User's first-name initial for mobile avatar
  const userInitial = user?.name ? user.name.split(' ').pop()[0] : '?';
  const avatarBg = isTeacher ? '#1B4D53' : user?.role === 'group_leader' ? '#0369a1' : user?.role === 'monitor' ? '#d97706' : '#4b5563';

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qlcn_theme') === 'dark');

  const toggleDarkMode = () => {
    const nextTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('qlcn_theme', nextTheme);
  };

  React.useEffect(() => {
    if (darkMode) document.documentElement.setAttribute('data-theme', 'dark');
  }, [darkMode]);

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50,
      gap: '0.75rem',
      minHeight: '56px',
    }}>
      {/* Left: current tab title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
          color: 'var(--color-primary-dark)',
          margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: 800,
        }}>
          {TAB_LABELS[activeTab] || activeTab}
        </h2>
        {/* Week badge — hidden on mobile */}
        <span className="header-week-badge" style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Lớp {settings.className} • {settings.currentWeek}
        </span>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
        {/* Language Switcher */}
        <button
          onClick={() => {
            const currentLang = localStorage.getItem('qlcn_lang') || 'vi';
            const nextLang = currentLang === 'vi' ? 'en' : 'vi';
            localStorage.setItem('qlcn_lang', nextLang);
            window.location.reload();
          }}
          title="Chuyển đổi Ngôn Ngữ / Switch Language"
          style={{
            padding: '0.35rem 0.65rem', borderRadius: '9999px',
            background: darkMode ? '#1e293b' : '#ffffff', border: '1px solid #94a3b8',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: darkMode ? '#67e8f9' : '#0369a1',
            display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap'
          }}
        >
          {(localStorage.getItem('qlcn_lang') || 'vi') === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Ban Đêm"}
          style={{
            padding: '0.35rem 0.65rem', borderRadius: '9999px',
            background: darkMode ? '#334155' : '#f3f4f6', border: '1px solid #94a3b8',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: darkMode ? '#f8fafc' : '#334155',
            display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap'
          }}
        >
          {darkMode ? '🌙 Ban đêm' : '☀️ Ban sáng'}
        </button>

        {/* Settings button — only for teacher, full label on desktop */}
        {isTeacher && (
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '0.35rem 0.7rem', borderRadius: '9999px',
              background: '#f3f4f6', border: '1px solid #d1d5db',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#374151',
              whiteSpace: 'nowrap',
            }}
          >
            ⚙️ <span className="header-week-badge">Cấu hình</span>
          </button>
        )}

        {/* Full user badge — desktop only */}
        {user ? (
          <>
            <span className="header-user-full" style={{
              backgroundColor: isTeacher ? '#dcfce7' : user.role === 'group_leader' ? '#e0f2fe' : '#f0fdf4',
              color: isTeacher ? '#166534' : user.role === 'group_leader' ? '#0369a1' : '#15803d',
              fontSize: '0.75rem', padding: '0.25rem 0.75rem',
              borderRadius: '9999px', fontWeight: 800,
              border: `1px solid ${isTeacher ? '#86efac' : user.role === 'group_leader' ? '#7dd3fc' : '#86efac'}`,
              whiteSpace: 'nowrap',
            }}>
              {isTeacher
                ? `👑 GVCN ${settings.teacherName}`
                : user?.role === 'group_leader'
                ? `⭐ Tổ Trưởng ${user.groupLeaderOf || user.group}`
                : user?.role === 'monitor'
                ? `👑 Lớp Trưởng (${user.name})`
                : `👨‍🎓 ${user.name}`}
            </span>
            {/* Mini avatar — mobile only */}
            <div className="header-user-mini" style={{
              display: 'none',
              width: '34px', height: '34px', borderRadius: '50%',
              background: avatarBg, color: 'white',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800, flexShrink: 0,
              cursor: 'pointer',
            }}
              title={user.name}
            >
              {userInitial}
            </div>
          </>
        ) : (
          <button
            onClick={onLoginClick || onMenuClick}
            style={{
              fontSize: '0.78rem', background: '#7c3aed', color: 'white',
              padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            🔑 Đăng nhập
          </button>
        )}
      </div>

      {showSettingsModal && <ClassSettingsModal onClose={() => setShowSettingsModal(false)} />}
    </header>
  );
}
