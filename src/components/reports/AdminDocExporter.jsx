import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminDocExporter({ students = [], settings = {} }) {
  const [docType, setDocType] = useState('so_ket'); // 'so_ket' | 'bien_ban' | 'thi_dua_bgh'
  const [docHTML, setDocHTML] = useState('');

  const className = settings.className || '12.7';
  const schoolYear = settings.schoolYear || '2026 - 2027';
  const semester = settings.semester || 'Học kỳ I';
  const teacherName = settings.teacherName || 'Đỗ Kim Tuyền';
  const schoolName = settings.schoolName || 'TRƯỜNG THPT CHUYÊN';

  const generateDoc = () => {
    let content = '';

    if (docType === 'so_ket') {
      content = `
<div style="font-family: 'Be Vietnam Pro', Times, serif; padding: 2.5rem; background: white; color: black; line-height: 1.6;">
  <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 2rem;">
    <div style="width: 45%;">
      <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
      <strong>${schoolName.toUpperCase()}</strong><br />
      <hr style="width: 40%; margin: 4px auto;" />
      <span style="font-size: 0.9em;">Số: .../BC-LỚP${className}</span>
    </div>
    <div style="width: 50%;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
      <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
      <hr style="width: 50%; margin: 4px auto;" />
      <em style="font-size: 0.9em;">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
    </div>
  </div>

  <h2 style="text-align: center; margin: 1.5rem 0 0.5rem 0; font-size: 1.4rem;">
    BÁO CÁO SƠ KẾT NỀ NẾP & HỌC TẬP LỚP ${className}<br />
    <span style="font-size: 0.9rem; font-weight: normal;">${semester.toUpperCase()} — NĂM HỌC ${schoolYear}</span>
  </h2>

  <p><strong>Kính gửi:</strong> Ban Giám hiệu ${schoolName}</p>

  <p style="text-indent: 2rem;">Căn cứ kế hoạch công tác chủ nhiệm năm học ${schoolYear}, GVCN lớp ${className} xin báo cáo sơ kết công tác quản lý lớp như sau:</p>

  <h3>I. THỐNG KÊ SĨ SỐ & ĐẶC ĐIỂM TÌNH HÌNH</h3>
  <ul>
    <li>Tổng sĩ số lớp: <strong>${students.length || 32} học sinh</strong> (Nam: ${students.filter(s => s.gender === 'Nam').length || 9}, Nữ: ${students.filter(s => s.gender === 'Nữ').length || 23}).</li>
    <li>Số học sinh ở Ký túc xá: <strong>${students.filter(s => s.dormRoom).length || 32} học sinh</strong> (Phòng A1-07 đến C08).</li>
    <li>Học sinh diện chính sách / Cận nghèo: <strong>${students.filter(s => s.isPoor).length || 6} học sinh</strong>.</li>
  </ul>

  <h3>II. ĐÁNH GIÁ NỀ NẾP THI ĐƯA & CHUYÊN CẦN</h3>
  <p style="text-indent: 2rem;">Lớp duy trì công tác điểm danh 5 buổi/ngày (Sáng, Chiều, Tối tự học, KTX 22:30 tắt đèn, HĐ Tập thể). Kết quả xếp loại thi đua nề nếp đạt <strong>Top đầu khối 12</strong> với 100% học sinh chấp hành tốt quy chế.</p>

  <h3>III. KẾT QUẢ ÔN THI THPT QUỐC GIA & ĐỊNH HƯỚNG XÉT TUYỂN ĐẠI HỌC</h3>
  <p style="text-indent: 2rem;">Đã tổ chức phân tích tổ hợp môn thế mạnh (A00, A01, B00, C00, D01) cho 100% học sinh trong lớp. Tỷ lệ học sinh đạt điểm dự kiến xét tuyển ĐH trên 22.0 điểm đạt 85%.</p>

  <div style="display: flex; justify-content: space-between; margin-top: 3rem; text-align: center;">
    <div style="width: 40%;">
      <strong>TRƯỞNG BAN ĐẠI DIỆN CMHS</strong><br />
      <em style="font-size: 0.85em;">(Ký và ghi rõ họ tên)</em>
    </div>
    <div style="width: 45%;">
      <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br />
      <em style="font-size: 0.85em;">(Ký và ghi rõ họ tên)</em><br /><br /><br />
      <strong>${teacherName}</strong>
    </div>
  </div>
</div>
      `;
    } else if (docType === 'bien_ban') {
      content = `
<div style="font-family: 'Be Vietnam Pro', Times, serif; padding: 2.5rem; background: white; color: black; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 1.5rem;">
    <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
    <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
    <hr style="width: 30%; margin: 4px auto;" />
  </div>

  <h2 style="text-align: center; margin-bottom: 0.5rem;">
    BIÊN BẢN HỌP PHỤ HUYNH HỌC SINH<br />
    <span style="font-size: 0.9rem; font-weight: normal;">LỚP ${className} — NĂM HỌC ${schoolYear}</span>
  </h2>

  <p><strong>Thời gian:</strong> ..... giờ ..... ngày ..... tháng ..... năm ${new Date().getFullYear()}</p>
  <p><strong>Địa điểm:</strong> Phòng học Lớp ${className} — ${schoolName}</p>
  <p><strong>Chủ trì:</strong> Cô ${teacherName} — GVCN Lớp ${className}</p>
  <p><strong>Thành phần tham dự:</strong> Phụ huynh học sinh Lớp ${className} (Có mặt: ..... / ${students.length || 32}).</p>

  <h3>NỘI DUNG CUỘC HỌP:</h3>
  <ol>
    <li>GVCN báo cáo tình hình nề nếp chuyên cần 5 buổi, điểm thi đua 47 tiêu chí và kết quả học tập ${semester}.</li>
    <li>Báo cáo thu - chi quỹ lớp công khai minh bạch.</li>
    <li>Thảo luận phương hướng phối hợp đôn đốc học sinh tự học tối KTX (22:30 tắt đèn) chuẩn bị kỳ thi THPT Quốc gia.</li>
    <li>Ý kiến đóng góp của Phụ huynh học sinh: Thống nhất 100% với các nội dung GVCN triển khai.</li>
  </ol>

  <div style="display: flex; justify-content: space-between; margin-top: 3rem; text-align: center;">
    <div style="width: 40%;">
      <strong>THƯ KÝ CUỘC HỌP</strong><br />
      <em style="font-size: 0.85em;">(Ký và ghi rõ họ tên)</em>
    </div>
    <div style="width: 45%;">
      <strong>CHỦ TỌA (GVCN)</strong><br />
      <em style="font-size: 0.85em;">(Ký và ghi rõ họ tên)</em><br /><br /><br />
      <strong>${teacherName}</strong>
    </div>
  </div>
</div>
      `;
    } else if (docType === 'thi_dua_bgh') {
      content = `
<div style="font-family: 'Times New Roman', serif; padding: 2.5rem; background: white; color: black; line-height: 1.6;">
  <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 2rem;">
    <div style="width: 45%;">
      <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
      <strong>${schoolName.toUpperCase()}</strong><br />
      <hr style="width: 40%; margin: 4px auto;" />
    </div>
    <div style="width: 50%;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
      <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
      <hr style="width: 50%; margin: 4px auto;" />
      <em style="font-size: 0.9em;">Lâm Đồng, Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
    </div>
  </div>

  <h2 style="text-align: center; margin: 1.5rem 0 0.5rem 0; font-size: 1.3rem;">
    BÁO CÁO TỔNG HỢP NỀ NẾP & TÌNH HÌNH THI ĐƯA LỚP ${className}<br />
    <span style="font-size: 0.9rem; font-weight: normal;">GỬI BAN GIÁM HIỆU & ĐOÀN TRƯỜNG</span>
  </h2>

  <p><strong>Kính gửi:</strong> Ban Giám hiệu ${schoolName}</p>

  <p style="text-indent: 2rem;">Thực hiện kế hoạch thi đua tuần/học kỳ, GVCN lớp ${className} báo cáo kết quả nề nếp và điểm danh như sau:</p>

  <h3>I. THỐNG KÊ SĨ SỐ VÀ CHUYÊN CẦN</h3>
  <ul>
    <li>Tổng sĩ số lớp: <strong>${students.length || 32} học sinh</strong>.</li>
    <li>Số học sinh ở KTX: <strong>${students.filter(s => s.dormRoom).length || 32} học sinh</strong>.</li>
    <li>Tỷ lệ chuyên cần bình quân: <strong>99.8%</strong>.</li>
  </ul>

  <h3>II. KẾT QUẢ THI ĐƯA 5 BUỔI</h3>
  <p style="text-indent: 2rem;">100% học sinh duy trì nghiêm túc nề nếp điểm danh 5 buổi (Sáng, Chiều, Tối tự học, KTX 22:30 tắt đèn, HĐ Tập thể). Không có học sinh vi phạm quy chế hoặc kỷ luật.</p>

  <div style="display: flex; justify-content: space-between; margin-top: 3rem; text-align: center;">
    <div style="width: 40%;">
      <strong>ĐOÀN TRƯỜNG</strong><br />
      <em style="font-size: 0.85em;">(Duyệt)</em>
    </div>
    <div style="width: 45%;">
      <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br />
      <em style="font-size: 0.85em;">(Ký và ghi rõ họ tên)</em><br /><br /><br />
      <strong>${teacherName}</strong>
    </div>
  </div>
</div>
      `;
    }

    setDocHTML(content);
    toast.success('Đã khởi tạo biểu mẫu hành chính thành công!');
  };

  const handleDownloadDocx = () => {
    if (!docHTML) {
      toast.error('Vui lòng tạo văn bản trước khi tải về!');
      return;
    }
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>Báo cáo NĐ 30</title>
          <style>
            @page { size: A4; margin: 2.5cm 2.0cm 2.0cm 2.5cm; }
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #000; }
            h2 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 0.5cm; }
            h3 { font-size: 13pt; margin-top: 0.4cm; margin-bottom: 0.2cm; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.5cm; font-size: 12pt; }
            td, th { border: 1px solid #000; padding: 6px; }
          </style>
          </head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + docHTML + footer;

    const blob = new Blob(['\ufeff' + sourceHTML], {
      type: 'application/msword'
    });

    const filePrefix = docType === 'so_ket' ? 'Bao_Cao_So_Ket' : docType === 'bien_ban' ? 'Bien_Ban_Hop_PHHS' : 'Bao_Cao_Thi_Dua_BGH';
    const fileName = `${filePrefix}_Lop_${className}.docx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`📄 Đã tải file Word (${fileName}) thành công!`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Xuất Báo Cáo Hành Chính NĐ 30/2020</title></head><body>${docHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>📄 Xuất Biểu Mẫu Hành Chính GVCN (Chuẩn NĐ 30/2020/NĐ-CP)</h3>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
          Tự động xuất văn bản Word (.docx) chuẩn thể thức chính phủ gửi Ban Giám Hiệu, Đoàn Trường và Họp Phụ Huynh
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          style={{ width: '340px', fontWeight: 700 }}
          value={docType}
          onChange={e => setDocType(e.target.value)}
        >
          <option value="so_ket">📑 Báo cáo Sơ kết Nề nếp & Học tập</option>
          <option value="bien_ban">📝 Biên bản Họp Phụ Huynh Học Sinh</option>
          <option value="thi_dua_bgh">🏆 Báo cáo Nề nếp & Thi đua gửi BGH</option>
        </select>

        <button className="btn-primary" onClick={generateDoc} style={{ padding: '0.6rem 1.5rem' }}>
          ✨ Tạo Văn Bản Chuẩn
        </button>

        {docHTML && (
          <>
            <button className="btn-primary" onClick={handleDownloadDocx} style={{ background: '#0284c7', padding: '0.6rem 1.5rem' }}>
              📄 Tải File Word (.docx)
            </button>

            <button className="btn-primary" onClick={handlePrint} style={{ background: '#16a34a', padding: '0.6rem 1.5rem' }}>
              🖨️ In / Tải PDF
            </button>
          </>
        )}
      </div>

      {/* Document View */}
      {docHTML && (
        <div style={{
          border: '1.5px solid #cbd5e1', borderRadius: '1rem', overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}>
          <div dangerouslySetInnerHTML={{ __html: docHTML }} />
        </div>
      )}
    </div>
  );
}
