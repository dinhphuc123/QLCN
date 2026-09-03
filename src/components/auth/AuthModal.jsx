import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';

export default function AuthModal({ onClose }) {
  const { loginTeacher, loginStudent, logout, user, loginError, setLoginError } = useAuth();
  const [tab, setTab] = useState(user ? 'profile' : 'teacher'); // 'teacher' | 'leader' | 'student' | 'profile'
  
  // Forms
  const [teacherPass, setTeacherPass] = useState('');
  const [studentId, setStudentId] = useState('1');
  const [studentPass, setStudentPass] = useState('');

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    const ok = await loginTeacher(teacherPass);
    if (ok) {
      onClose();
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const ok = await loginStudent(studentId, studentPass);
    if (ok) {
      onClose();
    }
  };

  const selectedStudent = INITIAL_STUDENTS.find(s => s.id === parseInt(studentId, 10));

  // Filter students by role for tabs
  const groupLeaders = INITIAL_STUDENTS.filter(s => {
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.25rem', width: '100%', maxWidth: '440px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        animation: 'slideUp 0.2s ease'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>🔐</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.35rem' }}>Cổng Đăng Nhập Phân Quyền</h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem' }}>
            Hệ thống Quản lý Lớp THPT ClassMate Pro
          </p>
        </div>

        {/* Currently logged in status banner */}
        {user && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>
                ĐANG ĐĂNG NHẬP VỚI VAI TRÒ:
              </span>
              <strong style={{ fontSize: '0.9rem', color: '#14532d' }}>
                {user.role === 'teacher' ? '👩‍🏫 GVCN Đỗ Kim Tuyền' : user.role === 'group_leader' ? `⭐ Tổ Trưởng ${user.group} (${user.name})` : `👨‍🎓 Học Sinh ${user.name}`}
              </strong>
            </div>
            <button
              onClick={() => { logout(); setTab('teacher'); }}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', background: '#dc2626', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Đăng xuất
            </button>
          </div>
        )}

        {/* Tab Switchers */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '0.85rem', padding: '0.25rem', gap: '0.2rem' }}>
          <button 
            onClick={() => { setTab('teacher'); setLoginError(''); }} 
            style={{
              flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s',
              background: tab === 'teacher' ? 'white' : 'transparent',
              color: tab === 'teacher' ? 'var(--color-primary-dark)' : '#6b7280',
              boxShadow: tab === 'teacher' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            👩‍🏫 GVCN
          </button>
          <button 
            onClick={() => { setTab('leader'); setLoginError(''); }} 
            style={{
              flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s',
              background: tab === 'leader' ? 'white' : 'transparent',
              color: tab === 'leader' ? '#0369a1' : '#6b7280',
              boxShadow: tab === 'leader' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            ⭐ Tổ Trưởng
          </button>
          <button 
            onClick={() => { setTab('student'); setLoginError(''); }} 
            style={{
              flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s',
              background: tab === 'student' ? 'white' : 'transparent',
              color: tab === 'student' ? '#166534' : '#6b7280',
              boxShadow: tab === 'student' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            👨‍🎓 Học Sinh
          </button>
        </div>

        {/* Tab 1: Teacher Form */}
        {tab === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fdf4ff', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f0abfc', fontSize: '0.8rem', color: '#701a75' }}>
              👑 <strong>Quyền hạn GVCN:</strong> Phê duyệt đơn xin phép, chốt thi đua 4 Tổ, quản lý Quỹ lớp, xuất báo cáo Excel & sửa sơ đồ lớp.
            </div>

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
              }}>Đóng</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>
                Đăng nhập GVCN
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Group Leader Form */}
        {tab === 'leader' && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f0f9ff', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1' }}>
              ⭐ <strong>Quyền hạn Tổ Trưởng / Cán Bộ:</strong> Chấm điểm thi đua nháp cho Tổ của mình, xác nhận đơn xin về nhà, hỗ trợ điểm danh.
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Chọn Cán Bộ Lớp / Tổ Trưởng
              </label>
              <select
                className="form-input"
                style={{ width: '100%', fontWeight: 700 }}
                value={studentId}
                onChange={e => { setStudentId(e.target.value); setLoginError(''); }}
              >
                {groupLeaders.map(s => (
                  <option key={s.id} value={s.id}>
                    ⭐ {String(s.id).padStart(2, '0')} - {s.name} ({s.position || s.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Mật khẩu đăng nhập
              </label>
              <input
                type="password" 
                className="form-input" 
                style={{ width: '100%' }}
                placeholder={`Mặc định là STT (${String(studentId).padStart(2, '0')})...`}
                value={studentPass} 
                onChange={e => { setStudentPass(e.target.value); setLoginError(''); }}
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
              }}>Đóng</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem', background: '#0284c7' }}>
                Đăng nhập Tổ Trưởng
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Student Form */}
        {tab === 'student' && (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
              👨‍🎓 <strong>Quyền hạn Học Sinh:</strong> Đăng ký đơn xin nghỉ & về nhà, xem vị trí sơ đồ lớp, gửi hòm thư tâm sự ẩn danh tới GVCN.
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Chọn Học Sinh (Mã STT 01–32)
              </label>
              <select
                className="form-input"
                style={{ width: '100%' }}
                value={studentId}
                onChange={e => { setStudentId(e.target.value); setLoginError(''); }}
              >
                {INITIAL_STUDENTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {String(s.id).padStart(2, '0')} - {s.name} ({s.group} | KTX: {s.dormRoom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
                Mật khẩu cá nhân
              </label>
              <input
                type="password" 
                className="form-input" 
                style={{ width: '100%' }}
                placeholder={`Mặc định là số STT 2 chữ số (${String(studentId).padStart(2, '0')})...`}
                value={studentPass} 
                onChange={e => { setStudentPass(e.target.value); setLoginError(''); }}
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
              }}>Đóng</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem', background: '#16a34a' }}>
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
