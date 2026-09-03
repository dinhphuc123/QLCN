import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', confirmColor = '#dc2626' }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.25rem',
        padding: '2rem', maxWidth: '420px', width: '90%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        animation: 'slideUp 0.2s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>⚠️</span>
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)', margin: 0 }}>{title}</h3>
        </div>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '9999px',
              border: '1.5px solid #d1d5db', background: 'white',
              color: '#6b7280', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = '#f9fafb'}
            onMouseLeave={e => e.target.style.background = 'white'}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '9999px',
              border: 'none', background: confirmColor,
              color: 'white', fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 14px ${confirmColor}55`,
              transition: 'all 0.2s'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
