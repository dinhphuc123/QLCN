import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Attendance({ students = [], attendance = {}, homeRequests = [], isTeacher, onRefresh }) {
  const { user, isGroupLeader, isMonitor, isDormLeader } = useAuth();
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

  // Resolve attendance record for date and session
  const dateRecord = attendance[selectedDate] || {};
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
    try {
      const res = await api.checkInAttendance(selectedDate, session, user.id);
      toast.success(`📍 Đã Check-in có mặt lúc ${res.checkedInAt || 'bây giờ'}!`);
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi Check-in!');
    }
  };

  // Officer Mark / Status Change Handler
  const setStatus = async (studentId, status) => {
    if (isLocked && !isTeacher) {
      toast.error('Sổ điểm danh đã được GVCN khóa, không thể sửa!');
      return;
    }
    const currentObj = getStudentStatus(studentId);
    const updatedObj = {
      status,
      checkedInAt: currentObj.checkedInAt,
      confirmedBy: user?.name || user?.position || 'Cán bộ lớp',
    };

    const updatedSessionRecord = { ...sessionRecord, [studentId]: updatedObj };
    await api.saveAttendance(selectedDate, session, updatedSessionRecord);
    onRefresh();
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

    await toast.promise(
      api.saveAttendance(selectedDate, session, updated),
      { loading: 'Đang xác nhận...', success: `Đã xác nhận điểm danh cho ${scopeLabel}!`, error: 'Lỗi khi xác nhận' }
    );
    onRefresh();
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
    await toast.promise(
      api.createHomeRequest({
        studentId: student.id,
        studentName: student.name,
        leaveDate,
        returnDate,
        reason: homeReason,
      }),
      { loading: 'Đang gửi...', success: 'Đã gửi đăng ký về nhà thành công!', error: 'Lỗi gửi đăng ký' }
    );
    setShowHomeModal(false);
    setHomeReason('');
    setLeaveDate('');
    setReturnDate('');
    onRefresh();
  };

  const handleApproveHomeRequest = async (id, status) => {
    await api.approveHomeRequest(id, status);
    toast.success(status === 'approved' ? 'Đã duyệt cho học sinh về nhà!' : 'Đã từ chối đăng ký!');
    onRefresh();
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

  if (!isTeacher && !isMonitor) {
    if (currentSessionDef.type === 'school' && isGroupLeader && user?.groupLeaderOf) {
      displayStudents = students.filter(s => s.group === user.groupLeaderOf);
      scopeTitle = `Danh sách ${user.groupLeaderOf}`;
      canQuickConfirm = true;
    } else if (currentSessionDef.type === 'dorm' && isDormLeader && user?.dormLeaderOf) {
      displayStudents = students.filter(s => s.dormRoom === user.dormLeaderOf);
      scopeTitle = `Danh sách Phòng KTX ${user.dormLeaderOf}`;
      canQuickConfirm = true;
    }
  }

  // Current student's own status for Check-in card
  const myCheckInObj = user?.id ? getStudentStatus(user.id) : null;

  const StatusBtn = ({ active, color, label, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.35rem 0.65rem', fontSize: '0.76rem', borderRadius: '0.5rem',
        fontWeight: 700, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !active ? 0.4 : 1,
        background: active ? color : '#f3f4f6',
        color: active ? 'white' : '#4b5563',
        transition: 'all 0.15s',
        boxShadow: active ? `0 2px 8px ${color}55` : 'none',
      }}
    >
      {label}
    </button>
  );

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

      {activeSubTab === 'attendance5' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Student Check-in Card (For Students) */}
          {user && !isTeacher && (
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1.5px solid #7dd3fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1rem' }}>📍 Check-in Cá Nhân ({currentSessionDef.label})</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#0c4a6e' }}>
                  {myCheckInObj?.checkedInAt 
                    ? `✅ Bạn đã Check-in lúc ${myCheckInObj.checkedInAt}. Trạng thái: ${myCheckInObj.status === 'present' ? 'Có mặt' : myCheckInObj.status === 'late' ? 'Đi trễ' : 'Đã ghi nhận'}`
                    : 'Nhấn nút để xác nhận sự có mặt của bạn buổi học này.'}
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={handleStudentCheckIn}
                disabled={isLocked}
                style={{ background: myCheckInObj?.checkedInAt ? '#0284c7' : '#0369a1', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                {myCheckInObj?.checkedInAt ? `✓ Đã Check-in (${myCheckInObj.checkedInAt})` : '📍 Bấm Check-in Có Mặt'}
              </button>
            </div>
          )}

          {/* Section 2: Main Panel */}
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
                
                // Permission check: Officers (Group Leader/Dorm Leader/Monitor) can edit before lock; GVCN does NOT edit directly
                const canOfficerEdit = !isTeacher && !isLocked && (
                  isMonitor ||
                  (currentSessionDef.type === 'school' && isGroupLeader && student.group === user?.groupLeaderOf) ||
                  (currentSessionDef.type === 'dorm' && isDormLeader && student.dormRoom === user?.dormLeaderOf) ||
                  (user?.id && Number(user.id) === student.id)
                );

                return (
                  <div key={student.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: status === 'absent' ? '#fff5f5' : status === 'permit' ? '#eff6ff' : status === 'late' ? '#fffbeb' : 'white',
                    borderRadius: '0.75rem',
                    border: `1px solid ${status === 'absent' ? '#fca5a5' : status === 'permit' ? '#93c5fd' : status === 'late' ? '#fde68a' : '#e5e7eb'}`,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

                    {/* If Officer & Not Locked → Display Edit Buttons; If GVCN or Normal Student → Read-only Badge */}
                    {canOfficerEdit ? (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <StatusBtn active={status === 'present'} color="#16a34a" label="✓ Có mặt" onClick={() => setStatus(student.id, 'present')} />
                        <StatusBtn active={status === 'permit'} color="#2563eb" label="📝 Phép" onClick={() => setStatus(student.id, 'permit')} />
                        <StatusBtn active={status === 'late'} color="#d97706" label="⏰ Trễ" onClick={() => setStatus(student.id, 'late')} />
                        <StatusBtn active={status === 'absent'} color="#dc2626" label="🔴 KP" onClick={() => setStatus(student.id, 'absent')} />
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px',
                        background: status === 'absent' ? '#fee2e2' : status === 'permit' ? '#dbeafe' : status === 'late' ? '#fef3c7' : '#dcfce7',
                        color: status === 'absent' ? '#991b1b' : status === 'permit' ? '#1e40af' : status === 'late' ? '#92400e' : '#166534',
                      }}>
                        {status === 'absent' ? 'Vắng KP' : status === 'permit' ? 'Có phép' : status === 'late' ? 'Đi trễ' : '✓ Có mặt'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
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
