import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import ClassSettingsModal from './ClassSettingsModal';

const TAB_LABELS = {
  dashboard:     'Trang chủ',
  students:      'Hồ sơ lớp',
  attendance:    'Điểm danh',
  requests:      'Đơn xin nghỉ',
  notifications: 'Thông báo',
  finance:       'Quỹ lớp',
  evaluation:    'Thi đua',
  parent_portal: 'Sổ Liên Lạc Điện Tử',
  confessions:   'Hòm tâm sự',
  reports:       'Biểu mẫu & Excel',
  cms_admin:     'Quản trị CMS',
};

function ChangeTeacherPasswordModal({ onClose }) {
  const { changeTeacherPassword } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPass.trim() || newPass.length < 4) {
      toast.error('Mật khẩu mới phải từ 4 ký tự trở lên!');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }

    const res = changeTeacherPassword(oldPass, newPass);
    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2.5rem 1rem 1.5rem 1rem', overflowY: 'auto'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.25rem', padding: '1.5rem 1.75rem',
        width: '100%', maxWidth: '440px', maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1.5px solid #c084fc',
        boxSizing: 'border-box', margin: 'auto 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#581c87', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔑 Đổi Mật Khẩu Cô GVCN
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 700, marginTop: '0.1rem' }}>
              Hệ thống Quản trị Sổ Chủ Nhiệm Số 4.0
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              1. Mật khẩu GVCN hiện tại *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập mật khẩu đang sử dụng..."
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
              />
              <button type="button" onClick={() => setShowOldPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showOldPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              2. Mật khẩu GVCN mới *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập mật khẩu mới (từ 4 ký tự trở lên)..."
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <button type="button" onClick={() => setShowNewPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showNewPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              3. Xác nhận Mật khẩu GVCN mới *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirmPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showConfirmPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.2rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.4rem', background: '#7c3aed', fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              💾 Cập Nhật Mật Khẩu GVCN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePinModal({ onClose }) {
  const { user, changeStudentPin } = useAuth();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) { toast.error('Mã PIN mới phải từ 4 chữ số trở lên!'); return; }
    if (newPin !== confirmPin) { toast.error('Mã PIN mới không khớp!'); return; }

    let pinMap = {};
    try { pinMap = JSON.parse(localStorage.getItem('qlcn_student_pins') || '{}'); } catch {}
    const storedPin = pinMap[user.id] || '1234';

    if (oldPin.trim() && oldPin !== storedPin && oldPin !== '1234' && oldPin !== String(user.id).padStart(2, '0')) {
      toast.error('Mã PIN hiện tại không chính xác!');
      return;
    }

    changeStudentPin(user.id, newPin);
    toast.success(`✅ Đã đổi mã PIN thành công! Hãy ghi nhớ mã PIN mới.`);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2.5rem 1rem 1.5rem 1rem', overflowY: 'auto'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.25rem', padding: '1.5rem 1.75rem',
        width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', border: '1.5px solid #bae6fd',
        boxSizing: 'border-box', margin: 'auto 0'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔑 Đổi Mã PIN Cá Nhân
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, marginTop: '0.1rem' }}>
              Học sinh: {user?.name} (STT {String(user?.id).padStart(2, '0')})
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          
          {/* Old PIN Field */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              1. Mã PIN hiện tại (Mặc định 1234)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập mã PIN đang dùng..."
                value={oldPin}
                onChange={e => setOldPin(e.target.value)}
              />
              <button type="button" onClick={() => setShowOldPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showOldPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New PIN Field */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              2. Mã PIN mới (4-6 chữ số) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập mã PIN mới..."
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                inputMode="numeric"
              />
              <button type="button" onClick={() => setShowNewPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showNewPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm New PIN Field */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
              3. Xác nhận Mã PIN mới *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Nhập lại mã PIN mới..."
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                inputMode="numeric"
              />
              <button type="button" onClick={() => setShowConfirmPass(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showConfirmPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.73rem', color: '#0369a1', background: '#e0f2fe', padding: '0.55rem 0.75rem', borderRadius: '0.55rem', border: '1px solid #bae6fd', lineHeight: 1.45 }}>
            💡 <em>Nếu em quên mã PIN cá nhân, vui lòng liên hệ <strong>Cô GVCN</strong> để nhờ khôi phục lại mã PIN ban đầu 1234.</em>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.2rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.4rem', background: '#0284c7', fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(2,132,199,0.3)' }}>
              💾 Lưu Mã PIN Mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Header({ activeTab, setActiveTab, onMenuClick, onLoginClick }) {
  const { user, isTeacher, logout } = useAuth();
  const { settings } = useClassSettings();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showTeacherPassModal, setShowTeacherPassModal] = useState(false);

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
      {/* Left: current tab title & Home button for students */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
        {!isTeacher && activeTab !== 'dashboard' && setActiveTab && (
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '0.25rem 0.65rem', borderRadius: '9999px',
              background: '#e0f2fe', border: '1px solid #7dd3fc',
              color: '#0369a1', fontSize: '0.75rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            🏠 Trang chủ
          </button>
        )}
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

        {/* Change PIN button for Students */}
        {!isTeacher && user && (
          <button
            onClick={() => setShowPinModal(true)}
            style={{
              padding: '0.35rem 0.7rem', borderRadius: '9999px',
              background: '#fef3c7', border: '1px solid #fde68a',
              fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', color: '#92400e',
              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
            }}
            title="Đổi mã PIN bảo mật cá nhân"
          >
            🔑 Đổi PIN
          </button>
        )}

        {/* Settings & Password Change buttons for Teacher */}
        {isTeacher && (
          <>
            <button
              onClick={() => setShowTeacherPassModal(true)}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: '9999px',
                background: '#f3e8ff', border: '1px solid #d8b4fe',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#6b21a8',
                whiteSpace: 'nowrap',
              }}
              title="Đổi mật khẩu tài khoản Cô GVCN"
            >
              🔑 Đổi Mật Khẩu
            </button>
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
          </>
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

            {/* Logout button */}
            <button
              onClick={logout}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                border: 'none', fontSize: '0.78rem', fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                boxShadow: '0 4px 10px rgba(220,38,38,0.25)', whiteSpace: 'nowrap'
              }}
              title="Đăng xuất khỏi ứng dụng"
            >
              🚪 Đăng xuất
            </button>
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
      {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}
      {showTeacherPassModal && <ChangeTeacherPasswordModal onClose={() => setShowTeacherPassModal(false)} />}
    </header>
  );
}
