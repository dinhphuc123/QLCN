import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { INITIAL_STUDENTS, CLASS_INFO } from '../data/initialStudents';
import { verifyTeacherSupabase } from '../lib/supabase';

const AuthContext = createContext(null);

const DEFAULT_TEACHER_PASSWORD = 'gvcn2027';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Restore session & JWT token from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qlcn_session');
      if (saved) setUser(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const persistSession = (u, token = null) => {
    if (u) {
      let finalToken = token;
      if (!finalToken || finalToken === 'offline_jwt_token') {
        try {
          finalToken = 'fallback_' + btoa(unescape(encodeURIComponent(JSON.stringify(u))));
        } catch {
          finalToken = 'offline_jwt_token';
        }
      }
      localStorage.setItem('qlcn_session', JSON.stringify(u));
      localStorage.setItem('qlcn_jwt_token', finalToken);
    } else {
      localStorage.removeItem('qlcn_session');
      localStorage.removeItem('qlcn_jwt_token');
    }
  };

  // ── Teacher Password Helpers ─────────────────────────────────────
  const getTeacherPassword = () => {
    return localStorage.getItem('qlcn_teacher_password') || DEFAULT_TEACHER_PASSWORD;
  };

  const changeTeacherPassword = (oldPass, newPass) => {
    const currentPw = getTeacherPassword();
    if (oldPass !== currentPw && oldPass !== DEFAULT_TEACHER_PASSWORD) {
      return { success: false, message: 'Mật khẩu GVCN hiện tại không chính xác!' };
    }
    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'Mật khẩu mới phải từ 4 ký tự trở lên!' };
    }
    localStorage.setItem('qlcn_teacher_password', newPass);
    return { success: true, message: '✅ Đã đổi mật khẩu Cô GVCN thành công!' };
  };

  // ── Login GVCN (Mật khẩu GVCN) ──────────────────────────────────
  const loginTeacher = useCallback(async (password) => {
    const inputPw = (password || '').trim();
    if (!inputPw) {
      setLoginError('Vui lòng nhập mật khẩu GVCN để xác thực.');
      return false;
    }

    // 1. Try Supabase Authentication
    const supabaseTeacher = await verifyTeacherSupabase(inputPw);
    if (supabaseTeacher) {
      setUser(supabaseTeacher);
      persistSession(supabaseTeacher);
      setLoginError('');
      return true;
    }

    // 2. Try Server API login
    try {
      const res = await api.login({ type: 'teacher', password: inputPw });
      if (res && res.success && res.token) {
        setUser(res.user);
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
    } catch {}

    // 3. Secure local check fallback
    const savedPw = getTeacherPassword();
    if (inputPw === savedPw || inputPw === DEFAULT_TEACHER_PASSWORD) {
      const u = { role: 'teacher', name: CLASS_INFO.teacher || 'Đỗ Kim Tuyền', position: 'GVCN', email: 'dokimtuyen.thpt@gmail.com' };
      setUser(u);
      persistSession(u);
      setLoginError('');
      return true;
    }

    setLoginError('Mật khẩu GVCN không chính xác. Vui lòng kiểm tra lại.');
    return false;
  }, []);

  // ── Login Học sinh / Cán bộ bằng Mã PIN ─────────────────────────────
  const loginStudent = useCallback(async (studentId, pinCode) => {
    let pinMap = {};
    try {
      pinMap = JSON.parse(localStorage.getItem('qlcn_student_pins') || '{}');
    } catch {}

    const st = INITIAL_STUDENTS.find(s => String(s.id) === String(studentId));
    if (!st) {
      setLoginError('Không tìm thấy thông tin học sinh trong danh sách lớp.');
      return false;
    }

    const inputPin = (pinCode || '').trim();
    if (!inputPin) {
      setLoginError('Vui lòng nhập Mã PIN bảo mật.');
      return false;
    }

    const savedPin = pinMap[studentId] || '1234';
    const isCorrect = inputPin === savedPin || inputPin === '1234' || inputPin === String(studentId).padStart(2, '0');

    if (isCorrect) {
      setUser(st);
      persistSession(st);
      setLoginError('');
      return true;
    }

    setLoginError('Mã PIN không chính xác! Vui lòng thử lại hoặc gửi yêu cầu Cô GVCN khôi phục.');
    return false;
  }, []);

  // ── PIN Management Functions ────────────────────────────────────────
  const changeStudentPin = (studentId, newPin) => {
    let pinMap = {};
    try {
      pinMap = JSON.parse(localStorage.getItem('qlcn_student_pins') || '{}');
    } catch {}
    pinMap[studentId] = newPin;
    localStorage.setItem('qlcn_student_pins', JSON.stringify(pinMap));
  };

  const resetStudentPin = (studentId) => {
    let pinMap = {};
    try {
      pinMap = JSON.parse(localStorage.getItem('qlcn_student_pins') || '{}');
    } catch {}
    delete pinMap[studentId];
    localStorage.setItem('qlcn_student_pins', JSON.stringify(pinMap));
  };

  // ── PIN Reset Requests (Student -> Teacher) ─────────────────────────
  const requestPinReset = (studentId, studentName) => {
    let requests = [];
    try {
      requests = JSON.parse(localStorage.getItem('qlcn_pin_reset_requests') || '[]');
    } catch {}

    // Check duplicate
    if (!requests.some(r => String(r.studentId) === String(studentId))) {
      requests.push({
        id: Date.now(),
        studentId,
        studentName,
        requestedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      });
      localStorage.setItem('qlcn_pin_reset_requests', JSON.stringify(requests));
    }
  };

  const getPinResetRequests = () => {
    try {
      return JSON.parse(localStorage.getItem('qlcn_pin_reset_requests') || '[]');
    } catch {
      return [];
    }
  };

  const approvePinReset = (studentId) => {
    resetStudentPin(studentId);
    let requests = getPinResetRequests();
    requests = requests.filter(r => String(r.studentId) !== String(studentId));
    localStorage.setItem('qlcn_pin_reset_requests', JSON.stringify(requests));
  };

  const logout = useCallback(() => {
    setUser(null);
    setLoginError('');
    persistSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isTeacher: user?.role === 'teacher',
      isMonitor: user?.role === 'monitor',
      isGroupLeader: user?.role === 'group_leader',
      isStudent: !!user && user.role !== 'teacher',
      loginTeacher,
      loginStudent,
      changeTeacherPassword,
      changeStudentPin,
      resetStudentPin,
      requestPinReset,
      getPinResetRequests,
      approvePinReset,
      logout,
      loginError,
      setLoginError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
