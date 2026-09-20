import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import {
  fetchCompetitionFromSupabase,
  saveCompetitionRecordToSupabase,
  bulkSaveCompetitionToSupabase,
  subscribeToCompetitionChanges
} from '../../lib/supabase';
import { 
  THI_DUA_CRITERIA, 
  CRITERIA_GROUPS, 
  getCriteriaByGroup, 
  calcWeekScore, 
  calcRanking,
  getStoredCriteria,
  saveStoredCriteria,
  getCriteriaGroups
} from '../../data/thiDuaCriteria';
import EvaluationHistoryModal from './EvaluationHistoryModal';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

// ── LocalStorage Fail-Safe Storage Helpers ─────────────────────────────────────
const STORAGE_KEY = 'qlcn_competition_records';

const STATUS_WEIGHT = {
  approved: 5,
  rejected: 4,
  monitor_approved: 3,
  reviewed: 2,
  submitted: 1,
  draft: 0
};

function getLocalCompetitionStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLocalWeekRecords(weekId) {
  const store = getLocalCompetitionStore();
  return store[weekId] || {};
}

function saveLocalWeekRecords(weekId, weekData) {
  try {
    const store = getLocalCompetitionStore();
    store[weekId] = { ...(store[weekId] || {}), ...weekData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Lỗi lưu localStorage competition:', e);
  }
}

function saveSingleLocalRecord(weekId, studentId, record) {
  try {
    const store = getLocalCompetitionStore();
    if (!store[weekId]) store[weekId] = {};
    store[weekId][studentId] = {
      ...(store[weekId][studentId] || {}),
      ...record,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Lỗi lưu localStorage competition single:', e);
  }
}

function mergeRecords(sourceA = {}, sourceB = {}) {
  const merged = { ...sourceA };
  for (const [sid, recB] of Object.entries(sourceB || {})) {
    const recA = merged[sid];
    if (!recA) {
      merged[sid] = recB;
      continue;
    }
    const weightA = STATUS_WEIGHT[recA.status] || 0;
    const weightB = STATUS_WEIGHT[recB.status] || 0;
    if (weightB > weightA) {
      merged[sid] = { ...recA, ...recB };
    } else if (weightB === weightA) {
      const timeA = recA.updatedAt || recA.submittedAt || '';
      const timeB = recB.updatedAt || recB.submittedAt || '';
      if (timeB && timeB >= timeA) {
        merged[sid] = { ...recA, ...recB };
      }
    }
  }
  return merged;
}

// Phát thông điệp tức thì giữa các tab trình duyệt
function broadcastLocalChange(weekId, record, source = 'local') {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('qlcn_competition_sync');
      bc.postMessage({ weekId, record, source });
      bc.close();
    }
  } catch {}
}

export default function Evaluation({ students = [], onRefresh }) {
  const { user, isTeacher, isGroupLeader, isMonitor, canApproveCompetition } = useAuth();
  const { settings } = useClassSettings() || {};
  const tabsRef = useRef(null);
  
  // Tự động đồng bộ tuần theo Cấu hình lớp (ví dụ: "Tuần 01" -> "tuan_01")
  const defaultWeekId = useMemo(() => {
    if (!settings?.currentWeek) return 'tuan_01';
    const m = settings.currentWeek.match(/\d+/);
    return m ? `tuan_${m[0].padStart(2, '0')}` : 'tuan_01';
  }, [settings?.currentWeek]);

  const [selectedWeek, setSelectedWeek] = useState(defaultWeekId);
  const [selectedStudentId, setSelectedStudentId] = useState(
    user?.id ? String(user.id) : (students[0] ? String(students[0].id) : '1')
  );

  // Tự động chọn đúng học sinh cá nhân khi là tài khoản học sinh
  useEffect(() => {
    if (user?.id && (!isTeacher && !isGroupLeader && !isMonitor)) {
      setSelectedStudentId(String(user.id));
    }
  }, [user, isTeacher, isGroupLeader, isMonitor]);
  
  const [selectedViolations, setSelectedViolations] = useState({});
  const [competitionData, setCompetitionData] = useState(() => getLocalWeekRecords(defaultWeekId)); // studentId -> record

  // Danh mục tiêu chí thi đua động (đồng bộ 2 chiều với Trang Quản trị CMS)
  const [criteriaList, setCriteriaList] = useState(() => getStoredCriteria());
  const criteriaGroups = useMemo(() => getCriteriaGroups(criteriaList), [criteriaList]);
  const [activeGroup, setActiveGroup] = useState(() => criteriaGroups[0] || '1. Chuyên cần');

  // Lắng nghe sự kiện cập nhật tiêu chí từ Trang Quản trị
  useEffect(() => {
    const handleCriteriaUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCriteriaList(e.detail);
      } else {
        setCriteriaList(getStoredCriteria());
      }
    };
    window.addEventListener('qlcn_criteria_updated', handleCriteriaUpdate);
    return () => window.removeEventListener('qlcn_criteria_updated', handleCriteriaUpdate);
  }, []);

  // Tự động kéo tiêu chí mới nhất từ máy chủ API
  useEffect(() => {
    const fetchRemoteCriteria = async () => {
      try {
        const res = await api.getCriteria();
        if (res && res.success && Array.isArray(res.criteria) && res.criteria.length > 0) {
          setCriteriaList(res.criteria);
          saveStoredCriteria(res.criteria);
        }
      } catch {}
    };
    fetchRemoteCriteria();
  }, []);

  const [saving, setSaving] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null); // { id, name } for modal
  const [reviewNotes, setReviewNotes] = useState({}); // studentId -> note
  const [teacherNotes, setTeacherNotes] = useState({}); // studentId -> note

  // Tải dữ liệu thi đua 3 tầng: LocalStorage (0ms) -> Supabase Cloud -> Express API
  const fetchWeekData = async () => {
    // 1. Tải tức thì từ LocalStorage để không delay
    const localRecords = getLocalWeekRecords(selectedWeek);
    if (Object.keys(localRecords).length > 0) {
      setCompetitionData(localRecords);
    }

    // 2. Tải đồng thời từ Supabase Cloud và Express API
    try {
      const [sbResult, apiResult] = await Promise.allSettled([
        fetchCompetitionFromSupabase(selectedWeek),
        api.getCompetition(selectedWeek)
      ]);

      const sbData = sbResult.status === 'fulfilled' && sbResult.value ? sbResult.value : {};
      const apiData = apiResult.status === 'fulfilled' && apiResult.value ? apiResult.value : {};

      // Merge thông minh 3 nguồn: Local -> API -> Supabase
      const merged = mergeRecords(mergeRecords(localRecords, apiData), sbData);

      setCompetitionData(merged);
      saveLocalWeekRecords(selectedWeek, merged);
    } catch (err) {
      console.warn('Lỗi đồng bộ thi đua nền:', err);
    }
  };

  useEffect(() => {
    fetchWeekData();
  }, [selectedWeek]);

  // Xử lý bản ghi thi đua gửi về thời gian thực (Supabase Realtime WebSocket & Cross-Tab)
  const handleIncomingRecord = (newRec) => {
    if (!newRec || !newRec.studentId) return;
    const sid = parseInt(newRec.studentId, 10);
    const targetStudent = students.find(s => s.id === sid);
    const studentName = targetStudent?.name || `HS #${sid}`;

    const isSelfAction = user?.id && String(user.id) === String(sid) && newRec.status === 'submitted';

    setCompetitionData(prev => {
      const currentRec = prev[sid] || {};
      const currentWeight = STATUS_WEIGHT[currentRec.status] || 0;
      const incomingWeight = STATUS_WEIGHT[newRec.status] || 0;

      // Q2 Phương án A: Bảo vệ học sinh đang được xem/sửa nếu người dùng đang trực tiếp thao tác
      const isCurrentlyInspecting = String(selectedStudentId) === String(sid);
      if (isCurrentlyInspecting && incomingWeight < currentWeight) {
        return prev;
      }

      const merged = {
        ...currentRec,
        ...newRec,
        updatedAt: new Date().toISOString()
      };
      saveSingleLocalRecord(selectedWeek, sid, merged);
      return {
        ...prev,
        [sid]: merged
      };
    });

    // Q1 Phương án A: Hiển thị thông báo Toast tức thì cho HS / Cán sự / GVCN
    if (!isSelfAction) {
      if (newRec.status === 'submitted') {
        toast(`⚡ Em ${studentName} vừa nộp phiếu tự đánh giá!`, { icon: '📩', duration: 4000 });
      } else if (newRec.status === 'reviewed') {
        toast(`⭐ Tổ trưởng đã duyệt Vòng 1 cho em ${studentName}!`, { icon: '⭐', duration: 4000 });
      } else if (newRec.status === 'monitor_approved') {
        toast(`👑 Lớp trưởng đã duyệt Vòng 2 cho em ${studentName}!`, { icon: '👑', duration: 4000 });
      } else if (newRec.status === 'approved') {
        toast(`✅ GVCN đã phê duyệt chốt điểm cho em ${studentName}!`, { icon: '✅', duration: 4000 });
      } else if (newRec.status === 'rejected') {
        toast(`💬 GVCN yêu cầu em ${studentName} điều chỉnh lại phiếu!`, { icon: '💬', duration: 4000 });
      }
    }
  };

  // Đăng ký kết nối Realtime WebSocket (Supabase) + BroadcastChannel (Cross-tab)
  useEffect(() => {
    // 1. Cross-tab instant communication
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('qlcn_competition_sync');
        bc.onmessage = (event) => {
          if (event.data && event.data.weekId === selectedWeek && event.data.record) {
            handleIncomingRecord(event.data.record);
          }
        };
      }
    } catch {}

    // 2. Supabase Realtime WebSocket (HS <-> Cán sự <-> GVCN tức thì trên mọi thiết bị)
    const channel = subscribeToCompetitionChanges(selectedWeek, ({ record }) => {
      if (record) {
        handleIncomingRecord(record);
      }
    });

    // 3. Fallback StorageEvent
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        const localRecords = getLocalWeekRecords(selectedWeek);
        setCompetitionData(prev => mergeRecords(prev, localRecords));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Khi người dùng focus quay lại tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWeekData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Polling dự phòng nhẹ nhàng mỗi 25 giây
    const interval = setInterval(() => {
      fetchWeekData();
    }, 25000);

    return () => {
      if (bc) bc.close();
      if (channel) channel.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [selectedWeek, selectedStudentId, user]);

  // Đồng bộ tiêu chí của học sinh đang chọn từ bản ghi thi đua
  useEffect(() => {
    const studentRecord = competitionData[selectedStudentId];
    if (studentRecord && studentRecord.violations) {
      const violObj = {};
      (studentRecord.violations || []).forEach(v => {
        violObj[v.criteriaId] = v.count;
      });
      setSelectedViolations(violObj);
    } else {
      setSelectedViolations({});
    }
  }, [selectedStudentId, competitionData]);

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10));
  const currentRecord = competitionData[selectedStudentId] || {};


  // Điều chỉnh tiêu chí (+ / -)
  const handleToggleCriterion = (criteriaId, delta = 1) => {
    // Q1 Phương án A: GVCN có toàn quyền trực tiếp điều chỉnh lỗi/điểm thưởng cho học sinh khi xét duyệt
    if (!isTeacher) {
      if (currentRecord.status === 'approved') {
        toast.error('Phiếu đã được GVCN duyệt chính thức, không thể sửa!');
        return;
      }
      if ((currentRecord.status === 'reviewed' || currentRecord.status === 'monitor_approved') && !isGroupLeader && !isMonitor) {
        toast.error('Phiếu đang trong quy trình xét duyệt, không thể tự chỉnh sửa!');
        return;
      }
    }

    setSelectedViolations(prev => {
      const current = prev[criteriaId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[criteriaId];
      else updated[criteriaId] = next;
      return updated;
    });
  };

  // Nộp phiếu tự đánh giá (Học sinh) — Lưu 3 tầng
  const handleStudentSubmit = async () => {
    setSaving(true);
    const sid = parseInt(selectedStudentId, 10);
    const violationsList = Object.entries(selectedViolations).map(([id, count]) => ({
      criteriaId: parseInt(id, 10),
      count
    }));

    const newRecord = {
      ...(competitionData[selectedStudentId] || {}),
      studentId: sid,
      violations: violationsList,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Cập nhật state tức thì
    setCompetitionData(prev => ({
      ...prev,
      [selectedStudentId]: newRecord
    }));

    // 2. Lưu ngay vào LocalStorage (fail-safe vĩnh viễn không mất dữ liệu)
    saveSingleLocalRecord(selectedWeek, selectedStudentId, newRecord);
    broadcastLocalChange(selectedWeek, newRecord, 'student_submit');

    toast.success('Đã nộp phiếu tự đánh giá thành công!');
    setSaving(false);

    // 3. Đồng bộ song song Cloud Supabase + Express API
    try {
      await Promise.allSettled([
        saveCompetitionRecordToSupabase(selectedWeek, selectedStudentId, newRecord),
        api.selfReport(selectedWeek, sid, violationsList)
      ]);
    } catch (err) {
      console.warn('selfReport API background sync (đã bảo toàn trên máy cá nhân & Supabase):', err.message);
    }
  };

  // Vòng 1: Tổ trưởng Duyệt cho thành viên thuộc Tổ
  const handleGroupLeaderReview = async () => {
    setSaving(true);
    const grp = user?.groupLeaderOf || user?.group || 'Tổ 1';
    const groupStudents = students.filter(s => s.group === grp);

    const updatedData = { ...competitionData };
    const changes = [];

    groupStudents.forEach(s => {
      const record = updatedData[s.id] || {};
      const isCurrent = String(s.id) === selectedStudentId;
      const violations = isCurrent 
        ? Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }))
        : (record.violations || []);

      const rec = {
        ...record,
        studentId: s.id,
        violations,
        reviewNote: reviewNotes[s.id] || record.reviewNote || '',
        reviewedBy: user?.name || 'Tổ trưởng',
        reviewedAt: new Date().toISOString(),
        status: 'reviewed',
        updatedAt: new Date().toISOString()
      };

      updatedData[s.id] = rec;
      changes.push({
        studentId: s.id,
        violations,
        note: rec.reviewNote,
        role: 'group_leader'
      });
    });

    // 1. Cập nhật state & 2. Lưu LocalStorage & Broadcast tức thì
    setCompetitionData(updatedData);
    saveLocalWeekRecords(selectedWeek, updatedData);
    groupStudents.forEach(s => broadcastLocalChange(selectedWeek, updatedData[s.id], 'group_review'));

    toast.success(`⭐ Đã duyệt thi đua Vòng 1 cho ${groupStudents.length} học sinh ${grp}!`);
    setSaving(false);

    // 3. Lưu song song Cloud Supabase + Express API
    try {
      await Promise.allSettled([
        bulkSaveCompetitionToSupabase(selectedWeek, updatedData),
        api.reviewCompetition(selectedWeek, changes)
      ]);
    } catch (err) {
      console.warn('reviewCompetition API sync (đã bảo toàn trên máy & Supabase):', err.message);
    }
  };

  // Vòng 2: Lớp trưởng Duyệt cho Toàn lớp sau khi các Tổ trưởng duyệt
  const handleMonitorReview = async () => {
    setSaving(true);
    const updatedData = { ...competitionData };
    const changes = [];

    students.forEach(s => {
      const record = updatedData[s.id] || {};
      const isCurrent = String(s.id) === selectedStudentId;
      const violations = isCurrent 
        ? Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }))
        : (record.violations || []);

      const rec = {
        ...record,
        studentId: s.id,
        violations,
        reviewNote: reviewNotes[s.id] || record.reviewNote || '',
        monitorApprovedBy: user?.name || 'Lớp trưởng',
        monitorApprovedAt: new Date().toISOString(),
        status: 'monitor_approved',
        updatedAt: new Date().toISOString()
      };

      updatedData[s.id] = rec;
      changes.push({
        studentId: s.id,
        violations,
        note: rec.reviewNote,
        role: 'monitor'
      });
    });

    // 1. Cập nhật state & 2. Lưu LocalStorage & Broadcast tức thì
    setCompetitionData(updatedData);
    saveLocalWeekRecords(selectedWeek, updatedData);
    students.forEach(s => broadcastLocalChange(selectedWeek, updatedData[s.id], 'monitor_review'));

    toast.success(`👑 Lớp trưởng đã duyệt thi đua Vòng 2 cho toàn bộ ${students.length} học sinh!`);
    setSaving(false);

    // 3. Lưu song song Cloud Supabase + Express API
    try {
      await Promise.allSettled([
        bulkSaveCompetitionToSupabase(selectedWeek, updatedData),
        api.reviewCompetition(selectedWeek, changes)
      ]);
    } catch (err) {
      console.warn('monitorReview API sync (đã bảo toàn trên máy & Supabase):', err.message);
    }
  };

  // Vòng 3: GVCN Chốt / Yêu cầu sửa (Phương án 1A, 2A, 3A: Hỗ trợ Duyệt riêng hoặc Duyệt toàn lớp)
  const handleTeacherAction = async (action = 'approve', scope = 'single') => {
    setSaving(true);
    const sid = parseInt(selectedStudentId, 10);
    const currStudentName = currentStudent?.name || `HS #${selectedStudentId}`;
    const updatedData = { ...competitionData };
    const changes = [];

    if (scope === 'single') {
      const record = updatedData[sid] || {};
      const violations = Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }));
      const rec = {
        ...record,
        studentId: sid,
        violations,
        teacherNote: teacherNotes[sid] || record.teacherNote || '',
        teacherOverride: true,
        approvedBy: user?.name || 'GVCN',
        approvedAt: new Date().toISOString(),
        status: action === 'reject' ? 'rejected' : 'approved',
        updatedAt: new Date().toISOString()
      };
      updatedData[sid] = rec;
      changes.push({
        studentId: sid,
        violations,
        teacherNote: rec.teacherNote,
        action
      });
    } else {
      // Q2 Phương án A: Duyệt toàn bộ lớp -> Học sinh chưa nộp tính 0 vi phạm (100đ) và duyệt luôn!
      students.forEach(s => {
        const record = updatedData[s.id] || {};
        const isCurrent = String(s.id) === selectedStudentId;
        const violations = isCurrent
          ? Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }))
          : (record.violations || []);

        const rec = {
          ...record,
          studentId: s.id,
          violations,
          teacherNote: teacherNotes[s.id] || record.teacherNote || '',
          teacherOverride: isCurrent,
          approvedBy: user?.name || 'GVCN',
          approvedAt: new Date().toISOString(),
          status: 'approved',
          updatedAt: new Date().toISOString()
        };
        updatedData[s.id] = rec;
        changes.push({
          studentId: s.id,
          violations,
          teacherNote: rec.teacherNote,
          action: 'approve'
        });
      });
    }

    // 1. Cập nhật state & 2. Lưu LocalStorage & Broadcast tức thì
    setCompetitionData(updatedData);
    saveLocalWeekRecords(selectedWeek, updatedData);
    if (scope === 'single') {
      broadcastLocalChange(selectedWeek, updatedData[sid], 'teacher_action');
    } else {
      students.forEach(s => broadcastLocalChange(selectedWeek, updatedData[s.id], 'teacher_action'));
    }

    if (scope === 'single') {
      toast.success(action === 'approve' ? `✅ Đã phê duyệt chốt điểm cho em ${currStudentName}!` : `💬 Đã yêu cầu em ${currStudentName} làm lại phiếu!`);
    } else {
      toast.success(`🚀 GVCN đã phê duyệt chốt điểm đồng loạt cho toàn bộ ${students.length} học sinh!`);
    }
    setSaving(false);

    // 3. Lưu song song Cloud Supabase + Express API
    try {
      await Promise.allSettled([
        bulkSaveCompetitionToSupabase(selectedWeek, updatedData),
        api.finalApprove(selectedWeek, changes)
      ]);
    } catch (err) {
      console.warn('finalApprove API sync (đã bảo toàn trên máy & Supabase):', err.message);
    }
  };



  // Convert selectedViolations object to violations array for score calc
  const currentViolationsArray = Object.entries(selectedViolations).map(([id, count]) => ({
    criteriaId: parseInt(id, 10),
    count
  }));

  const weekScore = calcWeekScore(currentViolationsArray);
  const ranking = calcRanking(weekScore);

  // Stats for BarChart
  const groupStats = useMemo(() => {
    return ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map(gName => {
      const gs = students.filter(s => s.group === gName);
      let total = 0;
      gs.forEach(s => {
        const record = competitionData[s.id];
        const vList = record && record.violations ? record.violations : [];
        total += calcWeekScore(vList);
      });
      const avg = gs.length > 0 ? parseFloat((total / gs.length).toFixed(1)) : 100;
      return { name: gName, 'Điểm TB': avg, 'Sĩ số': gs.length };
    });
  }, [students, competitionData]);

  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly_audit'

  // Star Student & Best Group calculation
  const bestGroup = useMemo(() => {
    if (!groupStats.length) return null;
    return [...groupStats].sort((a, b) => b['Điểm TB'] - a['Điểm TB'])[0];
  }, [groupStats]);

  const starStudents = useMemo(() => {
    return students.filter(s => {
      const rec = competitionData[s.id];
      const vList = rec && rec.violations ? rec.violations : [];
      return calcWeekScore(vList) === 100;
    });
  }, [students, competitionData]);

  // PDF Export for Competition Report
  const handleExportCompetitionPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Trình duyệt chặn pop-up'); return; }

    const weekNum = selectedWeek.replace('tuan_', '');
    const rows = students.map((s, idx) => {
      const rec = competitionData[s.id] || {};
      const vList = rec.violations || [];
      const score = calcWeekScore(vList);
      const rk = calcRanking(score);
      const vText = vList.map(v => {
        const c = criteriaList.find(item => String(item.id) === String(v.criteriaId)) || THI_DUA_CRITERIA.find(item => item.id === v.criteriaId);
        return c ? `${c.label || c.name} (x${v.count})` : '';
      }).filter(Boolean).join(', ');

      return `<tr>
        <td style="text-align:center; padding: 6px;">${idx + 1}</td>
        <td style="padding: 6px; font-weight: bold;">${s.name}</td>
        <td style="text-align:center; padding: 6px;">${s.group || 'Tổ 1'}</td>
        <td style="text-align:center; padding: 6px; font-weight: bold; color: ${score >= 90 ? '#16a34a' : score >= 80 ? '#2563eb' : '#dc2626'}">${score}</td>
        <td style="text-align:center; padding: 6px;">${rk.rank}</td>
        <td style="padding: 6px; font-size: 11px;">${vText || 'Không vi phạm'}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo Cáo Thi Đua Lớp 12.7 - Tuần ${weekNum}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.4; color: #000; }
          h2, h3 { text-align: center; margin: 5px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #000; }
          th { background-color: #f2f2f2; padding: 8px; text-align: center; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; text-align: center; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between;">
          <div>TRƯỜNG THPT QUỐC GIA<br/><strong>LỚP 12.7</strong></div>
          <div style="text-align: right;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>Độc lập - Tự do - Hạnh phúc</div>
        </div>
        <hr style="margin: 15px 0; border: 0.5px solid #000;" />
        <h2>BẢNG TỔNG HỢP XẾP LOẠI THI ĐƯA NỀ NẾP TUẦN ${weekNum}</h2>
        <p style="text-align: center; font-style: italic; margin-top: 0;">(Phục vụ Chào cờ Thứ 2 và Đánh giá Hạnh kiểm hàng tuần)</p>
        
        <div style="margin: 10px 0; font-size: 13px;">
          • <strong>Tổ xuất sắc nhất tuần:</strong> ${bestGroup ? `${bestGroup.name} (ĐTB: ${bestGroup['Điểm TB']}đ)` : 'Tổ 1'}<br/>
          • <strong>Số học sinh đạt điểm tuyệt đối 100đ (⭐ Ngôi Sao Tuần):</strong> ${starStudents.length} / ${students.length} học sinh
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th>Họ và Tên</th>
              <th style="width: 60px;">Tổ</th>
              <th style="width: 70px;">Điểm</th>
              <th style="width: 80px;">Xếp loại</th>
              <th>Chi tiết vi phạm trong tuần</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div><strong>ĐẠI DIỆN BAN THI ĐƯA LỚP</strong><br/><br/><br/><br/>(Ký & ghi rõ họ tên)</div>
          <div><strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/><br/><br/><br/>Đỗ Kim Tuyền</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Trạng thái hiển thị badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>✅ GVCN Đã Duyệt Chốt Điểm</span>;
      case 'monitor_approved': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>👑 Lớp Trưởng Đã Duyệt Vòng 2 (Chờ GVCN)</span>;
      case 'reviewed': return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⏳ Tổ Trưởng Đã Duyệt Vòng 1 (Chờ Lớp Trưởng)</span>;
      case 'submitted': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>📩 Đã Nộp (Chờ Tổ Trưởng)</span>;
      case 'rejected': return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>❌ Yêu Cầu Sửa Lại</span>;
      default: return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>📝 Đang Tự Kê Khai</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Control Row (Minimal & Refined Design) */}
      <div className="glass-panel eval-top-banner" style={{ padding: '1rem 1.25rem', borderRadius: '1.25rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', whiteSpace: 'nowrap' }}>
                📈 Đánh Giá Thi Đua
              </h3>
              {getStatusBadge(currentRecord.status)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                ⏱️ Hạn:
              </span>
              <span className="desktop-deadline-text">HS nộp T6 23:59 • Tổ trưởng duyệt T7 12:00 • GVCN chốt CN 20:00</span>
              <span className="mobile-deadline-text">T6 23:59 (HS) • T7 (Tổ) • CN (GVCN)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="eval-viewmode-toggle" style={{ background: '#f8fafc', padding: '0.2rem', borderRadius: '9999px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.2rem' }}>
              <button
                onClick={() => setViewMode('weekly')}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: viewMode === 'weekly' ? '#1B4D53' : 'transparent',
                  color: viewMode === 'weekly' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                📊 Đánh Giá Tuần
              </button>
              <button
                onClick={() => setViewMode('monthly_audit')}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: viewMode === 'monthly_audit' ? '#1B4D53' : 'transparent',
                  color: viewMode === 'monthly_audit' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                🗓️ Đối Soát Tháng
              </button>
            </div>

            <select
              className="form-input"
              style={{ width: '105px', fontWeight: 800, padding: '0.35rem 0.5rem', fontSize: '0.78rem', borderRadius: '8px', border: '1.5px solid #0284c7', background: '#f0f9ff' }}
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
            >
              {Array.from({ length: 18 }, (_, i) => {
                const wId = `tuan_${String(i + 1).padStart(2, '0')}`;
                return <option key={wId} value={wId}>Tuần {i + 1}</option>;
              })}
            </select>

            {isTeacher && (
              <button
                onClick={handleExportCompetitionPDF}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800,
                  background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  boxShadow: '0 2px 6px rgba(22,163,74,0.15)'
                }}
              >
                📄 Xuất PDF
              </button>
            )}
          </div>
        </div>

        {/* Slim Weekly Summary Strip */}
        <div className="eval-summary-strip" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9',
          background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
          width: '100%', minWidth: 0, boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1rem' }}>🏆</span>
            <span style={{ color: '#64748b' }}>Tổ xuất sắc:</span>
            <strong style={{ color: '#854d0e' }}>{bestGroup ? `${bestGroup.name} (${bestGroup['Điểm TB']}đ)` : 'Tổ 1'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1rem' }}>⭐</span>
            <span style={{ color: '#64748b' }}>Ngôi sao:</span>
            <strong style={{ color: '#166534' }}>{starStudents.length}/{students.length} HS (100đ)</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: 100% width for students, 2-col for officers */}
      <div className="eval-main-grid" style={{ display: 'grid', gridTemplateColumns: (isTeacher || isMonitor || isGroupLeader || canApproveCompetition) ? 'minmax(0, 1.8fr) minmax(0, 1.2fr)' : 'minmax(0, 1fr)', gap: '1.25rem', width: '100%', minWidth: 0 }}>
        
        {/* Main 2-Column Evaluation Panel */}
        <div className="glass-panel eval-panel-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          
          {/* Top Bar inside Card: Student Info & Live Score & Actions */}
          <div className="eval-card-header" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid #f1f5f9',
            width: '100%', minWidth: 0
          }}>
            {/* Student selection or info */}
            {(isTeacher || isMonitor || isGroupLeader || canApproveCompetition) ? (
              <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', color: '#64748b' }}>Chọn Học Sinh:</label>
                <select
                  className="form-input"
                  style={{ width: '100%', maxWidth: '280px', marginTop: '0.2rem', fontWeight: 700, fontSize: '0.85rem' }}
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                >
                  {students.map(s => {
                    const rec = competitionData[s.id] || {};
                    const stBadge = rec.status === 'approved' ? '✅' : rec.status === 'reviewed' ? '⏳' : rec.status === 'submitted' ? '📩' : '📝';
                    return (
                      <option key={s.id} value={s.id}>
                        {stBadge} {String(s.id).padStart(2, '0')} - {s.name} ({s.group})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Phiếu Tự Đánh Giá Cá Nhân:</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1B4D53', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  👨‍🎓 {currentStudent?.name || user?.name} ({currentStudent?.group || user?.group || 'Tổ 1'})
                </div>
              </div>
            )}

            {/* Score & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setHistoryStudent({ id: selectedStudentId, name: currentStudent?.name || '' })}
                className="touch-scale"
                style={{
                  background: '#f0f9ff', border: '1px solid #7dd3fc', color: '#0369a1',
                  padding: '0.5rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  minHeight: '40px'
                }}
              >
                📊 Lịch sử điểm
              </button>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: ranking.color + '12', border: `1.5px solid ${ranking.color}`,
                borderRadius: '0.85rem', padding: '0.35rem 0.75rem'
              }}>
                <span style={{ fontSize: '1.3rem' }}>{ranking.emoji}</span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: ranking.color, lineHeight: 1.1 }}>
                    {weekScore} điểm
                  </div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: ranking.color }}>
                    {ranking.label}
                  </div>
                </div>
              </div>

              {/* Submit button right on top for instant access */}
              {!isTeacher && currentRecord.status !== 'approved' && (
                <button
                  className="btn-primary touch-scale"
                  onClick={handleStudentSubmit}
                  disabled={saving}
                  style={{
                    padding: '0.55rem 1.15rem', fontSize: '0.84rem', fontWeight: 800,
                    borderRadius: '9999px', boxShadow: '0 4px 12px rgba(3, 105, 161, 0.25)',
                    whiteSpace: 'nowrap', minHeight: '40px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {saving ? '⏳ Đang nộp...' : '📩 Nộp Phiếu'}
                </button>
              )}
            </div>
          </div>

          {/* 2-Column Split Body */}
          <div className="eval-split-layout" style={{ width: '100%', minWidth: 0 }}>
            
            {/* Left Column: 8 Groups Sidebar */}
            <div className="eval-groups-sidebar" style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📑 {criteriaGroups.length} Nhóm Tiêu Chí</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Vuốt ngang ➔</span>
              </div>
              <div className="eval-groups-list mobile-pill-scroll" style={{ width: '100%', minWidth: 0 }}>
                {criteriaGroups.map((grp) => {
                  const isActive = activeGroup === grp;
                  const groupCriteria = getCriteriaByGroup(grp, criteriaList);
                  const activeCountInGroup = groupCriteria.reduce((sum, item) => sum + (selectedViolations[item.id] || 0), 0);
                  const isSevereGroup = grp.includes('8.') || grp.toLowerCase().includes('nghiêm trọng');

                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setActiveGroup(grp)}
                      className={`eval-group-btn touch-scale ${isActive ? 'active' : ''} ${isSevereGroup ? 'severe' : ''}`}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grp}</span>
                      {activeCountInGroup > 0 && (
                        <span className="eval-group-count">
                          {activeCountInGroup}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Criteria list of selected group */}
            <div className="eval-criteria-content" style={{ width: '100%', minWidth: 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '0.4rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9',
                width: '100%', minWidth: 0
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: activeGroup.toLowerCase().includes('nghiêm trọng') ? '#b91c1c' : '#0369a1' }}>
                  {activeGroup}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {getCriteriaByGroup(activeGroup, criteriaList).length} tiêu chí
                </div>
              </div>

              {/* Criteria list items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '0.2rem', width: '100%', minWidth: 0 }}>
                {getCriteriaByGroup(activeGroup, criteriaList).map(item => {
                  const count = selectedViolations[item.id] || 0;
                  const title = item.label || item.name;
                  const codeOrId = item.code || `#${item.id}`;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.8rem 0.95rem', borderRadius: '1rem',
                      background: count > 0 ? (item.isBonus ? '#f0fdf4' : '#fff5f5') : 'white',
                      border: `1.5px solid ${count > 0 ? (item.isBonus ? '#86efac' : '#fca5a5') : '#f1f5f9'}`,
                      boxShadow: count > 0 ? '0 2px 8px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease',
                      width: '100%', minWidth: 0, boxSizing: 'border-box'
                    }}>
                      <div style={{ flex: '1 1 auto', minWidth: 0, paddingRight: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#111827', lineHeight: 1.38, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {codeOrId}. {title}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: item.isBonus ? '#15803d' : '#b91c1c', fontWeight: 800, marginTop: '0.15rem', display: 'inline-block' }}>
                          {item.points > 0 ? `+${item.points}` : item.points} điểm / {item.unit || 'lần'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          className="criteria-btn touch-scale"
                          onClick={() => handleToggleCriterion(item.id, -1)}
                          disabled={count === 0}
                          title={count === 0 ? "Chưa có vi phạm" : "Trừ 1"}
                          style={{
                            width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #d1d5db',
                            background: 'white', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.35 : 1,
                            fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 900, fontSize: '1rem', minWidth: '24px', textAlign: 'center', color: '#1f2937' }}>
                          {count}
                        </span>
                        <button
                          className="criteria-btn touch-scale"
                          onClick={() => handleToggleCriterion(item.id, 1)}
                          title="Cộng 1"
                          style={{
                            width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                            background: item.isBonus ? '#16a34a' : 'var(--color-primary-dark)',
                            color: 'white', cursor: 'pointer', opacity: 1,
                            fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special GVCN Approval & Adjustment Panel */}
              {isTeacher && (
                <div style={{ background: '#f8fafc', borderRadius: '0.875rem', padding: '1.1rem', border: '1.5px solid #e2e8f0', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '0.92rem', fontWeight: 800 }}>
                      ⚖️ GVCN Phê Duyệt & Điều Chỉnh Điểm Trực Tiếp
                    </h4>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                      ✏️ Có quyền sửa điểm bằng nút +/-
                    </span>
                  </div>
                  <textarea
                    className="form-input"
                    style={{ width: '100%', minHeight: '65px', fontSize: '0.82rem', marginBottom: '0.75rem', resize: 'vertical' }}
                    placeholder={`Nhập nhận xét hoặc ghi chú điều chỉnh cho ${currentStudent?.name || 'học sinh'}...`}
                    value={teacherNotes[selectedStudentId] || currentRecord.teacherNote || ''}
                    onChange={e => setTeacherNotes({ ...teacherNotes, [selectedStudentId]: e.target.value })}
                  />
                </div>
              )}

              {/* Bottom Footer inside Criteria Content: Status & Actions */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap', gap: '0.6rem'
              }}>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  {currentRecord.reviewedBy && <div>👤 Tổ trưởng đã duyệt: <strong>{currentRecord.reviewedBy}</strong></div>}
                  {currentRecord.monitorApprovedBy && <div>👑 Lớp trưởng đã duyệt: <strong>{currentRecord.monitorApprovedBy}</strong></div>}
                  {currentRecord.approvedBy && <div>🚀 GVCN đã chốt điểm: <strong>{currentRecord.approvedBy}</strong></div>}
                  {currentRecord.status === 'submitted' && !currentRecord.reviewedBy && <div>📩 Đã nộp phiếu, đang chờ tổ trưởng duyệt.</div>}
                  {currentRecord.status === 'rejected' && <div style={{ color: '#dc2626', fontWeight: 700 }}>❌ Phiếu bị yêu cầu sửa lại. Vui lòng cập nhật và nộp lại.</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* HS Nộp */}
                  {!isTeacher && currentRecord.status !== 'approved' && (
                    <button
                      className="btn-primary touch-scale"
                      onClick={handleStudentSubmit}
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        minHeight: '48px',
                        width: '100%',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 14px rgba(3,105,161,0.28)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      }}
                    >
                      {saving ? '⏳ Đang nộp phiếu...' : '📩 Nộp Phiếu Tự Đánh Giá Tuần'}
                    </button>
                  )}

                  {/* Vòng 1: Tổ trưởng Duyệt */}
                  {isGroupLeader && !isMonitor && (
                    <button className="btn-primary" style={{ background: '#0284c7', padding: '0.55rem 1.1rem', fontSize: '0.84rem' }} onClick={handleGroupLeaderReview} disabled={saving}>
                      {saving ? 'Đang duyệt...' : `⭐ Duyệt Vòng 1 (${user?.groupLeaderOf || user?.group || 'Tổ'})`}
                    </button>
                  )}

                  {/* Vòng 2: Lớp trưởng Duyệt */}
                  {isMonitor && (
                    <button className="btn-primary" style={{ background: '#d97706', padding: '0.55rem 1.1rem', fontSize: '0.84rem' }} onClick={handleMonitorReview} disabled={saving}>
                      {saving ? 'Đang duyệt...' : '👑 Duyệt Vòng 2'}
                    </button>
                  )}

                  {/* Vòng 3: GVCN Chốt */}
                  {isTeacher && (
                    <>
                      <button className="btn-primary" style={{ background: '#dc2626', padding: '0.55rem 0.9rem', fontSize: '0.82rem' }} onClick={() => handleTeacherAction('reject', 'single')} disabled={saving}>
                        💬 Yêu cầu sửa
                      </button>
                      <button className="btn-primary" style={{ background: '#0284c7', padding: '0.55rem 0.95rem', fontSize: '0.82rem' }} onClick={() => handleTeacherAction('approve', 'single')} disabled={saving}>
                        ✅ Duyệt em này
                      </button>
                      <button className="btn-primary" style={{ background: '#059669', padding: '0.55rem 1rem', fontSize: '0.82rem' }} onClick={() => handleTeacherAction('approve', 'all')} disabled={saving}>
                        🚀 Duyệt toàn bộ lớp
                      </button>
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* BarChart & Class Progress List (Only visible to Officers: GVCN, Lớp trưởng, Tổ trưởng) */}
          {(isTeacher || isMonitor || isGroupLeader || canApproveCompetition) && (
            <>
              {/* BarChart */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>🏆 Điểm TB Thi Đua 4 Tổ ({selectedWeek.replace('tuan_', 'Tuần ')})</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={groupStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 110]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                    <Bar dataKey="Điểm TB" radius={[6, 6, 0, 0]}>
                      {groupStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick List Status */}
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem' }}>📋 Tiến Độ Nộp Phiếu Tuần Này</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  {students.map(s => {
                    const r = competitionData[s.id] || {};
                    const st = r.status || 'draft';
                    return (
                      <div key={s.id} onClick={() => setSelectedStudentId(String(s.id))} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.6rem', borderRadius: '0.4rem', background: selectedStudentId === String(s.id) ? '#e0f2fe' : '#f9fafb', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 600 }}>{String(s.id).padStart(2, '0')}. {s.name}</span>
                        <span>
                          {st === 'approved' && '✅ (Đã duyệt)'}
                          {st === 'monitor_approved' && '👑 (Chờ GVCN)'}
                          {st === 'reviewed' && '⏳ (Chờ Lớp trưởng)'}
                          {st === 'submitted' && '📩 (Chờ Tổ)'}
                          {st === 'rejected' && '❌ (Làm lại)'}
                          {st === 'draft' && '📝 (Chưa nộp)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* History Modal */}
      {historyStudent && (
        <EvaluationHistoryModal
          studentId={historyStudent.id}
          studentName={historyStudent.name}
          onClose={() => setHistoryStudent(null)}
        />
      )}

    </div>
  );
}
