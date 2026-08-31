import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

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

  const persistSession = (u, token) => {
    if (u && token) {
      localStorage.setItem('qlcn_session', JSON.stringify(u));
      localStorage.setItem('qlcn_jwt_token', token);
    } else {
      localStorage.removeItem('qlcn_session');
      localStorage.removeItem('qlcn_jwt_token');
    }
  };

  // ── Login GVCN ──────────────────────────────────────────────────────────
  const loginTeacher = useCallback(async (password) => {
    try {
      const res = await api.login({ type: 'teacher', password });
      if (res.success && res.token) {
        setUser(res.user);
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
    } catch (err) {
      setLoginError(err.message || 'Mật khẩu GVCN không chính xác');
    }
    return false;
  }, []);

  // ── Login Học sinh ─────────────────────────────────────────────────────
  const loginStudent = useCallback(async (studentId, password) => {
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
    } catch (err) {
      setLoginError(err.message || 'Đăng nhập không thành công');
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
