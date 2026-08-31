import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { INITIAL_STUDENTS, CLASS_INFO } from '../data/initialStudents';

const AuthContext = createContext(null);

const TEACHER_PASSWORD = 'gvcn2027';

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

  const persistSession = (u, token = 'offline_jwt_token') => {
    if (u) {
      localStorage.setItem('qlcn_session', JSON.stringify(u));
      localStorage.setItem('qlcn_jwt_token', token || 'offline_jwt_token');
    } else {
      localStorage.removeItem('qlcn_session');
      localStorage.removeItem('qlcn_jwt_token');
    }
  };

  // ── Login GVCN ──────────────────────────────────────────────────────────
  const loginTeacher = useCallback(async (password) => {
    // Attempt API server login first
    try {
      const res = await api.login({ type: 'teacher', password });
      if (res.success && res.token) {
        setUser(res.user);
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
    } catch {
      // Client-side fallback if server API is offline or returns error
      if (password === TEACHER_PASSWORD) {
        const u = { role: 'teacher', name: CLASS_INFO.teacher || 'Đỗ Kim Tuyền', position: 'GVCN' };
        setUser(u);
        persistSession(u);
        setLoginError('');
        return true;
      }
      setLoginError('Mật khẩu GVCN không chính xác.');
      return false;
    }
    return false;
  }, []);

  // ── Login Học sinh / Cán bộ ─────────────────────────────────────────────
  const loginStudent = useCallback(async (studentId, password) => {
    const id = parseInt(studentId, 10);
    const student = INITIAL_STUDENTS.find(s => s.id === id);

    try {
      const res = await api.login({ type: 'student', studentId, password });
      if (res.success && res.token) {
        const u = {
          ...res.user,
          groupLeaderOf: res.user.role === 'group_leader' ? res.user.group : null,
        };
        setUser(u);
        persistSession(u, res.token);
        setLoginError('');
        return true;
      }
    } catch {
      // Client-side fallback
      if (!student) {
        setLoginError('Mã học sinh không tồn tại (01–32).');
        return false;
      }
      const defaultPw = String(id).padStart(2, '0');
      if (password === defaultPw || password === '123456' || password === String(id)) {
        const u = {
          role: student.role === 'group_leader' ? 'group_leader' : student.role === 'monitor' ? 'monitor' : 'student',
          id: student.id,
          name: student.name,
          position: student.position,
          group: student.group,
          dormRoom: student.dormRoom,
          groupLeaderOf: student.role === 'group_leader' ? student.group : null,
        };
        setUser(u);
        persistSession(u);
        setLoginError('');
        return true;
      }
      setLoginError('Mật khẩu học sinh không chính xác.');
      return false;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null, null);
    setLoginError('');
  }, []);

  // ── Permissions ─────────────────────────────────────────────────────────
  const isTeacher     = user?.role === 'teacher';
  const isGroupLeader = user?.role === 'group_leader';
  const isMonitor     = user?.role === 'monitor';
  const isStudent     = ['student', 'group_leader', 'monitor'].includes(user?.role);

  const canApproveCompetition = isGroupLeader || isTeacher;
  const canMarkAttendance      = isTeacher;
  const canManageAnnouncements = isTeacher;
  const canViewOthers          = isTeacher || isGroupLeader;

  const value = {
    user,
    isTeacher, isStudent, isGroupLeader, isMonitor,
    canApproveCompetition, canMarkAttendance, canManageAnnouncements, canViewOthers,
    loginTeacher, loginStudent, logout,
    loginError, setLoginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
