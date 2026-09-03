import React from 'react';

export function computeStudentBadges(student) {
  const badges = [];
  const gpa = student.prevGPA || 7.5;
  const points = student.points || 95;

  if (gpa >= 8.0) {
    badges.push({ id: 'academic', title: '🎓 Rồng Học Tập', desc: 'ĐTB năm học đạt loại Giỏi/Xuất sắc', color: '#2563eb', bg: '#eff6ff' });
  }
  if (points >= 95) {
    badges.push({ id: 'discipline', title: '🥇 Chuyên Cần Vàng', desc: 'Điểm thi đua nề nếp đạt top 95+', color: '#d97706', bg: '#fef3c7' });
  }
  if (student.role === 'group_leader' || student.position?.includes('Tổ trưởng')) {
    badges.push({ id: 'leader', title: '⭐ Cán Bộ Gương Mẫu', desc: 'Đảm nhận chức vụ Lớp trưởng / Tổ trưởng', color: '#7c3aed', bg: '#f3e8ff' });
  }
  if (student.dormRoom && student.dormRoom.startsWith('A1')) {
    badges.push({ id: 'dorm', title: '🏠 KTX Gương Mẫu', desc: 'Chấp hành nghiêm quy định tắt đèn KTX', color: '#16a34a', bg: '#f0fdf4' });
  }

  return badges;
}

export default function Badges({ student }) {
  if (!student) return null;
  const badges = computeStudentBadges(student);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {badges.map(b => (
        <span key={b.id} title={b.desc} style={{
          background: b.bg, color: b.color, border: `1px solid ${b.color}44`,
          fontSize: '0.72rem', padding: '0.2rem 0.65rem', borderRadius: '9999px',
          fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
        }}>
          {b.title}
        </span>
      ))}
    </div>
  );
}
