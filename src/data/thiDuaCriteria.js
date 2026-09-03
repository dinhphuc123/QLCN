// 47 tiêu chí thi đua — QUY CHẾ LỚP 12.7 (điểm chuẩn 100 điểm/tuần)
// Điểm dương = cộng, âm = trừ

export const THI_DUA_CRITERIA = [
  // ── 1. Chuyên cần ──────────────────────────────────────────────────────
  { id: 1, group: '1. Chuyên cần', label: 'Vắng học có phép', points: -2, unit: 'buổi', autoLink: 'absent_permit' },
  { id: 2, group: '1. Chuyên cần', label: 'Vắng học không phép', points: -10, unit: 'buổi', autoLink: 'absent_no_permit' },
  { id: 3, group: '1. Chuyên cần', label: 'Đi học trễ (vào lớp / truy bài)', points: -5, unit: 'lần/buổi', autoLink: null },
  { id: 4, group: '1. Chuyên cần', label: 'Ổn định chậm 15 phút đầu giờ, đi lại lộn xộn', points: -5, unit: 'lần', autoLink: null },

  // ── 2. Học tập ─────────────────────────────────────────────────────────
  { id: 5, group: '2. Học tập', label: 'Không thuộc bài cũ khi GV kiểm tra', points: -15, unit: 'lần', autoLink: null },
  { id: 6, group: '2. Học tập', label: 'Không làm bài tập về nhà / không chuẩn bị bài', points: -15, unit: 'lần', autoLink: null },
  { id: 7, group: '2. Học tập', label: 'Không nộp bài theo đúng quy định', points: -10, unit: 'lần', autoLink: null },
  { id: 8, group: '2. Học tập', label: 'Thiếu dụng cụ & tài liệu học tập (SGK, vở, máy tính...)', points: -5, unit: 'lần', autoLink: null },
  { id: 9, group: '2. Học tập', label: 'Gian lận kiểm tra (sử dụng tài liệu, trao đổi bài, nhìn bài...)', points: -50, unit: 'lần', severe: true, autoLink: null },
  { id: 10, group: '2. Học tập', label: 'Ý thức sinh hoạt học thuật (ngủ gật, làm việc riêng, đọc truyện)', points: -5, unit: 'lần', autoLink: null },
  { id: 11, group: '2. Học tập', label: 'Thiếu tinh thần hợp tác nhóm (bỏ bê, đùn đẩy nhiệm vụ)', points: -5, unit: 'lần', autoLink: null },
  { id: 12, group: '2. Học tập', label: 'Sử dụng điện thoại trong giờ học chính khóa (trừ khi GV cho phép)', points: -10, unit: 'lần', autoLink: null },
  { id: 13, group: '2. Học tập', label: 'Tiết học đạt loại Khá', points: -5, unit: 'tiết', autoLink: null },
  { id: 14, group: '2. Học tập', label: 'Tiết học đạt loại Đạt', points: -10, unit: 'tiết', autoLink: null },
  { id: 15, group: '2. Học tập', label: 'Tiết học đạt loại chưa Đạt', points: -15, unit: 'tiết', autoLink: null },
  { id: 16, group: '2. Học tập', label: 'Phát biểu xây dựng bài dưới 10 lần/tuần', points: -15, unit: 'tuần', autoLink: null },
  { id: 17, group: '2. Học tập', label: 'Phát biểu xây dựng bài trên 20 lần/tuần (CỘNG ĐIỂM)', points: +5, unit: 'tuần', isBonus: true, autoLink: null },

  // ── 3. Tự học (chiều/tối) ──────────────────────────────────────────────
  { id: 18, group: '3. Tự học', label: 'Vắng tự học không phép', points: -5, unit: 'lần', autoLink: 'absent_self_study' },
  { id: 19, group: '3. Tự học', label: 'Đi tự học trễ', points: -5, unit: 'lần', autoLink: null },
  { id: 20, group: '3. Tự học', label: 'Sử dụng điện thoại trong giờ tự học', points: -30, unit: 'lần', severe: true, autoLink: null },
  { id: 21, group: '3. Tự học', label: 'Vi phạm giờ tự học (về sớm, mất trật tự, làm việc riêng)', points: -10, unit: 'lần', autoLink: null },

  // ── 4. Ngoại khóa & HĐ tập thể ────────────────────────────────────────
  { id: 22, group: '4. Ngoại khóa & HĐ tập thể', label: 'Vắng HĐ tập thể có phép', points: -2, unit: 'buổi', autoLink: 'absent_activity_permit' },
  { id: 23, group: '4. Ngoại khóa & HĐ tập thể', label: 'Vắng HĐ tập thể không phép', points: -10, unit: 'buổi', autoLink: 'absent_activity_no_permit' },
  { id: 24, group: '4. Ngoại khóa & HĐ tập thể', label: 'Đi HĐ tập thể trễ', points: -5, unit: 'lần', autoLink: null },
  { id: 25, group: '4. Ngoại khóa & HĐ tập thể', label: 'Không tham gia / vô kỷ luật trong phong trào thi đua chung', points: -10, unit: 'lần', autoLink: null },

  // ── 5. Tác phong & Đồng phục ───────────────────────────────────────────
  { id: 26, group: '5. Tác phong & Đồng phục', label: 'Không mặc đúng đồng phục / áo dài / áo Đoàn theo quy định', points: -5, unit: 'buổi', autoLink: null },
  { id: 27, group: '5. Tác phong & Đồng phục', label: 'Không mang bảng tên, dây nịt, huy hiệu Đoàn', points: -5, unit: 'lần', autoLink: null },
  { id: 28, group: '5. Tác phong & Đồng phục', label: 'Đầu tóc không đúng quy định (nhuộm tóc, để tóc dài quá quy định)', points: -5, unit: 'lần', autoLink: null },

  // ── 6. Vệ sinh & Nề nếp chung ─────────────────────────────────────────
  { id: 29, group: '6. Vệ sinh & Nề nếp', label: 'Lớp học / khu vực trực nhật không sạch sẽ', points: -20, unit: 'lần', autoLink: null },
  { id: 30, group: '6. Vệ sinh & Nề nếp', label: 'Viết, vẽ bậy lên bàn ghế, tường lớp học', points: -5, unit: 'trường hợp', autoLink: null },
  { id: 31, group: '6. Vệ sinh & Nề nếp', label: 'Sử dụng quạt, thiết bị sai quy định trong lớp', points: -5, unit: 'lần', autoLink: null },

  // ── 7. Ký túc xá (KTX) ────────────────────────────────────────────────
  { id: 32, group: '7. Ký túc xá (KTX)', label: 'Vi phạm giờ giấc KTX (về muộn sau 22h / ngủ muộn sau 22h30)', points: -10, unit: 'lần', autoLink: 'late_sleep' },
  { id: 33, group: '7. Ký túc xá (KTX)', label: 'Không tắt điện, quạt, van nước / để nước tràn thùng', points: -50, unit: 'lần', severe: true, autoLink: null },
  { id: 34, group: '7. Ký túc xá (KTX)', label: 'Tự ý câu điện, đun nấu bằng ấm/nồi cơm điện trong phòng', points: -5, unit: 'lần', autoLink: null },
  { id: 35, group: '7. Ký túc xá (KTX)', label: 'Phòng ở luộm thuộm, phơi quần áo sai quy định', points: -5, unit: 'lần', autoLink: null },
  { id: 36, group: '7. Ký túc xá (KTX)', label: 'Ngủ "nhầm" phòng', points: -10, unit: 'lần', autoLink: null },
  { id: 37, group: '7. Ký túc xá (KTX)', label: 'Dẫn bạn vào phòng KTX', points: -10, unit: 'lần', autoLink: null },
  { id: 38, group: '7. Ký túc xá (KTX)', label: 'Không xếp mùng mền gọn gàng sau khi thức dậy', points: -5, unit: 'lần', autoLink: null },
  { id: 39, group: '7. Ký túc xá (KTX)', label: 'Mang giày dép vào phòng (trừ dép đi trong phòng), để lộn xộn', points: -5, unit: 'lần', autoLink: null },
  { id: 40, group: '7. Ký túc xá (KTX)', label: 'Xả rác bừa bãi', points: -5, unit: 'lần', autoLink: null },
  { id: 41, group: '7. Ký túc xá (KTX)', label: 'Không đi bỏ rác đúng thời gian và phân công', points: -20, unit: 'lần', autoLink: null },
  { id: 42, group: '7. Ký túc xá (KTX)', label: 'Không thực hiện lịch trực theo phân công', points: -20, unit: 'lần', autoLink: null },

  // ── 8. Vi phạm nghiêm trọng ───────────────────────────────────────────
  { id: 43, group: '8. Vi phạm nghiêm trọng', label: 'HÚT THUỐC (kể cả thuốc lá điện tử)', points: -50, unit: 'lần', severe: true, disciplinary: true, autoLink: null },
  { id: 44, group: '8. Vi phạm nghiêm trọng', label: 'ĐÁNH NHAU', points: -50, unit: 'lần', severe: true, disciplinary: true, autoLink: null },
  { id: 45, group: '8. Vi phạm nghiêm trọng', label: 'SỬ DỤNG RƯỢU BIA', points: -50, unit: 'lần', severe: true, disciplinary: true, autoLink: null },
  { id: 46, group: '8. Vi phạm nghiêm trọng', label: 'SỬ DỤNG CHẤT CẤM/KÍCH THÍCH', points: -50, unit: 'lần', severe: true, disciplinary: true, autoLink: null },
  { id: 47, group: '8. Vi phạm nghiêm trọng', label: 'TÀNG TRỮ HUNG KHÍ', points: -50, unit: 'lần', severe: true, disciplinary: true, autoLink: null },
];

// Xếp loại theo điểm tuần
export const RANKING_THRESHOLDS = [
  { label: 'Xuất sắc', min: 90, max: Infinity, color: '#16a34a', emoji: '⭐' },
  { label: 'Khá',      min: 80, max: 89,        color: '#2563eb', emoji: '👍' },
  { label: 'Đạt',      min: 70, max: 79,        color: '#d97706', emoji: '✅' },
  { label: 'Không đạt',min: 0,  max: 69,        color: '#dc2626', emoji: '❌' },
];

export function calcRanking(score) {
  return RANKING_THRESHOLDS.find(r => score >= r.min && score <= r.max) || RANKING_THRESHOLDS[3];
}

// Tính điểm tuần từ danh sách vi phạm đã chọn
// violations: [{ criteriaId, count }]
export function calcWeekScore(violations = []) {
  let total = 100;
  for (const v of violations) {
    const criterion = THI_DUA_CRITERIA.find(c => c.id === v.criteriaId);
    if (criterion) {
      total += criterion.points * (v.count || 1);
    }
  }
  return Math.max(0, Math.min(150, total)); // cap 0–150 (có bonus)
}

// Tính điểm tháng = TB cộng các tuần trong tháng
export function calcMonthScore(weekScores = []) {
  if (!weekScores.length) return 0;
  return parseFloat((weekScores.reduce((s, w) => s + w, 0) / weekScores.length).toFixed(1));
}

// Tính điểm học kỳ = TB cộng các tuần trong học kỳ
export function calcSemesterScore(weekScores = []) {
  return calcMonthScore(weekScores); // same formula
}

// Nhóm các tiêu chí theo group
export const CRITERIA_GROUPS = [...new Set(THI_DUA_CRITERIA.map(c => c.group))];

export function getCriteriaByGroup(group) {
  return THI_DUA_CRITERIA.filter(c => c.group === group);
}
