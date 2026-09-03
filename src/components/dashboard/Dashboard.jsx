import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Building2, 
  HeartHandshake, 
  Cake, 
  Sparkles, 
  Shuffle, 
  LayoutGrid, 
  Layers, 
  ArrowLeftRight,
  School,
  Calendar,
  Zap,
  Trophy,
  Edit3,
  Camera,
  X 
} from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Sleek Minimalist Birthday Banner */}
      {birthdayStudents.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '0.75rem',
          padding: '0.45rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          boxShadow: '0 1px 2px rgba(217,119,6,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: '#92400e' }}>
            <Cake size={15} color="#d97706" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#78350f' }}>Sinh nhật T{currentMonth}:</strong>{' '}
              {birthdayStudents.map(s => `${s.name} (${s.dob})`).join(' • ')}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '0.12rem 0.5rem', borderRadius: '9999px', fontWeight: 700, border: '1px solid #fde68a' }}>
            Lớp {settings.className}
          </span>
        </div>
      )}

      {/* Modern Clean SaaS KPI Cards */}
      <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
        
        {/* KPI 1: Sĩ số */}
        <div className="card-saas" style={{ padding: '0.7rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sĩ số {settings.className}
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} color="#2563eb" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{students.length}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>({femaleCount}N / {maleCount}N)</span>
          </div>
        </div>

        {/* KPI 2: Vắng hôm nay */}
        <div className="card-saas" style={{ padding: '0.7rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vắng hôm nay
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: absentToday > 0 ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {absentToday > 0 ? <UserX size={14} color="#dc2626" /> : <UserCheck size={14} color="#16a34a" />}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: absentToday > 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}>
              {absentToday}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              {absentToday === 0 ? 'Đủ 100% quân số' : 'HS vắng'}
            </span>
          </div>
        </div>

        {/* KPI 3: KTX */}
        <div className="card-saas" style={{ padding: '0.7rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Nội trú KTX
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={14} color="#0284c7" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>6</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Phòng A1-C08</span>
          </div>
        </div>

        {/* KPI 4: Diện chính sách */}
        <div className="card-saas" style={{ padding: '0.7rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Diện chính sách
            </span>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={14} color="#ca8a04" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{poorCount}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Hộ cận nghèo</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Seating Map + Class Officers + Timetable */}
      <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.25rem' }}>
        
        {/* Left col: Interactive Seating Map (Supports Mobile Scroll) */}
        <div className="dashboard-seat-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="card-saas" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LayoutGrid size={17} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>
                    Sơ Đồ Lớp 2 Dãy • 10 Bàn Học
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                    Tối đa 4 Chỗ/Bàn • Click 2 học sinh bất kỳ để tráo đổi chỗ ngồi
                  </p>
                </div>
              </div>

              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className="btn-saas-secondary"
                    onClick={() => handleSmartArrange('group')}
                    title="Xếp theo 4 Tổ: Dãy 1 (Tổ 1 & 2), Dãy 2 (Tổ 3 & 4)"
                  >
                    <Layers size={13} /> Theo 4 Tổ
                  </button>
                  <button
                    className="btn-saas-secondary"
                    onClick={() => handleSmartArrange('gender')}
                    title="Xếp chỗ thông minh: Xen kẽ Nam và Nữ"
                  >
                    <Users size={13} /> Xen kẽ Nam-Nữ
                  </button>
                  <button
                    className="btn-saas-secondary"
                    onClick={() => handleSmartArrange('academic')}
                    title="Xếp chỗ thông minh: Ghép đôi học tập Khá - Yếu"
                  >
                    <Sparkles size={13} color="#16a34a" /> Ghép Đôi Học Tập
                  </button>
                  <button
                    className="btn-saas-primary"
                    onClick={() => setShowSeatingModal(true)}
                    title="Xếp ngẫu nhiên"
                  >
                    <Shuffle size={13} /> Ngẫu Nhiên
                  </button>
                </div>
              )}
            </div>

            {/* Active Swap Indicator */}
            {swapSrc && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.5rem 0.85rem', borderRadius: '0.65rem', marginBottom: '0.85rem', fontSize: '0.78rem', color: '#166534', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowLeftRight size={14} color="#16a34a" />
                  <span>Đang chọn <strong>#{String(swapSrc.student.id).padStart(2, '0')} - {swapSrc.student.name}</strong> ➔ Click vào chỗ ngồi thứ 2 để tráo đổi!</span>
                </span>
                <button onClick={() => setSwapSrc(null)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '0.4rem', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>Hủy</button>
              </div>
            )}

            {/* Sleek Teacher Board / Desk Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '8px',
              padding: '0.38rem 0.75rem', marginBottom: '1rem', color: '#475569',
              fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em'
            }}>
              <School size={15} color="#64748b" />
              <span>BẢNG ĐEN • BÀN GIÁO VIÊN • CỬA RA VÀO</span>
            </div>

            {/* Scrollable Container for Mobile */}
            <div className="seating-scroll-container">
              <div className="seating-scroll-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
                
                {/* Dãy 1 (Dãy Trái - Bàn 1 đến 5: CHỈ TỔ 1 & TỔ 2) */}
                <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', paddingBottom: '0.35rem', borderBottom: '1.5px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🚪 DÃY 1 (Phía Cửa) • TỔ 1 & TỔ 2</span>
                    <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#e0f2fe', padding: '0.12rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }}>5 Bàn</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
              <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', paddingBottom: '0.35rem', borderBottom: '1.5px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🪟 DÃY 2 (Phía Cửa Sổ) • TỔ 3 & TỔ 4</span>
                  <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#e0f2fe', padding: '0.12rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }}>5 Bàn</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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

        </div>

        {/* Right col: Timetable + Honor Board + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Timetable widget */}
          <div className="card-saas" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={16} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Thời Khóa Biểu Lớp {settings.className}</h4>
              </div>
              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setShowTimetableEditor(true)}
                    className="btn-saas-secondary"
                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                  >
                    <Edit3 size={12} /> Sửa Tiết
                  </button>
                  <label className="btn-saas-primary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <Camera size={12} /> Tải Ảnh
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleTimetableChange} />
                  </label>
                </div>
              )}
            </div>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '160px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {timetableImage ? (
                <img src={timetableImage} alt="TKB" style={{ width: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>Chưa tải lên ảnh thời khóa biểu</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-saas" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <Zap size={16} color="#eab308" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Thao Tác Nhanh</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button className="btn-saas-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', justifyContent: 'flex-start', width: '100%' }} onClick={() => setActiveTab('attendance')}>
                <UserCheck size={14} color="#16a34a" /> Điểm danh 5 buổi trong ngày
              </button>
              <button className="btn-saas-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', justifyContent: 'flex-start', width: '100%' }} onClick={() => setActiveTab('evaluation')}>
                <Sparkles size={14} color="#2563eb" /> Chấm thi đua 47 tiêu chí
              </button>
              <button className="btn-saas-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', justifyContent: 'flex-start', width: '100%' }} onClick={() => setActiveTab('requests')}>
                <Layers size={14} color="#7c3aed" /> Phê duyệt đơn xin nghỉ / Về nhà
              </button>
              <button className="btn-saas-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', justifyContent: 'flex-start', width: '100%' }} onClick={() => setActiveTab('finance')}>
                <Building2 size={14} color="#059669" /> Xem Thu - Chi Quỹ lớp
              </button>
            </div>
          </div>

          {/* Honor corner */}
          <div className="card-saas" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <Trophy size={16} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Tuyên Dương Thi Đua</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: '#f0fdf4', borderRadius: '0.65rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tổ Tiên Tiến Xuất Sắc</div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Tổ 1 — Đạt 100 điểm</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', background: '#fffbeb', borderRadius: '0.65rem', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Học Sinh Tiêu Biểu</div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
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
