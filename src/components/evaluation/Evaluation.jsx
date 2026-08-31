import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  THI_DUA_CRITERIA, CRITERIA_GROUPS, getCriteriaByGroup, calcWeekScore, calcRanking 
} from '../../data/thiDuaCriteria';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function Evaluation({ students = [], isTeacher, onRefresh }) {
  const { user, isGroupLeader, canApproveCompetition } = useAuth();
  
  const [selectedWeek, setSelectedWeek] = useState('tuan_01');
  const [selectedStudentId, setSelectedStudentId] = useState(
    user?.id ? String(user.id) : (students[0] ? String(students[0].id) : '1')
  );
  
  // Selected violations for current student in current week: { criteriaId: count }
  const [selectedViolations, setSelectedViolations] = useState({});
  const [competitionData, setCompetitionData] = useState({}); // studentId -> { violations, status }
  const [activeGroup, setActiveGroup] = useState(CRITERIA_GROUPS[0]);
  const [saving, setSaving] = useState(false);

  // Load competition data for week
  const fetchWeekData = async () => {
    try {
      const data = await api.getCompetition(selectedWeek);
      setCompetitionData(data || {});
    } catch {
      setCompetitionData({});
    }
  };

  useEffect(() => {
    fetchWeekData();
  }, [selectedWeek]);

  // Sync current student's selected violations from server data
  useEffect(() => {
    const studentRecord = competitionData[selectedStudentId];
    if (studentRecord && studentRecord.violations) {
      setSelectedViolations(studentRecord.violations);
    } else {
      setSelectedViolations({});
    }
  }, [selectedStudentId, competitionData]);

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10));

  const handleToggleCriterion = (criteriaId, delta = 1) => {
    setSelectedViolations(prev => {
      const current = prev[criteriaId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[criteriaId];
      else updated[criteriaId] = next;
      return updated;
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const violationsList = Object.entries(selectedViolations).map(([id, count]) => ({
        criteriaId: parseInt(id, 10),
        count
      }));
      await api.saveCompetitionDraft(selectedWeek, parseInt(selectedStudentId, 10), violationsList);
      toast.success('Đã lưu phiếu tự đánh giá!');
      fetchWeekData();
    } catch {
      toast.error('Lỗi khi lưu phiếu thi đua!');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveGroup = async () => {
    if (!canApproveCompetition) return;
    const targetGroup = isGroupLeader ? user.groupLeaderOf || user.group : null;
    const groupStudents = targetGroup ? students.filter(s => s.group === targetGroup) : students;

    const changes = groupStudents.map(s => {
      const record = competitionData[s.id] || {};
      return {
        studentId: s.id,
        violations: record.violations || [],
        status: 'approved'
      };
    });

    await toast.promise(
      api.approveCompetition(selectedWeek, changes),
      { loading: 'Đang phê duyệt...', success: `Đã duyệt thi đua cho ${groupStudents.length} học sinh!`, error: 'Lỗi duyệt' }
    );
    fetchWeekData();
  };

  // Convert selectedViolations object to violations array for score calc
  const currentViolationsArray = Object.entries(selectedViolations).map(([id, count]) => ({
    criteriaId: parseInt(id, 10),
    count
  }));

  const weekScore = calcWeekScore(currentViolationsArray);
  const ranking = calcRanking(weekScore);

  // Group performance stats for BarChart
  const groupStats = useMemo(() => {
    return ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map(gName => {
      const gs = students.filter(s => s.group === gName);
      let total = 0;
      gs.forEach(s => {
        const record = competitionData[s.id];
        const vList = record && record.violations ? record.violations : [];
        total += calcWeekScore(vList);
      });
      const avg = gs.length > 0 ? parseFloat((total / gs.length).toFixed(1)) : 100;
      return { name: gName, 'Điểm TB': avg, 'Sĩ số': gs.length };
    });
  }, [students, competitionData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Control Row */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>📈 Engine Chấm Điểm Thi Đua (47 Tiêu Chí)</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
              Quy chế lớp 12.7 — Điểm chuẩn 100 điểm/tuần. Hạn cuối tự đánh giá: <strong>Thứ 6 23:59</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Chọn Tuần:</label>
            <select
              className="form-input"
              style={{ width: '130px', fontWeight: 700 }}
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
            >
              {Array.from({ length: 18 }, (_, i) => {
                const wId = `tuan_${String(i + 1).padStart(2, '0')}`;
                return <option key={wId} value={wId}>Tuần {i + 1}</option>;
              })}
            </select>

            {canApproveCompetition && (
              <button 
                className="btn-primary" 
                style={{ background: '#059669', fontSize: '0.85rem' }}
                onClick={handleApproveGroup}
              >
                ✅ Duyệt Thi Đua {isGroupLeader ? user.groupLeaderOf || user.group : 'Toàn Lớp'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        
        {/* Left Column: 47 Criteria Checkbox Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', color: '#374151' }}>Chọn Học Sinh Chấm Điểm:</label>
              <select
                className="form-input"
                style={{ width: '260px', marginTop: '0.2rem', fontWeight: 600 }}
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {String(s.id).padStart(2, '0')} - {s.name} ({s.group})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Score Badge */}
            <div style={{ textAlign: 'right', background: ranking.color + '15', border: `1.5px solid ${ranking.color}`, borderRadius: '0.75rem', padding: '0.5rem 1rem' }}>
              <div style={{ fontSize: '0.72rem', color: ranking.color, fontWeight: 800, textTransform: 'uppercase' }}>Điểm Tuần Tính Toán</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: ranking.color }}>
                {weekScore} điểm {ranking.emoji} <span style={{ fontSize: '0.85rem' }}>({ranking.label})</span>
              </div>
            </div>
          </div>

          {/* Group Category Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', background: '#f3f4f6', padding: '0.3rem', borderRadius: '0.75rem' }}>
            {CRITERIA_GROUPS.map(grp => (
              <button
                key={grp}
                onClick={() => setActiveGroup(grp)}
                style={{
                  padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  background: activeGroup === grp ? 'white' : 'transparent',
                  color: activeGroup === grp ? 'var(--color-primary-dark)' : '#6b7280',
                  boxShadow: activeGroup === grp ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* Criteria List for Active Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
            {getCriteriaByGroup(activeGroup).map(item => {
              const count = selectedViolations[item.id] || 0;
              return (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 0.85rem', borderRadius: '0.625rem',
                  background: count > 0 ? (item.isBonus ? '#f0fdf4' : '#fff5f5') : 'white',
                  border: `1px solid ${count > 0 ? (item.isBonus ? '#86efac' : '#fca5a5') : '#f3f4f6'}`,
                }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
                      #{item.id}. {item.label}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: item.isBonus ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                      {item.points > 0 ? `+${item.points}` : item.points} điểm / {item.unit}
                    </span>
                    {item.severe && <span style={{ fontSize: '0.68rem', background: '#dc2626', color: 'white', padding: '0.05rem 0.35rem', borderRadius: '3px', marginLeft: '0.4rem', fontWeight: 700 }}>Nghiêm trọng</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleCriterion(item.id, -1)}
                      disabled={count === 0}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #d1d5db',
                        background: 'white', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.4 : 1,
                        fontWeight: 800, fontSize: '0.9rem'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '20px', textAlign: 'center' }}>
                      {count}
                    </span>
                    <button
                      onClick={() => handleToggleCriterion(item.id, 1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                        background: item.isBonus ? '#16a34a' : 'var(--color-primary-dark)', color: 'white', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.9rem'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f3f4f6' }}>
            <button className="btn-primary" onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Đang lưu...' : '💾 Lưu phiếu đánh giá'}
            </button>
          </div>

        </div>

        {/* Right Column: Analytics & Group Averages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* BarChart chart */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>🏆 Điểm TB Thi Đua Các Tổ (Tuần Hiện Tại)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                <Bar dataKey="Điểm TB" radius={[6, 6, 0, 0]}>
                  {groupStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rules Summary Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>📜 Thang Xếp Loại Thi Đua</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                <span>⭐ Xuất sắc</span>
                <span>≥ 90 điểm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', fontWeight: 700 }}>
                <span>👍 Khá</span>
                <span>80 – 89 điểm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 700 }}>
                <span>✅ Đạt</span>
                <span>70 – 79 điểm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700 }}>
                <span>❌ Không đạt</span>
                <span>&lt; 70 điểm</span>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', margin: 0, fontStyle: 'italic' }}>
              💡 Điểm tháng / học kỳ = Trung bình cộng điểm các tuần. Vi phạm nghiêm trọng sẽ bị xem xét kỷ luật cấp trường.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
