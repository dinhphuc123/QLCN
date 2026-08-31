import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';
import { useClassSettings } from '../../context/ClassSettingsContext';

export default function LoginGate() {
  const { loginTeacher, loginStudent, loginError, setLoginError } = useAuth();
  const { settings } = useClassSettings();

  const [portal, setPortal] = useState('teacher'); // 'teacher' | 'officer' | 'student'

  // Form states
  const [teacherPass, setTeacherPass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const [studentPass, setStudentPass] = useState('');

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    await loginTeacher(teacherPass);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    await loginStudent(selectedStudentId, studentPass);
  };

  const officers = INITIAL_STUDENTS.filter(s => s.role === 'group_leader' || s.role === 'monitor');

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31104b 100%)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
      color: '#f8fafc',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '1.5rem',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem',
            background: 'linear-gradient(135deg, #a7f3d0, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            marginBottom: '0.2rem'
          }}>
            ClassMate Pro
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>
            Hệ Thống Quản Lý Lớp {settings.className} ({settings.schoolYear})
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Vui lòng đăng nhập theo phân quyền để truy cập cổng thông tin lớp học
          </p>
        </div>

        {/* Fast 1-Click Login Demo Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.07)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '1rem',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Đăng nhập nhanh (Dành cho Demo & Thử nghiệm):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              onClick={() => loginTeacher('gvcn2027')}
              style={{
                padding: '0.55rem', borderRadius: '0.6rem',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
              }}
            >
              👑 GVCN Kim Tuyền
            </button>
            <button
              onClick={() => loginStudent('1', '01')}
              style={{
                padding: '0.55rem', borderRadius: '0.6rem',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              ⭐ Lớp Trưởng (01)
            </button>
            <button
              onClick={() => loginStudent('3', '03')}
              style={{
                padding: '0.55rem', borderRadius: '0.6rem',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
              }}
            >
              👨‍🎓 Học Sinh (03)
            </button>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.25rem',
          borderRadius: '0.85rem',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => { setPortal('teacher'); setLoginError(''); }}
            style={{
              padding: '0.65rem', borderRadius: '0.65rem', border: 'none',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: portal === 'teacher' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
              color: portal === 'teacher' ? 'white' : '#94a3b8'
            }}
          >
            👑 Cổng GVCN
          </button>
          <button
            onClick={() => { setPortal('officer'); setLoginError(''); }}
            style={{
              padding: '0.65rem', borderRadius: '0.65rem', border: 'none',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: portal === 'officer' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: portal === 'officer' ? 'white' : '#94a3b8'
            }}
          >
            ⭐ Cán Bộ Lớp
          </button>
          <button
            onClick={() => { setPortal('student'); setLoginError(''); }}
            style={{
              padding: '0.65rem', borderRadius: '0.65rem', border: 'none',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: portal === 'student' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              color: portal === 'student' ? 'white' : '#94a3b8'
            }}
          >
            👨‍🎓 Học Sinh
          </button>
        </div>

        {/* Error Alert */}
        {loginError && (
          <div style={{
            padding: '0.75rem 1rem', background: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid #f87171', borderRadius: '0.75rem', color: '#fca5a5',
            fontSize: '0.82rem', fontWeight: 600, textAlign: 'center'
          }}>
            ⚠️ {loginError}
          </div>
        )}

        {/* Portal Forms */}
        {portal === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Mật khẩu Giáo viên Chủ nhiệm (GVCN)
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu GVCN..."
                value={teacherPass}
                onChange={e => setTeacherPass(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.2)',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.5)'
              }}
            >
              🚀 Đăng Nhập GVCN (Toàn Quyền Management)
            </button>
          </form>
        )}

        {portal === 'officer' && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Chọn Cán bộ / Tổ trưởng
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: '#1e293b',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
              >
                {officers.map(s => (
                  <option key={s.id} value={s.id}>
                    STT {String(s.id).padStart(2, '0')}: {s.name} ({s.position})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Mật khẩu xác thực (Mặc định là STT, VD: 01, 02)
              </label>
              <input
                type="password"
                placeholder="Nhập STT của bạn..."
                value={studentPass}
                onChange={e => setStudentPass(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.2)',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white',
                border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 10px 20px -5px rgba(2, 132, 199, 0.5)'
              }}
            >
              ⭐ Đăng Nhập Cán Bộ Lớp & Tổ Trưởng
            </button>
          </form>
        )}

        {portal === 'student' && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Chọn Họ và Tên Học sinh
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: '#1e293b',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
              >
                {INITIAL_STUDENTS.map(s => (
                  <option key={s.id} value={s.id}>
                    STT {String(s.id).padStart(2, '0')}: {s.name} ({s.group})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Mật khẩu (Mặc định là số STT, VD: 03, 05)
              </label>
              <input
                type="password"
                placeholder="Nhập STT của bạn..."
                value={studentPass}
                onChange={e => setStudentPass(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.2)',
                  color: 'white', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white',
                border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 10px 20px -5px rgba(217, 119, 6, 0.5)'
              }}
            >
              👨‍🎓 Đăng Nhập Cổng Học Sinh & Phụ Huynh
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
          🔒 Bảo mật 100% dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP • ClassMate Pro
        </div>
      </div>
    </div>
  );
}
