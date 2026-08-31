import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: '📊', label: 'Trang chủ' },
  { id: 'students',      icon: '👥', label: 'Hồ sơ lớp' },
  { id: 'attendance',    icon: '📝', label: 'Điểm danh' },
  { id: 'requests',      icon: '✉️',  label: 'Đơn xin nghỉ' },
  { id: 'notifications', icon: '📢', label: 'Thông báo' },
  { id: 'activities',    icon: '📸', label: 'Hoạt động' },
  { id: 'finance',       icon: '💰', label: 'Quỹ lớp' },
  { id: 'evaluation',    icon: '📈', label: 'Thi đua 47' },
  { id: 'exam',          icon: '🎓', label: 'Ôn thi THPT' },
  { id: 'ai_assistant',  icon: '🤖', label: 'Trợ lý AI' },
  { id: 'parent_portal', icon: '👨‍👩‍👧', label: 'Sổ phụ huynh' },
  { id: 'confessions',   icon: '🤫', label: 'Hòm tâm sự' },
  { id: 'reports',       icon: '📋', label: 'Biểu mẫu & Excel' },
];

export default function Sidebar({ activeTab, setActiveTab, onLoginClick }) {
  const { user, isTeacher, logout } = useAuth();
  const { settings } = useClassSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getRoleLabel = () => {
    if (!user) return null;
    if (isTeacher) return { text: `GVCN ${settings.teacherName}`, icon: '👩‍🏫', bg: 'linear-gradient(135deg, #1B4D53, #2d6a70)' };
    if (user.role === 'group_leader') return { text: `Tổ trưởng ${user.group}`, icon: '⭐', bg: 'linear-gradient(135deg, #0284c7, #0369a1)' };
    if (user.role === 'monitor') return { text: 'Lớp trưởng', icon: '👑', bg: 'linear-gradient(135deg, #d97706, #b45309)' };
    return { text: user.name, icon: '👨‍🎓', bg: 'linear-gradient(135deg, #4b5563, #374151)' };
  };

  const roleInfo = getRoleLabel();

  const SidebarContent = () => (
    <aside style={{
      width: '280px', minWidth: '280px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      borderRight: '2px solid var(--color-primary-light)',
      padding: '1.5rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
      height: '100vh', position: 'sticky', top: 0,
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '0.5rem 0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-brand))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0
          }}>🏫</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 800 }}>ClassMate Pro</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-brand)', fontWeight: 700, letterSpacing: '0.03em' }}>LỚP {settings.className} • {settings.schoolYear}</span>
          </div>
        </div>

        {/* Role badge */}
        {roleInfo && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.4rem 0.8rem',
            background: roleInfo.bg,
            borderRadius: '0.5rem',
            color: 'white', fontSize: '0.75rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <span>{roleInfo.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roleInfo.text}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-link ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); setMobileOpen(false); }}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: activeTab === id ? undefined : '1px solid transparent', padding: '0.55rem 0.75rem' }}
          >
            <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: '0.86rem' }}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Auth controls */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        {user ? (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', backgroundColor: '#b91c1c' }}
            onClick={logout}
          >
            🚪 Đăng xuất ({user.name ? user.name.split(' ').pop() : 'Tài khoản'})
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
            onClick={onLoginClick}
          >
            🔑 Đăng nhập (GV / HS)
          </button>
        )}
        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.5rem' }}>
          QLCN v2.0 — Chuẩn Quốc Tế THPT
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        className="mobile-menu-btn"
        style={{ display: 'none' }}
        aria-label="Menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Desktop sidebar */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex',
          }}
        >
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
          <div style={{ animation: 'slideInRight 0.25s ease' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </>
  );
}
