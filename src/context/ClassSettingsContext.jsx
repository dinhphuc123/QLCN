import React, { createContext, useContext, useState, useEffect } from 'react';

const ClassSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  className: '12.7',
  schoolYear: '2026 - 2027',
  semester: 'Học kỳ I',
  currentMonth: 'Tháng 9',
  currentWeek: 'Tuần 01',
  teacherName: 'Đỗ Kim Tuyền',
  schoolName: 'Trường THPT',
};

export function ClassSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('classmate_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('classmate_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ClassSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ClassSettingsContext.Provider>
  );
}

export function useClassSettings() {
  const ctx = useContext(ClassSettingsContext);
  if (!ctx) throw new Error('useClassSettings must be used within ClassSettingsProvider');
  return ctx;
}
