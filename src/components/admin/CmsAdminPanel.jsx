import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useClassSettings } from '../../context/ClassSettingsContext';
import { api } from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';

export default function CmsAdminPanel({ students = [], finance = [], announcements = [], onRefresh }) {
  const { settings, updateSettings } = useClassSettings();
  const [activeTab, setActiveTab] = useState('students_crud'); // 'students_crud' | 'criteria_crud' | 'announcements_crud' | 'finance_crud' | 'class_info' | 'backup'

  // Class Info form
  const [classForm, setClassForm] = useState({ ...settings });

  // Student CRUD state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '', gender: 'Nữ', group: 'Tổ 1', dormRoom: 'A1-07', phone: '', motherPhone: '', fatherPhone: '', position: '', isPoor: false
  });
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  // Criteria CRUD state
  const [criteriaList, setCriteriaList] = useState([
    { id: '1', code: 'TC01', name: 'Đi học muộn (sau 07:00 / 13:30)', points: -2, category: 'Nề nếp' },
    { id: '2', code: 'TC02', name: 'Vắng học không phép', points: -5, category: 'Điểm danh' },
    { id: '3', code: 'TC03', name: 'Không thuộc bài cũ', points: -3, category: 'Học tập' },
    { id: '4', code: 'TC04', name: 'KTX 21:30 không tắt đèn', points: -4, category: 'KTX Nội trú' },
    { id: '5', code: 'TC05', name: 'Sử dụng điện thoại trong giờ', points: -3, category: 'Nề nếp' },
    { id: '6', code: 'TC06', name: 'Không mặc đồng phục quy định', points: -2, category: 'Nề nếp' },
    { id: '7', code: 'TC07', name: 'Đạt điểm 10 kiểm tra / Đạt giải', points: 5, category: 'Khen thưởng' },
  ]);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [criteriaForm, setCriteriaForm] = useState({ code: '', name: '', points: -2, category: 'Nề nếp' });

  // ── Student CRUD Handlers ──────────────────────────────────────────────────
  const handleOpenStudentModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({ ...student });
    } else {
      setEditingStudent(null);
      setStudentForm({
        id: students.length + 1,
        name: '', gender: 'Nữ', group: 'Tổ 1', dormRoom: 'A1-07', phone: '', motherPhone: '', fatherPhone: '', position: 'Thành viên', isPoor: false
      });
    }
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim()) { toast.error('Vui lòng nhập họ tên!'); return; }

    let updated = [];
    if (editingStudent) {
      updated = students.map(s => s.id === editingStudent.id ? { ...s, ...studentForm } : s);
    } else {
      updated = [...students, { ...studentForm, id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1 }];
    }

    await api.updateStudents(updated);
    toast.success(editingStudent ? 'Đã cập nhật học sinh!' : 'Đã thêm học sinh mới thành công!');
    setShowStudentModal(false);
    onRefresh();
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    const updated = students.filter(s => s.id !== deleteStudentTarget.id);
    await api.updateStudents(updated);
    toast.success(`Đã xóa học sinh ${deleteStudentTarget.name}!`);
    setDeleteStudentTarget(null);
    onRefresh();
  };

  // ── Criteria CRUD Handlers ────────────────────────────────────────────────
  const handleSaveCriteria = (e) => {
    e.preventDefault();
    if (!criteriaForm.name.trim()) { toast.error('Vui lòng nhập tên tiêu chí!'); return; }

    if (editingCriteria) {
      setCriteriaList(prev => prev.map(c => c.id === editingCriteria.id ? { ...c, ...criteriaForm } : c));
      toast.success('Đã cập nhật tiêu chí!');
    } else {
      const newCriteria = { ...criteriaForm, id: String(Date.now()), code: criteriaForm.code || `TC${String(criteriaList.length + 1).padStart(2, '0')}` };
      setCriteriaList(prev => [...prev, newCriteria]);
      toast.success('Đã thêm tiêu chí thi đua mới!');
    }
    setShowCriteriaModal(false);
  };

  const handleDeleteCriteria = (id) => {
    setCriteriaList(prev => prev.filter(c => c.id !== id));
    toast.success('Đã xóa tiêu chí!');
  };

  // ── Backup / Restore Handlers ─────────────────────────────────────────────
  const handleExportBackup = () => {
    const backupData = { settings, students, criteriaList, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_ClassMate_Lop${settings.className}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file Sao lưu Dữ liệu (.json)!');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.settings) updateSettings(parsed.settings);
        if (parsed.students && Array.isArray(parsed.students)) await api.updateStudents(parsed.students);
        if (parsed.criteriaList) setCriteriaList(parsed.criteriaList);
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
              ⚙️ CMS ADMIN DATA SUITE
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0, color: 'white', fontSize: '1.5rem' }}>
              Quản Trị CMS — Thêm / Sửa / Xóa Dữ Liệu Đầu Vào
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#a5b4fc', marginTop: '0.3rem', margin: 0 }}>
              Toàn quyền Thêm mới, Chỉnh sửa, Xóa sĩ số học sinh, tiêu chí thi đua 47, thông báo và quỹ lớp.
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
      <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.4rem', borderRadius: '1rem', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {[
          { id: 'students_crud', label: '👨‍🎓 Quản Lý Học Sinh (CRUD)', icon: '👥' },
          { id: 'criteria_crud', label: '📊 47 Tiêu Chí Thi Đua (CRUD)', icon: '📝' },
          { id: 'class_info', label: '🏫 Cấu Hình Lớp & GVCN', icon: '⚙️' },
          { id: 'backup', label: '🛡️ Sao Lưu & An Toàn Dữ Liệu', icon: '💾' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, minWidth: '180px', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none',
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

      {/* ── TAB 1: Student CRUD ────────────────────────────────────────────── */}
      {activeTab === 'students_crud' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>👨‍🎓 Danh Sách Sĩ Số Học Sinh ({students.length} em)</h3>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Thêm mới học sinh, cập nhật SĐT/KTX/Tổ hoặc xóa học sinh chuyển lớp
              </p>
            </div>
            <button className="btn-primary" onClick={() => handleOpenStudentModal(null)} style={{ background: '#16a34a' }}>
              ➕ Thêm Học Sinh Mới
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>STT</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Họ và Tên</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Giới tính</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Tổ</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Phòng KTX</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>SĐT Học sinh</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Chức vụ</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#64748b' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                      {s.name} {s.isPoor && <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.4rem' }}>Cận nghèo</span>}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{s.gender || 'Nữ'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>{s.group}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{s.dormRoom}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#2563eb' }}>{s.phone || '—'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.82rem' }}>{s.position || 'Thành viên'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button onClick={() => handleOpenStudentModal(s)} style={{ padding: '0.3rem 0.6rem', borderRadius: '0.375rem', background: '#e0f2fe', color: '#0369a1', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                          ✏️ Sửa
                        </button>
                        <button onClick={() => setDeleteStudentTarget(s)} style={{ padding: '0.3rem 0.6rem', borderRadius: '0.375rem', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Criteria CRUD ────────────────────────────────────────────── */}
      {activeTab === 'criteria_crud' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>📊 Danh Mục 47 Tiêu Chí Thi Đua Nề Nếp</h3>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Thêm mới, điều chỉnh mức phạt/cộng điểm hoặc xóa các tiêu chí nề nếp
              </p>
            </div>
            <button className="btn-primary" onClick={() => { setEditingCriteria(null); setCriteriaForm({ code: `TC${String(criteriaList.length + 1).padStart(2, '0')}`, name: '', points: -2, category: 'Nề nếp' }); setShowCriteriaModal(true); }} style={{ background: '#16a34a' }}>
              ➕ Thêm Tiêu Chí Mới
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {criteriaList.map(tc => (
              <div key={tc.id} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                    {tc.code} • {tc.category}
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.95rem' }}>{tc.name}</h4>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: tc.points > 0 ? '#16a34a' : '#dc2626' }}>
                    {tc.points > 0 ? `+${tc.points} điểm (Khen thưởng)` : `${tc.points} điểm (Trừ thi đua)`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button onClick={() => { setEditingCriteria(tc); setCriteriaForm({ ...tc }); setShowCriteriaModal(true); }} style={{ padding: '0.3rem 0.6rem', borderRadius: '0.375rem', background: '#e0f2fe', color: '#0369a1', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                    ✏️ Sửa
                  </button>
                  <button onClick={() => handleDeleteCriteria(tc.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '0.375rem', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Class Info ──────────────────────────────────────────────── */}
      {activeTab === 'class_info' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🏫 Cấu Hình Chi Tiết Thông Tin Lớp & Niên Khóa</h3>
          <form onSubmit={e => { e.preventDefault(); updateSettings(classForm); toast.success('Đã lưu cấu hình!'); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Tên Lớp Chủ Nhiệm</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.className} onChange={e => setClassForm({ ...classForm, className: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Năm Học</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.schoolYear} onChange={e => setClassForm({ ...classForm, schoolYear: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Học Kỳ</label>
              <select className="form-input" style={{ width: '100%' }} value={classForm.semester} onChange={e => setClassForm({ ...classForm, semester: e.target.value })}>
                <option>Học kỳ I</option>
                <option>Học kỳ II</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Tuần Hiện Tại</label>
              <select className="form-input" style={{ width: '100%' }} value={classForm.currentWeek} onChange={e => setClassForm({ ...classForm, currentWeek: e.target.value })}>
                {Array.from({ length: 35 }).map((_, i) => <option key={i} value={`Tuần ${String(i + 1).padStart(2, '0')}`}>Tuần {String(i + 1).padStart(2, '0')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Họ tên GVCN</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.teacherName} onChange={e => setClassForm({ ...classForm, teacherName: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Trường THPT</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.schoolName} onChange={e => setClassForm({ ...classForm, schoolName: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>💾 Lưu Cấu Hình</button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 4: Backup ─────────────────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🛡️ Sao Lưu & An Toàn Dữ Liệu Hệ Thống</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ border: '1.5px solid #bbf7d0', background: '#f0fdf4', padding: '1.5rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#166534', margin: '0 0 0.5rem 0' }}>📦 Sao Lưu Dữ Liệu (Backup)</h4>
              <p style={{ fontSize: '0.82rem', color: '#15803d', marginBottom: '1rem' }}>Tải file sao lưu JSON an toàn trên máy tính.</p>
              <button className="btn-primary" onClick={handleExportBackup} style={{ background: '#16a34a' }}>📥 Tải File Backup (.json)</button>
            </div>
            <div style={{ border: '1.5px solid #bfdbfe', background: '#eff6ff', padding: '1.5rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>🔄 Phục Hồi Dữ Liệu (Restore)</h4>
              <p style={{ fontSize: '0.82rem', color: '#1d4ed8', marginBottom: '1rem' }}>Tải lên file JSON sao lưu để phục hồi.</p>
              <label className="btn-primary" style={{ background: '#2563eb', cursor: 'pointer', display: 'inline-block' }}>
                📂 Chọn File Restore (.json)
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportBackup} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Thêm / Sửa Học Sinh ──────────────────────────────────────── */}
      {showStudentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>{editingStudent ? '✏️ Chỉnh Sửa Thông Tin Học Sinh' : '➕ Thêm Học Sinh Mới'}</h3>
            <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Họ và Tên (*)</label>
                <input type="text" className="form-input" style={{ width: '100%' }} value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Giới tính</label>
                  <select className="form-input" style={{ width: '100%' }} value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}>
                    <option>Nữ</option>
                    <option>Nam</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Tổ học tập</label>
                  <select className="form-input" style={{ width: '100%' }} value={studentForm.group} onChange={e => setStudentForm({ ...studentForm, group: e.target.value })}>
                    <option>Tổ 1</option>
                    <option>Tổ 2</option>
                    <option>Tổ 3</option>
                    <option>Tổ 4</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Phòng KTX</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={studentForm.dormRoom} onChange={e => setStudentForm({ ...studentForm, dormRoom: e.target.value })} placeholder="A1-07, C08..." />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>SĐT Học sinh</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="0912..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>SĐT Mẹ</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={studentForm.motherPhone} onChange={e => setStudentForm({ ...studentForm, motherPhone: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>SĐT Cha</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={studentForm.fatherPhone} onChange={e => setStudentForm({ ...studentForm, fatherPhone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowStudentModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>💾 Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Thêm / Sửa Tiêu Chí ──────────────────────────────────────── */}
      {showCriteriaModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>{editingCriteria ? '✏️ Sửa Tiêu Chí Thi Đua' : '➕ Thêm Tiêu Chí Thi Đua Mới'}</h3>
            <form onSubmit={handleSaveCriteria} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Tên Tiêu Chí (*)</label>
                <input type="text" className="form-input" style={{ width: '100%' }} value={criteriaForm.name} onChange={e => setCriteriaForm({ ...criteriaForm, name: e.target.value })} placeholder="VD: Đi học muộn..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Mã Tiêu chí</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={criteriaForm.code} onChange={e => setCriteriaForm({ ...criteriaForm, code: e.target.value })} placeholder="TC08" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Số điểm (+/-)</label>
                  <input type="number" className="form-input" style={{ width: '100%' }} value={criteriaForm.points} onChange={e => setCriteriaForm({ ...criteriaForm, points: parseInt(e.target.value, 10) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCriteriaModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.65rem' }}>💾 Lưu tiêu chí</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Student Modal ────────────────────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(deleteStudentTarget)}
        title="Xác nhận xóa học sinh"
        message={`Bạn có chắc chắn muốn xóa học sinh "${deleteStudentTarget?.name}" khỏi danh sách lớp?`}
        confirmText="Xóa học sinh"
        confirmColor="#dc2626"
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteStudentTarget(null)}
      />

    </div>
  );
}
