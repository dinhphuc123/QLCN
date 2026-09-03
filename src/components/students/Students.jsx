import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../ui/ConfirmModal';
import SearchFilterBar from '../ui/SearchFilterBar';
import { api } from '../../lib/api';
import { maskPhone, maskParentInfo } from '../../utils/privacy';
import { useAuth } from '../../context/AuthContext';

const DORM_ROOMS = ['A1-07', 'A1-08', 'A1-09', 'A1-10', 'A1-11', 'C08'];
const GROUPS = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

function StudentDetailModal({ student, onClose, onUpdateNote, onUpdateStudent }) {
  const { user, isTeacher, resetStudentPin } = useAuth();
  const isSelf = user?.id === student?.id;
  const [note, setNote] = useState(student ? student.note || '' : '');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(student ? { ...student } : {});
  const [isResettingPin, setIsResettingPin] = useState(false);

  const handleExportStudentReportPDF = () => {
    if (!student) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Trình duyệt chặn pop-up'); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Đánh Giá Cá Nhân HS - ${student.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; line-height: 1.5; color: #000; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          h2 { text-align: center; margin: 10px 0 5px 0; text-transform: uppercase; font-size: 18px; }
          .sub { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 13px; }
          .box { border: 1px solid #000; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
          .row { margin-bottom: 8px; font-size: 14px; }
          .label { font-weight: bold; min-width: 140px; display: inline-block; }
          .footer { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>TRƯỜNG THPT QUỐC GIA<br/><strong>LỚP 12.7</strong></div>
          <div style="text-align: right;"><strong>HỌP PHỤ HUYNH HỌC SINH</strong><br/>Năm học 2026 - 2027</div>
        </div>

        <h2>PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN & HỌC TẬP CÁ NHÂN</h2>
        <div class="sub">(Dành cho Học Sinh & Phụ Huynh Theo Dõi)</div>

        <div class="box">
          <h3 style="margin: 0 0 8px 0; font-size: 15px;">I. THÔNG TIN HỌC SINH</h3>
          <div class="row"><span class="label">Họ và Tên:</span> <strong>${student.name}</strong> (${student.gender || 'Nam'})</div>
          <div class="row"><span class="label">Mã Số HS:</span> ${student.studentCode || String(student.id).padStart(2, '0')} | <span class="label">Tổ sinh hoạt:</span> ${student.group || 'Tổ 1'}</div>
          <div class="row"><span class="label">Phòng KTX:</span> ${student.dormRoom || 'Không ở KTX'} | <span class="label">Chức vụ:</span> ${student.position || 'Học sinh'}</div>
          <div class="row"><span class="label">Họ tên Phụ huynh:</span> Mẹ: ${student.motherName || '—'} | Bố: ${student.fatherName || '—'}</div>
        </div>

        <div class="box">
          <h3 style="margin: 0 0 8px 0; font-size: 15px;">II. KẾT QUẢ RÈN LUYỆN NỀ NẾP THI ĐƯA & CHUYÊN CẦN 5 BUỔI</h3>
          <div class="row"><span class="label">Điểm Thi Đua Tuần:</span> <strong>98 / 100 điểm</strong> (Xếp loại: Tốt)</div>
          <div class="row"><span class="label">Chuyên Cần 5 Buổi:</span> Đạt 100% tỷ lệ có mặt đúng giờ</div>
          <div class="row"><span class="label">Vi Phạm Nề Nếp:</span> Không có vi phạm quy chế</div>
        </div>

        <div class="box">
          <h3 style="margin: 0 0 8px 0; font-size: 15px;">III. HỌC LỰC & ĐỊNH HƯỚNG TỔ HỢP THI THPT QUỐC GIA</h3>
          <div class="row"><span class="label">ĐTB Môn Năm Trước:</span> <strong>${student.prevGPA || '7.5'}</strong> (Học lực: ${student.prevRank || 'Khá'})</div>
          <div class="row"><span class="label">Khối Thi Mục Tiêu:</span> A00 / D01 (Kỳ thi THPT Quốc gia 2027)</div>
          <div class="row"><span class="label">Nguyện Vọng ĐH:</span> ${student.aspirations || 'Đại học Bách Khoa / Sư Phạm'}</div>
        </div>

        <div class="box">
          <h3 style="margin: 0 0 8px 0; font-size: 15px;">IV. NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM</h3>
          <div class="row">${note || student.note || 'Em ngoan ngoãn, lễ phép, chấp hành tốt mọi nội quy trường lớp. Cần tiếp tục duy trì phong độ học tập tốt.'}</div>
        </div>

        <div class="footer">
          <div><strong>Ý KIẾN PHỤ HUYNH HỌC SINH</strong><br/><br/><br/><br/>(Ký & ghi rõ họ tên)</div>
          <div><strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/><br/><br/><br/>Đỗ Kim Tuyền</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.name.trim()) {
      toast.error('Họ và tên không được để trống!');
      return;
    }
    if (onUpdateStudent) {
      await onUpdateStudent(editForm);
    }
    setIsEditing(false);
  };

  if (!student) return null;

  const motherInfo = maskParentInfo(student.motherName, student.motherPhone, isTeacher, isSelf);
  const fatherInfo = maskParentInfo(student.fatherName, student.fatherPhone, isTeacher, isSelf);
  const maskedPhone = maskPhone(student.phone, isTeacher, isSelf);

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.25rem', padding: '1.75rem',
        width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0',
        boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
              background: student.gender === 'Nữ' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.5rem', fontWeight: 800
            }}>
              {student.name ? student.name.split(' ').pop()[0] : '?'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                {student.name} {student.isPoor && isTeacher && <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Cận nghèo</span>}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Mã HS: <strong>{student.studentCode || String(student.id).padStart(2, '0')}</strong> | STT: <strong>{String(student.id).padStart(2, '0')}</strong> | {student.group} | {student.dormRoom}
              </p>
              {student.position && (
                <span style={{ display: 'inline-block', marginTop: '0.3rem', fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                  ⭐ {student.position}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Edit Form OR Info Grid */}
        {isEditing && isTeacher ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              ✏️ Chỉnh sửa thông tin học sinh
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Họ và tên *</label>
                <input className="form-input" style={{ width: '100%' }} value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Giới tính</label>
                <select className="form-input" style={{ width: '100%' }} value={editForm.gender || 'Nam'} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Ngày sinh</label>
                <input className="form-input" style={{ width: '100%' }} value={editForm.dob || ''} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))} placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Dân tộc</label>
                <input className="form-input" style={{ width: '100%' }} value={editForm.ethnicity || ''} onChange={e => setEditForm(f => ({ ...f, ethnicity: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>SĐT Học sinh</label>
                <input className="form-input" style={{ width: '100%' }} value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Tổ</label>
                <select className="form-input" style={{ width: '100%' }} value={editForm.group || 'Tổ 1'} onChange={e => setEditForm(f => ({ ...f, group: e.target.value }))}>
                  {GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Phòng KTX</label>
                <select className="form-input" style={{ width: '100%' }} value={editForm.dormRoom || 'A1-07'} onChange={e => setEditForm(f => ({ ...f, dormRoom: e.target.value }))}>
                  {DORM_ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Họ tên Mẹ & SĐT</label>
                <input className="form-input" style={{ width: '100%', marginBottom: '0.3rem' }} placeholder="Tên Mẹ" value={editForm.motherName || ''} onChange={e => setEditForm(f => ({ ...f, motherName: e.target.value }))} />
                <input className="form-input" style={{ width: '100%' }} placeholder="SĐT Mẹ" value={editForm.motherPhone || ''} onChange={e => setEditForm(f => ({ ...f, motherPhone: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Họ tên Cha & SĐT</label>
                <input className="form-input" style={{ width: '100%', marginBottom: '0.3rem' }} placeholder="Tên Cha" value={editForm.fatherName || ''} onChange={e => setEditForm(f => ({ ...f, fatherName: e.target.value }))} />
                <input className="form-input" style={{ width: '100%' }} placeholder="SĐT Cha" value={editForm.fatherPhone || ''} onChange={e => setEditForm(f => ({ ...f, fatherPhone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Địa chỉ thường trú</label>
              <input className="form-input" style={{ width: '100%' }} value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!editForm.isPoor} onChange={e => setEditForm(f => ({ ...f, isPoor: e.target.checked }))} />
                Học sinh cận nghèo / hoàn cảnh khó khăn
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Hủy</button>
              <button type="button" onClick={handleSaveEdit} className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem' }}>💾 Lưu thông tin</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Giới tính</span>
              <strong>{student.gender || '—'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Ngày sinh</span>
              <strong>{student.dob || '—'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Dân tộc</span>
              <strong>{student.ethnicity || '—'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>SĐT Học sinh</span>
              <strong>{maskedPhone}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Họ tên & SĐT Mẹ</span>
              <strong>{motherInfo.name}</strong> ({motherInfo.phone})
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Họ tên & SĐT Cha</span>
              <strong>{fatherInfo.name}</strong> ({fatherInfo.phone})
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Địa chỉ thường trú</span>
              <strong>{isTeacher || isSelf ? (student.address || '—') : '🔒 Chỉ GVCN'}</strong>
            </div>
          </div>
        )}

        {/* Year 11 Academic History */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', background: '#f8fafc' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>📚 Kết quả năm học trước (11.7)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#1d4ed8' }}>ĐTB Môn</span>
              <strong style={{ fontSize: '1.1rem', color: '#1e40af' }}>{student.prevGPA || '—'}</strong>
            </div>
            <div style={{ background: '#f0fdf4', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#15803d' }}>Học tập</span>
              <strong style={{ fontSize: '1rem', color: '#166534' }}>{student.prevRank || '—'}</strong>
            </div>
            <div style={{ background: '#fefce8', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #fef9c3' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#a16207' }}>Nghỉ có/không phép</span>
              <strong style={{ fontSize: '0.9rem', color: '#854d0e' }}>{student.prevAbsencePermit || 0}P / {student.prevAbsenceNo || 0}KP</strong>
            </div>
          </div>
        </div>

        {/* Note Editor for Teacher */}
        {isTeacher && (
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#334155' }}>📝 Ghi chú riêng của GVCN</label>
            <textarea
              className="form-input" style={{ width: '100%', height: '70px', resize: 'vertical' }}
              placeholder="Ghi chú về hoàn cảnh, sức khỏe, học lực..."
              value={note} onChange={e => setNote(e.target.value)}
            />
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          {isTeacher && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportStudentReportPDF}
                style={{
                  padding: '0.45rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700,
                  background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                }}
              >
                📄 In Phiếu Họp Phụ Huynh
              </button>
              
              <button
                type="button"
                disabled={isResettingPin}
                onClick={async () => {
                  setIsResettingPin(true);
                  try {
                    if (resetStudentPin) await resetStudentPin(student.id);
                    toast.success(`✅ Đã reset mã PIN cho em ${student.name} về mặc định 1234!`);
                  } catch (err) {
                    toast.error('Lỗi khi reset mã PIN');
                  } finally {
                    setIsResettingPin(false);
                  }
                }}
                style={{
                  padding: '0.45rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800,
                  background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', opacity: isResettingPin ? 0.7 : 1
                }}
              >
                🔄 {isResettingPin ? 'Đang reset...' : 'Reset PIN (Về 1234)'}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => { setEditForm({ ...student }); setIsEditing(true); }}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700,
                    background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                  }}
                >
                  ✏️ Sửa thông tin
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', border: '1.5px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Đóng</button>
            {isTeacher && (
              <button type="button" className="btn-primary" style={{ padding: '0.5rem 1.4rem', fontSize: '0.82rem' }} onClick={() => { onUpdateNote(student.id, note); onClose(); }}>Lưu ghi chú</button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

function AddStudentModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', gender: 'Nữ', dob: '', ethnicity: 'Kinh', address: '', phone: '',
    motherName: '', motherPhone: '', fatherName: '', fatherPhone: '',
    group: 'Tổ 1', dormRoom: 'A1-07', role: 'member', position: '',
    isPoor: false, note: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập họ tên!'); return; }
    onSave(form);
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.25rem', padding: '1.75rem',
        width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>➕ Thêm học sinh mới</h3>
          <button onClick={onClose} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Họ và tên *</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Nguyễn Văn A"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Giới tính</label>
            <select className="form-input" style={{ width: '100%' }} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option>Nữ</option>
              <option>Nam</option>
            </select>
          </div>
        </div>

        <div className="responsive-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Ngày sinh</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="DD/MM/YYYY"
              value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Dân tộc</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Chăm / Kinh..."
              value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>SĐT Học sinh</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="0901234567"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tổ học tập</label>
            <select className="form-input" style={{ width: '100%' }} value={form.group} onChange={e => set('group', e.target.value)}>
              {GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Phòng KTX</label>
            <select className="form-input" style={{ width: '100%' }} value={form.dormRoom} onChange={e => set('dormRoom', e.target.value)}>
              {DORM_ROOMS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>Tên Mẹ</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Tên Mẹ..."
              value={form.motherName} onChange={e => set('motherName', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#374151' }}>SĐT Mẹ</label>
            <input type="text" className="form-input" style={{ width: '100%' }} placeholder="0912..."
              value={form.motherPhone} onChange={e => set('motherPhone', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" id="isPoor" checked={form.isPoor} onChange={e => set('isPoor', e.target.checked)} />
          <label htmlFor="isPoor" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', cursor: 'pointer' }}>
            ⚠️ Học sinh thuộc diện cận nghèo / hoàn cảnh khó khăn
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.4rem', borderRadius: '9999px', border: '1.5px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Hủy</button>
          <button type="button" className="btn-primary" style={{ padding: '0.55rem 1.5rem', fontSize: '0.82rem' }} onClick={handleSave}>Lưu học sinh</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Students({ students = [], attendance = {}, onRefresh, handleExcelUpload, onUpdateStudents }) {
  const { isTeacher, getPinResetRequests, approvePinReset } = useAuth();
  
  const [resetRequests, setResetRequests] = useState(() => (getPinResetRequests ? getPinResetRequests() : []));

  const handleApprovePinReset = async (req) => {
    try {
      if (approvePinReset) await approvePinReset(req.studentId);
      setResetRequests(prev => prev.filter(r => r.studentId !== req.studentId));
      toast.success(`✅ Đã reset mã PIN của học sinh "${req.studentName}" về mặc định 1234!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Lỗi khi duyệt cấp lại PIN');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = (attendance?.[today]?.sessions?.morning || attendance?.[today]) || {};
  const safeStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);

  const filtered = useMemo(() => {
    let list = safeStudents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.studentCode && s.studentCode.includes(q)) ||
        (s.ethnicity && s.ethnicity.toLowerCase().includes(q))
      );
    }

    for (const f of activeFilters) {
      if (f.startsWith('Tổ')) list = list.filter(s => s.group === f);
      if (f === 'Cận nghèo') list = list.filter(s => s.isPoor);
      if (f === 'Vắng hôm nay') list = list.filter(s => todayAttendance[s.id] === 'absent');
    }

    return list;
  }, [safeStudents, searchQuery, activeFilters, todayAttendance]);

  const handleDelete = async (student) => {
    try {
      await api.deleteStudent(student.id);
      toast.success(`Đã xóa học sinh ${student.name}`);
      if (onRefresh) onRefresh();
    } catch {
      const updated = safeStudents.filter(s => s.id !== student.id);
      if (api.updateStudents) await api.updateStudents(updated);
      toast.success(`Đã xóa học sinh ${student.name}`);
      if (onRefresh) onRefresh();
    }
    setConfirmDelete(null);
  };

  const handleAddStudent = async (form) => {
    const newStudent = { ...form, id: form.id || Date.now() };
    toast.success('Thêm học sinh thành công!');
    setShowAddModal(false);
    if (onRefresh) onRefresh();
    try {
      await api.addStudent(newStudent);
    } catch (err) {
      console.warn('addStudent API failed:', err.message);
    }
  };

  const handleUpdateNote = async (id, note) => {
    const student = safeStudents.find(s => s.id === id);
    if (student) {
      toast.success('Đã cập nhật ghi chú!');
      if (onRefresh) onRefresh();
      try {
        await api.updateStudent(id, { ...student, note });
      } catch (err) {
        console.warn('updateNote API failed:', err.message);
      }
    }
  };

  const handleUpdateStudent = async (updatedData) => {
    try {
      await api.updateStudent(updatedData.id, updatedData);
      toast.success(`Đã cập nhật hồ sơ em ${updatedData.name}!`);
      if (onRefresh) onRefresh();
      setSelectedStudent(null);
    } catch (err) {
      console.warn('updateStudent API failed, falling back:', err.message);
      if (onUpdateStudents) {
        const updatedList = safeStudents.map(s => s.id === updatedData.id ? { ...s, ...updatedData } : s);
        onUpdateStudents(updatedList);
      }
      toast.success(`Đã lưu thay đổi cho em ${updatedData.name}!`);
      setSelectedStudent(null);
    }
  };

  const femaleCount = safeStudents.filter(s => s.gender === 'Nữ').length;
  const maleCount = safeStudents.filter(s => s.gender === 'Nam').length;
  const poorCount = safeStudents.filter(s => s.isPoor).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* PIN Reset Requests Banner (Teacher Only) */}
      {isTeacher && resetRequests.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📩 Yêu Cầu Khôi Phục Mã PIN Tới Cô GVCN ({resetRequests.length} học sinh)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {resetRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.5rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>
                  👨‍🎓 Học sinh: <strong>{req.studentName}</strong> (Gửi lúc {req.requestedAt})
                </span>
                <button
                  onClick={() => handleApprovePinReset(req)}
                  style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '0.55rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  ✅ Đồng ý Reset Về 1234
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Hồ sơ Danh sách Học sinh & KTX — Lớp 12.7</h3>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.3rem' }}>
              Sĩ số: <strong>{students.length}</strong> học sinh (<strong>{femaleCount}</strong> Nữ, <strong>{maleCount}</strong> Nam) | Cận nghèo: <strong>{poorCount}</strong> HS
            </p>
          </div>
          {isTeacher && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label className="btn-primary" style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                📥 Nạp file tonghop12_7.xlsx
                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
              </label>
              <button className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', background: 'var(--color-accent-green)' }} onClick={() => setShowAddModal(true)}>
                ➕ Thêm học sinh
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Search + Filter */}
        <SearchFilterBar
          onSearch={setSearchQuery}
          onFilter={setActiveFilters}
          activeFilters={activeFilters}
        />

        {/* Mobile: Card grid 2-column */}
        <div className="mobile-card-grid" style={{ display: 'none', gap: '0.65rem' }}>
          {filtered.map(student => {
            const isAbsent = todayAttendance[student.id] === 'absent';
            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                style={{
                  background: isAbsent ? '#fff5f5' : student.isPoor ? '#fffbeb' : 'white',
                  borderRadius: '0.75rem',
                  border: `1px solid ${isAbsent ? '#fca5a5' : student.isPoor ? '#fde68a' : '#e5e7eb'}`,
                  padding: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '0.3rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: student.gender === 'Nữ' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.75rem', fontWeight: 800,
                  }}>
                    {student.name.split(' ').pop()[0]}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {String(student.id).padStart(2, '0')}. {student.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                      {student.group} • {student.dormRoom}
                    </div>
                  </div>
                </div>
                {student.position && (
                  <span style={{ fontSize: '0.62rem', background: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, alignSelf: 'flex-start' }}>
                    {student.position.split(',')[0]}
                  </span>
                )}
                {isAbsent && <span style={{ fontSize: '0.62rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700, alignSelf: 'flex-start' }}>🔴 Vắng</span>}
              </div>
            );
          })}
        </div>

        {/* Desktop: Full Table */}
        <div className="hide-mobile" style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', width: '50px' }}>STT</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Họ và Tên</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Giới tính</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Tổ</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Phòng KTX</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Chức vụ</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>SĐT Liên hệ</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>
                  😔 Không tìm thấy học sinh nào phù hợp
                </td></tr>
              ) : filtered.map(student => {
                const isAbsent = todayAttendance[student.id] === 'absent';
                return (
                  <tr key={student.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: isAbsent ? '#fff5f5' : student.isPoor ? '#fffbeb' : 'transparent',
                    transition: 'background 0.15s'
                  }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#6b7280', fontSize: '0.85rem' }}>
                      {String(student.id).padStart(2, '0')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: student.gender === 'Nữ' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
                        }}>
                          {student.name.split(' ').pop()[0]}
                        </div>
                        <div>
                          <div 
                            style={{ cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                            onClick={() => setSelectedStudent(student)}
                          >
                            {student.name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                            {student.isPoor && isTeacher && <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>Cận nghèo</span>}
                            {isAbsent && <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>🔴 Vắng hôm nay</span>}
                            {student.prevGPA && <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>11: ĐTB {student.prevGPA}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{student.gender || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: '#f3f4f6', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>{student.group}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                      {student.dormRoom}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                      {student.position ? (
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {student.position.split(',')[0]}
                        </span>
                      ) : 'Thành viên'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: '#374151' }}>
                      {maskPhone(student.phone || student.motherPhone || student.fatherPhone, isTeacher)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          style={{
                            padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                            background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontWeight: 600
                          }}
                        >
                          👁️ Hồ sơ
                        </button>
                        {isTeacher && (
                          <button
                            onClick={() => setConfirmDelete(student)}
                            style={{
                              padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                              background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KTX Room Overview Grid */}
      <DormitoryGrid students={safeStudents} />

      {/* Modals */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdateNote={handleUpdateNote}
          onUpdateStudent={handleUpdateStudent}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Xóa học sinh"
        message={`Bạn có chắc muốn xóa học sinh "${confirmDelete?.name}"? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        confirmColor="#dc2626"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onSave={handleAddStudent} />}
    </div>
  );
}

function DormitoryGrid({ students = [] }) {
  const safeStudents = Array.isArray(students) ? students : [];
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h4 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>🏢 Sơ đồ phân phòng KTX — Lớp 12.7 (22 Nữ A1 / 9 Nam C08)</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {DORM_ROOMS.map(room => {
          const roomStudents = safeStudents.filter(s => s.dormRoom === room);
          const leader = roomStudents.find(s => s.position && s.position.includes('Trưởng phòng'));

          return (
            <div key={room} className="glass-panel" style={{ padding: '1rem', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => {
                const list = roomStudents.map(s => `• ${s.name} ${s.position ? `(${s.position})` : ''}`).join('\n');
                toast(list || 'Trống', { icon: '🏠', duration: 5000 });
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>{room}</strong>
                <span style={{ fontSize: '0.75rem', background: room.startsWith('A1') ? '#fce7f3' : '#dbeafe', color: room.startsWith('A1') ? '#be185d' : '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  {room.startsWith('A1') ? 'Nữ' : 'Nam'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#374151' }}>Sĩ số: <strong>{roomStudents.length}</strong> học sinh</div>
              {leader && (
                <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.3rem' }}>
                  👑 TP: <strong>{leader.name}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
