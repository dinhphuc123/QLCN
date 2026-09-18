import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useClassSettings } from '../../context/ClassSettingsContext';
import { api } from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';
import { 
  THI_DUA_CRITERIA, 
  getStoredCriteria, 
  saveStoredCriteria, 
  resetStoredCriteria, 
  getCriteriaGroups, 
  CRITERIA_GROUPS 
} from '../../data/thiDuaCriteria';

const QUICK_POSITIONS = [
  { label: '👑 Lớp trưởng', pos: 'Lớp trưởng', role: 'monitor' },
  { label: '📚 Lớp phó học tập', pos: 'Lớp phó học tập', role: 'room_leader' },
  { label: '⚡ Lớp phó lao động', pos: 'Lớp phó lao động', role: 'member' },
  { label: '🎨 Lớp phó văn thể', pos: 'Lớp phó văn thể mỹ', role: 'member' },
  { label: '⭐ Tổ trưởng', pos: 'Tổ trưởng', role: 'group_leader' },
  { label: '🏠 Trưởng phòng', pos: 'Trưởng phòng', role: 'room_leader' },
  { label: '💰 Thủ quỹ', pos: 'Thủ quỹ', role: 'member' },
  { label: '👨‍🎓 Thành viên', pos: 'Thành viên', role: 'member' },
];

export default function CmsAdminPanel({ students = [], finance = [], announcements = [], onRefresh }) {
  const { settings, updateSettings } = useClassSettings();
  const [activeTab, setActiveTab] = useState('students_crud'); // 'students_crud' | 'criteria_crud' | 'announcements_crud' | 'finance_crud' | 'class_info' | 'backup'

  // Class Info form
  const [classForm, setClassForm] = useState({ ...settings });

  // Student CRUD state (Hỗ trợ Position & Role)
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '', gender: 'Nữ', group: 'Tổ 1', dormRoom: 'A1-07', phone: '', motherPhone: '', fatherPhone: '', position: 'Thành viên', role: 'member', isPoor: false
  });
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  // Criteria CRUD state (Đồng bộ 47 tiêu chí chuẩn từ thiDuaCriteria)
  const [criteriaList, setCriteriaList] = useState(() => getStoredCriteria());
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [criteriaSearch, setCriteriaSearch] = useState('');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [criteriaForm, setCriteriaForm] = useState({ 
    code: '', 
    name: '', 
    points: -5, 
    category: '1. Chuyên cần',
    unit: 'lần',
    severe: false
  });

  // Tự động đồng bộ tiêu chí từ Server nếu có
  useEffect(() => {
    const fetchRemoteCriteria = async () => {
      try {
        const res = await api.getCriteria();
        if (res && res.success && Array.isArray(res.criteria) && res.criteria.length > 0) {
          setCriteriaList(res.criteria);
          saveStoredCriteria(res.criteria);
        }
      } catch {}
    };
    fetchRemoteCriteria();
  }, []);

  // ── Student CRUD Handlers ──────────────────────────────────────────────────
  const handleOpenStudentModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({ 
        ...student,
        position: student.position || 'Thành viên',
        role: student.role || 'member'
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        id: students.length + 1,
        name: '', gender: 'Nữ', group: 'Tổ 1', dormRoom: 'A1-07', phone: '', motherPhone: '', fatherPhone: '', position: 'Thành viên', role: 'member', isPoor: false
      });
    }
    setShowStudentModal(true);
  };

  const handleQuickSelectPosition = (item) => {
    if (item.pos === 'Thành viên') {
      setStudentForm(prev => ({ ...prev, position: 'Thành viên', role: 'member' }));
      return;
    }
    setStudentForm(prev => {
      const currentPos = prev.position && prev.position !== 'Thành viên' ? prev.position : '';
      let newPos = currentPos;
      if (!currentPos) {
        newPos = item.pos;
      } else if (!currentPos.includes(item.pos)) {
        newPos = `${currentPos}, ${item.pos}`;
      }
      
      let newRole = prev.role;
      if (newPos.includes('Lớp trưởng')) newRole = 'monitor';
      else if (newPos.includes('Tổ trưởng')) newRole = 'group_leader';
      else if (newPos.includes('Trưởng phòng') && newRole !== 'monitor' && newRole !== 'group_leader') newRole = 'room_leader';
      else if (item.role) newRole = item.role;

      return { ...prev, position: newPos, role: newRole };
    });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim()) { toast.error('Vui lòng nhập họ tên!'); return; }

    // Tự động chuẩn hóa vai trò kỹ thuật
    let finalRole = studentForm.role || 'member';
    const pos = studentForm.position || '';
    if (pos.includes('Lớp trưởng')) finalRole = 'monitor';
    else if (pos.includes('Tổ trưởng')) finalRole = 'group_leader';
    else if (pos.includes('Trưởng phòng') && finalRole !== 'monitor' && finalRole !== 'group_leader') finalRole = 'room_leader';

    const finalStudentData = { ...studentForm, role: finalRole };

    let updated = [];
    if (editingStudent) {
      updated = students.map(s => s.id === editingStudent.id ? { ...s, ...finalStudentData } : s);
    } else {
      updated = [...students, { ...finalStudentData, id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1 }];
    }

    try {
      localStorage.setItem('qlcn_custom_students', JSON.stringify(updated));
    } catch {}

    await api.updateStudents(updated);
    toast.success(editingStudent ? 'Đã cập nhật học sinh và chức vụ!' : 'Đã thêm học sinh mới thành công!');
    setShowStudentModal(false);
    onRefresh();
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    const updated = students.filter(s => s.id !== deleteStudentTarget.id);
    try {
      localStorage.setItem('qlcn_custom_students', JSON.stringify(updated));
    } catch {}
    await api.updateStudents(updated);
    toast.success(`Đã xóa học sinh ${deleteStudentTarget.name}!`);
    setDeleteStudentTarget(null);
    onRefresh();
  };

  // ── Criteria CRUD Handlers ────────────────────────────────────────────────
  const handleSaveCriteria = async (e) => {
    e.preventDefault();
    const name = (criteriaForm.name || criteriaForm.label || '').trim();
    if (!name) { toast.error('Vui lòng nhập tên tiêu chí!'); return; }

    let updatedList = [];
    if (editingCriteria) {
      updatedList = criteriaList.map(c => {
        if (c.id === editingCriteria.id) {
          return {
            ...c,
            ...criteriaForm,
            name: name,
            label: name,
            group: criteriaForm.category || criteriaForm.group,
            category: criteriaForm.category || criteriaForm.group,
            points: Number(criteriaForm.points),
            unit: criteriaForm.unit || 'lần',
            severe: Boolean(criteriaForm.severe),
            isBonus: Number(criteriaForm.points) > 0,
          };
        }
        return c;
      });
      toast.success('Đã cập nhật tiêu chí thi đua!');
    } else {
      const nextId = criteriaList.length > 0 ? Math.max(...criteriaList.map(c => Number(c.id) || 0)) + 1 : 1;
      const code = criteriaForm.code || `TC${String(nextId).padStart(2, '0')}`;
      const newCrit = {
        id: nextId,
        code: code,
        name: name,
        label: name,
        group: criteriaForm.category || criteriaForm.group || '1. Chuyên cần',
        category: criteriaForm.category || criteriaForm.group || '1. Chuyên cần',
        points: Number(criteriaForm.points),
        unit: criteriaForm.unit || 'lần',
        severe: Boolean(criteriaForm.severe),
        isBonus: Number(criteriaForm.points) > 0,
        autoLink: null,
      };
      updatedList = [...criteriaList, newCrit];
      toast.success('Đã thêm tiêu chí thi đua mới!');
    }

    setCriteriaList(updatedList);
    saveStoredCriteria(updatedList);
    try {
      await api.updateCriteria(updatedList);
    } catch {}
    setShowCriteriaModal(false);
  };

  const handleDeleteCriteria = async (id) => {
    const updatedList = criteriaList.filter(c => c.id !== id);
    setCriteriaList(updatedList);
    saveStoredCriteria(updatedList);
    try {
      await api.updateCriteria(updatedList);
    } catch {}
    toast.success('Đã xóa tiêu chí khỏi danh mục!');
  };

  const handleResetToDefaultCriteria = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại 47 tiêu chí chuẩn ban đầu của lớp?')) {
      resetStoredCriteria();
      setCriteriaList([...THI_DUA_CRITERIA]);
      try {
        await api.updateCriteria(THI_DUA_CRITERIA);
      } catch {}
      toast.success('🎉 Đã khôi phục 47 tiêu chí thi đua chuẩn!');
    }
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

  const handleResetDemoData = async () => {
    if (!window.confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH DỮ LIỆU DEMO?\n\nHệ thống sẽ xóa toàn bộ các bản ghi thử nghiệm (Thông báo, Đơn xin nghỉ, Tâm sự, Quỹ lớp demo) và nạp dữ liệu chuẩn 32 học sinh từ file Excel vào Supabase & CSDL.')) {
      return;
    }

    try {
      // Clear demo local storage keys
      localStorage.removeItem('qlcn_announcements');
      localStorage.removeItem('qlcn_leave_requests');
      localStorage.removeItem('qlcn_home_requests');
      localStorage.removeItem('qlcn_confessions');
      localStorage.removeItem('qlcn_activities');
      localStorage.removeItem('qlcn_finance');
      localStorage.removeItem('qlcn_attendance');
      localStorage.removeItem('qlcn_students_data');

      const res = await api.post('/api/admin/reset-demo', {});
      if (res && res.success) {
        toast.success('🎉 ' + (res.message || 'Đã xóa sạch dữ liệu demo và nạp 32 học sinh từ Excel vào Supabase!'));
      } else {
        toast.success('🎉 Đã xóa sạch dữ liệu demo và làm mới danh sách 32 học sinh!');
      }
      onRefresh();
    } catch (err) {
      toast.error('❌ Có lỗi khi làm mới dữ liệu: ' + (err.message || 'Lỗi server'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner — Tinh chỉnh padding gọn gàng & đồng bộ phong cách */}
      <div className="glass-panel cms-banner" style={{ color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.18)', color: '#e0e7ff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800, width: 'fit-content', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
              ⚙️ QUẢN TRỊ DỮ LIỆU ĐẦU VÀO
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: 800 }}>
              Quản Trị — Lớp {settings.className}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '0.25rem', margin: 0 }}>
              Quản lý sĩ số, 47 tiêu chí thi đua, thông tin lớp và sao lưu.
            </p>
          </div>

          <div className="cms-banner-actions" style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleResetDemoData} style={{ background: '#ef4444', padding: '0.5rem 1rem', fontSize: '0.8rem', boxShadow: '0 2px 10px rgba(239,68,68,0.3)' }}>
              🧹 Xóa Demo
            </button>
            <button className="btn-primary" onClick={handleExportBackup} style={{ background: '#10b981', padding: '0.5rem 1rem', fontSize: '0.8rem', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
              💾 Sao Lưu
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs — Segmented Control bo tròn hiện đại */}
      <div className="cms-tab-bar" role="tablist">
        {[
          { id: 'students_crud', label: 'Học Sinh', icon: '👨‍🎓' },
          { id: 'criteria_crud', label: 'Tiêu Chí Thi Đua', icon: '📊' },
          { id: 'class_info', label: 'Cấu Hình Lớp', icon: '🏫' },
          { id: 'backup', label: 'Sao Lưu & Khôi Phục', icon: '🛡️' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="cms-tab-btn"
              style={{
                background: isActive ? 'var(--color-primary-dark)' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                boxShadow: isActive ? '0 2px 8px rgba(27, 77, 83, 0.25)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Student CRUD ────────────────────────────────────────────── */}
      {activeTab === 'students_crud' && (
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>👨‍🎓 Danh Sách Học Sinh ({students.length} em)</h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                Cập nhật thông tin, chức vụ, tổ và phòng KTX
              </p>
            </div>
            <button className="btn-primary" onClick={() => handleOpenStudentModal(null)} style={{ background: '#16a34a' }}>
              ➕ Thêm Học Sinh
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="cms-student-desktop-table" style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
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
                    <td style={{ padding: '0.75rem', fontSize: '0.82rem' }}>
                      {(() => {
                        const pos = s.position || 'Thành viên';
                        const isMonitor = pos.includes('Lớp trưởng') || s.role === 'monitor';
                        const isGroupLeader = pos.includes('Tổ trưởng') || s.role === 'group_leader';
                        const isRoomLeader = pos.includes('Trưởng phòng') || s.role === 'room_leader';
                        const isVice = pos.includes('Lớp phó');
                        const isTreasurer = pos.includes('Thủ quỹ');

                        let bg = '#f1f5f9';
                        let color = '#475569';
                        let border = '#cbd5e1';

                        if (isMonitor) {
                          bg = '#fef3c7'; color = '#92400e'; border = '#fde68a';
                        } else if (isGroupLeader) {
                          bg = '#e0f2fe'; color = '#0369a1'; border = '#bae6fd';
                        } else if (isRoomLeader) {
                          bg = '#ecfdf5'; color = '#047857'; border = '#a7f3d0';
                        } else if (isVice) {
                          bg = '#ede9fe'; color = '#5b21b6'; border = '#ddd6fe';
                        } else if (isTreasurer) {
                          bg = '#fef9c3'; color = '#854d0e'; border = '#fef08a';
                        }

                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.25rem 0.65rem', borderRadius: '9999px',
                            background: bg, color: color, border: `1px solid ${border}`,
                            fontWeight: isMonitor || isGroupLeader || isRoomLeader || isVice ? 800 : 600,
                            fontSize: '0.75rem', whiteSpace: 'nowrap'
                          }}>
                            {isMonitor && '👑 '}
                            {isGroupLeader && '⭐ '}
                            {isRoomLeader && '🏠 '}
                            {isVice && '📚 '}
                            {isTreasurer && '💰 '}
                            {pos}
                          </span>
                        );
                      })()}
                    </td>
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

          {/* Mobile Card-based List View */}
          <div className="cms-student-mobile-cards">
            {students.map((s, idx) => {
              const pos = s.position || 'Thành viên';
              const isMonitor = pos.includes('Lớp trưởng') || s.role === 'monitor';
              const isGroupLeader = pos.includes('Tổ trưởng') || s.role === 'group_leader';
              const isRoomLeader = pos.includes('Trưởng phòng') || s.role === 'room_leader';
              const isVice = pos.includes('Lớp phó');
              const isTreasurer = pos.includes('Thủ quỹ');

              let bg = '#f1f5f9';
              let color = '#475569';
              let border = '#cbd5e1';

              if (isMonitor) {
                bg = '#fef3c7'; color = '#92400e'; border = '#fde68a';
              } else if (isGroupLeader) {
                bg = '#e0f2fe'; color = '#0369a1'; border = '#bae6fd';
              } else if (isRoomLeader) {
                bg = '#ecfdf5'; color = '#047857'; border = '#a7f3d0';
              } else if (isVice) {
                bg = '#ede9fe'; color = '#5b21b6'; border = '#ddd6fe';
              } else if (isTreasurer) {
                bg = '#fef9c3'; color = '#854d0e'; border = '#fef08a';
              }

              return (
                <div
                  key={s.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.85rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{s.name}</strong>
                      {s.isPoor && <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Cận nghèo</span>}
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                      padding: '0.18rem 0.55rem', borderRadius: '9999px',
                      background: bg, color: color, border: `1px solid ${border}`,
                      fontWeight: 700, fontSize: '0.72rem'
                    }}>
                      {isMonitor && '👑 '}
                      {isGroupLeader && '⭐ '}
                      {isRoomLeader && '🏠 '}
                      {isVice && '📚 '}
                      {isTreasurer && '💰 '}
                      {pos}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>👥 {s.group}</span>
                    <span>🏡 KTX: {s.dormRoom}</span>
                    <span>⚧️ {s.gender || 'Nữ'}</span>
                    {s.phone && <span>📞 {s.phone}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.2rem', paddingTop: '0.45rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => handleOpenStudentModal(s)}
                      style={{
                        flex: 1, padding: '0.45rem', borderRadius: '0.5rem',
                        background: '#e0f2fe', color: '#0369a1', border: 'none',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                      }}
                    >
                      ✏️ Sửa thông tin
                    </button>
                    <button
                      onClick={() => setDeleteStudentTarget(s)}
                      style={{
                        padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                        background: '#fee2e2', color: '#991b1b', border: 'none',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem'
                      }}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: Criteria CRUD ────────────────────────────────────────────── */}
      {activeTab === 'criteria_crud' && (
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📊</span>
                <span>47 Tiêu Chí Thi Đua</span>
                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                  {criteriaList.length} tiêu chí
                </span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                Đồng bộ 2 chiều với hệ thống tự chấm và thi đua tuần
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={handleResetToDefaultCriteria}
                style={{ 
                  padding: '0.5rem 0.85rem', borderRadius: '0.75rem', border: '1.5px solid #d97706',
                  background: '#fffbeb', color: '#b45309', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' 
                }}
                title="Khôi phục danh sách về 47 tiêu chí gốc ban đầu"
              >
                🔄 Khôi Phục Gốc
              </button>
              <button 
                className="btn-primary" 
                onClick={() => { 
                  setEditingCriteria(null); 
                  setCriteriaForm({ 
                    code: `TC${String(criteriaList.length + 1).padStart(2, '0')}`, 
                    name: '', 
                    points: -5, 
                    category: selectedGroup === 'ALL' ? '1. Chuyên cần' : selectedGroup,
                    unit: 'lần',
                    severe: false
                  }); 
                  setShowCriteriaModal(true); 
                }} 
                style={{ background: '#16a34a', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                ➕ Thêm Tiêu Chí
              </button>
            </div>
          </div>

          {/* 8 Nhóm tiêu chí Filter Bar & Tìm kiếm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem', scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setSelectedGroup('ALL')}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '9999px',
                  border: selectedGroup === 'ALL' ? '1px solid var(--color-primary-brand)' : '1px solid #e2e8f0',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: selectedGroup === 'ALL' ? 'var(--color-primary-brand)' : 'white',
                  color: selectedGroup === 'ALL' ? 'white' : '#475569',
                  boxShadow: selectedGroup === 'ALL' ? '0 2px 8px rgba(114, 155, 18, 0.25)' : 'none',
                }}
              >
                📋 Tất cả ({criteriaList.length})
              </button>
              {CRITERIA_GROUPS.map(grp => {
                const countInGrp = criteriaList.filter(c => (c.group || c.category) === grp).length;
                const isSelected = selectedGroup === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    style={{
                      padding: '0.4rem 0.85rem', borderRadius: '9999px',
                      border: isSelected ? '1px solid var(--color-primary-brand)' : '1px solid #e2e8f0',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                      background: isSelected ? 'var(--color-primary-brand)' : 'white',
                      color: isSelected ? 'white' : '#475569',
                      boxShadow: isSelected ? '0 2px 8px rgba(114, 155, 18, 0.25)' : 'none',
                    }}
                  >
                    {grp} ({countInGrp})
                  </button>
                );
              })}
            </div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>🔍</span>
              <input
                type="text"
                className="form-input"
                placeholder="Tìm kiếm theo tên tiêu chí, mã số hoặc số điểm..."
                style={{ width: '100%', paddingLeft: '2.4rem', borderRadius: '0.75rem' }}
                value={criteriaSearch}
                onChange={e => setCriteriaSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Danh sách tiêu chí Cards */}
          {(() => {
            const filteredCriteria = criteriaList.filter(c => {
              const grp = c.group || c.category;
              const matchGroup = selectedGroup === 'ALL' || grp === selectedGroup;
              if (!matchGroup) return false;
              if (!criteriaSearch.trim()) return true;
              const term = criteriaSearch.toLowerCase();
              const name = (c.label || c.name || '').toLowerCase();
              const code = (c.code || '').toLowerCase();
              const pointsStr = String(c.points || '');
              return name.includes(term) || code.includes(term) || pointsStr.includes(term);
            });

            if (filteredCriteria.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '1rem', color: '#64748b' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🔎</span>
                  Không tìm thấy tiêu chí nào phù hợp với bộ lọc.
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
                {filteredCriteria.map(tc => {
                  const title = tc.label || tc.name;
                  const groupName = tc.group || tc.category || 'Tiêu chí';
                  const isBonus = Number(tc.points) > 0;
                  const isSevere = Boolean(tc.severe);

                  return (
                    <div 
                      key={tc.id} 
                      style={{ 
                        background: 'white', 
                        border: isSevere ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0', 
                        borderRadius: '0.875rem', 
                        padding: '1.2rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                            {tc.code ? `${tc.code}` : `#${tc.id}`}
                          </span>
                          <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {groupName}
                          </span>
                          {isSevere && (
                            <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                              🚨 Nghiêm trọng
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.4 }}>
                          {title}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 900, color: isBonus ? '#16a34a' : '#dc2626' }}>
                            {isBonus ? `+${tc.points}` : `${tc.points}`} điểm
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            / {tc.unit || 'lần'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: isBonus ? '#15803d' : '#991b1b', fontWeight: 600 }}>
                            ({isBonus ? 'Khen thưởng' : 'Trừ thi đua'})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
                        <button 
                          onClick={() => { 
                            setEditingCriteria(tc); 
                            setCriteriaForm({ 
                              ...tc,
                              name: tc.label || tc.name,
                              category: tc.group || tc.category,
                              points: tc.points,
                              unit: tc.unit || 'lần',
                              severe: Boolean(tc.severe),
                            }); 
                            setShowCriteriaModal(true); 
                          }} 
                          style={{ padding: '0.35rem 0.7rem', borderRadius: '0.375rem', background: '#e0f2fe', color: '#0369a1', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteCriteria(tc.id)} 
                          style={{ padding: '0.35rem 0.7rem', borderRadius: '0.375rem', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 3: Class Info ──────────────────────────────────────────────── */}
      {activeTab === 'class_info' && (
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>🏫 Cấu Hình Lớp</h3>
          <form onSubmit={e => { e.preventDefault(); updateSettings(classForm); toast.success('Đã lưu cấu hình!'); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Tên Lớp</label>
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
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Họ Tên GVCN</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.teacherName} onChange={e => setClassForm({ ...classForm, teacherName: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Trường Học</label>
              <input type="text" className="form-input" style={{ width: '100%' }} value={classForm.schoolName} onChange={e => setClassForm({ ...classForm, schoolName: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.75rem' }}>💾 Lưu Cấu Hình</button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 4: Backup ─────────────────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🛡️ Sao Lưu & Khôi Phục</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ border: '1.5px solid #bbf7d0', background: '#f0fdf4', padding: '1.25rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#166534', margin: '0 0 0.4rem 0' }}>📦 Sao Lưu Dữ Liệu</h4>
              <p style={{ fontSize: '0.8rem', color: '#15803d', marginBottom: '0.85rem' }}>Tải file JSON lưu trữ an toàn trên thiết bị.</p>
              <button className="btn-primary" onClick={handleExportBackup} style={{ background: '#16a34a', padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}>📥 Tải Bản Sao Lưu</button>
            </div>
            <div style={{ border: '1.5px solid #bfdbfe', background: '#eff6ff', padding: '1.25rem', borderRadius: '1rem' }}>
              <h4 style={{ color: '#1e40af', margin: '0 0 0.4rem 0' }}>🔄 Khôi Phục Dữ Liệu</h4>
              <p style={{ fontSize: '0.8rem', color: '#1d4ed8', marginBottom: '0.85rem' }}>Chọn file JSON sao lưu để phục hồi hệ thống.</p>
              <label className="btn-primary" style={{ background: '#2563eb', cursor: 'pointer', display: 'inline-block', padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}>
                📂 Chọn File Khôi Phục
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

              {/* Chức vụ & Vai trò học sinh */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.85rem', border: '1.5px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.4rem', color: '#1e293b' }}>
                  🎖️ Chức Vụ Học Sinh (Chọn nhanh hoặc tự nhập)
                </label>
                
                {/* Quick Select Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                  {QUICK_POSITIONS.map(item => {
                    const isSelected = (studentForm.position || '').includes(item.pos);
                    return (
                      <button
                        key={item.pos}
                        type="button"
                        onClick={() => handleQuickSelectPosition(item)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          border: isSelected ? '1.5px solid var(--color-primary-brand)' : '1px solid #cbd5e1',
                          background: isSelected ? '#ecfccb' : 'white',
                          color: isSelected ? '#3f6212' : '#334155',
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.85rem' }}
                  value={studentForm.position}
                  onChange={e => {
                    const val = e.target.value;
                    let r = studentForm.role;
                    if (val.includes('Lớp trưởng')) r = 'monitor';
                    else if (val.includes('Tổ trưởng')) r = 'group_leader';
                    else if (val.includes('Trưởng phòng') && r !== 'monitor' && r !== 'group_leader') r = 'room_leader';
                    setStudentForm({ ...studentForm, position: val, role: r });
                  }}
                  placeholder="VD: Lớp phó học tập, Trưởng phòng..."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>
                      Vai Trò Kỹ Thuật (Role)
                    </label>
                    <select
                      className="form-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                      value={studentForm.role || 'member'}
                      onChange={e => setStudentForm({ ...studentForm, role: e.target.value })}
                    >
                      <option value="member">👨‍🎓 member (Học sinh/Thành viên)</option>
                      <option value="monitor">👑 monitor (Lớp trưởng)</option>
                      <option value="group_leader">⭐ group_leader (Tổ trưởng)</option>
                      <option value="room_leader">🏠 room_leader (Trưởng phòng)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>
                      Hoàn Cảnh Gia Đình
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginTop: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(studentForm.isPoor)}
                        onChange={e => setStudentForm({ ...studentForm, isPoor: e.target.checked })}
                      />
                      <span>Gia đình diện cận nghèo</span>
                    </label>
                  </div>
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
          <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>{editingCriteria ? '✏️ Sửa Tiêu Chí Thi Đua' : '➕ Thêm Tiêu Chí Thi Đua Mới'}</h3>
            <form onSubmit={handleSaveCriteria} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Nhóm Tiêu Chí (*)</label>
                <select 
                  className="form-input" 
                  style={{ width: '100%' }} 
                  value={criteriaForm.category || criteriaForm.group || '1. Chuyên cần'} 
                  onChange={e => setCriteriaForm({ ...criteriaForm, category: e.target.value, group: e.target.value })}
                >
                  {CRITERIA_GROUPS.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Tên Tiêu Chí (*)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%' }} 
                  value={criteriaForm.name || criteriaForm.label || ''} 
                  onChange={e => setCriteriaForm({ ...criteriaForm, name: e.target.value, label: e.target.value })} 
                  placeholder="VD: Đi học trễ, Không làm bài tập..." 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Mã Tiêu chí</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} value={criteriaForm.code || ''} onChange={e => setCriteriaForm({ ...criteriaForm, code: e.target.value })} placeholder="TC08" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Số điểm (+ cộng / - trừ)</label>
                  <input type="number" className="form-input" style={{ width: '100%' }} value={criteriaForm.points} onChange={e => setCriteriaForm({ ...criteriaForm, points: parseInt(e.target.value, 10) || 0 })} placeholder="-5, +5..." required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Đơn vị tính</label>
                  <select 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={criteriaForm.unit || 'lần'} 
                    onChange={e => setCriteriaForm({ ...criteriaForm, unit: e.target.value })}
                  >
                    <option value="lần">lần</option>
                    <option value="buổi">buổi</option>
                    <option value="tiết">tiết</option>
                    <option value="tuần">tuần</option>
                    <option value="trường hợp">trường hợp</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={Boolean(criteriaForm.severe)} 
                      onChange={e => setCriteriaForm({ ...criteriaForm, severe: e.target.checked })} 
                    />
                    <span>🚨 Vi phạm nghiêm trọng (-50đ)</span>
                  </label>
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
