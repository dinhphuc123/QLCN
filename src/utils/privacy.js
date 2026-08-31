/**
 * Privacy & Data Masking Utility compliant with Decree 13/2023/NĐ-CP
 */

export function maskPhone(phone, isTeacher = false, isSelf = false) {
  if (!phone) return '—';
  if (isTeacher || isSelf) return phone;
  
  // Mask phone for guests & other students: 0912345678 -> 0912.***.678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 4)}.***.${cleaned.slice(-3)}`;
  }
  return '🔒 ********';
}

export function maskParentInfo(parentName, parentPhone, isTeacher = false, isSelf = false) {
  if (isTeacher || isSelf) {
    return { name: parentName || 'Đang cập nhật', phone: parentPhone || '—' };
  }
  return {
    name: parentName ? `${parentName.split(' ')[0]} ***` : 'Bảo mật',
    phone: '🔒 Chỉ GVCN'
  };
}

export function canAccessConfession(user, confessionAuthorId) {
  if (!user) return false;
  if (user.role === 'teacher') return true;
  if (user.id === confessionAuthorId) return true;
  return false;
}
