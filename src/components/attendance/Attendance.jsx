import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Attendance({ students = [], attendance = {}, homeRequests = [], onRefresh }) {
  const { user, isTeacher, isGroupLeader, isMonitor, isDormLeader } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('attendance5'); // 'attendance5' | 'home_requests'
  const [session, setSession] = useState('morning'); // morning, afternoon, evening_study, sleeping, group_activity
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Home request form modal
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [homeReason, setHomeReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const sessions = [
    { id: 'morning', label: '🌅 Buổi Sáng', time: '07:00 - 11:30', type: 'school' },
    { id: 'afternoon', label: '☀️ Buổi Chiều', time: '13:30 - 17:00', type: 'school' },
    { id: 'evening_study', label: '🌙 Tự Học Tối', time: '19:30 - 21:30', type: 'school' },
    { id: 'sleeping', label: '🛌 Đi Ngủ KTX', time: '22:30 Tắt đèn', type: 'dorm' },
    { id: 'group_activity', label: '🏃 HĐ Tập Thể', time: 'Ngoại khóa', type: 'school' },
  ];

  // Local state for 0ms reactive UI updates & instant offline persistence
  const [localStore, setLocalStore] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qlcn_attendance_records') || '{}');
      return saved;
    } catch {}
    return {};
  });

  // Keep localStore in sync when prop attendance changes
  React.useEffect(() => {
    if (attendance && Object.keys(attendance).length > 0) {
      setLocalStore(prev => ({ ...prev, ...attendance }));
    }
  }, [attendance]);

  // Resolve attendance record for date and session from localStore + props
  const activeAtt = { ...attendance, ...localStore };
  const dateRecord = activeAtt[selectedDate] || {};
  const isLocked = !!dateRecord.isLocked;
  const sessionRecord = (dateRecord.sessions && dateRecord.sessions[session]) 
    ? dateRecord.sessions[session] 
    : (session === 'morning' && !dateRecord.sessions ? dateRecord : {});

  // Extract student check-in status or string status
  const getStudentStatus = (studentId) => {
    const raw = sessionRecord[studentId];
    if (typeof raw === 'object' && raw !== null) {
      return { status: raw.status || 'present', checkedInAt: raw.checkedInAt || null, confirmedBy: raw.confirmedBy || null };
    }
    return { status: raw || 'present', checkedInAt: null, confirmedBy: null };
  };

  // Student Check-in Handler
  const handleStudentCheckIn = async () => {
    if (isLocked) {
      toast.error('Sổ điểm danh ngày này đã được GVCN khóa!');
      return;
    }
    if (!user?.id) return;
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    toast.success(`📍 Đã Check-in có mặt lúc ${nowTime}!`);

    // Instant local state update
    const updatedObj = { status: 'present', checkedInAt: nowTime, confirmedBy: user?.name || 'Học sinh' };
    const updatedSessionRecord = { ...sessionRecord, [user.id]: updatedObj };
    setLocalStore(prev => {
      const prevDate = prev[selectedDate] || {};
      const prevSessions = prevDate.sessions || {};
      const nextStore = {
        ...prev,
        [selectedDate]: {
          ...prevDate,
          sessions: {
            ...prevSessions,
            [session]: updatedSessionRecord
          }
        }
      };
      try { localStorage.setItem('qlcn_attendance_records', JSON.stringify(nextStore)); } catch {}
      return nextStore;
    });

    if (onRefresh) onRefresh();

    // Background sync
    try {
      await api.checkInAttendance(selectedDate, session, user.id);
    } catch (err) {
      console.warn('Check-in sync failed:', err.message);
    }
  };

  // Officer Mark / Status Change Handler (0ms instant reactive update)
  const setStatus = async (studentId, status) => {
    if (isLocked && !isTeacher) {
      toast.error('Sổ điểm danh đã được GVCN khóa, không thể sửa!');
      return;
    }
    const currentObj = getStudentStatus(studentId);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const updatedObj = {
      status,
      checkedInAt: currentObj.checkedInAt || (status === 'present' || status === 'late' ? nowTime : null),
      confirmedBy: user?.name || user?.position || 'Cán bộ lớp',
    };

    const updatedSessionRecord = { ...sessionRecord, [studentId]: updatedObj };

    // 1. Instant 0ms Local State Update
    setLocalStore(prev => {
      const prevDate = prev[selectedDate] || {};
      const prevSessions = prevDate.sessions || {};
      const nextStore = {
        ...prev,
        [selectedDate]: {
          ...prevDate,
          sessions: {
            ...prevSessions,
            [session]: updatedSessionRecord
          }
        }
      };
      try { localStorage.setItem('qlcn_attendance_records', JSON.stringify(nextStore)); } catch {}
      return nextStore;
    });

    // 2. Toast feedback
    const STATUS_NAMES = {
      present: '✅ Có mặt',
      permit: '📝 Có phép',
      late: '⏰ Đi trễ',
      absent: '🔴 KP (Vắng không phép)'
    };
    const targetStudent = students.find(s => s.id === studentId);
    toast.success(`Đã chọn ${targetStudent?.name || 'Học sinh'}: ${STATUS_NAMES[status] || status}`);

    if (onRefresh) onRefresh();

    // 3. Background sync - don't block UI
    try {
      await api.saveAttendance(selectedDate, session, updatedSessionRecord);
    } catch (err) {
      console.warn('Attendance save failed:', err.message);
    }
  };

  // Confirm Quick Action per Group / Dorm
  const handleQuickConfirmScope = async (scopeStudents, scopeLabel) => {
    if (isLocked && !isTeacher) {
      toast.error('Sổ điểm danh đã được GVCN khóa!');
      return;
    }
    const updated = { ...sessionRecord };
    scopeStudents.forEach(s => {
      const stObj = getStudentStatus(s.id);
      updated[s.id] = {
        status: stObj.status || 'present',
        checkedInAt: stObj.checkedInAt,
        confirmedBy: user?.name || scopeLabel,
      };
    });

    toast.success(`Đã xác nhận điểm danh cho ${scopeLabel}!`);
    onRefresh();
    // Background sync
    try {
      await api.saveAttendance(selectedDate, session, updated);
    } catch (err) {
      console.warn('Attendance confirm sync failed, updated locally:', err.message);
    }
  };

  // Lock / Unlock Attendance (GVCN Only)
  const handleToggleLock = async () => {
    try {
      const res = await api.lockAttendance(selectedDate, !isLocked);
      toast.success(res.isLocked ? '🔒 Đã khóa sổ điểm danh ngày!' : '🔓 Đã mở khóa sổ điểm danh!');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Lỗi thao tác khóa sổ!');
    }
  };

  // Home Request Handlers
  const handleCreateHomeRequest = async (e) => {
    e.preventDefault();
    if (!leaveDate || !returnDate || !homeReason.trim()) {
      toast.error('Vui lòng điền đầy đủ ngày về, ngày lên và lý do!');
      return;
    }
    const student = students.find(s => s.id === user?.id) || { id: user?.id || 1, name: user?.name || 'Học sinh' };
    const newReq = {
      id: Date.now(),
      studentId: student.id,
      studentName: student.name,
      leaveDate,
      returnDate,
      reason: homeReason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Instant local persistence fail-safe
    try {
      const savedStr = localStorage.getItem('qlcn_home_requests') || '[]';
      const list = JSON.parse(savedStr);
      list.unshift(newReq);
      localStorage.setItem('qlcn_home_requests', JSON.stringify(list));
    } catch { /* ignore */ }

    setShowHomeModal(false);
    setHomeReason('');
    setLeaveDate('');
    setReturnDate('');
    toast.success('Đã gửi đăng ký về nhà thành công!');

    // Background sync to server
    try {
      await api.createHomeRequest(newReq);
    } catch (err) {
      console.warn('Backend sync home request postponed, saved locally:', err.message);
    }
    onRefresh();
  };


  const handleApproveHomeRequest = async (id, status) => {
    try {
      const localHomeReqs = JSON.parse(localStorage.getItem('qlcn_home_requests') || '[]');
      const updated = localHomeReqs.map(r => r.id === id ? { ...r, status } : r);
      localStorage.setItem('qlcn_home_requests', JSON.stringify(updated));
    } catch {}

    toast.success(status === 'approved' ? 'Đã duyệt cho học sinh về nhà!' : 'Đã từ chối đăng ký!');
    onRefresh();

    try {
      await api.approveHomeRequest(id, status);
    } catch (err) {
      console.warn('API approve home request failed, preserved locally:', err.message);
    }
  };


  // Compute students with >= 2 unexcused absences
  const frequentAbsentees = React.useMemo(() => {
    const counts = {};
    Object.values(attendance || {}).forEach(dayRec => {
      const sessObj = dayRec.sessions || {};
      Object.values(sessObj).forEach(sessRec => {
        if (typeof sessRec === 'object') {
          Object.entries(sessRec).forEach(([sId, val]) => {
            const st = typeof val === 'object' ? val.status : val;
            if (st === 'absent') {
              counts[sId] = (counts[sId] || 0) + 1;
            }
          });
        }
      });
    });

    return students.filter(s => (counts[s.id] || 0) >= 2).map(s => ({
      ...s,
      absentTimes: counts[s.id]
    }));
  }, [students, attendance]);

  // PDF Export for Attendance Report
  const handleExportAttendancePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Trình duyệt chặn pop-up'); return; }

    const rows = students.map((s, idx) => {
      const stObj = getStudentStatus(s.id);
      const stText = stObj.status === 'present' ? 'Có mặt' : stObj.status === 'late' ? 'Đi trễ' : stObj.status === 'permit' ? 'Có phép' : 'Vắng KP';
      const stColor = stObj.status === 'present' ? '#16a34a' : stObj.status === 'late' ? '#d97706' : stObj.status === 'permit' ? '#2563eb' : '#dc2626';

      return `<tr>
        <td style="text-align:center; padding: 6px;">${idx + 1}</td>
        <td style="padding: 6px; font-weight: bold;">${s.name}</td>
        <td style="text-align:center; padding: 6px;">${s.group || 'Tổ 1'}</td>
        <td style="text-align:center; padding: 6px;">${s.dormRoom || 'Không'}</td>
        <td style="text-align:center; padding: 6px; font-weight: bold; color: ${stColor}">${stText}</td>
        <td style="text-align:center; padding: 6px; font-size: 11px;">${stObj.checkedInAt ? new Date(stObj.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo Cáo Sĩ Số & Điểm Danh - Ngày ${selectedDate}</title>
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
        <h2>BÁO CÁO ĐIỂM DANH SĨ SỐ HỌC SINH</h2>
        <p style="text-align: center; font-style: italic; margin-top: 0;">Ngày: ${selectedDate} | Buổi: ${currentSessionDef.label} (${currentSessionDef.time})</p>
        
        <div style="margin: 10px 0; font-size: 13px;">
          • <strong>Tổng sĩ số:</strong> ${students.length} học sinh | <strong>Có mặt:</strong> ${presentCount} | <strong>Vắng phép:</strong> ${permitCount} | <strong>Vắng KP:</strong> ${absentCount} | <strong>Trễ:</strong> ${lateCount}<br/>
          • <strong>Tỷ lệ chuyên cần buổi:</strong> ${Math.round(((presentCount + permitCount) / (students.length || 1)) * 100)}%
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th>Họ và Tên</th>
              <th style="width: 60px;">Tổ</th>
              <th style="width: 80px;">Phòng KTX</th>
              <th style="width: 90px;">Trạng Thái</th>
              <th style="width: 90px;">Giờ Check-in</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div><strong>ĐẠI DIỆN LỚP / TỔ TRƯỞNG</strong><br/><br/><br/><br/>(Ký & ghi rõ họ tên)</div>
          <div><strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/><br/><br/><br/>Đỗ Kim Tuyền</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Compute Statistics
  let absentCount = 0, lateCount = 0, permitCount = 0, presentCount = 0;
  students.forEach(s => {
    const st = getStudentStatus(s.id).status;
    if (st === 'absent') absentCount++;
    else if (st === 'late') lateCount++;
    else if (st === 'permit') permitCount++;
    else presentCount++;
  });

  // Current session definition
  const currentSessionDef = sessions.find(s => s.id === session) || sessions[0];

  // Scoped student filtering based on officer role
  let displayStudents = students;
  let scopeTitle = 'Toàn bộ lớp 12.7';
  let canQuickConfirm = false;

  if (isMonitor) {
    displayStudents = students;
    scopeTitle = 'Toàn bộ lớp 12.7 (Lớp trưởng điểm danh & duyệt)';
    canQuickConfirm = true;
  } else if (isGroupLeader) {
    const grp = user?.groupLeaderOf || user?.group;
    if (grp && currentSessionDef.type === 'school') {
      displayStudents = students.filter(s => s.group === grp);
      scopeTitle = `Danh sách ${grp} (Tổ trưởng quản lý)`;
      canQuickConfirm = true;
    }
  } else if (isDormLeader) {
    const rm = user?.dormLeaderOf || user?.dormRoom;
    if (rm && currentSessionDef.type === 'dorm') {
      displayStudents = students.filter(s => s.dormRoom === rm);
      scopeTitle = `Danh sách Phòng KTX ${rm} (Trưởng phòng quản lý)`;
      canQuickConfirm = true;
    }
  }

  // Current student's own status for Check-in card
  const myCheckInObj = user?.id ? getStudentStatus(user.id) : null;

  const StatusBtn = ({ active, color, label, onClick, disabled }) => {
    const [pressed, setPressed] = useState(false);

    return (
      <button
        onClick={(e) => {
          setPressed(true);
          setTimeout(() => setPressed(false), 150);
          onClick(e);
        }}
        disabled={disabled}
        style={{
          padding: '0.4rem 0.7rem', fontSize: '0.78rem', borderRadius: '0.6rem',
          fontWeight: 800, border: active ? `2px solid ${color}` : '1.5px solid transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled && !active ? 0.35 : 1,
          background: active ? color : '#f1f5f9',
          color: active ? 'white' : '#475569',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: pressed ? 'scale(0.92)' : active ? 'scale(1.03)' : 'scale(1)',
          minHeight: '38px',
          boxShadow: active ? `0 4px 14px ${color}66` : 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
          userSelect: 'none'
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub-tabs Header */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('attendance5')}
            className="btn-primary"
            style={{
              background: activeSubTab === 'attendance5' ? 'var(--color-primary-dark)' : 'transparent',
              color: activeSubTab === 'attendance5' ? 'white' : '#4b5563',
              boxShadow: activeSubTab === 'attendance5' ? undefined : 'none',
            }}
          >
            📝 Điểm Danh Phân Quyền 5 Buổi
          </button>
          <button
            onClick={() => setActiveSubTab('home_requests')}
            className="btn-primary"
            style={{
              background: activeSubTab === 'home_requests' ? 'var(--color-primary-dark)' : 'transparent',
              color: activeSubTab === 'home_requests' ? 'white' : '#4b5563',
              boxShadow: activeSubTab === 'home_requests' ? undefined : 'none',
            }}
          >
            🏠 Đăng Ký Về Nhà Cuối Tuần
          </button>
        </div>

        {activeSubTab === 'home_requests' && (
          <button className="btn-primary" style={{ background: '#059669' }} onClick={() => setShowHomeModal(true)}>
            ➕ Đăng ký về nhà
          </button>
        )}
      </div>

      {/* Frequent Absence Warning Banner */}
      {frequentAbsentees.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1.5px solid #fca5a5',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🚨</span>
            <div>
              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem' }}>
                CẢNH BÁO NỀ NẾP: {frequentAbsentees.length} Học Sinh Vắng Không Phép ≥ 2 Lần!
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {frequentAbsentees.map(s => (
                  <span key={s.id} style={{ background: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #f87171', fontWeight: 700 }}>
                    {s.name} ({s.group || 'Lớp'}) — Vắng {s.absentTimes} buổi
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#991b1b', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 700 }}>
            GVCN Cần Nhắc Nhở
          </span>
        </div>
      )}

      {activeSubTab === 'attendance5' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section Controls: Date picker & Export PDF */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>📅 Chọn Ngày:</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px', fontWeight: 700 }}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {isTeacher && (
              <button
                onClick={handleExportAttendancePDF}
                style={{
                  padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700,
                  background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                }}
              >
                📄 Xuất Báo Cáo Sĩ Số PDF
              </button>
            )}
          </div>
          
          {/* 5-Session Selection Timeline Bar (Visible to both Students & Officers) */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1B4D53', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⏱️ Chọn Buổi Học & Sinh Hoạt Nội Trú ({sessions.length} Buổi):
              </div>

              {/* Student Daily 5/5 Check-in Tracker */}
              {!isTeacher && user && (() => {
                const checkedInCount = sessions.filter(s => {
                  const sRec = (dateRecord.sessions && dateRecord.sessions[s.id]) || (s.id === 'morning' && !dateRecord.sessions ? dateRecord : {});
                  const st = sRec[user.id];
                  return st && (st === 'present' || (typeof st === 'object' && st.status === 'present'));
                }).length;
                const pct = Math.round((checkedInCount / sessions.length) * 100);

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857' }}>
                      🎯 Tiến độ Check-in: <strong>{checkedInCount}/{sessions.length} Buổi</strong> ({pct}%)
                    </span>
                    <div style={{ width: '80px', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 5 Session Horizontal Pill Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {sessions.map(s => {
                const isSelected = session === s.id;
                // Check if current user checked in for this session
                const sRec = (dateRecord.sessions && dateRecord.sessions[s.id]) || (s.id === 'morning' && !dateRecord.sessions ? dateRecord : {});
                const userSt = user?.id ? sRec[user.id] : null;
                const isCheckedIn = userSt && (userSt === 'present' || (typeof userSt === 'object' && userSt.status === 'present'));

                return (
                  <button
                    key={s.id}
                    onClick={() => setSession(s.id)}
                    style={{
                      flex: 1, minWidth: '140px', padding: '0.65rem 0.75rem', borderRadius: '0.75rem',
                      border: isSelected ? '2px solid #1B4D53' : '1.5px solid #e2e8f0',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                      background: isSelected ? '#1B4D53' : 'white',
                      color: isSelected ? 'white' : '#1e293b',
                      boxShadow: isSelected ? '0 4px 12px rgba(27,77,83,0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{s.label}</div>
                      {!isTeacher && user && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 800, padding: '0.08rem 0.4rem', borderRadius: '9999px',
                          background: isCheckedIn ? (isSelected ? '#dcfce7' : '#10b981') : (isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9'),
                          color: isCheckedIn ? (isSelected ? '#166534' : 'white') : (isSelected ? 'white' : '#64748b')
                        }}>
                          {isCheckedIn ? '✓' : '⏳'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.65, marginTop: '0.2rem', fontWeight: 600 }}>
                      {s.time}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Section 1: Student Check-in Card (Dynamic for currently selected session) */}
          {!isTeacher && user && (
            <div className="glass-panel" style={{
              margin: '0.5rem 0 1rem 0',
              padding: '1.1rem 1.35rem',
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              border: '1.5px solid #7dd3fc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 10,
              borderRadius: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, color: '#0369a1', fontSize: '0.95rem', fontWeight: 800 }}>
                  📍 Check-in Cá Nhân: {currentSessionDef.label} ({currentSessionDef.time})
                </h4>
                {myCheckInObj?.checkedInAt && (
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                    ✓ Đã Check-in lúc {myCheckInObj.checkedInAt}
                  </span>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={handleStudentCheckIn}
                disabled={isLocked && !isTeacher}
                style={{
                  background: myCheckInObj?.checkedInAt ? '#0284c7' : '#0369a1',
                  padding: '0.6rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: (isLocked && !isTeacher) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(3, 105, 161, 0.25)',
                  borderRadius: '9999px',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {myCheckInObj?.checkedInAt ? `✓ Đã Check-in (${myCheckInObj.checkedInAt})` : `📍 Check-in ${currentSessionDef.label}`}
              </button>
            </div>
          )}

          {/* Section 2: Main Panel (Only visible to Officers: GVCN, Lớp trưởng, Tổ trưởng, Trưởng phòng KTX) */}
          {(isTeacher || isMonitor || isGroupLeader || isDormLeader) && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
            
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ margin: 0 }}>📊 Sổ Điểm Danh Nề Nếp 12.7</h3>
                  {isLocked && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>🔒 Đã Khóa Sổ Ngày</span>}
                </div>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                  Có mặt: <strong style={{ color: '#16a34a' }}>{presentCount}</strong> | Vắng KP: <strong style={{ color: '#dc2626' }}>{absentCount}</strong> | Có phép: <strong style={{ color: '#2563eb' }}>{permitCount}</strong> | Đi trễ: <strong style={{ color: '#d97706' }}>{lateCount}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="date" className="form-input" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                />

                {/* GVCN Lock Button */}
                {isTeacher && (
                  <button
                    className="btn-primary"
                    style={{ background: isLocked ? '#059669' : '#dc2626', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    onClick={handleToggleLock}
                  >
                    {isLocked ? '🔓 Mở Khóa Sổ Ngày' : '🔒 Khóa Sổ & Duyệt Báo Cáo Ngày'}
                  </button>
                )}

                {/* Scope Quick Confirm for Officers */}
                {!isTeacher && canQuickConfirm && (
                  <button
                    className="btn-primary"
                    style={{ background: '#0284c7', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    disabled={isLocked}
                    onClick={() => handleQuickConfirmScope(displayStudents, scopeTitle)}
                  >
                    ✅ Xác nhận nhanh {scopeTitle}
                  </button>
                )}
              </div>
            </div>

            {/* Session tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.3rem', borderRadius: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSession(s.id)}
                  style={{
                    flex: 1, minWidth: '130px', padding: '0.6rem 0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                    background: session === s.id ? 'white' : 'transparent',
                    color: session === s.id ? 'var(--color-primary-dark)' : '#6b7280',
                    boxShadow: session === s.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <div>{s.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 500 }}>{s.time}</div>
                </button>
              ))}
            </div>

            {/* Scope Information Bar */}
            <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>🎯 Phạm vi quản lý: <strong>{scopeTitle}</strong> ({displayStudents.length} học sinh)</span>
              {isTeacher && <span style={{ color: '#0369a1', fontWeight: 700 }}>👁️ Chế độ GVCN: Giám sát sĩ số & Khóa sổ (không trực tiếp chọn trạng thái)</span>}
            </div>

            {/* Student Attendance List */}
            <div className="attendance-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '0.75rem' }}>
              {displayStudents.map(student => {
                const stObj = getStudentStatus(student.id);
                const status = stObj.status;
                const checkedInAt = stObj.checkedInAt;
                
                // Enable attendance editing for Officers (Lớp trưởng, Tổ trưởng, Trưởng phòng KTX) when not locked
                const canOfficerEdit = !isLocked && (isMonitor || isGroupLeader || isDormLeader);

                return (
                  <div key={student.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: status === 'absent' ? '#fff5f5' : status === 'permit' ? '#eff6ff' : status === 'late' ? '#fffbeb' : 'white',
                    borderRadius: '0.75rem',
                    border: `1px solid ${status === 'absent' ? '#fca5a5' : status === 'permit' ? '#93c5fd' : status === 'late' ? '#fde68a' : '#e5e7eb'}`,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#111827' }}>
                          {String(student.id).padStart(2, '0')}. {student.name}
                        </strong>
                        {checkedInAt && (
                          <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                            📍 {checkedInAt}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {student.group} • {student.dormRoom}
                      </div>
                    </div>

                    {/* Display Status: Read-Only Badge for GVCN vs Interactive Buttons for Class Officers */}
                    {isTeacher ? (
                      <span style={{
                        padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '9999px',
                        fontWeight: 800,
                        background: status === 'absent' ? '#fee2e2' : status === 'permit' ? '#dbeafe' : status === 'late' ? '#fef3c7' : '#dcfce7',
                        color: status === 'absent' ? '#dc2626' : status === 'permit' ? '#1e40af' : status === 'late' ? '#b45309' : '#166534',
                        border: `1.5px solid ${status === 'absent' ? '#fca5a5' : status === 'permit' ? '#93c5fd' : status === 'late' ? '#fde68a' : '#86efac'}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        {status === 'absent' ? '🔴 KP (Vắng không phép)' : status === 'permit' ? '📝 Có phép' : status === 'late' ? '⏰ Đi trễ' : '✓ Có mặt'}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <StatusBtn active={status === 'present'} color="#16a34a" label="✓ Có mặt" onClick={() => setStatus(student.id, 'present')} disabled={!canOfficerEdit} />
                        <StatusBtn active={status === 'permit'} color="#2563eb" label="📝 Phép" onClick={() => setStatus(student.id, 'permit')} disabled={!canOfficerEdit} />
                        <StatusBtn active={status === 'late'} color="#d97706" label="⏰ Trễ" onClick={() => setStatus(student.id, 'late')} disabled={!canOfficerEdit} />
                        <StatusBtn active={status === 'absent'} color="#dc2626" label="🔴 KP" onClick={() => setStatus(student.id, 'absent')} disabled={!canOfficerEdit} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}
        </div>
      ) : (
        /* Home Requests List */
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>🏡 Danh Sách Đăng Ký Về Nhà Cuối Tuần</h3>
          <div className="mobile-scroll-x" style={{ borderRadius: '0.75rem', border: '1px solid #f3f4f6' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Học sinh</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Ngày về</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Ngày lên</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Lý do</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Trạng thái</th>
                  {isTeacher && <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textAlign: 'center' }}>Duyệt đơn</th>}
                </tr>
              </thead>
              <tbody>
                {homeRequests.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>
                    🏡 Chưa có đơn đăng ký về nhà nào
                  </td></tr>
                ) : homeRequests.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.studentName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{item.leaveDate}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{item.returnDate}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#4b5563' }}>{item.reason}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                        background: item.status === 'approved' ? '#dcfce7' : item.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: item.status === 'approved' ? '#166534' : item.status === 'rejected' ? '#991b1b' : '#92400e',
                      }}>
                        {item.status === 'approved' ? '✓ Đã duyệt' : item.status === 'rejected' ? '✗ Từ chối' : '⏳ Chờ GVCN duyệt'}
                      </span>
                    </td>
                    {isTeacher && (
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {item.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#16a34a' }} onClick={() => handleApproveHomeRequest(item.id, 'approved')}>
                              Duyệt
                            </button>
                            <button className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#dc2626' }} onClick={() => handleApproveHomeRequest(item.id, 'rejected')}>
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal đăng ký về nhà */}
      {showHomeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>🏠 Đăng Ký Về Nhà Cuối Tuần</h3>
            
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Ngày về (Thứ 6 / Thứ 7)</label>
              <input type="date" className="form-input" style={{ width: '100%' }} value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Ngày vào lại KTX (Chủ nhật)</label>
              <input type="date" className="form-input" style={{ width: '100%' }} value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Lý do xin về</label>
              <textarea className="form-input" style={{ width: '100%', height: '70px' }} placeholder="Về thăm gia đình, việc riêng..." value={homeReason} onChange={e => setHomeReason(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setShowHomeModal(false)} style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button className="btn-primary" onClick={handleCreateHomeRequest}>Gửi đơn cho GVCN</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
