import React, { useState, useCallback } from 'react';

const FILTERS = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4', 'Cảnh báo', 'Vắng hôm nay'];

export default function SearchFilterBar({ onSearch, onFilter, activeFilters = [] }) {
  const [query, setQuery] = useState('');

  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  }, [onSearch]);

  const toggleFilter = (f) => {
    const next = activeFilters.includes(f)
      ? activeFilters.filter(x => x !== f)
      : [...activeFilters, f];
    onFilter(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Tìm kiếm học sinh theo tên..."
          className="form-input"
          style={{ paddingLeft: '2.75rem', width: '100%' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch(''); }}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: '1.1rem'
            }}
          >✕</button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = activeFilters.includes(f);
          const isWarning = f === 'Cảnh báo';
          const isAbsent = f === 'Vắng hôm nay';
          const chipColor = active
            ? (isWarning ? '#dc2626' : isAbsent ? '#ea580c' : 'var(--color-primary-brand)')
            : 'white';
          return (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              style={{
                padding: '0.35rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                background: chipColor,
                color: active ? 'white' : '#374151',
                border: active ? 'none' : '1.5px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {isWarning ? '⚠️ ' : isAbsent ? '🔴 ' : ''}{f}
            </button>
          );
        })}
        {(query || activeFilters.length > 0) && (
          <button
            onClick={() => { setQuery(''); onSearch(''); onFilter([]); }}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.8rem',
              background: '#fee2e2', color: '#991b1b', border: 'none',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
