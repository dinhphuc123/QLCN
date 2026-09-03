import React, { useState } from 'react';
import { useClassSettings } from '../../context/ClassSettingsContext';
import toast from 'react-hot-toast';

export default function ClassSettingsModal({ onClose }) {
  const { settings, updateSettings } = useClassSettings();
  const [form, setForm] = useState({ ...settings });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(form);
    toast.success('Đã cập nhật cấu hình lớp học thành công!');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 220,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.25rem', width: '100%', maxWidth: '460px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>⚙️</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.35rem' }}>Cấu Hình Lớp Học & Thời Gian</h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem' }}>
            Tùy chỉnh linh hoạt tên lớp, năm học, học kỳ và thời gian cho bất kỳ GVCN nào
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tên Lớp Chủ Nhiệm</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={form.className} onChange={e => handleChange('className', e.target.value)} placeholder="VD: 12.7, 10A1..." />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Năm Học</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={form.schoolYear} onChange={e => handleChange('schoolYear', e.target.value)} placeholder="2026 - 2027" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Học Kỳ</label>
              <select className="form-input" style={{ width: '100%' }} value={form.semester} onChange={e => handleChange('semester', e.target.value)}>
                <option>Học kỳ I</option>
                <option>Học kỳ II</option>
                <option>Hè / Ôn tập</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tuần Học Hiện Tại</label>
              <select className="form-input" style={{ width: '100%' }} value={form.currentWeek} onChange={e => handleChange('currentWeek', e.target.value)}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const w = `Tuần ${String(i + 1).padStart(2, '0')}`;
                  return <option key={w} value={w}>{w}</option>;
                })}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Họ và Tên GVCN</label>
            <input type="text" className="form-input" style={{ width: '100%' }} value={form.teacherName} onChange={e => handleChange('teacherName', e.target.value)} placeholder="Nhập tên GVCN..." />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tên Trường THPT</label>
            <input type="text" className="form-input" style={{ width: '100%' }} value={form.schoolName} onChange={e => handleChange('schoolName', e.target.value)} placeholder="VD: THPT Chuyên..." />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.65rem', borderRadius: '9999px',
              border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600
            }}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>
              💾 Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
