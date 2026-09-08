import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { CLASS_OFFICERS } from '../../data/initialStudents';
import Badges from '../gamification/Badges';
import { useClassSettings } from '../../context/ClassSettingsContext';
import StudentDashboard from './StudentDashboard';

export default function Dashboard({ students, attendance, announcements, timetableImage, timetableData, classMapImage, isTeacher, setActiveTab, handleTimetableChange, handleClassMapChange, handleDeleteClassMap, onRefresh, onUpdateStudents }) {
  const { settings } = useClassSettings();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showTimetableEditor, setShowTimetableEditor] = useState(false);
  const [editingDay, setEditingDay] = useState('Thứ 2');
  const [tempTimetable, setTempTimetable] = useState(() => {
    if (timetableData && typeof timetableData === 'object' && Object.keys(timetableData).length > 0) {
      return timetableData;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('qlcn_timetable_data') || 'null');
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) return saved;
    } catch {}
    return {
      'Thứ 2': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
      'Thứ 3': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
      'Thứ 4': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
      'Thứ 5': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
      'Thứ 6': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
      'Thứ 7': { morning: ['', '', '', '', ''], afternoon: ['', '', ''] },
    };
  });

  React.useEffect(() => {
    if (timetableData && typeof timetableData === 'object' && Object.keys(timetableData).length > 0) {
      setTempTimetable(timetableData);
    }
  }, [timetableData]);

  if (!isTeacher) {
    return <StudentDashboard timetableImage={timetableImage} timetableData={timetableData} classMapImage={classMapImage} announcements={announcements} students={students} attendance={attendance} setActiveTab={setActiveTab} onRefresh={onRefresh} />;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAtt = (attendance[today] && attendance[today].sessions ? attendance[today].sessions.morning : attendance[today]) || {};
  const absentToday = Object.values(todayAtt).filter(v => v === 'absent').length;

  const femaleCount = students.filter(s => s.gender === 'Nữ').length;
  const maleCount = students.filter(s => s.gender === 'Nam').length;
  const poorCount = students.filter(s => s.isPoor).length;

  // Birthdays this month / week check
  const currentMonth = new Date().getMonth() + 1;
  const birthdayStudents = students.filter(s => {
    if (!s.dob) return false;
    const parts = s.dob.split('/');
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonth;
    }
    return false;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Ultra-Compact Birthday Banner */}
      {birthdayStudents.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #f59e0b',
          borderRadius: '9999px', padding: '0.45rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
          boxShadow: '0 2px 8px rgba(245,158,11,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#78350f', fontWeight: 700 }}>
            <span>🎂</span>
            <span><strong>Sinh nhật T{currentMonth}:</strong> {birthdayStudents.map(s => `${s.name} (${s.dob})`).join(' • ')}</span>
          </div>
          <span style={{ fontSize: '0.68rem', background: '#f59e0b', color: 'white', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
            🎉 Lớp {settings.className}
          </span>
        </div>
      )}

      {/* Ultra-Compact KPI Badges (Horizontal Minimalist Strip) */}
      <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
        
        {/* Badge 1 */}
        <div className="glass-panel" style={{ padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', borderLeft: '4px solid #0369a1' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>👥 Sĩ số {settings.className}</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {students.length} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>({femaleCount}N/{maleCount}N)</span>
          </div>
        </div>

        {/* Badge 2 */}
        <div className="glass-panel" style={{ padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', borderLeft: `4px solid ${absentToday > 0 ? '#dc2626' : '#16a34a'}` }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>🔴 Vắng hôm nay</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: absentToday > 0 ? '#dc2626' : '#16a34a' }}>
            {absentToday} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>HS</span>
          </div>
        </div>

        {/* Badge 3 */}
        <div className="glass-panel" style={{ padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>🏡 Nội trú KTX</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0284c7' }}>
            6 <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Phòng</span>
          </div>
        </div>

        {/* Badge 4 */}
        <div className="glass-panel" style={{ padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>💛 Cận nghèo</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d97706' }}>
            {poorCount} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>HS</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Seating Map + Class Officers + Timetable */}
      <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Left col: Uploaded Seating Chart Image */}
        <div className="dashboard-seat-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  🏫 Sơ Đồ Chỗ Ngồi Lớp {settings.className}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  🖼️ Sơ đồ bố trí chỗ ngồi chính thức năm học {settings.schoolYear || '2026-2027'}
                </p>
              </div>

              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {classMapImage && (
                    <>
                      <button
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#0284c7', boxShadow: '0 4px 10px rgba(2,132,199,0.2)' }}
                        onClick={() => setShowMapModal(true)}
                      >
                        🔍 Phóng To Sơ Đồ
                      </button>
                      <button
                        onClick={handleDeleteClassMap}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                        title="Xóa ảnh sơ đồ lớp hiện tại"
                      >
                        🗑️ Xóa Ảnh
                      </button>
                    </>
                  )}
                  <label
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#16a34a', boxShadow: '0 4px 10px rgba(22,163,74,0.2)', cursor: 'pointer' }}
                  >
                    {classMapImage ? '📷 Đổi Ảnh Sơ Đồ' : '📷 Tải Lên Ảnh Sơ Đồ'}
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleClassMapChange} />
                  </label>
                </div>
              )}
            </div>

            {/* Seating Map Image Display / Empty Placeholder */}
            {classMapImage ? (
              <div style={{
                position: 'relative',
                borderRadius: '1rem',
                overflow: 'hidden',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                textAlign: 'center'
              }}>
                <img
                  src={classMapImage}
                  alt={`Sơ đồ lớp ${settings.className}`}
                  onClick={() => setShowMapModal(true)}
                  style={{
                    width: '100%',
                    maxHeight: '560px',
                    objectFit: 'contain',
                    cursor: 'zoom-in',
                    display: 'block'
                  }}
                />
                <div style={{
                  padding: '0.65rem 1rem',
                  background: 'rgba(255,255,255,0.95)',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  <span style={{ fontWeight: 600 }}>💡 Click trực tiếp vào ảnh để phóng to toàn màn hình</span>
                  <button
                    onClick={() => setShowMapModal(true)}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Xem chi tiết ↗
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius: '1rem',
                border: '2px dashed #cbd5e1',
                background: '#f8fafc',
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '3rem' }}>📷</div>
                <h4 style={{ margin: 0, color: '#334155', fontSize: '1.05rem', fontWeight: 800 }}>
                  Chưa có hình ảnh Sơ đồ chỗ ngồi
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '380px', lineHeight: 1.5 }}>
                  Cô GVCN vui lòng bấm nút bên dưới để tải lên ảnh chụp sơ đồ bàn ghế, phân chỗ ngồi cho lớp {settings.className}.
                </p>
                {isTeacher && (
                  <label
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', padding: '0.65rem 1.5rem', fontSize: '0.85rem', background: '#0284c7', boxShadow: '0 4px 14px rgba(2,132,199,0.3)', cursor: 'pointer' }}
                  >
                    📷 Chọn File Ảnh Sơ Đồ Lớp
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleClassMapChange} />
                  </label>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right col: Timetable + Honor Board + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Timetable widget */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>📅 Thời Khóa Biểu Lớp {settings.className}</h4>
              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setShowTimetableEditor(true)}
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✏️ Nhập/Sửa Tiết
                  </button>
                  <label className="btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                    📷 Tải Ảnh TKB
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleTimetableChange} />
                  </label>
                </div>
              )}
            </div>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', minHeight: '180px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {timetableImage ? (
                <img src={timetableImage} alt="TKB" style={{ width: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>📷 Chưa có thời khóa biểu chính thức</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.875rem' }}>⚡ Thao Tác Nhanh</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.82rem', textAlign: 'left' }} onClick={() => setActiveTab('attendance')}>
                📝 Điểm danh 5 buổi trong ngày
              </button>
              <button className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.82rem', textAlign: 'left', background: '#0284c7' }} onClick={() => setActiveTab('evaluation')}>
                📈 Chấm thi đua 47 tiêu chí
              </button>
              <button className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.82rem', textAlign: 'left', background: '#7c3aed' }} onClick={() => setActiveTab('requests')}>
                ✉️ Phê duyệt đơn xin nghỉ / Về nhà
              </button>
              <button className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.82rem', textAlign: 'left', background: '#059669' }} onClick={() => setActiveTab('finance')}>
                💰 Xem Thu - Chi Quỹ lớp
              </button>
            </div>
          </div>

          {/* Honor corner */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font-serif)' }}>🏆 Tuyên Dương Thi Đua Lớp</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ padding: '0.75rem', background: '#ecfdf5', borderRadius: '0.625rem', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700 }}>TỔ TIÊN TIẾN 🥇</div>
                <strong style={{ fontSize: '0.9rem' }}>Tổ 1 — Đạt 100 điểm</strong>
              </div>
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '0.625rem', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 700 }}>HỌC SINH GIỎI TIÊU BIỂU ⭐</div>
                <strong style={{ fontSize: '0.9rem' }}>Hoàng Kim Ánh (ĐTB 8.71)</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Student detail modal */}
      {selectedStudent && (() => {
        const motherInfo = maskParentInfo(selectedStudent.motherName, selectedStudent.motherPhone, isTeacher);
        const fatherInfo = maskParentInfo(selectedStudent.fatherName, selectedStudent.fatherPhone, isTeacher);
        const maskedPhone = maskPhone(selectedStudent.phone, isTeacher);

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ background: 'white', padding: '2rem', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h3 style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem', margin: 0 }}>👤 Hồ sơ học sinh</h3>
              {[
                ['Mã / STT', `${String(selectedStudent.id).padStart(2, '0')} (${selectedStudent.studentCode || ''})`],
                ['Họ và tên', selectedStudent.name],
                ['Giới tính', selectedStudent.gender || '—'],
                ['Tổ học tập', selectedStudent.group],
                ['Ký túc xá', selectedStudent.dormRoom],
                ['Chức vụ', selectedStudent.position || 'Thành viên'],
                ['SĐT Học sinh', maskedPhone],
                ['Thông tin Mẹ', `${motherInfo.name} (${motherInfo.phone})`],
                ['Thông tin Cha', `${fatherInfo.name} (${fatherInfo.phone})`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, minWidth: '110px', fontSize: '0.82rem', color: '#6b7280' }}>{k}:</span>
                  <span style={{ fontSize: '0.88rem' }}>{v}</span>
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedStudent(null)}>Đóng</button>
            </div>
          </div>
        );
      })()}


      {/* Timetable Structured Editor Modal for GVCN */}
      {showTimetableEditor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ background: 'white', padding: '1.5rem', maxWidth: '600px', width: '100%', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1B4D53' }}>✏️ Nhập / Chỉnh Sửa Thời Khóa Biểu Tiết Học Thực Tế</h3>
              <button onClick={() => setShowTimetableEditor(false)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Day Selector */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(day => (
                <button
                  key={day}
                  onClick={() => setEditingDay(day)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800,
                    background: editingDay === day ? '#1B4D53' : '#f3f4f6',
                    color: editingDay === day ? 'white' : '#4b5563',
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Editor fields for selected day */}
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.85rem' }}>☀️ BUỔI SÁNG (Tiết 1 - Tiết 5)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>T{idx+1}</span>
                    <input
                      type="text"
                      placeholder={`Tiết ${idx+1}`}
                      value={(tempTimetable[editingDay]?.morning || [])[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempTimetable(prev => {
                          const dayObj = prev[editingDay] || { morning: ['', '', '', '', ''], afternoon: ['', '', ''] };
                          const newMorning = [...(dayObj.morning || ['', '', '', '', ''])];
                          newMorning[idx] = val;
                          return { ...prev, [editingDay]: { ...dayObj, morning: newMorning } };
                        });
                      }}
                      style={{ padding: '0.4rem 0.25rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.85rem', marginTop: '0.5rem' }}>⛅ BUỔI CHIỀU (Tiết 6 - Tiết 8)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {[0, 1, 2].map(idx => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>T{idx+6}</span>
                    <input
                      type="text"
                      placeholder={`Tiết ${idx+6}`}
                      value={(tempTimetable[editingDay]?.afternoon || [])[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempTimetable(prev => {
                          const dayObj = prev[editingDay] || { morning: ['', '', '', '', ''], afternoon: ['', '', ''] };
                          const newAfternoon = [...(dayObj.afternoon || ['', '', ''])];
                          newAfternoon[idx] = val;
                          return { ...prev, [editingDay]: { ...dayObj, afternoon: newAfternoon } };
                        });
                      }}
                      style={{ padding: '0.4rem 0.25rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setShowTimetableEditor(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#f3f4f6', color: '#4b5563', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  // Clean empty strings at ends
                  const cleaned = {};
                  Object.keys(tempTimetable).forEach(d => {
                    const m = (tempTimetable[d]?.morning || []).map(s => String(s).trim()).filter(Boolean);
                    const a = (tempTimetable[d]?.afternoon || []).map(s => String(s).trim()).filter(Boolean);
                    cleaned[d] = { morning: m, afternoon: a };
                  });
                  localStorage.setItem('qlcn_timetable_data', JSON.stringify(cleaned));
                  try {
                    await api.saveTimetableData(cleaned);
                  } catch (err) {
                    console.warn('Timetable cloud sync error:', err.message);
                  }
                  toast.success('✅ Đã lưu Thời Khóa Biểu thực tế và đồng bộ Cổng Học Sinh!');
                  setShowTimetableEditor(false);
                  if (onRefresh) onRefresh();
                }}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800 }}
              >
                💾 Lưu & Đồng Bộ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Seating Map Modal */}
      {showMapModal && classMapImage && (
        <div
          onClick={() => setShowMapModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '96vw',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '1rem',
              padding: '0.5rem'
            }}
          >
            <button
              onClick={() => setShowMapModal(false)}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: 0,
                background: 'white',
                color: '#0f172a',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1.1rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              title="Đóng (ESC)"
            >
              ✕
            </button>
            <img
              src={classMapImage}
              alt="Sơ đồ lớp toàn màn hình"
              style={{
                maxWidth: '94vw',
                maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
