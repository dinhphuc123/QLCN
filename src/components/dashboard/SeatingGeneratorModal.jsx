import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SeatingGeneratorModal({ students = [], onClose, onSaveSeats }) {
  const [strategy, setStrategy] = useState('academic'); // 'academic' | 'gender' | 'group' | 'random'

  const handleGenerate = () => {
    let sorted = [...students];

    if (strategy === 'academic') {
      // Pair High GPA with Low GPA
      sorted.sort((a, b) => (b.prevGPA || 7.5) - (a.prevGPA || 7.5));
      const paired = [];
      let left = 0;
      let right = sorted.length - 1;
      while (left <= right) {
        if (left === right) {
          paired.push(sorted[left]);
        } else {
          paired.push(sorted[left]);
          paired.push(sorted[right]);
        }
        left++;
        right--;
      }
      sorted = paired;
    } else if (strategy === 'gender') {
      // Alternate Male and Female
      const males = sorted.filter(s => s.gender === 'Nam');
      const females = sorted.filter(s => s.gender === 'Nữ');
      const mixed = [];
      const maxLen = Math.max(males.length, females.length);
      for (let i = 0; i < maxLen; i++) {
        if (females[i]) mixed.push(females[i]);
        if (males[i]) mixed.push(males[i]);
      }
      sorted = mixed;
    } else if (strategy === 'group') {
      // Group together by Tổ
      sorted.sort((a, b) => a.group.localeCompare(b.group));
    } else {
      // Shuffle random
      sorted.sort(() => Math.random() - 0.5);
    }

    // Reassign seatIndex (0 to 31)
    const updated = sorted.map((st, idx) => ({ ...st, seatIndex: idx }));
    onSaveSeats(updated);
    toast.success(`Đã xếp sơ đồ lớp học tự động theo thuật toán "${strategy === 'academic' ? 'Học lực (Giỏi kèm Yếu)' : strategy === 'gender' ? 'Nam / Nữ đan xen' : strategy === 'group' ? 'Phân bổ theo Tổ' : 'Ngẫu nhiên'}"!`);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2rem', width: '100%', maxWidth: '440px',
        display: 'flex', flexDirection: 'column', gap: '1.25rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>🎲</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Engine Sơ Đồ Lớp Thông Minh</h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem' }}>
            Tự động tính toán vị trí chỗ ngồi tối ưu cho 32 học sinh
          </p>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
            Chọn Chiến Lược Phân Chỗ Ngồi:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              ['academic', '🎓 Giỏi kèm Yếu (Ghép cặp ĐTB Cao + Thấp)'],
              ['gender', '⚖️ Nam / Nữ đan xen hài hòa'],
              ['group', '👥 Gom nhóm theo Tổ (Tổ 1 → Tổ 4)'],
              ['random', '🔀 Đổi chỗ ngồi Ngẫu nhiên (Hàng tuần)'],
            ].map(([val, label]) => (
              <label key={val} style={{
                padding: '0.75rem 1rem', borderRadius: '0.75rem',
                border: `1.5px solid ${strategy === val ? '#2563eb' : '#e2e8f0'}`,
                background: strategy === val ? '#eff6ff' : 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.85rem', fontWeight: strategy === val ? 700 : 500
              }}>
                <input
                  type="radio" name="strategy"
                  checked={strategy === val}
                  onChange={() => setStrategy(val)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.65rem', borderRadius: '9999px',
            border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600
          }}>Hủy</button>
          <button className="btn-primary" onClick={handleGenerate} style={{ flex: 2, padding: '0.65rem' }}>
            ✨ Xếp sơ đồ ngay
          </button>
        </div>
      </div>
    </div>
  );
}
