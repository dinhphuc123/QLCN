import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';

export default function AuthModal({ onClose }) {
  const { loginTeacher, loginStudent, loginError, setLoginError } = useAuth();
  const [tab, setTab] = useState('teacher'); // 'teacher' | 'student'
  
  // Teacher form
  const [teacherPass, setTeacherPass] = useState('');
  
  // Student form
  const [studentId, setStudentId] = useState('1');
  const [studentPass, setStudentPass] = useState('');

  const handleTeacherSubmit = (e) => {
    e.preventDefault();
    if (loginTeacher(teacherPass)) {
      onClose();
    }
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (loginStudent(studentId, studentPass)) {
      onClose();
    }
  };

  const selectedStudent = INITIAL_STUDENTS.find(s => s.id === parseInt(studentId, 10));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        animation: 'slideUp 0.2s ease'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>🔐</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.4rem' }}>Đăng Nhập QLCN 12.7</h3>
          <p style={{ fontSize: '0.82rem', color: 'gray', marginTop: '0.3rem' }}>
            Hệ thống Quản lý Lớp Chủ nhiệm THPT
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem' }}>
          <button 
            onClick={() => { setTab('teacher'); setLoginError(''); }} 
            style={{
              flex: 1, padding: '0.55rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
              background: tab === 'teacher' ? 'white' : 'transparent',
              color: tab === 'teacher' ? 'var(--color-primary-dark)' : '#6b7280',
              boxShadow: tab === 'teacher' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            👩‍🏫 Giáo Viên Chủ Nhiệm
          </button>
          <button 
            onClick={() => { setTab('student'); setLoginError(''); }} 
            style={{
              flex: 1, padding: '0.55rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
              background: tab === 'student' ? 'white' : 'transparent',
              color: tab === 'student' ? 'var(--color-primary-dark)' : '#6b7280',
              boxShadow: tab === 'student' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            👨‍🎓 Học Sinh / Cán Bộ
          </button>
        </div>

        {/* Teacher form */}
        {tab === 'teacher' ? (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Mật khẩu GVCN
              </label>
              <input
                type="password" 
                className="form-input" 
                style={{ width: '100%' }}
                placeholder="Nhập mật khẩu (mặc định: gvcn2027)..."
                value={teacherPass} 
                onChange={e => { setTeacherPass(e.target.value); setLoginError(''); }}
                autoFocus
              />
            </div>
            {loginError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                ❌ {loginError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '0.65rem', borderRadius: '9999px',
                border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600
              }}>Hủy</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>
                Đăng nhập GVCN
              </button>
            </div>
          </form>
        ) : (
          /* Student form */
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Chọn Học Sinh (Mã STT 01–32)
              </label>
              <select
                className="form-input"
                style={{ width: '100%', cursor: 'pointer' }}
                value={studentId}
                onChange={e => { setStudentId(e.target.value); setLoginError(''); }}
              >
                {INITIAL_STUDENTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {String(s.id).padStart(2, '0')} - {s.name} ({s.group} {s.position ? `| ${s.position}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div style={{ background: '#f0f9ff', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#0369a1' }}>
                📌 Chức vụ: <strong>{selectedStudent.position || 'Thành viên'}</strong> | Tổ: <strong>{selectedStudent.group}</strong>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Mật khẩu đăng nhập
              </label>
              <input
                type="password" 
                className="form-input" 
                style={{ width: '100%' }}
                placeholder={`Mặc định là mã số (${String(studentId).padStart(2, '0')})...`}
                value={studentPass} 
                onChange={e => { setStudentPass(e.target.value); setLoginError(''); }}
              />
              <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.3rem' }}>
                💡 Mật khẩu mặc định là số thứ tự 2 chữ số (VD: STT 01 → mk: 01)
              </p>
            </div>

            {loginError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                ❌ {loginError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '0.65rem', borderRadius: '9999px',
                border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600
              }}>Hủy</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>
                Đăng nhập Học sinh
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}
