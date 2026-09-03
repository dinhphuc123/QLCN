import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';
import { useClassSettings } from '../../context/ClassSettingsContext';

const PORTALS = [
  { id: 'teacher', label: 'Cổng GVCN',     icon: '👑', color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', desc: 'Xác thực Mật khẩu GVCN Nội Bổ' },
  { id: 'officer', label: 'Cán Bộ Lớp',    icon: '⭐', color: '#0369a1', bg: 'linear-gradient(135deg,#0284c7,#0369a1)', desc: 'Tên đăng nhập & Mã PIN' },
  { id: 'student', label: 'Học Sinh',       icon: '🎓', color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#b45309)', desc: 'Tên đăng nhập & Mã PIN' },
];

export default function LoginGate() {
  const { loginTeacher, loginStudent, requestPinReset, loginError, setLoginError } = useAuth();
  const { settings } = useClassSettings();

  const [portal, setPortal] = useState('teacher');
  const [teacherPass, setTeacherPass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const [studentPass, setStudentPass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const officers = INITIAL_STUDENTS.filter(s => {
    const pos = (s.position || '').toLowerCase();
    return (
      s.role === 'group_leader' ||
      s.role === 'monitor' ||
      s.role === 'room_leader' ||
      pos.includes('tổ trưởng') ||
      pos.includes('lớp trưởng') ||
      pos.includes('lớp phó') ||
      pos.includes('trưởng phòng')
    );
  });

  const listToShow = (portal === 'officer' ? officers : INITIAL_STUDENTS).filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      String(s.id).includes(term) ||
      (s.position || '').toLowerCase().includes(term) ||
      (s.group || '').toLowerCase().includes(term)
    );
  });

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    if (!teacherPass.trim()) {
      setLoginError('Vui lòng nhập mật khẩu GVCN.');
      return;
    }
    setLoading(true);
    await loginTeacher(teacherPass);
    setLoading(false);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentPass.trim()) {
      setLoginError('Vui lòng nhập Mã PIN cá nhân.');
      return;
    }
    setLoading(true);
    await loginStudent(selectedStudentId, studentPass);
    setLoading(false);
  };

  const handleRequestPinReset = () => {
    const st = INITIAL_STUDENTS.find(s => String(s.id) === String(selectedStudentId));
    if (st) {
      requestPinReset(st.id, st.name);
      toast.success(`📩 Đã gửi yêu cầu khôi phục PIN của học sinh "${st.name}" tới Cô GVCN!`);
    }
  };

  return (
    <div className="lg-wrapper">
      <style>{`
        .lg-wrapper {
          min-height: 100dvh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem 1rem;
          box-sizing: border-box;
          font-family: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(150deg, #e0f2fe 0%, #f0f9ff 40%, #eff6ff 70%, #f5f3ff 100%);
          position: relative;
          overflow: hidden;
        }
        .lg-wrapper::before {
          content: '';
          position: absolute;
          top: -120px; left: -80px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .lg-wrapper::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -60px;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%);
          pointer-events: none;
        }
        .lg-card {
          position: relative;
          z-index: 1;
          max-width: 520px;
          width: 100%;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(14,165,233,0.2);
          border-radius: 1.5rem;
          padding: 2rem 1.75rem;
          box-shadow: 0 20px 60px -10px rgba(3,105,161,0.16), 0 4px 16px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          box-sizing: border-box;
        }
        .lg-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.35rem;
          background: #f1f5f9;
          border-radius: 0.75rem;
          padding: 0.25rem;
        }
        .lg-tab {
          padding: 0.6rem 0.2rem;
          border: none;
          border-radius: 0.55rem;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }
        .lg-tab.active {
          color: white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
        }
        .student-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.45rem;
          max-height: 180px;
          overflow-y: auto;
          padding: 0.2rem;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .student-card {
          padding: 0.5rem 0.3rem;
          border-radius: 0.65rem;
          border: 2px solid #e2e8f0;
          background: white;
          cursor: pointer;
          text-align: center;
          transition: all 0.18s ease;
          font-size: 0.7rem;
          font-weight: 600;
          color: #374151;
          line-height: 1.3;
        }
        .student-card:hover {
          border-color: #7dd3fc;
          background: #f0f9ff;
          transform: translateY(-1px);
        }
        .student-card.selected {
          border-color: #0369a1;
          background: #e0f2fe;
          color: #0c4a6e;
        }
        .pass-field {
          position: relative;
        }
        .pass-field input {
          width: 100%;
          padding: 0.7rem 2.8rem 0.7rem 0.9rem;
          border-radius: 0.75rem;
          border: 1.5px solid #cbd5e1;
          background: white;
          color: #0c4a6e;
          font-size: 0.9rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .pass-field input:focus {
          border-color: #0369a1;
          box-shadow: 0 0 0 3px rgba(3,105,161,0.12);
        }
        .eye-btn {
          position: absolute;
          right: 0.65rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          color: #64748b;
          padding: 0.25rem;
          line-height: 1;
        }
        .lg-submit {
          width: 100%;
          padding: 0.8rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          color: white;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .lg-submit:hover:not(:disabled) { opacity: 0.93; transform: translateY(-1px); }
        .lg-submit:active { transform: scale(0.98); }
        .lg-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .lg-error {
          padding: 0.65rem 0.85rem;
          background: #fef2f2;
          border: 1.5px solid #fca5a5;
          border-radius: 0.65rem;
          color: #dc2626;
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
        }
        .lg-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-size: 0.68rem;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 0.75rem;
        }
        .lg-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.4rem;
        }
        @media (max-width: 480px) {
          .lg-card {
            padding: 1.4rem 1rem;
            border-radius: 1.1rem;
            gap: 1rem;
          }
          .student-card-grid {
            grid-template-columns: repeat(2, 1fr);
            max-height: 160px;
          }
        }
      `}</style>

      <div className="lg-card">
        {/* Brand */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg,#0369a1,#0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 0.65rem',
            boxShadow: '0 6px 20px rgba(3,105,161,0.25)'
          }}>🏫</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0c4a6e', margin: '0 0 0.15rem' }}>
            Sổ Chủ Nhiệm Số 4.0
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600, margin: 0 }}>
            Lớp {settings.className} • {settings.schoolYear}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Cổng Đăng Nhập 3 Phân Hệ Theo Quyền Hạn Độc Lập
          </p>
        </div>

        {/* Portal tabs */}
        <div className="lg-tabs">
          {PORTALS.map(p => (
            <button
              key={p.id}
              className={`lg-tab${portal === p.id ? ' active' : ''}`}
              style={portal === p.id ? { background: p.bg } : {}}
              onClick={() => { setPortal(p.id); setLoginError(''); setSearchTerm(''); }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {loginError && <div className="lg-error">⚠️ {loginError}</div>}

        {/* Portal 1: GVCN Password Login */}
        {portal === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label className="lg-label" htmlFor="teacher-pass">Mật khẩu GVCN Nội Bộ</label>
              <div className="pass-field">
                <input
                  id="teacher-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu GVCN..."
                  value={teacherPass}
                  onChange={e => setTeacherPass(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Hiện/ẩn mật khẩu">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button className="lg-submit" type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 8px 20px rgba(124,58,237,0.35)' }}>
              {loading ? '⏳ Đang xác thực...' : '🚀 Đăng Nhập Mật Khẩu GVCN'}
            </button>
          </form>
        )}

        {/* Portal 2 & 3: Officer / Student Login (Name/ID + PIN Code) */}
        {(portal === 'officer' || portal === 'student') && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* Search Filter for Students */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="lg-label" style={{ margin: 0 }}>
                  {portal === 'officer' ? '1. Chọn Cán bộ / Tổ trưởng' : '1. Chọn Học sinh / Tên đăng nhập'}
                </label>
                <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>
                  ({listToShow.length} học sinh)
                </span>
              </div>

              <input
                type="text"
                placeholder="🔍 Tìm nhanh tên hoặc mã STT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.45rem 0.75rem', borderRadius: '0.6rem',
                  border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '0.45rem', outline: 'none'
                }}
              />

              <div className="student-card-grid">
                {listToShow.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`student-card${String(s.id) === String(selectedStudentId) ? ' selected' : ''}`}
                    onClick={() => { setSelectedStudentId(String(s.id)); setLoginError(''); }}
                  >
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.1rem' }}>
                      STT {String(s.id).padStart(2, '0')}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.68rem', lineHeight: 1.25 }}>
                      {s.name.split(' ').slice(-2).join(' ')}
                    </div>
                    {s.position && (
                      <div style={{ fontSize: '0.58rem', color: '#0369a1', marginTop: '0.1rem', fontWeight: 700 }}>
                        {s.position}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* PIN Code Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="lg-label" htmlFor="student-pass" style={{ margin: 0 }}>
                  2. Nhập Mã PIN bảo mật
                </label>
                <button
                  type="button"
                  onClick={handleRequestPinReset}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  📩 Quên mã PIN?
                </button>
              </div>
              <div className="pass-field">
                <input
                  id="student-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập Mã PIN cá nhân..."
                  value={studentPass}
                  onChange={e => setStudentPass(e.target.value)}
                  inputMode="numeric"
                  autoComplete="current-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Hiện/ẩn mật khẩu">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button className="lg-submit" type="submit" disabled={loading}
              style={{
                background: portal === 'officer'
                  ? 'linear-gradient(135deg,#0284c7,#0369a1)'
                  : 'linear-gradient(135deg,#d97706,#b45309)',
                boxShadow: portal === 'officer'
                  ? '0 8px 20px rgba(2,132,199,0.35)'
                  : '0 8px 20px rgba(217,119,6,0.35)'
              }}>
              {loading
                ? '⏳ Đang xác thực...'
                : portal === 'officer'
                  ? '⭐ Đăng Nhập Cán Bộ Lớp & Tổ Trưởng'
                  : '🎓 Đăng Nhập Cổng Học Sinh & Phụ Huynh'}
            </button>
          </form>
        )}

        {/* Security footer */}
        <div className="lg-footer">
          <span>🔒</span>
          <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
          <span>•</span>
          <span>Sổ Chủ Nhiệm Số</span>
        </div>
      </div>

    </div>
  );
}
