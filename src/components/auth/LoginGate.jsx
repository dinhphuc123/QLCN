import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';
import { useClassSettings } from '../../context/ClassSettingsContext';

const PORTALS = [
  { id: 'teacher', label: 'Cổng GVCN',     icon: '👑', color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  { id: 'officer', label: 'Cán Bộ Lớp',    icon: '⭐', color: '#0369a1', bg: 'linear-gradient(135deg,#0284c7,#0369a1)' },
  { id: 'student', label: 'Học Sinh',       icon: '🎓', color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#b45309)' },
];

export default function LoginGate() {
  const { loginTeacher, loginStudent, loginError, setLoginError } = useAuth();
  const { settings } = useClassSettings();

  const [portal, setPortal] = useState('teacher');
  const [teacherPass, setTeacherPass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const [studentPass, setStudentPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const officers = INITIAL_STUDENTS.filter(s => s.role === 'group_leader' || s.role === 'monitor');
  const currentPortal = PORTALS.find(p => p.id === portal);

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loginTeacher(teacherPass);
    setLoading(false);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loginStudent(selectedStudentId, studentPass);
    setLoading(false);
  };

  const listToShow = portal === 'officer' ? officers : INITIAL_STUDENTS;

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
          /* Light security gradient — WCAG AAA */
          background: linear-gradient(150deg, #e0f2fe 0%, #f0f9ff 40%, #eff6ff 70%, #f5f3ff 100%);
          position: relative;
          overflow: hidden;
        }
        /* Subtle decorative blobs */
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
          max-width: 500px;
          width: 100%;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(14,165,233,0.18);
          border-radius: 1.5rem;
          padding: 2rem 1.75rem;
          box-shadow: 0 20px 60px -10px rgba(3,105,161,0.14), 0 4px 16px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-sizing: border-box;
        }
        /* Portal tab switcher */
        .lg-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.3rem;
          background: #f1f5f9;
          border-radius: 0.75rem;
          padding: 0.25rem;
        }
        .lg-tab {
          padding: 0.55rem 0.2rem;
          border: none;
          border-radius: 0.55rem;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }
        .lg-tab.active {
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        /* Student/officer card grid */
        .student-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.45rem;
          max-height: 200px;
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
        /* Password field with eye toggle */
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
          -webkit-text-security: disc;
        }
        .pass-field input:focus {
          border-color: #0369a1;
          box-shadow: 0 0 0 3px rgba(3,105,161,0.12);
        }
        .pass-field input.reveal {
          -webkit-text-security: none;
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
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #0369a1; }
        /* Quick login bar */
        .quick-bar {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          padding: 0.75rem;
        }
        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.4rem;
          margin-top: 0.45rem;
        }
        .quick-btn {
          padding: 0.5rem 0.25rem;
          border-radius: 0.55rem;
          border: none;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
          color: white;
          transition: opacity 0.2s, transform 0.15s;
          line-height: 1.3;
        }
        .quick-btn:active { transform: scale(0.97); }
        /* Submit button */
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
        /* Error */
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
        /* Security footer */
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
        /* Label */
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
            max-height: 180px;
          }
          .quick-grid {
            grid-template-columns: 1fr;
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
            Đăng nhập theo phân quyền để truy cập hệ thống
          </p>
        </div>

        {/* Quick login */}
        <div className="quick-bar">
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            ⚡ Dùng thử nhanh
          </div>
          <div className="quick-grid">
            <button className="quick-btn" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 3px 10px rgba(124,58,237,0.35)' }}
              onClick={() => loginTeacher('gvcn2027')}>
              👑 GVCN Kim Tuyền
            </button>
            <button className="quick-btn" style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)', boxShadow: '0 3px 10px rgba(2,132,199,0.35)' }}
              onClick={() => loginStudent('7', '07')}>
              👑 Lớp Trưởng (07)
            </button>
            <button className="quick-btn" style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 3px 10px rgba(5,150,105,0.35)' }}
              onClick={() => loginStudent('11', '11')}>
              ⭐ Tổ Trưởng T4 (11)
            </button>
          </div>
        </div>

        {/* Portal tabs */}
        <div className="lg-tabs">
          {PORTALS.map(p => (
            <button
              key={p.id}
              className={`lg-tab${portal === p.id ? ' active' : ''}`}
              style={portal === p.id ? { background: p.bg } : {}}
              onClick={() => { setPortal(p.id); setLoginError(''); }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {loginError && <div className="lg-error">⚠️ {loginError}</div>}

        {/* GVCN form */}
        {portal === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="lg-label" htmlFor="teacher-pass">Mật khẩu Giáo viên Chủ nhiệm</label>
              <div className="pass-field">
                <input
                  id="teacher-pass"
                  className={showPass ? 'reveal' : ''}
                  type="text"
                  placeholder="Nhập mật khẩu GVCN..."
                  value={teacherPass}
                  onChange={e => setTeacherPass(e.target.value)}
                  autoComplete="current-password"
                  inputMode="text"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Hiện/ẩn mật khẩu">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button className="lg-submit" type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 8px 20px rgba(124,58,237,0.35)' }}>
              {loading ? '⏳ Đang xác thực...' : '🚀 Đăng Nhập GVCN — Toàn Quyền Quản Lý'}
            </button>
          </form>
        )}

        {/* Officer / Student form */}
        {(portal === 'officer' || portal === 'student') && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Card picker */}
            <div>
              <label className="lg-label">
                {portal === 'officer' ? 'Chọn Cán bộ / Tổ trưởng' : 'Chọn Học sinh'}
              </label>
              <div className="student-card-grid">
                {listToShow.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`student-card${String(s.id) === String(selectedStudentId) ? ' selected' : ''}`}
                    onClick={() => { setSelectedStudentId(String(s.id)); setLoginError(''); }}
                  >
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '0.1rem' }}>
                      {String(s.id).padStart(2, '0')}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.68rem', lineHeight: 1.25 }}>
                      {s.name.split(' ').slice(-2).join(' ')}
                    </div>
                    {s.position && (
                      <div style={{ fontSize: '0.58rem', color: '#0369a1', marginTop: '0.1rem' }}>
                        {s.position}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="lg-label" htmlFor="student-pass">
                Mật khẩu <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Mặc định: số STT, VD: 01)</span>
              </label>
              <div className="pass-field">
                <input
                  id="student-pass"
                  className={showPass ? 'reveal' : ''}
                  type="text"
                  placeholder="Nhập số STT..."
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
