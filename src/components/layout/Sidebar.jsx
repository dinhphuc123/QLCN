import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: '📊', label: 'Trang chủ',       roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'students',      icon: '👥', label: 'Hồ sơ lớp',       roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'attendance',    icon: '📝', label: 'Điểm danh',        roles: ['teacher', 'group_leader', 'monitor'] },
  { id: 'requests',      icon: '✉️',  label: 'Đơn nghỉ',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'notifications', icon: '📢', label: 'Thông báo',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'activities',    icon: '📸', label: 'Hoạt động',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'finance',       icon: '💰', label: 'Quỹ lớp',          roles: ['teacher', 'group_leader', 'monitor'] },
  { id: 'evaluation',    icon: '📈', label: 'Thi đua',          roles: ['teacher', 'group_leader', 'monitor'] },
  { id: 'exam',          icon: '🧭', label: 'Hướng nghiệp',     roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'ai_assistant',  icon: '🤖', label: 'Trợ lý AI',        roles: ['teacher'] },
  { id: 'parent_portal', icon: '📱', label: 'Sổ Liên Lạc',   roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'confessions',   icon: '🤫', label: 'Tâm sự',           roles: ['teacher', 'student'] },
  { id: 'reports',       icon: '📋', label: 'Biểu mẫu',         roles: ['teacher'] },
  { id: 'cms_admin',     icon: '⚙️', label: 'Quản trị',         roles: ['teacher'] },
];

// Logout item — shown only in Bottom Nav when logged in
const LOGOUT_NAV_ITEM = { id: '__logout__', icon: '🚪', label: 'Đăng xuất' };

export default function Sidebar({ activeTab, setActiveTab, onLoginClick }) {
  const { user, isTeacher, logout } = useAuth();
  const { settings } = useClassSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item =>
    !user || item.roles.includes(user?.role || 'student')
  );

  const getRoleLabel = () => {
    if (!user) return null;
    if (isTeacher) return { text: `GVCN ${settings.teacherName}`, icon: '👩‍🏫', bg: 'linear-gradient(135deg,#1B4D53,#2d6a70)' };
    if (user.role === 'group_leader') return { text: `Tổ trưởng ${user.groupLeaderOf || user.group}`, icon: '⭐', bg: 'linear-gradient(135deg,#0284c7,#0369a1)' };
    if (user.role === 'monitor') return { text: 'Lớp trưởng', icon: '👑', bg: 'linear-gradient(135deg,#d97706,#b45309)' };
    return { text: user.name, icon: '👨‍🎓', bg: 'linear-gradient(135deg,#4b5563,#374151)' };
  };
  const roleInfo = getRoleLabel();

  // Desktop sidebar content
  const SidebarContent = () => (
    <aside style={{
      width: '280px', minWidth: '280px',
      background: 'rgba(255,255,255,0.85)',
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
            background: 'linear-gradient(135deg,var(--color-primary-dark),var(--color-primary-brand))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0
          }}>🏫</div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 800 }}>
              Sổ Chủ Nhiệm Số
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-brand)', fontWeight: 700, letterSpacing: '0.03em' }}>
              LỚP {settings.className} • {settings.schoolYear}
            </span>
          </div>
        </div>
        {roleInfo && (
          <div style={{
            marginTop: '0.75rem', padding: '0.4rem 0.8rem',
            background: roleInfo.bg, borderRadius: '0.5rem',
            color: 'white', fontSize: '0.74rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <span>{roleInfo.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roleInfo.text}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
        {visibleItems.map(({ id, icon, label }) => (
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
          <button className="btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }} onClick={onLoginClick}>
            🔑 Đăng nhập (GV / HS)
          </button>
        )}
        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.5rem' }}>
          QLCN v2.0 — Chuẩn Quốc Tế THPT
        </div>
      </div>
    </aside>
  );

  // Bottom nav items: nav tabs + logout/login at end
  const bottomItems = [...visibleItems];

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile drawer overlay (opened from hamburger in Header) */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
          <div style={{ animation: 'slideInRight 0.25s ease' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Nav Bar ─────────────────────────────────────── */}
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Điều hướng chính">
        <div className="mobile-bottom-scroll">
          {/* Nav tabs */}
          {bottomItems.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`mbn-item${activeTab === id ? ' mbn-active' : ''}`}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <span className="mbn-icon">{icon}</span>
              <span className="mbn-label">{label}</span>
            </button>
          ))}

          {/* Separator + Logout / Login button at the end */}
          <div className="mbn-separator" aria-hidden="true" />
          {user ? (
            <button
              className="mbn-item mbn-logout"
              onClick={logout}
              aria-label="Đăng xuất"
            >
              <span className="mbn-icon">🚪</span>
              <span className="mbn-label">Đăng xuất</span>
            </button>
          ) : (
            <button
              className="mbn-item mbn-login"
              onClick={onLoginClick}
              aria-label="Đăng nhập"
            >
              <span className="mbn-icon">🔑</span>
              <span className="mbn-label">Đăng nhập</span>
            </button>
          )}
        </div>
      </nav>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }

        /* ── Desktop ── */
        @media (min-width: 769px) {
          .sidebar-desktop { display: block; }
          .mobile-bottom-nav { display: none; }
        }

        /* ── Mobile Bottom Nav ── */
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }

          .mobile-bottom-nav {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 200;
            background: rgba(255,255,255,0.97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 -4px 24px rgba(0,0,0,0.07);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .mobile-bottom-scroll {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0 0.125rem;
          }
          .mobile-bottom-scroll::-webkit-scrollbar { display: none; }

          .mbn-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.12rem;
            padding: 0.6rem 0.65rem 0.5rem;
            min-width: 62px;
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 0;
            transition: background 0.18s;
            position: relative;
          }
          .mbn-item:active { background: rgba(3,105,161,0.06); }

          /* Active indicator — top bar */
          .mbn-item.mbn-active::before {
            content: '';
            position: absolute;
            top: 0; left: 18%; right: 18%;
            height: 3px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, #0369a1, #0284c7);
          }

          .mbn-icon {
            font-size: 1.3rem;
            line-height: 1;
            transition: transform 0.18s;
          }
          .mbn-item.mbn-active .mbn-icon { transform: translateY(-1px); }
          .mbn-label {
            font-size: 0.56rem;
            font-weight: 600;
            color: #94a3b8;
            white-space: nowrap;
            line-height: 1;
          }
          .mbn-item.mbn-active .mbn-label { color: #0369a1; font-weight: 800; }

          /* Separator line before logout */
          .mbn-separator {
            width: 1px;
            background: #e5e7eb;
            margin: 0.55rem 0;
            flex-shrink: 0;
          }

          /* Logout button — red tint */
          .mbn-logout .mbn-icon { filter: hue-rotate(180deg) saturate(2); }
          .mbn-logout .mbn-label { color: #ef4444; }
          .mbn-logout:active { background: rgba(239,68,68,0.07); }

          /* Login button — purple tint */
          .mbn-login .mbn-label { color: #7c3aed; }
          .mbn-login:active { background: rgba(124,58,237,0.07); }

          /* Push main content up so Bottom Nav doesn't cover it */
          .main-content {
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
    </>
  );
}
