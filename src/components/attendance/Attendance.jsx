import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Attendance({ students = [], attendance = {}, homeRequests = [], isTeacher, onRefresh }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('attendance5'); // 'attendance5' | 'home_requests'
  const [session, setSession] = useState('morning'); // morning, afternoon, evening_study, sleeping, group_activity
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Home request form
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [homeReason, setHomeReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const sessions = [
    { id: 'morning', label: '🌅 Buổi Sáng', time: '07:00 - 11:30' },
    { id: 'afternoon', label: '☀️ Buổi Chiều', time: '13:30 - 17:00' },
    { id: 'evening_study', label: '🌙 Tự Học Tối', time: '19:00 - 21:00' },
    { id: 'sleeping', label: '🛌 Đi Ngủ KTX', time: '21:30 Tắt đèn' },
    { id: 'group_activity', label: '🏃 HĐ Tập Thể', time: 'Ngoại khóa' },
  ];

  // Resolve attendance record for date and session
  const dateRecord = attendance[selectedDate] || {};
  const sessionRecord = (dateRecord.sessions && dateRecord.sessions[session]) 
    ? dateRecord.sessions[session] 
    : (session === 'morning' && !dateRecord.sessions ? dateRecord : {});

  const setStatus = async (studentId, status) => {
    const updatedRecord = { ...sessionRecord, [studentId]: status };
    await api.saveAttendance(selectedDate, session, updatedRecord);
    onRefresh();
  };

  const markAllPresent = async () => {
    const record = {};
    students.forEach(s => { record[s.id] = 'present'; });
    await toast.promise(
      api.saveAttendance(selectedDate, session, record),
      { loading: 'Đang lưu...', success: 'Đã điểm danh tất cả có mặt!', error: 'Lỗi điểm danh' }
    );
    onRefresh();
  };

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

  const absentCount = Object.values(sessionRecord).filter(v => v === 'absent').length;
  const lateCount = Object.values(sessionRecord).filter(v => v === 'late').length;
  const permitCount = Object.values(sessionRecord).filter(v => v === 'permit').length;
  const presentCount = students.length - absentCount - lateCount - permitCount;

  const StatusBtn = ({ active, color, label, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '0.5rem',
        fontWeight: 700, border: 'none', cursor: 'pointer',
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
      
      {/* Navigation Sub-tabs */}
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
            📝 Điểm Danh 5 Buổi
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
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Session Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>📊 Sổ Điểm Danh Nề Nếp 12.7</h3>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Có mặt: <strong style={{ color: '#16a34a' }}>{presentCount}</strong> | Vắng KP: <strong style={{ color: '#dc2626' }}>{absentCount}</strong> | Có phép: <strong style={{ color: '#2563eb' }}>{permitCount}</strong> | Đi trễ: <strong style={{ color: '#d97706' }}>{lateCount}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="date" className="form-input" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
              />
              {isTeacher && (
                <button className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={markAllPresent}>
                  ✅ Chọn tất cả có mặt
                </button>
              )}
            </div>
          </div>

          {/* Session tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.3rem', borderRadius: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
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

          {/* Student attendance list */}
          <div className="attendance-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {students.map(student => {
              const status = sessionRecord[student.id] || 'present';
              const canEdit = isTeacher || user?.role === 'monitor' || (user?.role === 'group_leader' && student.group === user.group);
              return (
                <div key={student.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: status === 'absent' ? '#fff5f5' : status === 'permit' ? '#eff6ff' : status === 'late' ? '#fffbeb' : 'white',
                  borderRadius: '0.75rem',
                  border: `1px solid ${status === 'absent' ? '#fca5a5' : status === 'permit' ? '#93c5fd' : status === 'late' ? '#fde68a' : '#e5e7eb'}`,
                }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#111827' }}>
                      {String(student.id).padStart(2, '0')}. {student.name}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {student.group} • {student.dormRoom}
                    </div>
                  </div>

                  {canEdit ? (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <StatusBtn active={status === 'present'} color="#16a34a" label="✓ Có mặt" onClick={() => setStatus(student.id, 'present')} />
                      <StatusBtn active={status === 'permit'} color="#2563eb" label="📝 Có phép" onClick={() => setStatus(student.id, 'permit')} />
                      <StatusBtn active={status === 'late'} color="#d97706" label="⏰ Trễ" onClick={() => setStatus(student.id, 'late')} />
                      <StatusBtn active={status === 'absent'} color="#dc2626" label="🔴 KP" onClick={() => setStatus(student.id, 'absent')} />
                    </div>
                  ) : (
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px',
                      background: status === 'absent' ? '#fee2e2' : status === 'permit' ? '#dbeafe' : status === 'late' ? '#fef3c7' : '#dcfce7',
                      color: status === 'absent' ? '#991b1b' : status === 'permit' ? '#1e40af' : status === 'late' ? '#92400e' : '#166534',
                    }}>
                      {status === 'absent' ? 'Vắng KP' : status === 'permit' ? 'Có phép' : status === 'late' ? 'Đi trễ' : 'Có mặt'}
                    </span>
                  )}
                </div>
              );
            })}
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
