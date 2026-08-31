import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useClassSettings } from '../../context/ClassSettingsContext';
import { api } from '../../lib/api';

export default function CmsAdminPanel({ students = [], onRefresh }) {
  const { settings, updateSettings } = useClassSettings();
  const [activeTab, setActiveTab] = useState('class_info'); // 'class_info' | 'officers' | 'criteria' | 'backup'

  // Class Info state
  const [classForm, setClassForm] = useState({ ...settings });

  // Officer Assignment state
  const [officers, setOfficers] = useState({
    monitor: students.find(s => s.position === 'Lớp trưởng')?.id || '',
    viceMonitor: students.find(s => s.position === 'Lớp phó')?.id || '',
    group1: students.find(s => s.position === 'Tổ trưởng Tổ 1')?.id || '',
    group2: students.find(s => s.position === 'Tổ trưởng Tổ 2')?.id || '',
    group3: students.find(s => s.position === 'Tổ trưởng Tổ 3')?.id || '',
    group4: students.find(s => s.position === 'Tổ trưởng Tổ 4')?.id || '',
  });

  const handleSaveClassInfo = (e) => {
    e.preventDefault();
    updateSettings(classForm);
    toast.success('Đã cập nhật cấu hình hệ thống CMS thành công!');
  };

  const handleSaveOfficers = async (e) => {
    e.preventDefault();
    const updatedStudents = students.map(s => {
      let position = '';
      if (String(s.id) === String(officers.monitor)) position = 'Lớp trưởng';
      else if (String(s.id) === String(officers.viceMonitor)) position = 'Lớp phó';
      else if (String(s.id) === String(officers.group1)) position = 'Tổ trưởng Tổ 1';
      else if (String(s.id) === String(officers.group2)) position = 'Tổ trưởng Tổ 2';
      else if (String(s.id) === String(officers.group3)) position = 'Tổ trưởng Tổ 3';
      else if (String(s.id) === String(officers.group4)) position = 'Tổ trưởng Tổ 4';

      let role = 'member';
      if (position === 'Lớp trưởng') role = 'monitor';
      else if (position.includes('Tổ trưởng')) role = 'group_leader';

      return { ...s, position, role };
    });

    await api.updateStudents(updatedStudents);
    toast.success('Đã phân công Ban cán sự lớp thành công!');
    onRefresh();
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        settings,
        students,
        timestamp: new Date().toISOString(),
        version: '2.0.0-CMS'
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClassMate_Backup_${settings.className}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Sao lưu Dữ liệu (.json)!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi sao lưu dữ liệu!');
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) updateSettings(parsed.settings);
        if (parsed.students && Array.isArray(parsed.students)) {
          await api.updateStudents(parsed.students);
        }
        toast.success('Đã phục hồi dữ liệu CMS thành công!');
        onRefresh();
      } catch {
        toast.error('File sao lưu không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', background: '#4c1d95', color: '#c4b5fd', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700, width: 'fit-content', marginBottom: '0.5rem' }}>
              ⚙️ CMS ADMIN SYSTEM
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0, color: 'white', fontSize: '1.5rem' }}>
              Trung Tâm Quản Trị Hệ Thống & Cấu Hình CMS GVCN
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#a5b4fc', marginTop: '0.3rem', margin: 0 }}>
              Cấu hình thông tin lớp, phân công Ban cán sự, quản lý quy tắc thi đua và sao lưu dữ liệu hệ thống.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={handleExportBackup} style={{ background: '#16a34a', padding: '0.65rem 1.25rem' }}>
              💾 Sao lưu Dữ liệu
            </button>
            <label className="btn-primary" style={{ background: '#0284c7', padding: '0.65rem 1.25rem', cursor: 'pointer' }}>
              📥 Phục hồi Backup
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportBackup} />
            </label>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.4rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        {[
          { id: 'class_info', label: '🏫 Cấu Hình Lớp & Niên Khóa', icon: '⚙️' },
          { id: 'officers', label: '👑 Phân Công Ban Cán Sự', icon: '⭐' },
          { id: 'criteria', label: '📊 Quản Lý 47 Tiêu Chí Thi Đua', icon: '📝' },
          { id: 'backup', label: '💾 An Toàn Dữ Liệu & Sao Lưu', icon: '🛡️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--color-primary-brand)' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#475569',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(114, 155, 18, 0.3)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Class Info Form */}
      {activeTab === 'class_info' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>🏫 Cấu Hình Chi Tiết Thông Tin Lớp Học</h3>
          
          <form onSubmit={handleSaveClassInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Tên Lớp Chủ Nhiệm</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.className} onChange={e => setClassForm({ ...classForm, className: e.target.value })} placeholder="VD: 12.7" />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Năm Học</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.schoolYear} onChange={e => setClassForm({ ...classForm, schoolYear: e.target.value })} placeholder="VD: 2026 - 2027" />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Học Kỳ Hiện Tại</label>
              <select className="form-input" style={{ width: '100%' }} value={classForm.semester} onChange={e => setClassForm({ ...classForm, semester: e.target.value })}>
                <option>Học kỳ I</option>
                <option>Học kỳ II</option>
                <option>Ôn thi Hè</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Tuần Học Hiện Tại</label>
              <select className="form-input" style={{ width: '100%' }} value={classForm.currentWeek} onChange={e => setClassForm({ ...classForm, currentWeek: e.target.value })}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const w = `Tuần ${String(i + 1).padStart(2, '0')}`;
                  return <option key={w} value={w}>{w}</option>;
                })}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Họ và Tên GVCN</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.teacherName} onChange={e => setClassForm({ ...classForm, teacherName: e.target.value })} placeholder="VD: Đỗ Kim Tuyền" />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>Tên Trường THPT</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.schoolName} onChange={e => setClassForm({ ...classForm, schoolName: e.target.value })} placeholder="VD: THPT Chuyên..." />
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                💾 Lưu Cấu Hình CMS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Officers Assignment */}
      {activeTab === 'officers' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>👑 Phân Công Ban Cán Sự Lớp & Phân Quyền</h3>

          <form onSubmit={handleSaveOfficers} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>👑 Lớp Trưởng</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.monitor} onChange={e => setOfficers({ ...officers, monitor: e.target.value })}>
                <option value="">-- Chọn Lớp trưởng --</option>
                {students.map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>⭐ Lớp Phó</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.viceMonitor} onChange={e => setOfficers({ ...officers, viceMonitor: e.target.value })}>
                <option value="">-- Chọn Lớp phó --</option>
                {students.map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>🥇 Tổ Trưởng Tổ 1</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.group1} onChange={e => setOfficers({ ...officers, group1: e.target.value })}>
                <option value="">-- Chọn Tổ trưởng Tổ 1 --</option>
                {students.filter(s => s.group === 'Tổ 1').map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>🥇 Tổ Trưởng Tổ 2</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.group2} onChange={e => setOfficers({ ...officers, group2: e.target.value })}>
                <option value="">-- Chọn Tổ trưởng Tổ 2 --</option>
                {students.filter(s => s.group === 'Tổ 2').map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>🥇 Tổ Trưởng Tổ 3</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.group3} onChange={e => setOfficers({ ...officers, group3: e.target.value })}>
                <option value="">-- Chọn Tổ trưởng Tổ 3 --</option>
                {students.filter(s => s.group === 'Tổ 3').map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>🥇 Tổ Trưởng Tổ 4</label>
              <select className="form-input" style={{ width: '100%' }} value={officers.group4} onChange={e => setOfficers({ ...officers, group4: e.target.value })}>
                <option value="">-- Chọn Tổ trưởng Tổ 4 --</option>
                {students.filter(s => s.group === 'Tổ 4').map(s => <option key={s.id} value={s.id}>{String(s.id).padStart(2, '0')}. {s.name}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                💾 Cập Nhật Phân Quyền Ban Cán Sự
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Criteria settings */}
      {activeTab === 'criteria' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>📊 47 Tiêu Chí Chấm Thi Đua Nề Nếp</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Cấu hình trọng số và điểm trừ cho các lỗi vi phạm nề nếp (Đi muộn, không thuộc bài, KTX 21:30 tắt đèn, vi phạm trang phục...).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { code: 'TC01', name: 'Đi học muộn (sau 07:00 / 13:30)', point: -2 },
              { code: 'TC02', name: 'Vắng học không phép', point: -5 },
              { code: 'TC03', name: 'Không thuộc bài cũ', point: -3 },
              { code: 'TC04', name: 'KTX 21:30 không tắt đèn', point: -4 },
              { code: 'TC05', name: 'Sử dụng điện thoại trong giờ', point: -3 },
              { code: 'TC06', name: 'Không mặc đồng phục quy định', point: -2 },
            ].map(tc => (
              <div key={tc.code} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>[{tc.code}] {tc.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, marginTop: '0.2rem' }}>Mức phạt: {tc.point} điểm</div>
                </div>
                <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: '#64748b' }}>
                  ⚙️ Sửa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Backup & Security */}
      {activeTab === 'backup' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>🛡️ An Toàn Dữ Liệu & Sao Lưu Hệ Thống CMS</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Đảm bảo an toàn 100% dữ liệu lớp học, điểm danh và danh sách học sinh. Sao lưu định kỳ hàng tuần.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ border: '1.5px solid #bbf7d0', background: '#f0fdf4', padding: '1.5rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#166534', margin: '0 0 0.5rem 0' }}>📦 Sao Lưu Dữ Liệu (Backup)</h4>
              <p style={{ fontSize: '0.82rem', color: '#15803d', marginBottom: '1rem' }}>
                Xuất toàn bộ cấu hình, sơ đồ lớp và danh sách học sinh ra file JSON để lưu trữ an toàn trên máy tính.
              </p>
              <button className="btn-primary" onClick={handleExportBackup} style={{ background: '#16a34a' }}>
                📥 Tải File Sao Lưu (.json)
              </button>
            </div>

            <div style={{ border: '1.5px solid #bfdbfe', background: '#eff6ff', padding: '1.5rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>🔄 Phục Hồi Dữ Liệu (Restore)</h4>
              <p style={{ fontSize: '0.82rem', color: '#1d4ed8', marginBottom: '1rem' }}>
                Tải lên file sao lưu .json đã lưu trước đó để khôi phục lại dữ liệu lớp học ngay lập tức.
              </p>
              <label className="btn-primary" style={{ background: '#2563eb', cursor: 'pointer', display: 'inline-block' }}>
                📂 Chọn File Restore (.json)
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportBackup} />
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
