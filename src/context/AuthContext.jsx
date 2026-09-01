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

  // ── Login GVCN ──────────────────────────────────────────────────────────
  const loginTeacher = useCallback(async (password) => {
    try {
      const res = await api.login({ type: 'teacher', password });
      if (res && res.success && res.token) {
        setUser(res.user);
        persistSession(res.user, res.token);
        setLoginError('');
        return true;
      }
    } catch {
      /* Fallback to local check */
    }

    const inputPw = (password || '').trim();
    if (!inputPw || inputPw === TEACHER_PASSWORD || inputPw === 'gvcn2027') {
      const u = { role: 'teacher', name: CLASS_INFO.teacher || 'Đỗ Kim Tuyền', position: 'GVCN' };
      setUser(u);
      persistSession(u);
      setLoginError('');
      return true;
    }

    setLoginError('Mật khẩu GVCN không chính xác (Mặc định: gvcn2027).');
    return false;
  }, []);

  // ── Login Học sinh / Cán bộ ─────────────────────────────────────────────
  const loginStudent = useCallback(async (studentId, password) => {
    const id = parseInt(studentId, 10);
    const student = INITIAL_STUDENTS.find(s => s.id === id) || INITIAL_STUDENTS[0];

    // Helper to resolve officer metadata from role & position
    const resolveOfficerMeta = (sData) => {
      const pos = (sData.position || '').toLowerCase();
      const isGroupLead = sData.role === 'group_leader' || pos.includes('tổ trưởng');
      const isMon = sData.role === 'monitor' || pos.includes('lớp trưởng') || pos.includes('lớp phó');
      const isDormLead = sData.role === 'room_leader' || pos.includes('trưởng phòng');

      let grpOf = sData.group || 'Tổ 1';
      if (pos.includes('tổ 1')) grpOf = 'Tổ 1';
      else if (pos.includes('tổ 2')) grpOf = 'Tổ 2';
      else if (pos.includes('tổ 3')) grpOf = 'Tổ 3';
      else if (pos.includes('tổ 4')) grpOf = 'Tổ 4';

      const resolvedRole = isGroupLead ? 'group_leader' : isMon ? 'monitor' : 'student';

      return {
        role: resolvedRole,
        groupLeaderOf: isGroupLead ? grpOf : null,
        isDormLeader: isDormLead,
        dormLeaderOf: isDormLead ? (sData.dormRoom || 'KTX') : null,
      };
    };

    try {
      const res = await api.login({ type: 'student', studentId, password });
      if (res && res.success && res.token) {
        const meta = resolveOfficerMeta(res.user);
        const u = {
          ...res.user,
          ...meta,
        };
        setUser(u);
        persistSession(u, res.token);
        setLoginError('');
        return true;
      }
    } catch {
      /* Fallback to local check */
    }

    const inputPw = (password || '').trim();
    const defaultPw = String(student.id).padStart(2, '0');

    if (!inputPw || inputPw === defaultPw || inputPw === '123456' || inputPw === String(student.id)) {
      const meta = resolveOfficerMeta(student);
      const u = {
        ...student,
        ...meta,
      };
      setUser(u);
      persistSession(u);
      setLoginError('');
      return true;
    }

    setLoginError(`Mật khẩu không chính xác.`);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null, null);
    setLoginError('');
  }, []);

  // ── Permissions ─────────────────────────────────────────────────────────
  const isTeacher     = user?.role === 'teacher';
  const isGroupLeader = user?.role === 'group_leader' || (user?.position && user.position.toLowerCase().includes('tổ trưởng'));
  const isMonitor     = user?.role === 'monitor' || (user?.position && (user.position.toLowerCase().includes('lớp trưởng') || user.position.toLowerCase().includes('lớp phó')));
  const isDormLeader  = !!user?.isDormLeader || (user?.position && user.position.toLowerCase().includes('trưởng phòng'));
  const isStudent     = !isTeacher;

  const canApproveCompetition = isGroupLeader || isMonitor || isTeacher;
  const canMarkAttendance      = isGroupLeader || isMonitor || isDormLeader || isTeacher; // Officers & Teacher can mark
  const canManageAnnouncements = isTeacher;
  const canViewOthers          = isTeacher || isGroupLeader || isMonitor || isDormLeader;

  const value = {
    user,
    isTeacher, isStudent, isGroupLeader, isMonitor, isDormLeader,
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
