import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ConfirmModal from '../ui/ConfirmModal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import AdminDocExporter from './AdminDocExporter';

export default function Reports({ students = [], attendance = {}, dormAttendance = {}, finance = [], onRefresh }) {
  const { isTeacher } = useAuth();
  const { settings } = useClassSettings();
  const [showResetModal, setShowResetModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  if (!isTeacher) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h3 style={{ color: '#dc2626', margin: 0 }}>Quyền Truy Cập Dành Riêng Cho GVCN</h3>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Tính năng xuất báo cáo và biểu mẫu (.docx / .xlsx) chỉ dành riêng cho Giáo viên chủ nhiệm.
        </p>
      </div>
    );
  }

  // Compute summary metrics
  const stats = useMemo(() => {
    const totalDays = Object.keys(attendance).length;
    const femaleCount = students.filter(s => s.gender === 'Nữ').length;
    const maleCount = students.filter(s => s.gender === 'Nam').length;
    const poorCount = students.filter(s => s.isPoor).length;

    const totalIncome = finance.filter(f => f.type === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const totalExpense = finance.filter(f => f.type === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const balance = totalIncome - totalExpense;

    return { totalDays, femaleCount, maleCount, poorCount, totalIncome, totalExpense, balance };
  }, [students, attendance, finance]);

  // Multi-sheet Excel export
  const handleExportMultiSheetExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: DS Học sinh & Nề nếp
      const sheet1Data = students.map(s => ({
        'STT': String(s.id).padStart(2, '0'),
        'Mã HS': s.studentCode || '',
        'Họ và Tên': s.name,
        'Giới tính': s.gender || 'Nữ',
        'Ngày sinh': s.dob || '',
        'Dân tộc': s.ethnicity || '',
        'Tổ': s.group,
        'Phòng KTX': s.dormRoom,
        'Chức vụ': s.position || 'Thành viên',
        'Cận nghèo': s.isPoor ? 'Có' : 'Không',
        'SĐT HS': s.phone || '',
        'SĐT Mẹ': s.motherPhone || '',
        'SĐT Cha': s.fatherPhone || '',
        'ĐTB Lớp 11': s.prevGPA || '',
        'Xếp loại Lớp 11': s.prevRank || '',
      }));
      const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
      XLSX.utils.book_append_sheet(wb, ws1, 'DS Học Sinh & KTX');

      // Sheet 2: Sổ Thu Chi Quỹ Lớp
      const sheet2Data = finance.map((f, i) => ({
        'STT': i + 1,
        'Ngày': f.date,
        'Loại': f.type === 'income' ? 'THU' : 'CHI',
        'Nội dung': f.title,
        'Danh mục': f.category,
        'Số tiền (VNĐ)': f.amount,
        'Ghi chú': f.note || ''
      }));
      const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
      XLSX.utils.book_append_sheet(wb, ws2, 'Sổ Thu Chi Quỹ Lớp');

      // Sheet 3: Tổng quan Báo cáo
      const sheet3Data = [
        { 'Chỉ số': 'Sĩ số toàn lớp 12.7', 'Giá trị': `${students.length} học sinh` },
        { 'Chỉ số': 'Số lượng Học sinh Nữ', 'Giá trị': `${stats.femaleCount} Nữ` },
        { 'Chỉ số': 'Số lượng Học sinh Nam', 'Giá trị': `${stats.maleCount} Nam` },
        { 'Chỉ số': 'Số lượng HS Cận nghèo', 'Giá trị': `${stats.poorCount} HS` },
        { 'Chỉ số': 'Tổng Thu Quỹ Lớp', 'Giá trị': `${stats.totalIncome.toLocaleString()} VNĐ` },
        { 'Chỉ số': 'Tổng Chi Quỹ Lớp', 'Giá trị': `${stats.totalExpense.toLocaleString()} VNĐ` },
        { 'Chỉ số': 'Số Dư Quỹ Hiện Tại', 'Giá trị': `${stats.balance.toLocaleString()} VNĐ` },
      ];
      const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
      XLSX.utils.book_append_sheet(wb, ws3, 'Tổng Quan Báo Cáo');

      // Download file
      const fileName = `BaoCao_TongHop_Lop12.7_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Đã xuất file Excel 3 Sheet thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất file Excel!');
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkText.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error('Vui lòng nhập danh sách!'); return; }
    const newStudents = lines.map((name, idx) => ({
      id: idx + 1, name, group: `Tổ ${Math.floor(idx / 8) + 1}`,
      dormRoom: idx < 22 ? `A1-0${7 + Math.floor(idx / 5)}` : 'C08',
      role: idx === 0 ? 'monitor' : 'member',
      gender: idx < 22 ? 'Nữ' : 'Nam',
      points: 100, note: '',
      seatIndex: idx,
    }));
    toast.success(`Đã nhập ${newStudents.length} học sinh!`);
    setShowBulkModal(false);
    setBulkText('');
    onRefresh();
    try {
      await api.bulkImport(newStudents);
    } catch (err) {
      console.warn('bulkImport API failed:', err.message);
    }
  };


  const StatCard = ({ label, value, unit = '', color = 'var(--color-primary-brand)', icon }) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: 'var(--font-sans)', fontWeight: 600, margin: 0 }}>{label}</h4>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}<span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.25rem' }}>{unit}</span></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header & Export bar */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>📋 Tổng Kết & Xuất Báo Cáo Định Kỳ Excel (3 Sheet)</h3>
            <p style={{ fontSize: '0.82rem', color: 'gray', marginTop: '0.25rem' }}>
              Xuất dữ liệu chuẩn cho nhà trường, ban giám hiệu và phụ huynh học sinh
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleExportMultiSheetExcel} style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', background: '#15803d' }}>
              📥 Xuất Excel 3 Sheet (.xlsx)
            </button>
            {isTeacher && (
              <button className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', background: '#7c3aed' }} onClick={() => setShowBulkModal(true)}>
                📝 Nhập văn bản
              </button>
            )}
            {isTeacher && (
              <button className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', background: '#dc2626' }} onClick={() => setShowResetModal(true)}>
                ⚙️ Reset toàn bộ
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <StatCard label="Sĩ số lớp" value={students.length} unit="HS" icon="👨‍🎓" color="#1B4D53" />
          <StatCard label="Học sinh Nữ" value={stats.femaleCount} unit="em" icon="👩" color="#ec4899" />
          <StatCard label="Học sinh Nam" value={stats.maleCount} unit="em" icon="👨" color="#2563eb" />
          <StatCard label="Diện Cận nghèo" value={stats.poorCount} unit="HS" icon="⚠️" color="#d97706" />
          <StatCard label="Quỹ Lớp Hiện Tại" value={(stats.balance / 1000).toFixed(0)} unit="k" icon="💰" color="#16a34a" />
        </div>
      </div>

      {/* Administrative Document Exporter */}
      <AdminDocExporter students={students} settings={settings} />

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset & Nhập lớp mới"
        message="Toàn bộ dữ liệu học sinh, điểm danh, đơn xin phép và thông báo sẽ bị xóa sạch. Bạn có chắc chắn?"
        confirmText="Xóa và nhập mới"
        confirmColor="#dc2626"
        onConfirm={() => { setShowResetModal(false); setShowBulkModal(true); }}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Bulk import modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>📝 Nhập danh sách học sinh văn bản</h3>
            <p style={{ fontSize: '0.8rem', color: 'gray' }}>Dán danh sách họ tên, mỗi tên một dòng.</p>
            <textarea className="form-input" style={{ minHeight: '160px', resize: 'vertical', width: '100%' }}
              placeholder={'Nguyễn Văn A\nTrần Thị B\n...'}
              value={bulkText} onChange={e => setBulkText(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBulkModal(false)} style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button className="btn-primary" onClick={handleBulkImport}>✅ Nhập danh sách</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
