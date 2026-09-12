import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: '📊', label: 'Trang chủ',       roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'students',      icon: '👥', label: 'Hồ sơ lớp',       roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'attendance',    icon: '📝', label: 'Điểm danh',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'requests',      icon: '✉️',  label: 'Đơn nghỉ',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'notifications', icon: '📢', label: 'Thông báo',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'activities',    icon: '📸', label: 'Hoạt động',        roles: ['teacher', 'group_leader', 'monitor', 'student'] },
  { id: 'finance',       icon: '💰', label: 'Quỹ lớp',          roles: ['teacher', 'group_leader', 'monitor'] },
  { id: 'evaluation',    icon: '📈', label: 'Thi đua',          roles: ['teacher', 'group_leader', 'monitor', 'student'] },
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

  // Normalize student role ('member' from initialStudents is equivalent to 'student')
  const isPlainStudent = !isTeacher && (!user || user.role === 'student' || user.role === 'member');
  const userRole = user?.role === 'member' ? 'student' : (user?.role || 'student');

  const visibleItems = NAV_ITEMS.filter(item =>
    !user || item.roles.includes(userRole)
  );

  const STUDENT_NAV = [
    { id: 'dashboard',  icon: '🏠', label: 'Trang chủ' },
    { id: 'attendance', icon: '📝', label: 'Điểm danh' },
    { id: 'evaluation', icon: '📈', label: 'Thi đua' },
    { id: 'explore',    icon: '✨', label: 'Khám phá' },
  ];

  // For students, use clean 4-tab unified nav; for officers/teachers use visibleItems
  const sidebarItems = isPlainStudent ? STUDENT_NAV : visibleItems;
  const bottomItems = isPlainStudent ? STUDENT_NAV : [...visibleItems];

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
        {sidebarItems.map(({ id, icon, label }) => (
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

  return (
    <>
      {/* Desktop sidebar — Only for Teacher, Monitor, and Group Leader; hidden for students to give 100% width */}
      {!isPlainStudent && (
        <div className="sidebar-desktop">
          <SidebarContent />
        </div>
      )}

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
      <nav className={`mobile-bottom-nav ${isPlainStudent ? 'student-nav' : ''}`} role="navigation" aria-label="Điều hướng chính">
        <div className="mobile-bottom-scroll">
          {/* Nav tabs */}
          {bottomItems.map(({ id, icon, label }) => {
            // Khi ở các tab mở rộng (requests, notifications, exam...) thì tab explore được sáng
            const isExploreActive = id === 'explore' && ['explore', 'requests', 'notifications', 'exam', 'confessions', 'students', 'activities', 'parent_portal'].includes(activeTab);
            const isTabActive = activeTab === id || isExploreActive;

            return (
              <button
                key={id}
                className={`mbn-item${isTabActive ? ' mbn-active' : ''}`}
                onClick={() => setActiveTab(id)}
                aria-label={label}
                aria-current={isTabActive ? 'page' : undefined}
              >
                <span className="mbn-icon">{icon}</span>
                <span className="mbn-label">{label}</span>
              </button>
            );
          })}

          {/* Separator + Logout / Login button at the end (cho GV & cán bộ lớp) */}
          {!isPlainStudent && (
            <>
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
            </>
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

          /* 4 Tab học sinh chia đều 100% màn hình, phong cách Native App iOS/Material 3 */
          .mobile-bottom-nav.student-nav .mobile-bottom-scroll {
            display: flex;
            width: 100%;
            justify-content: space-around;
            padding: 0.25rem 0.5rem 0.25rem;
            overflow-x: hidden;
          }
          .mobile-bottom-nav.student-nav .mbn-item {
            flex: 1;
            min-width: 0;
            padding: 0.35rem 0.2rem 0.25rem;
            border-radius: 0.85rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .mobile-bottom-nav.student-nav .mbn-item.mbn-active {
            background: rgba(3, 105, 161, 0.08);
          }
          .mobile-bottom-nav.student-nav .mbn-item.mbn-active::before {
            display: none; /* Dùng pill background thay vì vạch ngang cũ */
          }
          .mobile-bottom-nav.student-nav .mbn-label {
            font-size: 0.72rem;
            font-weight: 700;
            margin-top: 0.15rem;
          }
          .mobile-bottom-nav.student-nav .mbn-item.mbn-active .mbn-label {
            color: #0284c7;
            font-weight: 900;
          }

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
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.18s;
            position: relative;
          }
          .mbn-item:active {
            transform: scale(0.92);
            background: rgba(3,105,161,0.08);
          }

          /* Active indicator — top bar (cho view GV) */
          .mbn-item.mbn-active::before {
            content: '';
            position: absolute;
            top: 0; left: 18%; right: 18%;
            height: 3px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, #0369a1, #0284c7);
          }

          .mbn-icon {
            font-size: 1.35rem;
            line-height: 1;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .mbn-item.mbn-active .mbn-icon {
            transform: translateY(-2px) scale(1.12);
          }
          .mbn-label {
            font-size: 0.58rem;
            font-weight: 600;
            color: #94a3b8;
            white-space: nowrap;
            line-height: 1.2;
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
