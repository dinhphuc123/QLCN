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
import Finance from './components/finance/Finance';
import Evaluation from './components/evaluation/Evaluation';
import Confessions from './components/confessions/Confessions';
import Reports from './components/reports/Reports';
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
      let localAnn = [], localReqs = [], localHomeReqs = [], localFinance = [], localConfessions = [];
      try { localAnn = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]'); } catch {}
      try { localReqs = JSON.parse(localStorage.getItem('qlcn_leave_requests') || '[]'); } catch {}
      try { localHomeReqs = JSON.parse(localStorage.getItem('qlcn_home_requests') || '[]'); } catch {}
      try { localFinance = JSON.parse(localStorage.getItem('qlcn_finance') || '[]'); } catch {}
      try { localConfessions = JSON.parse(localStorage.getItem('qlcn_confessions') || '[]'); } catch {}

      const serverAnn = Array.isArray(result.announcements) ? result.announcements : [];
      const mergedAnn = [...serverAnn];
      localAnn.forEach(la => {
        if (!mergedAnn.some(a => String(a.id) === String(la.id))) {
          mergedAnn.unshift(la);
        }
      });

      const serverReqs = Array.isArray(result.leaveRequests) ? result.leaveRequests : [];
      const mergedReqs = [...serverReqs];
      localReqs.forEach(lr => {
        if (!mergedReqs.some(r => String(r.id) === String(lr.id))) {
          mergedReqs.unshift(lr);
        }
      });

      const serverHomeReqs = Array.isArray(result.homeRequests) ? result.homeRequests : [];
      const mergedHomeReqs = [...serverHomeReqs];
      localHomeReqs.forEach(lhr => {
        if (!mergedHomeReqs.some(r => String(r.id) === String(lhr.id))) {
          mergedHomeReqs.unshift(lhr);
        }
      });

      const serverFinance = Array.isArray(result.finance) ? result.finance : [];
      const mergedFinance = [...serverFinance];
      localFinance.forEach(lf => {
        if (!mergedFinance.some(f => String(f.id) === String(lf.id))) {
          mergedFinance.unshift(lf);
        }
      });

      const serverConfessions = Array.isArray(result.confessions) ? result.confessions : [];
      const mergedConfessions = [...serverConfessions];
      localConfessions.forEach(lc => {
        if (!mergedConfessions.some(c => String(c.id) === String(lc.id))) {
          mergedConfessions.unshift(lc);
        }
      });

      let localSt = null;
      try { localSt = JSON.parse(localStorage.getItem('qlcn_students_data') || 'null'); } catch {}

      const serverSt = (result.students && result.students.length > 0) ? result.students : INITIAL_STUDENTS;
      let finalStudents = serverSt;
      if (Array.isArray(localSt) && localSt.length > 0) {
        const serverMap = new Map(serverSt.map(s => [s.id, s]));
        const orderedFromLocal = localSt.map(ls => ({ ...(serverMap.get(ls.id) || {}), ...ls })).filter(Boolean);
        serverSt.forEach(s => {
          if (!orderedFromLocal.some(os => os.id === s.id)) {
            orderedFromLocal.push(s);
          }
        });
        finalStudents = orderedFromLocal;
      }

      setData(prev => ({
        ...prev,
        ...result,
        students: finalStudents,
        announcements: mergedAnn,
        leaveRequests: mergedReqs,
        homeRequests: mergedHomeReqs,
        finance: mergedFinance,
        confessions: mergedConfessions,
        timetableImage: result.timetableImage || localTkb || prev.timetableImage,
        classMapImage: result.classMapImage || localMap || prev.classMapImage,
      }));
    } catch {
      if (isInitial) {
        console.warn('Backend server disconnected. Running in client-side mode with preloaded Class 12.7 data.');
      }
      const localTkb = localStorage.getItem('qlcn_timetable_image') || '';
      const localMap = localStorage.getItem('qlcn_class_map_image') || '';
      let localAnn = [], localReqs = [], localHomeReqs = [], localFinance = [], localConfessions = [];
      try { localAnn = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]'); } catch {}
      try { localReqs = JSON.parse(localStorage.getItem('qlcn_leave_requests') || '[]'); } catch {}
      try { localHomeReqs = JSON.parse(localStorage.getItem('qlcn_home_requests') || '[]'); } catch {}
      try { localFinance = JSON.parse(localStorage.getItem('qlcn_finance') || '[]'); } catch {}
      try { localConfessions = JSON.parse(localStorage.getItem('qlcn_confessions') || '[]'); } catch {}

      setData(prev => ({
        ...prev,
        announcements: localAnn.length > 0 ? localAnn : prev.announcements,
        leaveRequests: localReqs.length > 0 ? localReqs : prev.leaveRequests,
        homeRequests: localHomeReqs.length > 0 ? localHomeReqs : prev.homeRequests,
        finance: localFinance.length > 0 ? localFinance : prev.finance,
        confessions: localConfessions.length > 0 ? localConfessions : prev.confessions,
        timetableImage: prev.timetableImage || localTkb,
        classMapImage: prev.classMapImage || localMap,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    // Realtime background sync polling every 5 seconds
    const timer = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // ── Multi-sheet Excel Upload Handler for tonghop12_7.xlsx ─────────────────
  const handleExcelUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Đang đọc file tonghop12_7.xlsx...');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      // 1. Read DS học sinh 12.7 sheet
      const dsSheetName = wb.SheetNames.find(n => n.includes('DS học sinh') || n.includes('DS') || n === wb.SheetNames[0]);
      const dsSheet = wb.Sheets[dsSheetName];
      const dsRows = XLSX.utils.sheet_to_json(dsSheet, { header: 1, defval: '' });

      const headerRow = dsRows.findIndex(r => r.some(c => String(c).toLowerCase().includes('họ')));
      if (headerRow < 0) { toast.error('Không tìm thấy cột Họ và Tên!', { id: toastId }); return; }

      const headers = dsRows[headerRow].map(h => String(h).toLowerCase().trim());
      const findIdx = (...names) => headers.findIndex(h => names.some(n => h.includes(n)));

      const nameIdx = findIdx('họ và tên', 'tên', 'name');
      const genderIdx = findIdx('giới tính', 'gioi tinh');
      const dobIdx = findIdx('ngày sinh', 'ngay sinh');
      const ethIdx = findIdx('dân tộc', 'dan toc');
      const addrIdx = findIdx('địa chỉ', 'dia chi');
      const phoneIdx = findIdx('số điện thoại', 'sđt', 'phone');

      const getVal = (row, idx) => idx >= 0 ? String(row[idx] || '').trim() : '';

      // 2. Read Contacts sheet
      const contactSheetName = wb.SheetNames.find(n => n.includes('Liên lạc'));
      const contactMap = {};
      if (contactSheetName) {
        const cRows = XLSX.utils.sheet_to_json(wb.Sheets[contactSheetName], { header: 1, defval: '' });
        cRows.slice(4).forEach(r => {
          const name = String(r[1] || '').trim();
          if (name) {
            contactMap[name] = {
              motherName: String(r[3] || '').trim(),
              motherPhone: String(r[4] || '').trim(),
              fatherName: String(r[5] || '').trim(),
              fatherPhone: String(r[6] || '').trim(),
            };
          }
        });
      }

      // 3. Read Officers sheet
      const officerSheetName = wb.SheetNames.find(n => n.includes('Cán bộ'));
      const officerMap = {};
      if (officerSheetName) {
        const oRows = XLSX.utils.sheet_to_json(wb.Sheets[officerSheetName], { header: 1, defval: '' });
        oRows.slice(4).forEach(r => {
          const pos = String(r[1] || '').trim();
          const name = String(r[2] || '').trim();
          if (name) {
            if (!officerMap[name]) officerMap[name] = [];
            officerMap[name].push(pos);
          }
        });
      }

      // 4. Read Dorm sheet
      const dormSheetName = wb.SheetNames.find(n => n.includes('Phòng KTX'));
      const dormMap = {};
      if (dormSheetName) {
        const dRows = XLSX.utils.sheet_to_json(wb.Sheets[dormSheetName], { header: 1, defval: '' });
        let currentRoom = 'A1-07';
        dRows.forEach(r => {
          const cellA = String(r[0] || '').trim();
          if (cellA.includes('PHÒNG')) {
            const match = cellA.match(/A1-\d+|C08/i);
            if (match) currentRoom = match[0].toUpperCase();
          }
          const name = String(r[1] || '').trim();
          if (name && !name.includes('Họ và tên') && !name.includes('DANH SÁCH')) {
            dormMap[name] = currentRoom;
          }
        });
      }

      // 5. Read Groups sheet
      const groupSheetName = wb.SheetNames.find(n => n.includes('Danh sách 4 tổ') || n.includes('4 tổ'));
      const groupMap = {};
      if (groupSheetName) {
        const gRows = XLSX.utils.sheet_to_json(wb.Sheets[groupSheetName], { header: 1, defval: '' });
        let currentGroup = 'Tổ 1';
        gRows.forEach(r => {
          const cellA = String(r[0] || '').trim();
          if (cellA.includes('TỔ')) {
            const match = cellA.match(/TỔ \d/i);
            if (match) currentGroup = match[0].replace('TỔ', 'Tổ');
          }
          const name = String(r[1] || '').trim();
          if (name && !name.includes('Họ và tên')) {
            groupMap[name] = currentGroup;
          }
        });
      }

      // Build parsed student list
      const newStudents = dsRows.slice(headerRow + 1)
        .filter(row => getVal(row, nameIdx))
        .map((row, i) => {
          const name = getVal(row, nameIdx);
          const cInfo = contactMap[name] || {};
          const positions = officerMap[name] || [];
          const positionStr = positions.join(', ');

          let role = 'member';
          if (positionStr.includes('Lớp trưởng')) role = 'monitor';
          else if (positionStr.includes('Tổ trưởng')) role = 'group_leader';
          else if (positionStr.includes('Trưởng phòng')) role = 'room_leader';

          return {
            id: i + 1,
            studentCode: `24047661${15 + i}`,
            name,
            gender: getVal(row, genderIdx) || (i < 23 ? 'Nữ' : 'Nam'),
            dob: getVal(row, dobIdx),
            ethnicity: getVal(row, ethIdx),
            address: getVal(row, addrIdx),
            phone: getVal(row, phoneIdx),
            motherName: cInfo.motherName || '',
            motherPhone: cInfo.motherPhone || '',
            fatherName: cInfo.fatherName || '',
            fatherPhone: cInfo.fatherPhone || '',
            group: groupMap[name] || (i < 8 ? 'Tổ 1' : i < 16 ? 'Tổ 2' : i < 25 ? 'Tổ 3' : 'Tổ 4'),
            dormRoom: dormMap[name] || (i < 22 ? `A1-0${7 + Math.floor(i / 5)}` : 'C08'),
            role,
            position: positionStr,
            isPoor: [5, 6, 12, 18, 24, 27].includes(i + 1),
            points: 100,
            seatIndex: i,
          };
        });

      if (newStudents.length === 0) { toast.error('Không có dữ liệu trong file!', { id: toastId }); return; }

      await api.bulkImport(newStudents);
      toast.success(`✅ Đã nạp thành công ${newStudents.length} học sinh từ 5 Sheet!`, { id: toastId });
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
      case 'dashboard':     return <Dashboard {...props} setActiveTab={setActiveTab} handleTimetableChange={handleTimetableChange} handleClassMapChange={handleClassMapChange} />;
      case 'students':      return <Students {...props} handleExcelUpload={handleExcelUpload} />;
      case 'attendance':    return <Attendance {...props} homeRequests={data.homeRequests} />;
      case 'requests':      return <Requests leaveRequests={data.leaveRequests} students={data.students} isTeacher={isTeacher} onRefresh={fetchData} />;
      case 'notifications': return <Notifications announcements={data.announcements} students={data.students} onRefresh={fetchData} />;
      case 'finance':       return <Finance finance={data.finance} onRefresh={fetchData} />;
      case 'evaluation':    return <Evaluation {...props} />;
      case 'parent_portal': return <ParentPortal />;
      case 'confessions':   return <Confessions confessions={data.confessions} isTeacher={isTeacher} onRefresh={fetchData} />;
      case 'reports':       return isTeacher ? <Reports {...props} /> : <AccessDeniedCard onLogin={() => setShowAuth(true)} title="Biểu Mẫu & Excel" />;
      case 'cms_admin':     return isTeacher ? <CmsAdminPanel students={data.students} onRefresh={fetchData} /> : <AccessDeniedCard onLogin={() => setShowAuth(true)} title="Quản Trị CMS Admin" />;
      default:              return <Dashboard {...props} setActiveTab={setActiveTab} handleTimetableChange={handleTimetableChange} handleClassMapChange={handleClassMapChange} />;
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
