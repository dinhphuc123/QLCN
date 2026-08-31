import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { THI_DUA_CRITERIA, CRITERIA_GROUPS, getCriteriaByGroup, calcWeekScore, calcRanking } from '../../data/thiDuaCriteria';
import EvaluationHistoryModal from './EvaluationHistoryModal';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function Evaluation({ students = [], isTeacher, onRefresh }) {
  const { user, isGroupLeader, canApproveCompetition } = useAuth();
  
  const [selectedWeek, setSelectedWeek] = useState('tuan_01');
  const [selectedStudentId, setSelectedStudentId] = useState(
    user?.id ? String(user.id) : (students[0] ? String(students[0].id) : '1')
  );
  
  const [selectedViolations, setSelectedViolations] = useState({});
  const [competitionData, setCompetitionData] = useState({}); // studentId -> record
  const [activeGroup, setActiveGroup] = useState(CRITERIA_GROUPS[0]);
  const [saving, setSaving] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null); // { id, name } for modal
  const [reviewNotes, setReviewNotes] = useState({}); // studentId -> note
  const [teacherNotes, setTeacherNotes] = useState({}); // studentId -> note

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
      const violObj = {};
      (studentRecord.violations || []).forEach(v => {
        violObj[v.criteriaId] = v.count;
      });
      setSelectedViolations(violObj);
    } else {
      setSelectedViolations({});
    }
  }, [selectedStudentId, competitionData]);

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10));
  const currentRecord = competitionData[selectedStudentId] || {};

  const handleToggleCriterion = (criteriaId, delta = 1) => {
    if (currentRecord.status === 'approved' && !isTeacher) {
      toast.error('Phiếu đã được GVCN duyệt chính thức, không thể sửa!');
      return;
    }
    if (currentRecord.status === 'reviewed' && !isTeacher && !isGroupLeader) {
      toast.error('Phiếu đang chờ GVCN duyệt!');
      return;
    }

    setSelectedViolations(prev => {
      const current = prev[criteriaId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[criteriaId];
      else updated[criteriaId] = next;
      return updated;
    });
  };

  // Nộp phiếu tự đánh giá (Học sinh)
  const handleStudentSubmit = async () => {
    setSaving(true);
    try {
      const violationsList = Object.entries(selectedViolations).map(([id, count]) => ({
        criteriaId: parseInt(id, 10),
        count
      }));
      await api.selfReport(selectedWeek, parseInt(selectedStudentId, 10), violationsList);
      toast.success('Đã nộp phiếu tự đánh giá thành công!');
      fetchWeekData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi nộp phiếu thi đua!');
    } finally {
      setSaving(false);
    }
  };

  // Duyệt vòng giữa (Tổ trưởng / Lớp trưởng)
  const handleGroupLeaderReview = async () => {
    setSaving(true);
    try {
      const targetGroup = isGroupLeader ? (user.groupLeaderOf || user.group) : null;
      const groupStudents = targetGroup ? students.filter(s => s.group === targetGroup) : students;

      const changes = groupStudents.map(s => {
        const record = competitionData[s.id] || {};
        const isCurrent = String(s.id) === selectedStudentId;
        const violations = isCurrent 
          ? Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }))
          : (record.violations || []);

        return {
          studentId: s.id,
          violations,
          note: reviewNotes[s.id] || record.reviewNote || ''
        };
      });

      await api.reviewCompetition(selectedWeek, changes);
      toast.success(`Đã duyệt thi đua vòng 1 cho ${groupStudents.length} học sinh!`);
      fetchWeekData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi duyệt thi đua!');
    } finally {
      setSaving(false);
    }
  };

  // Duyệt cuối (GVCN Chốt / Trả về)
  const handleTeacherAction = async (action = 'approve') => {
    setSaving(true);
    try {
      const changes = students.map(s => {
        const record = competitionData[s.id] || {};
        const isCurrent = String(s.id) === selectedStudentId;
        const violations = isCurrent 
          ? Object.entries(selectedViolations).map(([id, count]) => ({ criteriaId: parseInt(id, 10), count }))
          : (record.violations || []);

        return {
          studentId: s.id,
          violations,
          teacherNote: teacherNotes[s.id] || record.teacherNote || '',
          action: isCurrent ? action : 'approve'
        };
      });

      await api.finalApprove(selectedWeek, changes);
      toast.success(action === 'approve' ? 'GVCN đã phê duyệt chốt điểm!' : 'Đã yêu cầu học sinh làm lại phiếu!');
      fetchWeekData();
    } catch (err) {
      toast.error(err.message || 'Lỗi phê duyệt!');
    } finally {
      setSaving(false);
    }
  };

  // Convert selectedViolations object to violations array for score calc
  const currentViolationsArray = Object.entries(selectedViolations).map(([id, count]) => ({
    criteriaId: parseInt(id, 10),
    count
  }));

  const weekScore = calcWeekScore(currentViolationsArray);
  const ranking = calcRanking(weekScore);

  // Stats for BarChart
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

  // Trạng thái hiển thị badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>✅ GVCN Đã Duyệt</span>;
      case 'reviewed': return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⏳ Tổ Trưởng Đã Duyệt (Chờ GVCN)</span>;
      case 'submitted': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⏳ Đã Nộp (Chờ Tổ Trưởng)</span>;
      case 'rejected': return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>❌ GVCN Yêu Cầu Sửa Lại</span>;
      default: return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>📝 Đang Tự Kê Khai</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Control Row */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>📈 Quy Trình Đánh Giá Thi Đua 3 Vòng</h3>
              {getStatusBadge(currentRecord.status)}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
              HS nộp trước <strong>Thứ 6 23:59</strong> ➔ Tổ trưởng duyệt <strong>Thứ 7 12:00</strong> ➔ GVCN chốt <strong>Chủ Nhật 20:00</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tuần:</label>
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
          </div>
        </div>
      </div>

      {/* Main 2-Col layout */}
      <div className="eval-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        
        {/* Left Column: 47 Criteria Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', color: '#374151' }}>Chọn Học Sinh:</label>
              <select
                className="form-input"
                style={{ width: '100%', maxWidth: '300px', marginTop: '0.2rem', fontWeight: 600 }}
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => {
                  const rec = competitionData[s.id] || {};
                  const stBadge = rec.status === 'approved' ? '✅' : rec.status === 'reviewed' ? '⏳' : rec.status === 'submitted' ? '📩' : '📝';
                  return (
                    <option key={s.id} value={s.id}>
                      {stBadge} {String(s.id).padStart(2, '0')} - {s.name} ({s.group})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Live Score & History Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setHistoryStudent({ id: selectedStudentId, name: currentStudent?.name || '' })}
                style={{ background: '#f0f9ff', border: '1px solid #7dd3fc', color: '#0369a1', padding: '0.5rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                📊 Lịch sử điểm
              </button>

              <div style={{ textAlign: 'right', background: ranking.color + '15', border: `1.5px solid ${ranking.color}`, borderRadius: '0.75rem', padding: '0.5rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: ranking.color, fontWeight: 800, textTransform: 'uppercase' }}>Điểm Tính Toán</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: ranking.color }}>
                  {weekScore} điểm {ranking.emoji}
                </div>
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

          {/* Criteria List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.3rem' }}>
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
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="criteria-btn"
                      onClick={() => handleToggleCriterion(item.id, -1)}
                      disabled={count === 0}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #d1d5db',
                        background: 'white', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.4 : 1,
                        fontWeight: 800, fontSize: '1rem'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center' }}>
                      {count}
                    </span>
                    <button
                      className="criteria-btn"
                      onClick={() => handleToggleCriterion(item.id, 1)}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                        background: item.isBonus ? '#16a34a' : 'var(--color-primary-dark)', color: 'white', cursor: 'pointer',
                        fontWeight: 800, fontSize: '1rem'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row — Depending on Role & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              {currentRecord.reviewedBy && <div>👤 Tổ trưởng đã duyệt: <strong>{currentRecord.reviewedBy}</strong></div>}
              {currentRecord.approvedBy && <div>👑 GVCN đã chốt: <strong>{currentRecord.approvedBy}</strong></div>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* HS Nộp */}
              {(!user || user.role === 'student' || String(user.id) === selectedStudentId) && currentRecord.status !== 'approved' && (
                <button className="btn-primary" onClick={handleStudentSubmit} disabled={saving}>
                  {saving ? 'Đang nộp...' : '📩 Nộp Phiếu Tự Đánh Giá'}
                </button>
              )}

              {/* Tổ trưởng / Lớp trưởng Duyệt */}
              {canApproveCompetition && (
                <button className="btn-primary" style={{ background: '#0284c7' }} onClick={handleGroupLeaderReview} disabled={saving}>
                  {saving ? 'Đang duyệt...' : `⭐ Duyệt Vòng 1 (${isGroupLeader ? user.groupLeaderOf || user.group : 'Toàn lớp'})`}
                </button>
              )}

              {/* GVCN Chốt */}
              {isTeacher && (
                <>
                  <button className="btn-primary" style={{ background: '#dc2626' }} onClick={() => handleTeacherAction('reject')} disabled={saving}>
                    ❌ Yêu cầu sửa
                  </button>
                  <button className="btn-primary" style={{ background: '#059669' }} onClick={() => handleTeacherAction('approve')} disabled={saving}>
                    ✅ GVCN Chốt Điểm
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Analytics & Ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* BarChart */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>🏆 Điểm TB Thi Đua 4 Tổ ({selectedWeek.replace('tuan_', 'Tuần ')})</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={groupStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 110]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                <Bar dataKey="Điểm TB" radius={[6, 6, 0, 0]}>
                  {groupStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick List Status */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem' }}>📋 Tiến Độ Nộp Phiếu Tuần Này</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              {students.map(s => {
                const r = competitionData[s.id] || {};
                const st = r.status || 'draft';
                return (
                  <div key={s.id} onClick={() => setSelectedStudentId(String(s.id))} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.6rem', borderRadius: '0.4rem', background: selectedStudentId === String(s.id) ? '#e0f2fe' : '#f9fafb', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 600 }}>{String(s.id).padStart(2, '0')}. {s.name}</span>
                    <span>
                      {st === 'approved' && '✅'}
                      {st === 'reviewed' && '⏳ (Chờ GVCN)'}
                      {st === 'submitted' && '📩 (Chờ Tổ)'}
                      {st === 'rejected' && '❌ (Làm lại)'}
                      {st === 'draft' && '📝 (Chưa nộp)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* History Modal */}
      {historyStudent && (
        <EvaluationHistoryModal
          studentId={historyStudent.id}
          studentName={historyStudent.name}
          onClose={() => setHistoryStudent(null)}
        />
      )}

    </div>
  );
}
