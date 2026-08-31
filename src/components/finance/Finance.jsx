import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Finance({ finance = [], onRefresh }) {
  const { isTeacher } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('income'); // 'income' | 'expense'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Đóng quỹ lớp');
  const [note, setNote] = useState('');

  const totalIncome = finance.filter(f => f.type === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalExpense = finance.filter(f => f.type === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Vui lòng nhập nội dung!'); return; }
    const num = parseInt(amount.replace(/\D/g, ''), 10);
    if (isNaN(num) || num <= 0) { toast.error('Vui lòng nhập số tiền hợp lệ!'); return; }

    await toast.promise(
      api.createFinance({
        type,
        title,
        amount: num,
        category,
        note,
        date: new Date().toISOString().split('T')[0],
      }),
      { loading: 'Đang ghi sổ...', success: 'Đã thêm giao dịch thành công!', error: 'Lỗi khi lưu' }
    );
    setShowModal(false);
    setTitle('');
    setAmount('');
    setNote('');
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản thu/chi này?')) {
      await api.deleteFinance(id);
      toast.success('Đã xóa giao dịch!');
      onRefresh();
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #16a34a' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>🟢 Tổng Khoản Thu</span>
          <h2 style={{ margin: '0.4rem 0 0 0', color: '#15803d', fontSize: '1.75rem' }}>{formatVND(totalIncome)}</h2>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Quỹ lớp & hỗ trợ</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #dc2626' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>🔴 Tổng Khoản Chi</span>
          <h2 style={{ margin: '0.4rem 0 0 0', color: '#b91c1c', fontSize: '1.75rem' }}>{formatVND(totalExpense)}</h2>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phô-tô, photo, phong trào...</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `5px solid ${balance >= 0 ? '#2563eb' : '#d97706'}` }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: balance >= 0 ? '#2563eb' : '#d97706', textTransform: 'uppercase' }}>💰 Quỹ Lớp Còn Lại</span>
          <h2 style={{ margin: '0.4rem 0 0 0', color: balance >= 0 ? '#1d4ed8' : '#b45309', fontSize: '1.75rem' }}>{formatVND(balance)}</h2>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Số dư hiện tại</span>
        </div>
      </div>

      {/* Main Table View */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>📊 Sổ Thu-Chi Quỹ Lớp 12.7</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>
              Minh bạch 100% tất cả các khoản thu chi trong năm học
            </p>
          </div>
          {isTeacher && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              ➕ Thêm Thu / Chi mới
            </button>
          )}
        </div>

        <div className="mobile-scroll-x" style={{ borderRadius: '0.75rem', border: '1px solid #f3f4f6', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '580px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Ngày</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Loại</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Nội dung Thu / Chi</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Danh mục</th>
                <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textAlign: 'right' }}>Số tiền</th>
                {isTeacher && <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textAlign: 'center' }}>Xóa</th>}
              </tr>
            </thead>
            <tbody>
              {finance.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>
                  💸 Chưa có giao dịch nào được ghi chép
                </td></tr>
              ) : finance.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6b7280' }}>{item.date}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                      background: item.type === 'income' ? '#dcfce7' : '#fee2e2',
                      color: item.type === 'income' ? '#166534' : '#991b1b',
                    }}>
                      {item.type === 'income' ? '🟢 Thu' : '🔴 Chi'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#111827' }}>
                    {item.title}
                    {item.note && <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>{item.note}</div>}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: '#4b5563' }}>{item.category || '—'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', color: item.type === 'income' ? '#16a34a' : '#dc2626' }}>
                    {item.type === 'income' ? '+' : '-'}{formatVND(item.amount)}
                  </td>
                  {isTeacher && (
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        title="Xóa giao dịch"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Finance Item */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>💰 Ghi Sổ Thu / Chi Quỹ Lớp</h3>

            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem',
                  background: type === 'income' ? '#16a34a' : 'transparent',
                  color: type === 'income' ? 'white' : '#4b5563',
                }}
              >
                🟢 Khoản THU
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem',
                  background: type === 'expense' ? '#dc2626' : 'transparent',
                  color: type === 'expense' ? 'white' : '#4b5563',
                }}
              >
                🔴 Khoản CHI
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Nội dung giao dịch *</label>
              <input
                type="text" className="form-input" style={{ width: '100%' }}
                placeholder={type === 'income' ? 'VD: Đóng quỹ đợt 1...' : 'VD: Mua nước hoa quả tổng kết...'}
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Số tiền (VNĐ) *</label>
              <input
                type="text" className="form-input" style={{ width: '100%' }}
                placeholder="VD: 50000 hoặc 50.000"
                value={amount} onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Phân loại danh mục</label>
              <select className="form-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
                <option>Đóng quỹ lớp</option>
                <option>In ấn tài liệu / Photo</option>
                <option>Phong trào trường / Đoàn</option>
                <option>Liên hoan / Sinh nhật</option>
                <option>Hỗ trợ học sinh khó khăn</option>
                <option>Khác</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>Ghi chú thêm</label>
              <input
                type="text" className="form-input" style={{ width: '100%' }}
                placeholder="Ai nộp, hóa đơn đính kèm..."
                value={note} onChange={e => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button className="btn-primary" onClick={handleCreate}>Lưu giao dịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
