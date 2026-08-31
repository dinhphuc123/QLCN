import React, { useState } from 'react';
import { INITIAL_STUDENTS } from '../../data/initialStudents';

export default function ParentPortal() {
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const student = INITIAL_STUDENTS.find(s => s.id === parseInt(selectedStudentId, 10)) || INITIAL_STUDENTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
              👨‍👩‍👧 SỔ LIÊN LẠC ĐIỆN TỬ DÀNH CHO PHỤ HUYNH
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'white' }}>
              Trang Tra Cứu Kết Quả Học Tập & Nề Nếp Con Em — Lớp 12.7
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#dbeafe', marginTop: '0.3rem', margin: 0 }}>
              GVCN: Cô Đỗ Kim Tuyền | Hotline liên hệ: <strong>0987.654.321</strong>
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem', color: '#e0f2fe' }}>
              Chọn con em phụ huynh:
            </label>
            <select
              className="form-input"
              style={{ width: '220px', fontWeight: 800, color: '#0f172a', background: 'white' }}
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
            >
              {INITIAL_STUDENTS.map(s => (
                <option key={s.id} value={s.id}>
                  {String(s.id).padStart(2, '0')} - {s.name} ({s.group})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Student Profile */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e3a8a' }}>👤 Thông Tin Học Sinh</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Họ và tên:</strong> {student.name}</div>
            <div><strong>Giới tính / Dân tộc:</strong> {student.gender} | {student.ethnicity}</div>
            <div><strong>Tổ học tập:</strong> {student.group} ({student.position || 'Thành viên'})</div>
            <div><strong>Phòng KTX:</strong> {student.dormRoom}</div>
            <div><strong>SĐT Học sinh:</strong> {student.phone || 'Chưa cập nhật'}</div>
            <div><strong>Địa chỉ:</strong> {student.address}</div>
          </div>
        </div>

        {/* Card 2: Contact Info Parents */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#166534' }}>📞 Thông Tin Phụ Huynh Đã Đăng Ký</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div><strong>Họ tên Mẹ:</strong> {student.motherName || 'Đang cập nhật'}</div>
            <div><strong>SĐT Mẹ:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{student.motherPhone || '0912.xxx.xxx'}</span></div>
            <div><strong>Họ tên Cha:</strong> {student.fatherName || 'Đang cập nhật'}</div>
            <div><strong>SĐT Cha:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{student.fatherPhone || '0913.xxx.xxx'}</span></div>
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#15803d' }}>
              💡 GVCN sẽ gửi tin nhắn trực tiếp qua Zalo theo SĐT đã đăng ký trên.
            </div>
          </div>
        </div>

        {/* Card 3: Conduct & Competition Score */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>🏆 Điểm Thi Đua & Nề Nếp Tuần</h4>
          <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#d97706' }}>
              {student.points || 98} / 100
            </div>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.78rem' }}>
              Xếp loại: Xuất sắc
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.75rem' }}>
            - Điểm danh 5 buổi: <strong>Đủ 100%</strong><br />
            - Điểm danh KTX 21:30 tắt đèn: <strong>Đúng giờ</strong><br />
            - Lịch sử vi phạm tuần: <strong>Không có</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
