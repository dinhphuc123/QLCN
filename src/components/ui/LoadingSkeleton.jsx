import React from 'react';

function SkeletonRow({ width = '100%', height = '1rem', style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: '0.5rem',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style
    }} />
  );
}

export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SkeletonRow width="40px" height="40px" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <SkeletonRow width={`${60 + (i % 3) * 10}%`} height="0.85rem" />
            <SkeletonRow width={`${40 + (i % 4) * 8}%`} height="0.75rem" />
          </div>
          <SkeletonRow width="80px" height="2rem" style={{ borderRadius: '9999px' }} />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  );
}
