import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { THI_DUA_CRITERIA, CRITERIA_GROUPS, getCriteriaByGroup, calcWeekScore, calcRanking } from '../../data/thiDuaCriteria';
import EvaluationHistoryModal from './EvaluationHistoryModal';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function Evaluation({ students = [], onRefresh }) {
  const { user, isTeacher, isGroupLeader, isMonitor, canApproveCompetition } = useAuth();
  
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
    if (isTeacher) {
      toast('Chế độ GVCN chỉ xem & xét duyệt. Vui lòng nhập ghi chú yêu cầu thay đổi bên dưới nếu cần!', { icon: '👁️' });
      return;
    }
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
    const sid = parseInt(selectedStudentId, 10);
    const violationsList = Object.entries(selectedViolations).map(([id, count]) => ({
      criteriaId: parseInt(id, 10),
      count
    }));

    // Local optimistic update
    setCompetitionData(prev => ({
      ...prev,
      [selectedStudentId]: {
        ...(prev[selectedStudentId] || {}),
        studentId: sid,
        violations: violationsList,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      }
    }));

    toast.success('Đã nộp phiếu tự đánh giá thành công!');
    setSaving(false);

    try {
      await api.selfReport(selectedWeek, sid, violationsList);
      fetchWeekData();
    } catch (err) {
      console.warn('selfReport API background sync error (preserved locally):', err.message);
    }
  };

  // Vòng 1: Tổ trưởng Duyệt cho thành viên thuộc Tổ
  const handleGroupLeaderReview = async () => {
    setSaving(true);
    const grp = user?.groupLeaderOf || user?.group || 'Tổ 1';
    const groupStudents = students.filter(s => s.group === grp);

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

    // Optimistic local state update
    setCompetitionData(prev => {
      const updated = { ...prev };
      changes.forEach(ch => {
        const sid = ch.studentId;
        updated[sid] = {
          ...(updated[sid] || {}),
          studentId: sid,
          violations: ch.violations,
          reviewNote: ch.note,
          reviewedBy: user?.name || 'Tổ trưởng',
          reviewedAt: new Date().toISOString(),
          status: 'reviewed',
        };
      });
      return updated;
    });

    toast.success(`Đã duyệt thi đua Vòng 1 cho ${groupStudents.length} học sinh ${grp}!`);
    setSaving(false);

    try {
      await api.reviewCompetition(selectedWeek, changes);
      fetchWeekData();
    } catch (err) {
      console.warn('reviewCompetition API sync failover (saved locally):', err.message);
    }
  };

  // Vòng 2: Lớp trưởng Duyệt cho Toàn lớp sau khi các Tổ trưởng duyệt
  const handleMonitorReview = async () => {
    setSaving(true);
    const changes = students.map(s => {
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

    // Optimistic local state update
    setCompetitionData(prev => {
      const updated = { ...prev };
      changes.forEach(ch => {
        const sid = ch.studentId;
        updated[sid] = {
          ...(updated[sid] || {}),
          studentId: sid,
          violations: ch.violations,
          monitorApprovedBy: user?.name || 'Lớp trưởng',
          monitorApprovedAt: new Date().toISOString(),
          status: 'monitor_approved',
        };
      });
      return updated;
    });

    toast.success(`👑 Lớp trưởng đã duyệt thi đua Vòng 2 cho toàn bộ ${students.length} học sinh!`);
    setSaving(false);

    try {
      await api.reviewCompetition(selectedWeek, changes);
      fetchWeekData();
    } catch (err) {
      console.warn('monitorReview API sync failover (saved locally):', err.message);
    }
  };

  // Vòng 3: GVCN Chốt / Yêu cầu sửa
  const handleTeacherAction = async (action = 'approve') => {
    setSaving(true);
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

    // Optimistic local state update
    setCompetitionData(prev => {
      const updated = { ...prev };
      changes.forEach(ch => {
        const sid = ch.studentId;
        const act = ch.action || 'approve';
        updated[sid] = {
          ...(updated[sid] || {}),
          studentId: sid,
          violations: ch.violations,
          teacherNote: ch.teacherNote,
          approvedBy: user?.name || 'GVCN',
          approvedAt: new Date().toISOString(),
          status: act === 'reject' ? 'rejected' : 'approved',
        };
      });
      return updated;
    });

    toast.success(action === 'approve' ? '🚀 GVCN đã phê duyệt chốt điểm thi đua tuần!' : 'Đã yêu cầu làm lại phiếu!');
    setSaving(false);

    try {
      await api.finalApprove(selectedWeek, changes);
      fetchWeekData();
    } catch (err) {
      console.warn('finalApprove API sync failover (saved locally):', err.message);
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

  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly_audit'

  // Star Student & Best Group calculation
  const bestGroup = useMemo(() => {
    if (!groupStats.length) return null;
    return [...groupStats].sort((a, b) => b['Điểm TB'] - a['Điểm TB'])[0];
  }, [groupStats]);

  const starStudents = useMemo(() => {
    return students.filter(s => {
      const rec = competitionData[s.id];
      const vList = rec && rec.violations ? rec.violations : [];
      return calcWeekScore(vList) === 100;
    });
  }, [students, competitionData]);

  // PDF Export for Competition Report
  const handleExportCompetitionPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Trình duyệt chặn pop-up'); return; }

    const weekNum = selectedWeek.replace('tuan_', '');
    const rows = students.map((s, idx) => {
      const rec = competitionData[s.id] || {};
      const vList = rec.violations || [];
      const score = calcWeekScore(vList);
      const rk = calcRanking(score);
      const vText = vList.map(v => {
        const c = THI_DUA_CRITERIA.find(item => item.id === v.criteriaId);
        return c ? `${c.label} (x${v.count})` : '';
      }).filter(Boolean).join(', ');

      return `<tr>
        <td style="text-align:center; padding: 6px;">${idx + 1}</td>
        <td style="padding: 6px; font-weight: bold;">${s.name}</td>
        <td style="text-align:center; padding: 6px;">${s.group || 'Tổ 1'}</td>
        <td style="text-align:center; padding: 6px; font-weight: bold; color: ${score >= 90 ? '#16a34a' : score >= 80 ? '#2563eb' : '#dc2626'}">${score}</td>
        <td style="text-align:center; padding: 6px;">${rk.rank}</td>
        <td style="padding: 6px; font-size: 11px;">${vText || 'Không vi phạm'}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo Cáo Thi Đua Lớp 12.7 - Tuần ${weekNum}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.4; color: #000; }
          h2, h3 { text-align: center; margin: 5px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #000; }
          th { background-color: #f2f2f2; padding: 8px; text-align: center; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; text-align: center; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between;">
          <div>TRƯỜNG THPT QUỐC GIA<br/><strong>LỚP 12.7</strong></div>
          <div style="text-align: right;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>Độc lập - Tự do - Hạnh phúc</div>
        </div>
        <hr style="margin: 15px 0; border: 0.5px solid #000;" />
        <h2>BẢNG TỔNG HỢP XẾP LOẠI THI ĐƯA NỀ NẾP TUẦN ${weekNum}</h2>
        <p style="text-align: center; font-style: italic; margin-top: 0;">(Phục vụ Chào cờ Thứ 2 và Đánh giá Hạnh kiểm hàng tuần)</p>
        
        <div style="margin: 10px 0; font-size: 13px;">
          • <strong>Tổ xuất sắc nhất tuần:</strong> ${bestGroup ? `${bestGroup.name} (ĐTB: ${bestGroup['Điểm TB']}đ)` : 'Tổ 1'}<br/>
          • <strong>Số học sinh đạt điểm tuyệt đối 100đ (⭐ Ngôi Sao Tuần):</strong> ${starStudents.length} / ${students.length} học sinh
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th>Họ và Tên</th>
              <th style="width: 60px;">Tổ</th>
              <th style="width: 70px;">Điểm</th>
              <th style="width: 80px;">Xếp loại</th>
              <th>Chi tiết vi phạm trong tuần</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div><strong>ĐẠI DIỆN BAN THI ĐƯA LỚP</strong><br/><br/><br/><br/>(Ký & ghi rõ họ tên)</div>
          <div><strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/><br/><br/><br/>Đỗ Kim Tuyền</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Trạng thái hiển thị badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>✅ GVCN Đã Duyệt Chốt Điểm</span>;
      case 'monitor_approved': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>👑 Lớp Trưởng Đã Duyệt Vòng 2 (Chờ GVCN)</span>;
      case 'reviewed': return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⏳ Tổ Trưởng Đã Duyệt Vòng 1 (Chờ Lớp Trưởng)</span>;
      case 'submitted': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>📩 Đã Nộp (Chờ Tổ Trưởng)</span>;
      case 'rejected': return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>❌ Yêu Cầu Sửa Lại</span>;
      default: return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>📝 Đang Tự Kê Khai</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Control Row (Minimal & Refined Design) */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                📈 Đánh Giá Thi Đua Nề Nếp & Vinh Danh
              </h3>
              {getStatusBadge(currentRecord.status)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.12rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                ⏱️ Hạn chốt:
              </span>
              <span>HS nộp T6 23:59 • Tổ trưởng duyệt T7 12:00 • GVCN chốt CN 20:00</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8fafc', padding: '0.2rem', borderRadius: '9999px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.2rem' }}>
              <button
                onClick={() => setViewMode('weekly')}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: viewMode === 'weekly' ? '#1B4D53' : 'transparent',
                  color: viewMode === 'weekly' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                📊 Đánh Giá Tuần
              </button>
              <button
                onClick={() => setViewMode('monthly_audit')}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: viewMode === 'monthly_audit' ? '#1B4D53' : 'transparent',
                  color: viewMode === 'monthly_audit' ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                🗓️ Đối Soát Tháng
              </button>
            </div>

            <select
              className="form-input"
              style={{ width: '110px', fontWeight: 800, padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
            >
              {Array.from({ length: 18 }, (_, i) => {
                const wId = `tuan_${String(i + 1).padStart(2, '0')}`;
                return <option key={wId} value={wId}>Tuần {i + 1}</option>;
              })}
            </select>

            {isTeacher && (
              <button
                onClick={handleExportCompetitionPDF}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800,
                  background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  boxShadow: '0 2px 6px rgba(22,163,74,0.15)'
                }}
              >
                📄 Xuất Báo Cáo PDF
              </button>
            )}
          </div>
        </div>

        {/* Weekly Badges Row: Best Group & Star Students */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ background: '#fefce8', padding: '0.85rem 1.15rem', borderRadius: '0.85rem', border: '1.5px solid #fef08a', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏆</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a16207', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TỔ XUẤT SẮC NHẤT TUẦN</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#854d0e', marginTop: '0.1rem' }}>
                {bestGroup ? `${bestGroup.name} (${bestGroup['Điểm TB']} điểm)` : 'Tổ 1'}
              </div>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '0.85rem 1.15rem', borderRadius: '0.85rem', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⭐</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NGÔI SAO TUẦN (100 ĐIỂM TUYỆT ĐỐI)</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#166534', marginTop: '0.1rem' }}>
                {starStudents.length} / {students.length} Học Sinh
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 100% width for students, 2-col for officers */}
      <div className="eval-main-grid" style={{ display: 'grid', gridTemplateColumns: (isTeacher || isMonitor || isGroupLeader || canApproveCompetition) ? 'minmax(0, 1.8fr) minmax(0, 1.2fr)' : '1fr', gap: '1.5rem' }}>
        
        {/* Left Column: 47 Criteria Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {(isTeacher || isMonitor || isGroupLeader || canApproveCompetition) ? (
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
            ) : (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280' }}>Phiếu Tự Đánh Giá Cá Nhân:</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B4D53', marginTop: '0.15rem' }}>
                  👨‍🎓 {currentStudent?.name || user?.name} ({currentStudent?.group || user?.group || 'Tổ 1'})
                </div>
              </div>
            )}

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

          {/* Group Category Tabs (Mobile Touch Scroll Pills) */}
          <div className="mobile-scroll-x" style={{
            display: 'flex', gap: '0.45rem', overflowX: 'auto', background: '#f3f4f6',
            padding: '0.35rem', borderRadius: '0.85rem', scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}>
            {CRITERIA_GROUPS.map(grp => (
              <button
                key={grp}
                onClick={() => setActiveGroup(grp)}
                style={{
                  padding: '0.55rem 0.9rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  flexShrink: 0,
                  background: activeGroup === grp ? 'white' : 'transparent',
                  color: activeGroup === grp ? 'var(--color-primary-dark)' : '#4b5563',
                  boxShadow: activeGroup === grp ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* Criteria List (Touch-optimized 44px targets) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
            {getCriteriaByGroup(activeGroup).map(item => {
              const count = selectedViolations[item.id] || 0;
              return (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.95rem', borderRadius: '0.75rem',
                  background: count > 0 ? (item.isBonus ? '#f0fdf4' : '#fff5f5') : 'white',
                  border: `1.5px solid ${count > 0 ? (item.isBonus ? '#86efac' : '#fca5a5') : '#f3f4f6'}`,
                  boxShadow: count > 0 ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
                }}>
                  <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', lineHeight: 1.35 }}>
                      #{item.id}. {item.label}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: item.isBonus ? '#15803d' : '#b91c1c', fontWeight: 800, marginTop: '0.15rem', display: 'inline-block' }}>
                      {item.points > 0 ? `+${item.points}` : item.points} điểm / {item.unit}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className="criteria-btn"
                      onClick={() => handleToggleCriterion(item.id, -1)}
                      disabled={isTeacher || count === 0}
                      title={isTeacher ? "Chế độ GVCN chỉ xét duyệt" : "Trừ 1"}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #d1d5db',
                        background: 'white', cursor: (isTeacher || count === 0) ? 'not-allowed' : 'pointer', opacity: (isTeacher || count === 0) ? 0.35 : 1,
                        fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 900, fontSize: '1rem', minWidth: '24px', textAlign: 'center', color: '#1f2937' }}>
                      {count}
                    </span>
                    <button
                      className="criteria-btn"
                      onClick={() => handleToggleCriterion(item.id, 1)}
                      disabled={isTeacher}
                      title={isTeacher ? "Chế độ GVCN chỉ xét duyệt" : "Cộng 1"}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                        background: isTeacher ? '#94a3b8' : (item.isBonus ? '#16a34a' : 'var(--color-primary-dark)'),
                        color: 'white', cursor: isTeacher ? 'not-allowed' : 'pointer', opacity: isTeacher ? 0.45 : 1,
                        fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isTeacher ? 'none' : '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special GVCN Approval & Adjustment Panel */}
          {isTeacher && (
            <div style={{ background: '#f8fafc', borderRadius: '0.875rem', padding: '1.1rem', border: '1.5px solid #e2e8f0', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '0.92rem', fontWeight: 800 }}>
                  ⚖️ GVCN Phê Duyệt & Yêu Cầu Thay Đổi (Nếu Có)
                </h4>
                <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 800 }}>
                  👁️ Chế độ Xét Duyệt
                </span>
              </div>
              <textarea
                className="form-input"
                style={{ width: '100%', minHeight: '65px', fontSize: '0.82rem', marginBottom: '0.75rem', resize: 'vertical' }}
                placeholder={`Nhập nhận xét hoặc yêu cầu điều chỉnh đặc biệt cho ${currentStudent?.name || 'học sinh'} (ví dụ: Khen thưởng đột xuất, Nhắc nhở quy định...)...`}
                value={teacherNotes[selectedStudentId] || currentRecord.teacherNote || ''}
                onChange={e => setTeacherNotes({ ...teacherNotes, [selectedStudentId]: e.target.value })}
              />
            </div>
          )}

          {/* Action Row — Depending on Role & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              {currentRecord.reviewedBy && <div>👤 Tổ trưởng đã duyệt Vòng 1: <strong>{currentRecord.reviewedBy}</strong></div>}
              {currentRecord.monitorApprovedBy && <div>👑 Lớp trưởng đã duyệt Vòng 2: <strong>{currentRecord.monitorApprovedBy}</strong></div>}
              {currentRecord.approvedBy && <div>🚀 GVCN đã chốt điểm: <strong>{currentRecord.approvedBy}</strong></div>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* HS Nộp */}
              {(!user || user.role === 'student' || String(user.id) === selectedStudentId) && currentRecord.status !== 'approved' && (
                <button className="btn-primary" onClick={handleStudentSubmit} disabled={saving}>
                  {saving ? 'Đang nộp...' : '📩 Nộp Phiếu Tự Đánh Giá'}
                </button>
              )}

              {/* Vòng 1: Tổ trưởng Duyệt */}
              {isGroupLeader && !isMonitor && (
                <button className="btn-primary" style={{ background: '#0284c7' }} onClick={handleGroupLeaderReview} disabled={saving}>
                  {saving ? 'Đang duyệt...' : `⭐ Tổ Trưởng Duyệt Vòng 1 (${user?.groupLeaderOf || user?.group || 'Tổ'})`}
                </button>
              )}

              {/* Vòng 2: Lớp trưởng Duyệt */}
              {isMonitor && (
                <button className="btn-primary" style={{ background: '#d97706' }} onClick={handleMonitorReview} disabled={saving}>
                  {saving ? 'Đang duyệt...' : '👑 Lớp Trưởng Duyệt Vòng 2 (Toàn Lớp)'}
                </button>
              )}

              {/* Vòng 3: GVCN Chốt */}
              {isTeacher && (
                <>
                  <button className="btn-primary" style={{ background: '#dc2626' }} onClick={() => handleTeacherAction('reject')} disabled={saving}>
                    💬 Yêu cầu thay đổi / làm lại
                  </button>
                  <button className="btn-primary" style={{ background: '#059669' }} onClick={() => handleTeacherAction('approve')} disabled={saving}>
                    🚀 Phê duyệt & Chốt điểm
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Analytics & Ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* BarChart & Class Progress List (Only visible to Officers: GVCN, Lớp trưởng, Tổ trưởng) */}
          {(isTeacher || isMonitor || isGroupLeader || canApproveCompetition) && (
            <>
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
            </>
          )}

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
