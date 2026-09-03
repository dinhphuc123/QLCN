import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { INITIAL_STUDENTS, CLASS_INFO } from '../data/initialStudents';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Restore session & JWT token from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('qlcn_session');
      const token = localStorage.getItem('qlcn_jwt_token');
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('qlcn_session');
      localStorage.removeItem('qlcn_jwt_token');
    }
  }, []);

  const persistSession = (u, token = null) => {
    if (u && token) {
      localStorage.setItem('qlcn_session', JSON.stringify(u));
      localStorage.setItem('qlcn_jwt_token', token);
      setUser(u);
    } else {
      localStorage.removeItem('qlcn_session');
      localStorage.removeItem('qlcn_jwt_token');
      setUser(null);
    }
  };

  // ── Đổi mật khẩu GVCN qua Backend API ─────────────────────────────
  const changeTeacherPassword = async (oldPassword, newPassword) => {
    try {
      const res = await api.changeTeacherPassword({ oldPassword, newPassword });
      if (res && res.success) {
        return { success: true, message: '✅ Đã cập nhật mật khẩu Cô GVCN thành công!' };
      }
      return { success: false, message: res?.error || 'Lỗi cập nhật mật khẩu' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  // ── Đổi mã PIN học sinh qua Backend API ──────────────────────────
  const changeStudentPin = async (studentId, newPin) => {
    try {
      const res = await api.changePin({ studentId, newPin });
      if (res && res.success) {
        return { success: true, message: '✅ Đã cập nhật mã PIN học sinh thành công!' };
      }
      return { success: false, message: res?.error || 'Lỗi cập nhật PIN' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  // ── Đăng nhập GVCN ───────────────────────────────────────────────
  const loginTeacher = useCallback(async (password) => {
    const inputPw = (password || '').trim();
    if (!inputPw) {
      setLoginError('Vui lòng nhập mật khẩu GVCN.');
      return false;
    }

    try {
      // 1. Authenticate against Backend API (Bcrypt verification on server/Supabase)
      const res = await api.login({ type: 'teacher', password: inputPw });
      if (res && res.success && res.token) {
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
      setLoginError(res?.error || 'Mật khẩu GVCN không chính xác.');
      return false;
    } catch (err) {
      // 2. Demo fallback if server is offline
      if (inputPw === 'demo2026' || inputPw === 'gvcn_demo') {
        const demoTeacher = { role: 'teacher', name: CLASS_INFO.teacher || 'Đỗ Kim Tuyền', position: 'GVCN' };
        persistSession(demoTeacher, 'demo_session_token');
        setLoginError('');
        return true;
      }
      setLoginError(err.message || 'Mật khẩu GVCN không chính xác.');
      return false;
    }
  }, []);

  // ── Đăng nhập Học sinh / Ban cán sự bằng Mã PIN ─────────────────
  const loginStudent = useCallback(async (studentId, pinCode) => {
    const inputPin = (pinCode || '').trim();
    const sid = parseInt(studentId, 10);

    if (!sid || !inputPin) {
      setLoginError('Vui lòng chọn học sinh và nhập Mã PIN bảo mật.');
      return false;
    }

    try {
      // 1. Authenticate against Backend API (Bcrypt verification on Supabase)
      const res = await api.login({ type: 'student', studentId: sid, password: inputPin });
      if (res && res.success && res.token) {
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
      setLoginError(res?.error || 'Mã PIN không chính xác.');
      return false;
    } catch (err) {
      // 2. Demo fallback if server is offline (demo PIN 1234)
      if (inputPin === '1234') {
        const mockStudent = INITIAL_STUDENTS.find(s => s.id === sid);
        if (mockStudent) {
          persistSession(mockStudent, 'demo_session_token');
          setLoginError('');
          return true;
        }
      }
      setLoginError(err.message || 'Mã PIN không chính xác! Vui lòng liên hệ Cô GVCN nếu quên PIN.');
      return false;
    }
  }, []);

  // ── Đăng xuất ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    persistSession(null, null);
    setLoginError('');
  }, []);

  // ── Yêu cầu đặt lại PIN (Gửi thông báo đến GVCN) ──────────────────
  const requestPinReset = async (studentId, studentName) => {
    try {
      await api.createRequest({
        studentId,
        studentName,
        type: 'Khôi phục mã PIN',
        reason: `Học sinh ${studentName} (STT ${studentId}) yêu cầu cấp lại mã PIN đăng nhập.`
      });
      return true;
    } catch {
      return false;
    }
  };

  const isTeacher = user?.role === 'teacher';
  const isGroupLeader = user?.role === 'group_leader';
  const isMonitor = user?.role === 'monitor';
  const isViceMonitor = user?.role === 'vice_monitor';
  const isRoomLeader = user?.role === 'room_leader';
  const isStudent = !!user && user.role !== 'teacher';
  const isOfficer = isGroupLeader || isMonitor || isViceMonitor || isRoomLeader;

  return (
    <AuthContext.Provider value={{
      user,
      loginTeacher,
      loginStudent,
      logout,
      changeTeacherPassword,
      changeStudentPin,
      requestPinReset,
      loginError,
      setLoginError,
      isTeacher,
      isStudent,
      isOfficer,
      isGroupLeader,
      isMonitor,
      isViceMonitor,
      isRoomLeader,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
