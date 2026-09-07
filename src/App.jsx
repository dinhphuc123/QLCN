import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Dashboard from './components/dashboard/Dashboard';
import Students from './components/students/Students';
import Attendance from './components/attendance/Attendance';
import Requests from './components/requests/Requests';
import Notifications from './components/notifications/Notifications';
import Activities from './components/activities/Activities';
import Finance from './components/finance/Finance';
import Evaluation from './components/evaluation/Evaluation';
import Exam from './components/exam/Exam';
import Confessions from './components/confessions/Confessions';
import Reports from './components/reports/Reports';
import AiAssistant from './components/ai/AiAssistant';
import ParentPortal from './components/parent/ParentPortal';
import CmsAdminPanel from './components/admin/CmsAdminPanel';

import LoginGate from './components/auth/LoginGate';
import AuthModal from './components/auth/AuthModal';
import LoadingSkeleton from './components/ui/LoadingSkeleton';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
import { INITIAL_STUDENTS } from './data/initialStudents';

// ── Image Compressor Helper ──────────────────────────────────────────────────
const compressImageFile = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Automatic mobile cache cleaner on new version release
const QLCN_SYNC_VERSION = 'qlcn_v2026_clean_v2';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('qlcn_sync_version') !== QLCN_SYNC_VERSION) {
      [
        'qlcn_announcements', 'qlcn_leave_requests', 'qlcn_home_requests',
        'qlcn_confessions', 'qlcn_activities', 'qlcn_finance',
        'qlcn_attendance', 'qlcn_students_data'
      ].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('qlcn_sync_version', QLCN_SYNC_VERSION);
    }
  } catch {}
}

// ── App Entry Point ─────────────────────────────────────────────────────────
export default function App() {
  const { user, isTeacher, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    students: INITIAL_STUDENTS,
    timetableImage: localStorage.getItem('qlcn_timetable_image') || '',
    classMapImage: localStorage.getItem('qlcn_class_map_image') || '',
    announcements: [],
    leaveRequests: [],
    homeRequests: [],
    confessions: [],
    attendance: {},
    dormAttendance: {},
    activities: [],
    finance: [],
  });

  const lastDataRef = React.useRef(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const result = await api.getData();
      const dataHash = JSON.stringify(result);
      if (lastDataRef.current === dataHash && !isInitial) {
        setLoading(false);
        return; // Skip state update if server data hasn't changed (stops screen flickering!)
      }
      lastDataRef.current = dataHash;

      const localTkb = localStorage.getItem('qlcn_timetable_image') || '';
      const localMap = localStorage.getItem('qlcn_class_map_image') || '';
      let localAnn = [], localReqs = [], localHomeReqs = [], localFinance = [], localActivities = [], localConfessions = [];
      try { localAnn = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]'); } catch {}
      try { localReqs = JSON.parse(localStorage.getItem('qlcn_leave_requests') || '[]'); } catch {}
      try { localHomeReqs = JSON.parse(localStorage.getItem('qlcn_home_requests') || '[]'); } catch {}
      try { localFinance = JSON.parse(localStorage.getItem('qlcn_finance') || '[]'); } catch {}
      try { localActivities = JSON.parse(localStorage.getItem('qlcn_activities') || '[]'); } catch {}
      try { localConfessions = JSON.parse(localStorage.getItem('qlcn_confessions') || '[]'); } catch {}

      const serverAnn = Array.isArray(result.announcements) ? result.announcements : [];
      const serverReqs = Array.isArray(result.leaveRequests) ? result.leaveRequests : [];
      const serverHomeReqs = Array.isArray(result.homeRequests) ? result.homeRequests : [];
      const serverFinance = Array.isArray(result.finance) ? result.finance : [];
      const serverActivities = Array.isArray(result.activities) ? result.activities : [];
      const serverConfessions = Array.isArray(result.confessions) ? result.confessions : [];

      let localSt = null;
      try { localSt = JSON.parse(localStorage.getItem('qlcn_students_data') || 'null'); } catch {}

      const serverSt = (result.students && result.students.length > 0) ? result.students : INITIAL_STUDENTS;
      let finalStudents = serverSt;
      if (Array.isArray(localSt) && localSt.length === serverSt.length) {
        const serverMap = new Map(serverSt.map(s => [s.id, s]));
        const orderedFromLocal = localSt.map(ls => ({ ...(serverMap.get(ls.id) || {}), seatIndex: ls.seatIndex })).filter(Boolean);
        if (orderedFromLocal.length === serverSt.length) {
          finalStudents = orderedFromLocal;
        }
      }

      // Cache authoritative server data to phone localStorage for offline support
      try {
        localStorage.setItem('qlcn_announcements', JSON.stringify(serverAnn));
        localStorage.setItem('qlcn_leave_requests', JSON.stringify(serverReqs));
        localStorage.setItem('qlcn_home_requests', JSON.stringify(serverHomeReqs));
        localStorage.setItem('qlcn_finance', JSON.stringify(serverFinance));
        localStorage.setItem('qlcn_activities', JSON.stringify(serverActivities));
        localStorage.setItem('qlcn_confessions', JSON.stringify(serverConfessions));
      } catch {}

      setData(prev => ({
        ...prev,
        ...result,
        students: finalStudents,
        announcements: serverAnn,
        leaveRequests: serverReqs,
        homeRequests: serverHomeReqs,
        finance: serverFinance,
        activities: serverActivities,
        confessions: serverConfessions,
        timetableImage: result.timetableImage || localTkb || prev.timetableImage,
        classMapImage: result.classMapImage || localMap || prev.classMapImage,
      }));
    } catch {
      if (isInitial) {
        console.warn('Backend server disconnected. Running in client-side mode with preloaded Class 12.7 data.');
      }
      const localTkb = localStorage.getItem('qlcn_timetable_image') || '';
      const localMap = localStorage.getItem('qlcn_class_map_image') || '';
      let localAnn = [], localReqs = [], localHomeReqs = [], localFinance = [], localActivities = [], localConfessions = [];
      try { localAnn = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]'); } catch {}
      try { localReqs = JSON.parse(localStorage.getItem('qlcn_leave_requests') || '[]'); } catch {}
      try { localHomeReqs = JSON.parse(localStorage.getItem('qlcn_home_requests') || '[]'); } catch {}
      try { localFinance = JSON.parse(localStorage.getItem('qlcn_finance') || '[]'); } catch {}
      try { localActivities = JSON.parse(localStorage.getItem('qlcn_activities') || '[]'); } catch {}
      try { localConfessions = JSON.parse(localStorage.getItem('qlcn_confessions') || '[]'); } catch {}

      setData(prev => ({
        ...prev,
        announcements: localAnn.length > 0 ? localAnn : prev.announcements,
        leaveRequests: localReqs.length > 0 ? localReqs : prev.leaveRequests,
        homeRequests: localHomeReqs.length > 0 ? localHomeReqs : prev.homeRequests,
        finance: localFinance.length > 0 ? localFinance : prev.finance,
        activities: localActivities.length > 0 ? localActivities : prev.activities,
        confessions: localConfessions.length > 0 ? localConfessions : prev.confessions,
        timetableImage: prev.timetableImage || localTkb,
        classMapImage: prev.classMapImage || localMap,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData(true);

    // Periodic background sync (every 5 seconds)
    const timer = setInterval(() => {
      fetchData(false);
    }, 5000);

    // Mobile Phone Sync: Automatically refresh data when user switches to app or unlocks screen
    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    window.addEventListener('visibilitychange', handleSyncOnVisible);
    window.addEventListener('focus', handleSyncOnVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleSyncOnVisible);
      window.removeEventListener('focus', handleSyncOnVisible);
    };
  }, [fetchData]);

  // ── Multi-sheet / Single-sheet Smart Excel Upload Handler ─────────────────
  const handleExcelUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Đang đọc và phân tích file Excel...');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      const clean = str => String(str || '').trim();
      const norm = str => clean(str)
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const isNameHeader = (cell) => {
        const n = norm(cell);
        if (n.includes('danh sach') || n.includes('can bo') || n.includes('so dien thoai')) return false;
        return n === 'ho va ten' || n === 'ho va ten hoc sinh' || n === 'ho ten' || n === 'ten hoc sinh' || n === 'ho ten hs' || n === 'name' || (n.includes('ho') && n.includes('ten'));
      };

      // 1. Read main student sheet
      const dsSheetName = wb.SheetNames.find(n => norm(n).includes('ds hoc sinh') || norm(n).includes('danh sach') || norm(n).includes('hoc sinh') || norm(n).includes('ds')) || wb.SheetNames[0];
      const dsSheet = wb.Sheets[dsSheetName];
      const dsRows = XLSX.utils.sheet_to_json(dsSheet, { header: 1, defval: '' });

      let headerRow = dsRows.findIndex(row => {
        const cells = row.map(norm);
        const hasName = cells.some(isNameHeader);
        const hasOther = cells.some(c => c.includes('stt') || c.includes('gioi tinh') || c.includes('ngay sinh') || c.includes('dan toc') || c.includes('sdt') || c.includes('dien thoai'));
        return hasName && (hasOther || cells.filter(Boolean).length >= 3);
      });

      if (headerRow < 0) {
        headerRow = dsRows.findIndex(row => row.some(isNameHeader));
      }

      if (headerRow < 0) {
        toast.error('Không tìm thấy dòng tiêu đề (Họ và Tên) trong file Excel!', { id: toastId });
        return;
      }

      const headers = dsRows[headerRow].map(norm);
      const findIdx = (...keywords) => headers.findIndex(h => keywords.some(k => {
        if (k === 'to') return h === 'to' || h.startsWith('to ') || h.includes(' to ') || h.endsWith(' to');
        return h.includes(k);
      }));

      const nameIdx = findIdx('ho va ten', 'ho ten', 'ten hoc sinh', 'ten');
      const genderIdx = findIdx('gioi tinh', 'phai', 'nam nu');
      const dobIdx = findIdx('ngay sinh', 'ngaysinh', 'nam sinh', 'dob');
      const ethIdx = findIdx('dan toc');
      const addrIdx = findIdx('dia chi', 'noi o', 'ho khau');
      const phoneIdx = findIdx('so dien thoai', 'sdt', 'dien thoai', 'phone');
      const dormIdx = findIdx('phong', 'ktx', 'dorm');
      const groupIdx = findIdx('to', 'nhom', 'group');
      const posIdx = findIdx('chuc vu', 'nhiem vu', 'role', 'position');

      if (nameIdx < 0) {
        toast.error('Không tìm thấy cột Họ và Tên trong bảng!', { id: toastId });
        return;
      }

      const getVal = (row, idx) => idx >= 0 ? clean(row[idx]) : '';

      // 2. Read Contacts sheet (if available)
      const contactSheetName = wb.SheetNames.find(n => norm(n).includes('lien lac') || norm(n).includes('phu huynh') || norm(n).includes('gia dinh') || norm(n).includes('contact'));
      const contactMap = {};
      if (contactSheetName) {
        const cRows = XLSX.utils.sheet_to_json(wb.Sheets[contactSheetName], { header: 1, defval: '' });
        const cHeaderRow = cRows.findIndex(row => row.some(isNameHeader));
        const cStart = cHeaderRow >= 0 ? cHeaderRow + 1 : 1;
        const cHeaders = cHeaderRow >= 0 ? cRows[cHeaderRow].map(norm) : [];
        const cNameIdx = cHeaderRow >= 0 ? cHeaders.findIndex(h => h.includes('ho va ten') || h.includes('ho ten') || h.includes('ten')) : 1;
        const cMomIdx = cHeaderRow >= 0 ? cHeaders.findIndex(h => h === 'me' || h.includes('ten me') || h.includes('me')) : 3;
        const cMomPhoneIdx = cHeaderRow >= 0 ? cHeaders.findIndex(h => (h.includes('dien thoai') || h.includes('sdt')) && h.includes('me')) : 4;
        const cDadIdx = cHeaderRow >= 0 ? cHeaders.findIndex(h => h === 'ba' || h === 'bo' || h.includes('ten ba') || h.includes('ten bo') || h.includes('ba') || h.includes('bo')) : 5;
        const cDadPhoneIdx = cHeaderRow >= 0 ? cHeaders.findIndex(h => (h.includes('dien thoai') || h.includes('sdt')) && (h.includes('ba') || h.includes('bo'))) : 6;

        cRows.slice(cStart).forEach(r => {
          const name = clean(r[cNameIdx >= 0 ? cNameIdx : 1]);
          if (name && !norm(name).includes('ho va ten') && !norm(name).includes('tong so')) {
            contactMap[name] = {
              motherName: clean(r[cMomIdx >= 0 ? cMomIdx : 3]),
              motherPhone: clean(r[cMomPhoneIdx >= 0 ? cMomPhoneIdx : 4]),
              fatherName: clean(r[cDadIdx >= 0 ? cDadIdx : 5]),
              fatherPhone: clean(r[cDadPhoneIdx >= 0 ? cDadPhoneIdx : 6]),
            };
          }
        });
      }

      // 3. Read Officers sheet (if available)
      const officerSheetName = wb.SheetNames.find(n => norm(n).includes('can bo') || norm(n).includes('ban can su') || norm(n).includes('chuc vu') || norm(n).includes('officer'));
      const officerMap = {};
      if (officerSheetName) {
        const oRows = XLSX.utils.sheet_to_json(wb.Sheets[officerSheetName], { header: 1, defval: '' });
        const oHeaderRow = oRows.findIndex(row => row.some(isNameHeader) || row.some(c => norm(c).includes('chuc vu')));
        const oStart = oHeaderRow >= 0 ? oHeaderRow + 1 : 1;
        const oHeaders = oHeaderRow >= 0 ? oRows[oHeaderRow].map(norm) : [];
        const oNameIdx = oHeaderRow >= 0 ? oHeaders.findIndex(h => h.includes('ho va ten') || h.includes('ho ten') || h.includes('ten')) : 2;
        const oPosIdx = oHeaderRow >= 0 ? oHeaders.findIndex(h => h.includes('chuc vu') || h.includes('nhiem vu') || h.includes('vi tri')) : 1;

        oRows.slice(oStart).forEach(r => {
          const name = clean(r[oNameIdx >= 0 ? oNameIdx : 2]);
          const pos = clean(r[oPosIdx >= 0 ? oPosIdx : 1]);
          if (name && pos && !norm(name).includes('ho va ten') && !norm(name).includes('tong so')) {
            if (!officerMap[name]) officerMap[name] = [];
            officerMap[name].push(pos);
          }
        });
      }

      // 4. Read Dorm sheet (if available)
      const dormSheetName = wb.SheetNames.find(n => norm(n).includes('phong ktx') || norm(n).includes('ktx'));
      const dormMap = {};
      if (dormSheetName) {
        const dRows = XLSX.utils.sheet_to_json(wb.Sheets[dormSheetName], { header: 1, defval: '' });
        let currentRoom = 'A1-07';
        dRows.forEach(r => {
          const cellA = clean(r[0]);
          if (cellA.toUpperCase().includes('PHÒNG') || cellA.toUpperCase().includes('PHONG')) {
            const match = cellA.match(/A1-\d+|C08/i);
            if (match) currentRoom = match[0].toUpperCase();
          }
          const name = clean(r[1]);
          if (name && !norm(name).includes('ho va ten') && !norm(name).includes('danh sach')) {
            dormMap[name] = currentRoom;
          }
        });
      }

      // 5. Read Groups sheet (if available)
      const groupSheetName = wb.SheetNames.find(n => norm(n).includes('4 to') || norm(n).includes('danh sach to'));
      const groupMap = {};
      if (groupSheetName) {
        const gRows = XLSX.utils.sheet_to_json(wb.Sheets[groupSheetName], { header: 1, defval: '' });
        let currentGroup = 'Tổ 1';
        gRows.forEach(r => {
          const cellA = clean(r[0]);
          if (cellA.toUpperCase().includes('TỔ') || cellA.toUpperCase().includes('TO ')) {
            const match = cellA.match(/TỔ \d|TO \d/i);
            if (match) currentGroup = match[0].toUpperCase().replace('TO', 'Tổ');
          }
          const name = clean(r[1]);
          if (name && !norm(name).includes('ho va ten')) {
            groupMap[name] = currentGroup;
          }
        });
      }

      // Build parsed student list
      const rawStudents = dsRows.slice(headerRow + 1).filter(row => {
        const name = getVal(row, nameIdx);
        const n = norm(name);
        return name && !n.includes('ho va ten') && !n.includes('tong so') && !n.includes('nguoi lap') && !n.includes('giao vien');
      });

      if (rawStudents.length === 0) {
        toast.error('Không tìm thấy dữ liệu học sinh trong file!', { id: toastId });
        return;
      }

      const newStudents = rawStudents.map((row, i) => {
        const id = i + 1;
        const name = getVal(row, nameIdx);
        const cInfo = contactMap[name] || {};
        const positions = officerMap[name] || (posIdx >= 0 && getVal(row, posIdx) ? [getVal(row, posIdx)] : []);
        const positionStr = positions.join(', ');

        let role = 'member';
        if (positionStr.includes('Lớp trưởng')) role = 'monitor';
        else if (positionStr.includes('Tổ trưởng')) role = 'group_leader';
        else if (positionStr.includes('Trưởng phòng')) role = 'room_leader';

        let group = groupMap[name] || (groupIdx >= 0 ? getVal(row, groupIdx) : '');
        if (!group) {
          if (id <= 8) group = 'Tổ 1';
          else if (id <= 16) group = 'Tổ 2';
          else if (id <= 24) group = 'Tổ 3';
          else group = 'Tổ 4';
        }
        if (positionStr.includes('Tổ trưởng tổ 1')) group = 'Tổ 1';
        if (positionStr.includes('Tổ trưởng tổ 2')) group = 'Tổ 2';
        if (positionStr.includes('Tổ trưởng tổ 3')) group = 'Tổ 3';
        if (positionStr.includes('Tổ trưởng tổ 4')) group = 'Tổ 4';

        const gender = getVal(row, genderIdx) || (i < 23 ? 'Nữ' : 'Nam');
        const isMale = gender === 'Nam';

        let dormRoom = dormMap[name] || (dormIdx >= 0 ? getVal(row, dormIdx) : '');
        if (!dormRoom) {
          if (isMale) {
            dormRoom = 'C08';
          } else {
            if (id <= 6) dormRoom = 'A1-07';
            else if (id <= 12) dormRoom = 'A1-08';
            else if (id <= 18) dormRoom = 'A1-09';
            else if (id <= 24) dormRoom = 'A1-10';
            else dormRoom = 'A1-11';
          }
        }

        return {
          id,
          studentCode: '2404766' + String(115 + i).padStart(3, '0'),
          name,
          gender,
          dob: getVal(row, dobIdx),
          ethnicity: getVal(row, ethIdx),
          address: getVal(row, addrIdx),
          phone: getVal(row, phoneIdx),
          motherName: cInfo.motherName || '',
          motherPhone: cInfo.motherPhone || '',
          fatherName: cInfo.fatherName || '',
          fatherPhone: cInfo.fatherPhone || '',
          group,
          dormRoom,
          role,
          position: positionStr,
          isPoor: [5, 6, 12, 18, 24, 27].includes(id),
          points: 100,
          seatIndex: i
        };
      });

      // Update state immediately for instant responsive UI
      setData(prev => ({ ...prev, students: newStudents }));
      try {
        localStorage.setItem('qlcn_custom_students', JSON.stringify(newStudents));
      } catch {}

      await api.bulkImport(newStudents);
      toast.success(`✅ Đã nạp thành công ${newStudents.length} học sinh!`, { id: toastId });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(`Lỗi nạp file: ${err.message}`, { id: toastId });
    }
    e.target.value = '';
  }, [fetchData]);

  // ── Timetable & Class Map Upload Handlers ─────────────────────────────────
  const handleTimetableChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Đang xử lý ảnh thời khóa biểu...');
    try {
      const base64 = await compressImageFile(file);
      // Store in local storage immediately for instant rendering
      try { localStorage.setItem('qlcn_timetable_image', base64); } catch {}
      setData(prev => ({ ...prev, timetableImage: base64 }));

      // Upload to server/API
      await api.uploadTimetable(base64);
      toast.success('✅ Đã cập nhật thời khóa biểu!', { id: toastId });
      fetchData();
    } catch (err) {
      console.warn('API error, fallback local storage:', err.message);
      toast.success('✅ Đã lưu thời khóa biểu!', { id: toastId });
    }
    e.target.value = '';
  }, [fetchData]);

  const handleClassMapChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Đang xử lý ảnh sơ đồ lớp...');
    try {
      const base64 = await compressImageFile(file);
      // Store in local storage immediately for instant rendering
      try { localStorage.setItem('qlcn_class_map_image', base64); } catch {}
      setData(prev => ({ ...prev, classMapImage: base64 }));

      // Upload to server/API
      await api.uploadClassMap(base64);
      toast.success('✅ Đã cập nhật sơ đồ lớp!', { id: toastId });
      fetchData();
    } catch (err) {
      console.warn('API error, fallback local storage:', err.message);
      toast.success('✅ Đã lưu sơ đồ lớp!', { id: toastId });
    }
    e.target.value = '';
  }, [fetchData]);

  const handleDeleteClassMap = useCallback(async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh sơ đồ lớp hiện tại?')) return;
    try {
      localStorage.removeItem('qlcn_class_map_image');
      setData(prev => ({ ...prev, classMapImage: '' }));
      await api.uploadClassMap('');
      toast.success('🗑️ Đã xóa ảnh sơ đồ lớp!');
      fetchData();
    } catch (err) {
      toast.success('🗑️ Đã xóa ảnh sơ đồ lớp!');
    }
  }, [fetchData]);

  // ── Access Denied Lock Banner ─────────────────────────────────────────────
  const AccessDeniedCard = ({ title, onLogin }) => {
    const { loginTeacher } = useAuth();
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '520px', margin: '2rem auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🔒</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#991b1b', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
          Khóa Quyền Riêng Tư: {title}
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Tính năng này chứa dữ liệu quản lý nội bộ dành riêng cho <strong>Giáo viên Chủ nhiệm (GVCN)</strong>. Vui lòng đăng nhập tài khoản GVCN để mở khóa.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn-primary"
            onClick={onLogin}
            style={{ padding: '0.75rem 2rem', background: '#7c3aed', fontWeight: 700 }}
          >
            🔑 Mở Cổng Đăng Nhập GVCN
          </button>
        </div>
      </div>
    );
  };

  const handleUpdateStudents = useCallback((newStudents) => {
    try { localStorage.setItem('qlcn_students_data', JSON.stringify(newStudents)); } catch {}
    setData(prev => ({ ...prev, students: newStudents }));
  }, []);

  // ── Tab Renderer ──────────────────────────────────────────────────────────
  const renderPage = () => {
    if (loading) return <LoadingSkeleton rows={8} />;
    const props = { ...data, isTeacher, onRefresh: fetchData, onUpdateStudents: handleUpdateStudents };

    switch (activeTab) {
      case 'dashboard':     return <Dashboard {...props} setActiveTab={setActiveTab} handleTimetableChange={handleTimetableChange} handleClassMapChange={handleClassMapChange} handleDeleteClassMap={handleDeleteClassMap} />;
      case 'students':      return <Students {...props} handleExcelUpload={handleExcelUpload} />;
      case 'attendance':    return <Attendance {...props} homeRequests={data.homeRequests} />;
      case 'requests':      return <Requests leaveRequests={data.leaveRequests} students={data.students} isTeacher={isTeacher} onRefresh={fetchData} />;
      case 'notifications': return <Notifications announcements={data.announcements} students={data.students} onRefresh={fetchData} />;
      case 'activities':    return <Activities activities={data.activities} onRefresh={fetchData} />;
      case 'finance':       return <Finance finance={data.finance} onRefresh={fetchData} />;
      case 'evaluation':    return <Evaluation {...props} />;
      case 'exam':          return <Exam students={data.students} isTeacher={isTeacher} onRefresh={fetchData} />;
      case 'ai_assistant':  return isTeacher ? <AiAssistant students={data.students} /> : <AccessDeniedCard onLogin={() => setShowAuth(true)} title="AI Trợ Lý GVCN" />;
      case 'parent_portal': return <ParentPortal />;
      case 'confessions':   return <Confessions confessions={data.confessions} isTeacher={isTeacher} onRefresh={fetchData} />;
      case 'reports':       return isTeacher ? <Reports {...props} /> : <AccessDeniedCard onLogin={() => setShowAuth(true)} title="Biểu Mẫu & Excel" />;
      case 'cms_admin':     return isTeacher ? <CmsAdminPanel students={data.students} onRefresh={fetchData} /> : <AccessDeniedCard onLogin={() => setShowAuth(true)} title="Quản Trị CMS Admin" />;
      default:              return <Dashboard {...props} setActiveTab={setActiveTab} handleTimetableChange={handleTimetableChange} handleClassMapChange={handleClassMapChange} handleDeleteClassMap={handleDeleteClassMap} />;
    }
  };

  // Mandatory Authentication Gate (evaluated strictly after all hooks)
  if (!user) return <LoginGate />;

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#729B12', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoginClick={() => setShowAuth(true)}
      />

      <div className="main-content">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isTeacher={isTeacher}
          onLoginClick={() => setShowAuth(true)}
        />
        <main style={{ padding: '1.25rem', minHeight: 'calc(100vh - 64px)' }}>
          {renderPage()}
        </main>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
