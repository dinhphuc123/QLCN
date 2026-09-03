import React, { createContext, useContext, useState } from 'react';

const translations = {
  vi: {
    dashboard: 'Trang chủ',
    students: 'Hồ sơ lớp',
    attendance: 'Điểm danh',
    requests: 'Đơn xin nghỉ',
    notifications: 'Thông báo',
    finance: 'Quỹ lớp',
    evaluation: 'Thi đua 47',
    ai_assistant: 'Trợ lý AI',
    parent_portal: 'Sổ phụ huynh',
    confessions: 'Hòm tâm sự',
    reports: 'Biểu mẫu & Excel',
    cms_admin: 'Quản trị CMS',
    welcome: 'Sổ Chủ Nhiệm Số 12.7',
    classLabel: 'Lớp 12.7 • THPT Quốc Gia',
    languageName: 'Tiếng Việt 🇻🇳',
  },
  en: {
    dashboard: 'Dashboard',
    students: 'Student Profiles',
    attendance: 'Attendance',
    requests: 'Leave Requests',
    notifications: 'Announcements',
    finance: 'Class Fund',
    evaluation: 'Competition',
    ai_assistant: 'AI Assistant',
    parent_portal: 'Parent Portal',
    confessions: 'Confessions',
    reports: 'Reports & Export',
    cms_admin: 'CMS Admin',
    welcome: 'Class 12.7 Management System',
    classLabel: 'Class 12.7 • High School',
    languageName: 'English 🇬🇧',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('qlcn_lang') || 'vi');

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    localStorage.setItem('qlcn_lang', nextLang);
  };

  const t = (key) => translations[lang]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
