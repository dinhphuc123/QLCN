import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { api } from '../../lib/api';
import { calcWeekScore, calcRanking } from '../../data/thiDuaCriteria';

export default function EvaluationHistoryModal({ studentId, studentName, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getHistory(studentId);
        const processed = (res || []).map(item => {
          const score = calcWeekScore(item.violations || []);
          const ranking = calcRanking(score);
          return {
            ...item,
            score,
            label: ranking.label,
            color: ranking.color,
          };
        });
        setHistory(processed);
      } catch (err) {
        console.error('Err history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [studentId]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel modal-inner" style={{ background: 'white', borderRadius: '1.25rem', padding: '1.75rem', width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>📈 Lịch Sử Tiến Triển Thi Đua</h3>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>Học sinh: <strong>{studentName}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải lịch sử...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Chưa có dữ liệu thi đua tuần nào được ghi nhận.</div>
        ) : (
          <>
            {/* Chart */}
            <div style={{ background: '#fafafa', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #f3f4f6' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                  <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} name="Điểm tuần" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History Table */}
            <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #f3f4f6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Tuần</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Điểm</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Xếp loại</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.week} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>{item.weekLabel}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: item.color }}>{item.score}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: item.color, background: item.color + '15' }}>
                          {item.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                        {item.status === 'approved' && <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ Đã duyệt</span>}
                        {item.status === 'reviewed' && <span style={{ color: '#0284c7', fontWeight: 700 }}>⏳ Chờ GVCN</span>}
                        {item.status === 'submitted' && <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ Chờ Tổ trưởng</span>}
                        {item.status === 'rejected' && <span style={{ color: '#dc2626', fontWeight: 700 }}>❌ Cần sửa</span>}
                        {item.status === 'draft' && <span style={{ color: '#6b7280' }}>📝 Tự kê khai</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
