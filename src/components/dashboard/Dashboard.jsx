import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { CLASS_OFFICERS } from '../../data/initialStudents';
import SeatingGeneratorModal from './SeatingGeneratorModal';
import Badges from '../gamification/Badges';
import { useClassSettings } from '../../context/ClassSettingsContext';
import StudentDashboard from './StudentDashboard';

export default function Dashboard({ students, attendance, announcements, timetableImage, classMapImage, isTeacher, setActiveTab, handleTimetableChange, handleClassMapChange, onRefresh, onUpdateStudents }) {
  const { settings } = useClassSettings();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [swapSrc, setSwapSrc] = useState(null);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showTimetableEditor, setShowTimetableEditor] = useState(false);
  const [editingDay, setEditingDay] = useState('Thứ 2');
  const [tempTimetable, setTempTimetable] = useState(() => {
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

  if (!isTeacher) {
    return <StudentDashboard timetableImage={timetableImage} announcements={announcements} students={students} attendance={attendance} setActiveTab={setActiveTab} onRefresh={onRefresh} />;
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

  const handleSmartArrange = async (type) => {
    let arranged = [...students];
    if (type === 'group') {
      const g1 = students.filter(s => s.group === 'Tổ 1').sort((a, b) => a.id - b.id);
      const g2 = students.filter(s => s.group === 'Tổ 2').sort((a, b) => a.id - b.id);
      const g3 = students.filter(s => s.group === 'Tổ 3').sort((a, b) => a.id - b.id);
      const g4 = students.filter(s => s.group === 'Tổ 4').sort((a, b) => a.id - b.id);
      const other = students.filter(s => !['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].includes(s.group)).sort((a, b) => a.id - b.id);

      // Day 1 (Left Row - Desk 1 to 5): Tổ 1 then Tổ 2 (20 seats max)
      const day1 = [...g1, ...g2];
      while (day1.length < 20) day1.push(null);

      // Day 2 (Right Row - Desk 6 to 10): Tổ 3 then Tổ 4 + others (20 seats max)
      const day2 = [...g3, ...g4, ...other];
      while (day2.length < 20) day2.push(null);

      arranged = [...day1.slice(0, 20), ...day2.slice(0, 20)].filter(Boolean);
      toast.success('🧠 Đã xếp chỗ theo 4 Tổ: Dãy 1 (Tổ 1 & Tổ 2), Dãy 2 (Tổ 3 & Tổ 4)!');
    } else if (type === 'gender') {
      const males = students.filter(s => s.gender === 'Nam');
      const females = students.filter(s => s.gender === 'Nữ');
      arranged = [];
      let i = 0, j = 0;
      while (i < females.length || j < males.length) {
        if (i < females.length) arranged.push(females[i++]);
        if (j < males.length) arranged.push(males[j++]);
      }
      toast.success('🧠 Đã xếp chỗ thông minh: Xen kẽ Nam - Nữ!');
    } else if (type === 'academic') {
      arranged.sort((a, b) => (a.id % 2 === 0 ? -1 : 1));
      toast.success('🧠 Đã xếp chỗ thông minh: Ghép đôi học tập Khá - Yếu!');
    }

    try { localStorage.setItem('qlcn_students_data', JSON.stringify(arranged)); } catch {}
    if (typeof onUpdateStudents === 'function') onUpdateStudents(arranged);
    try { await api.updateStudents(arranged); } catch {}
  };

  const handleSeatClick = async (targetStudent, targetIdx) => {
    if (!isTeacher) { 
      if (targetStudent) setSelectedStudent(targetStudent); 
      return; 
    }
    
    // 1. First click: select source seat
    if (!swapSrc) {
      if (!targetStudent) {
        toast.error('Vui lòng click chọn một học sinh có trong sơ đồ trước!');
        return;
      }
      setSwapSrc({ student: targetStudent, idx: targetIdx });
      return;
    }

    // 2. Click same seat again -> cancel
    if (swapSrc.idx === targetIdx) {
      setSwapSrc(null);
      return;
    }

    // 3. Perform array index swap
    const srcIdx = swapSrc.idx;
    const updated = [...students];

    // Ensure array has enough elements
    const maxIdx = Math.max(srcIdx, targetIdx);
    while (updated.length <= maxIdx) {
      updated.push(null);
    }

    const temp = updated[srcIdx];
    updated[srcIdx] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Compact list (remove trailing nulls)
    const finalStudents = updated.filter(Boolean);

    // Save to local storage for instant persistence
    try {
      localStorage.setItem('qlcn_students_data', JSON.stringify(finalStudents));
    } catch {}

    // Update parent state immediately
    if (typeof onUpdateStudents === 'function') {
      onUpdateStudents(finalStudents);
    }

    // Persist to backend asynchronously
    try {
      await api.updateStudents(finalStudents);
    } catch (e) {
      console.warn('Backend update notice:', e.message);
    }

    toast.success(`✅ Đã tráo đổi chỗ ngồi: ${swapSrc.student.name} ↔ ${targetStudent ? targetStudent.name : 'Ghế trống'}`);
    setSwapSrc(null);
  };



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
        
        {/* Left col: Interactive Seating Map (hidden on mobile) */}
        <div className="dashboard-seat-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 800 }}>
                  🏫 Sơ Đồ Lớp 2 Dãy • 10 Bàn Học (Tối Đa 4 Chỗ/Bàn)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  ⚡ Click 2 học sinh bất kỳ để tráo đổi chỗ ngồi • 🟢 Badge điểm danh thực tế
                </p>
              </div>

              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#0284c7', boxShadow: '0 4px 10px rgba(2,132,199,0.2)' }}
                    onClick={() => handleSmartArrange('group')}
                    title="Xếp theo 4 Tổ: Dãy 1 (Tổ 1 & Tổ 2), Dãy 2 (Tổ 3 & Tổ 4)"
                  >
                    🧠 Xếp theo 4 Tổ
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#0891b2', boxShadow: '0 4px 10px rgba(8,145,178,0.2)' }}
                    onClick={() => handleSmartArrange('gender')}
                    title="Xếp chỗ thông minh: Xen kẽ Nam và Nữ"
                  >
                    🧠 Xen kẽ Nam-Nữ
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#16a34a', boxShadow: '0 4px 10px rgba(22,163,74,0.2)' }}
                    onClick={() => handleSmartArrange('academic')}
                    title="Xếp chỗ thông minh: Ghép đôi học tập Khá - Yếu"
                  >
                    🧠 Ghép đôi Học tập
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: '#7c3aed', boxShadow: '0 4px 10px rgba(124,58,237,0.2)' }}
                    onClick={() => setShowSeatingModal(true)}
                  >
                    🎲 Xếp ngẫu nhiên
                  </button>
                </div>
              )}
            </div>

            {/* Active Swap Indicator */}
            {swapSrc && (
              <div style={{ background: '#e0f2fe', border: '1.5px solid #0284c7', padding: '0.55rem 0.85rem', borderRadius: '0.65rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#0369a1', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔄 Đang chọn HS #{String(swapSrc.student.id).padStart(2, '0')} - {swapSrc.student.name} ➔ Click vào chỗ ngồi thứ 2 (hoặc ghế trống) để tráo đổi!</span>
                <button onClick={() => setSwapSrc(null)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>Hủy</button>
              </div>
            )}

            {/* Blackboard Banner */}
            <div style={{
              textAlign: 'center', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#f8fafc', padding: '0.65rem 1rem', borderRadius: '0.75rem',
              marginBottom: '1.25rem', fontWeight: 800, fontSize: '0.85rem',
              letterSpacing: '0.08em', border: '1px solid #334155',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}>
              📋 BẢNG ĐEN / BÀN GIÁO VIÊN / CỬA RA VÀO
            </div>

            {/* 2 Rows of Desks Grid (Dãy 1 & Dãy 2) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* Dãy 1 (Dãy Trái - Bàn 1 đến 5: CHỈ TỔ 1 & TỔ 2) */}
              <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '0.85rem', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: '#0369a1', paddingBottom: '0.4rem', borderBottom: '2px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🚪 DÃY 1 (Phía Cửa) • CHỈ TỔ 1 & TỔ 2</span>
                  <span style={{ fontSize: '0.7rem', color: '#0284c7', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>5 Bàn • 16-20 Chỗ</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, bIdx) => {
                    const deskNum = bIdx + 1;
                    // Dãy 1 gets students from Tổ 1 & Tổ 2
                    const day1List = students.filter(s => s.group === 'Tổ 1' || s.group === 'Tổ 2');
                    // 3-4 seats per desk
                    const deskStudents = day1List.slice(bIdx * 3, bIdx * 3 + 3);

                    return (
                      <div key={deskNum} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.55rem 0.65rem', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🪑 BÀN {deskNum} (Tổ 1 & 2)</span>
                          <span style={{ fontSize: '0.6rem', color: '#0284c7', fontWeight: 700 }}>{deskStudents.length} HS</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))', gap: '0.35rem' }}>
                          {Array.from({ length: Math.max(3, deskStudents.length) }).map((_, sIdx) => {
                            const s = deskStudents[sIdx];
                            const globalSeatIdx = students.findIndex(st => st?.id === s?.id);

                            if (!s) {
                              return (
                                <div
                                  key={sIdx}
                                  onClick={() => handleSeatClick(null, bIdx * 4 + sIdx)}
                                  style={{
                                    background: swapSrc ? '#fef2f2' : '#f1f5f9',
                                    border: swapSrc ? '1.5px dashed #0284c7' : '1px dashed #cbd5e1',
                                    borderRadius: '0.5rem', padding: '0.4rem 0.25rem',
                                    textAlign: 'center', fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic',
                                    cursor: swapSrc ? 'pointer' : 'default'
                                  }}
                                  title="Ghế trống - Click để chuyển HS đến đây"
                                >
                                  Ghế {sIdx + 1}<br/>(Trống)
                                </div>
                              );
                            }

                            const attStatus = todayAtt[s.id];
                            const isAbsent = attStatus === 'absent';
                            const isLate = attStatus === 'late';
                            const isSelected = swapSrc?.idx === globalSeatIdx;

                            return (
                              <div
                                key={s.id}
                                className="seat-item"
                                onClick={() => handleSeatClick(s, globalSeatIdx)}
                                style={{
                                  background: isSelected
                                    ? '#fef2f2'
                                    : s.gender === 'Nữ' ? '#fdf2f8' : '#eff6ff',
                                  border: isSelected
                                    ? '2px dashed #dc2626'
                                    : selectedStudent?.id === s.id
                                    ? '2px solid #0284c7'
                                    : '1.5px solid #cbd5e1',
                                  cursor: 'pointer',
                                  padding: '0.4rem 0.35rem',
                                  borderRadius: '0.5rem',
                                  transition: 'all 0.15s ease',
                                  position: 'relative'
                                }}
                                title={`Click để tráo đổi chỗ ngồi: ${s.name}`}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.68rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {String(s.id).padStart(2, '0')}. {s.name.split(' ').pop()}
                                  </div>
                                  <span style={{ fontSize: '0.55rem' }}>
                                    {isAbsent ? '🔴' : isLate ? '🟡' : '🟢'}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.58rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                                  <span style={{ fontWeight: 800, color: '#0369a1' }}>{s.group}</span>
                                  {s.position && <span style={{ color: '#0369a1', fontWeight: 800 }} title={s.position}>⭐</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dãy 2 (Dãy Phải - Bàn 6 đến 10: CHỈ TỔ 3 & TỔ 4) */}
              <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '0.85rem', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: '#0369a1', paddingBottom: '0.4rem', borderBottom: '2px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🪟 DÃY 2 (Phía Cửa Sổ) • CHỈ TỔ 3 & TỔ 4</span>
                  <span style={{ fontSize: '0.7rem', color: '#0284c7', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>5 Bàn • 16-20 Chỗ</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, bIdx) => {
                    const deskNum = bIdx + 6;
                    // Dãy 2 gets students from Tổ 3 & Tổ 4
                    const day2List = students.filter(s => s.group === 'Tổ 3' || s.group === 'Tổ 4' || !['Tổ 1', 'Tổ 2'].includes(s.group));
                    // 3-4 seats per desk
                    const deskStudents = day2List.slice(bIdx * 3, bIdx * 3 + 3);

                    return (
                      <div key={deskNum} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.55rem 0.65rem', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🪑 BÀN {deskNum} (Tổ 3 & 4)</span>
                          <span style={{ fontSize: '0.6rem', color: '#0284c7', fontWeight: 700 }}>{deskStudents.length} HS</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))', gap: '0.35rem' }}>
                          {Array.from({ length: Math.max(3, deskStudents.length) }).map((_, sIdx) => {
                            const s = deskStudents[sIdx];
                            const globalSeatIdx = students.findIndex(st => st?.id === s?.id);

                            if (!s) {
                              return (
                                <div
                                  key={sIdx}
                                  onClick={() => handleSeatClick(null, (bIdx + 5) * 4 + sIdx)}
                                  style={{
                                    background: swapSrc ? '#fef2f2' : '#f1f5f9',
                                    border: swapSrc ? '1.5px dashed #0284c7' : '1px dashed #cbd5e1',
                                    borderRadius: '0.5rem', padding: '0.4rem 0.25rem',
                                    textAlign: 'center', fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic',
                                    cursor: swapSrc ? 'pointer' : 'default'
                                  }}
                                  title="Ghế trống - Click để chuyển HS đến đây"
                                >
                                  Ghế {sIdx + 1}<br/>(Trống)
                                </div>
                              );
                            }

                            const attStatus = todayAtt[s.id];
                            const isAbsent = attStatus === 'absent';
                            const isLate = attStatus === 'late';
                            const isSelected = swapSrc?.idx === globalSeatIdx;

                            return (
                              <div
                                key={s.id}
                                className="seat-item"
                                onClick={() => handleSeatClick(s, globalSeatIdx)}
                                style={{
                                  background: isSelected
                                    ? '#fef2f2'
                                    : s.gender === 'Nữ' ? '#fdf2f8' : '#eff6ff',
                                  border: isSelected
                                    ? '2px dashed #dc2626'
                                    : selectedStudent?.id === s.id
                                    ? '2px solid #0284c7'
                                    : '1.5px solid #cbd5e1',
                                  cursor: 'pointer',
                                  padding: '0.4rem 0.35rem',
                                  borderRadius: '0.5rem',
                                  transition: 'all 0.15s ease',
                                  position: 'relative'
                                }}
                                title={`Click để tráo đổi chỗ ngồi: ${s.name}`}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.68rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {String(s.id).padStart(2, '0')}. {s.name.split(' ').pop()}
                                  </div>
                                  <span style={{ fontSize: '0.55rem' }}>
                                    {isAbsent ? '🔴' : isLate ? '🟡' : '🟢'}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.58rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                                  <span style={{ fontWeight: 800, color: '#0369a1' }}>{s.group}</span>
                                  {s.position && <span style={{ color: '#0369a1', fontWeight: 800 }} title={s.position}>⭐</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
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
                <strong style={{ fontSize: '0.9rem' }}>
                  {(() => {
                    const top = [...students].sort((a, b) => (b.prevGPA || 0) - (a.prevGPA || 0))[0];
                    return top ? `${top.name} (ĐTB ${top.prevGPA || '8.5'})` : 'Học sinh Tiêu biểu (ĐTB 8.5)';
                  })()}
                </strong>
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
      {/* Seating Generator Modal */}
      {showSeatingModal && (
        <SeatingGeneratorModal
          students={students}
          onClose={() => setShowSeatingModal(false)}
          onSaveSeats={async (updated) => {
            await api.updateStudents(updated);
            onRefresh();
          }}
        />
      )}

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
                onClick={() => {
                  // Clean empty strings at ends
                  const cleaned = {};
                  Object.keys(tempTimetable).forEach(d => {
                    const m = (tempTimetable[d]?.morning || []).map(s => String(s).trim()).filter(Boolean);
                    const a = (tempTimetable[d]?.afternoon || []).map(s => String(s).trim()).filter(Boolean);
                    cleaned[d] = { morning: m, afternoon: a };
                  });
                  localStorage.setItem('qlcn_timetable_data', JSON.stringify(cleaned));
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

    </div>
  );
}
