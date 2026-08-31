import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { CLASS_OFFICERS } from '../../data/initialStudents';
import SeatingGeneratorModal from './SeatingGeneratorModal';
import Badges from '../gamification/Badges';
import { useClassSettings } from '../../context/ClassSettingsContext';

export default function Dashboard({ students, attendance, timetableImage, classMapImage, isTeacher, setActiveTab, handleTimetableChange, onRefresh }) {
  const { settings } = useClassSettings();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [swapSrc, setSwapSrc] = useState(null);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

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

  const handleSeatClick = async (student) => {
    if (!isTeacher) { setSelectedStudent(student); return; }
    if (!swapSrc) { setSwapSrc(student.id); return; }
    if (swapSrc === student.id) { setSwapSrc(null); return; }

    const srcStudent = students.find(s => s.id === swapSrc);
    if (srcStudent) {
      const updated = students.map(s => {
        if (s.id === srcStudent.id) return { ...s, group: student.group };
        if (s.id === student.id) return { ...s, group: srcStudent.group };
        return s;
      });
      await api.updateStudents(updated);
      toast.success(`Đã đổi vị trí: ${srcStudent.name} ↔ ${student.name}`);
      onRefresh();
    }
    setSwapSrc(null);
  };

  const handleClassMapChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await api.uploadClassMap(ev.target.result);
      toast.success('Đã cập nhật sơ đồ lớp hình ảnh!');
      onRefresh();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Birthday Banner if any */}
      {birthdayStudents.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1.5px solid #f59e0b',
          borderRadius: '1rem', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🎂</span>
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>Chúc mừng sinh nhật tháng {currentMonth}!</strong>
              <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                {birthdayStudents.map(s => `${s.name} (${s.dob})`).join(' • ')}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
            🎉 Lớp {settings.className} Đoàn kết
          </span>
        </div>
      )}

      {/* KPI Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>Sĩ số lớp {settings.className}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {students.length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>({femaleCount} Nữ / {maleCount} Nam)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>Vắng học hôm nay</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: absentToday > 0 ? '#dc2626' : '#16a34a' }}>
            {absentToday} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>HS</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>Nội trú KTX</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>
            6 <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phòng (5 Nữ, 1 Nam)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>Hoàn cảnh khó khăn</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>
            {poorCount} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>HS Cận nghèo</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Seating Map + Class Officers + Timetable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Left col: Interactive Seating Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>🗺️ Sơ Đồ Lớp {settings.className} (Tổ 1 → Tổ 4)</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Bố trí theo 4 tổ học tập và vị trí ngồi thực tế</p>
              </div>
              {isTeacher && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#7c3aed' }}
                    onClick={() => setShowSeatingModal(true)}
                  >
                    🎲 Xếp sơ đồ tự động
                  </button>
                  <label className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', background: '#0284c7' }}>
                    📷 Upload sơ đồ ảnh
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleClassMapChange} />
                  </label>
                </div>
              )}
            </div>

            {/* Blackboard */}
            <div style={{ textAlign: 'center', background: 'var(--color-primary-dark)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
              📋 BẢNG ĐEN / BÀN GIÁO VIÊN / CỬA RA VÀO
            </div>

            {/* 4 Groups Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
              {Array.from({ length: 4 }).map((_, ci) => {
                const gName = `Tổ ${ci + 1}`;
                const gs = students.filter(s => s.group === gName).sort((a, b) => a.id - b.id);
                return (
                  <div key={gName} style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary-brand)', marginBottom: '0.6rem' }}>{gName} ({gs.length} HS)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {gs.map(s => (
                        <div key={s.id} className="seat-item"
                          style={{
                            background: swapSrc === s.id ? '#fecaca' : s.gender === 'Nữ' ? '#fdf2f8' : '#eff6ff',
                            border: swapSrc === s.id ? '2px dashed #dc2626' : selectedStudent?.id === s.id ? '2px solid var(--color-primary-brand)' : '1px solid #e5e7eb',
                            cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: '0.5rem'
                          }}
                          onClick={() => handleSeatClick(s)}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1f2937' }}>
                            {String(s.id).padStart(2, '0')}. {s.name.split(' ').pop()}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{s.dormRoom}</span>
                            {s.position && <span style={{ color: '#0369a1', fontWeight: 700 }}>⭐</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Class map image preview if uploaded */}
            {classMapImage && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>🖼️ File Sơ Đồ Lớp Tải Lên</h4>
                <img src={classMapImage} alt="Sơ đồ lớp" style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
              </div>
            )}
          </div>

          {/* Class Officers Table */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>👑 Danh Sách Ban Cán Sự Lớp {settings.className}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {CLASS_OFFICERS.map(off => (
                <div key={off.position + off.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.6rem', padding: '0.65rem 0.85rem' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{off.position}</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{off.name}</strong>
                  {off.phone && <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.1rem' }}>📞 {off.phone}</div>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right col: Timetable + Honor Board + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Timetable widget */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0 }}>📅 Thời Khóa Biểu Lớp {settings.className}</h4>
              {isTeacher && (
                <label className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                  🔄 Cập nhật
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleTimetableChange} />
                </label>
              )}
            </div>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', minHeight: '180px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {timetableImage ? (
                <img src={timetableImage} alt="TKB" style={{ width: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>📷 Chưa có thời khóa biểu</span>
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
      {selectedStudent && (
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
              ['SĐT Học sinh', selectedStudent.phone || '—'],
              ['SĐT Mẹ', selectedStudent.motherPhone || '—'],
              ['SĐT Cha', selectedStudent.fatherPhone || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, minWidth: '110px', fontSize: '0.82rem', color: '#6b7280' }}>{k}:</span>
                <span style={{ fontSize: '0.88rem' }}>{v}</span>
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedStudent(null)}>Đóng</button>
          </div>
        </div>
      )}
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

    </div>
  );
}
