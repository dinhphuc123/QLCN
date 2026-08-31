import React from 'react';

// Custom beautifully styled SVG components representing different plant evolution stages.
// All stages render a cute pot with a smiley face and growing plants.

export const PlantSeedIcon = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ width: '80px', height: '80px', ...style }}>
    {/* Cute pot */}
    <path d="M25 60 L75 60 L68 85 L32 85 Z" fill="#D97706" />
    <rect x="20" y="52" width="60" height="8" rx="3" fill="#B45309" />
    {/* Smiley Face */}
    <circle cx="43" cy="70" r="2.5" fill="#1F2937" />
    <circle cx="57" cy="70" r="2.5" fill="#1F2937" />
    <path d="M47 75 Q50 78 53 75" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="54" rx="26" ry="4" fill="#78350F" />
    {/* Seed resting on soil */}
    <circle cx="50" cy="46" r="6" fill="#F59E0B" />
    <circle cx="48" cy="44" r="2" fill="#FEF3C7" />
  </svg>
);

export const PlantSproutIcon = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ width: '80px', height: '80px', ...style }}>
    {/* Cute pot */}
    <path d="M25 60 L75 60 L68 85 L32 85 Z" fill="#D97706" />
    <rect x="20" y="52" width="60" height="8" rx="3" fill="#B45309" />
    {/* Smiley Face */}
    <circle cx="43" cy="70" r="2.5" fill="#1F2937" />
    <circle cx="57" cy="70" r="2.5" fill="#1F2937" />
    <path d="M47 75 Q50 78 53 75" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="54" rx="26" ry="4" fill="#78350F" />
    {/* Sprout Stem & Leaf */}
    <path d="M50 54 Q48 40 45 32" stroke="#10B981" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M45 32 Q52 28 56 34 Q49 38 45 32" fill="#10B981" />
  </svg>
);

export const PlantSaplingIcon = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ width: '80px', height: '80px', ...style }}>
    {/* Cute pot */}
    <path d="M25 60 L75 60 L68 85 L32 85 Z" fill="#D97706" />
    <rect x="20" y="52" width="60" height="8" rx="3" fill="#B45309" />
    {/* Smiley Face */}
    <circle cx="43" cy="70" r="2.5" fill="#1F2937" />
    <circle cx="57" cy="70" r="2.5" fill="#1F2937" />
    <path d="M47 75 Q50 78 53 75" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="54" rx="26" ry="4" fill="#78350F" />
    {/* Young Plant Stem */}
    <path d="M50 54 Q50 35 50 20" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Left Leaf */}
    <path d="M50 38 Q38 34 36 42 Q46 44 50 38" fill="#10B981" />
    {/* Right Leaf */}
    <path d="M50 30 Q62 26 64 34 Q54 36 50 30" fill="#10B981" />
  </svg>
);

export const PlantBudIcon = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ width: '80px', height: '80px', ...style }}>
    {/* Cute pot */}
    <path d="M25 60 L75 60 L68 85 L32 85 Z" fill="#D97706" />
    <rect x="20" y="52" width="60" height="8" rx="3" fill="#B45309" />
    {/* Smiley Face */}
    <circle cx="43" cy="70" r="2.5" fill="#1F2937" />
    <circle cx="57" cy="70" r="2.5" fill="#1F2937" />
    <path d="M47 75 Q50 78 53 75" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="54" rx="26" ry="4" fill="#78350F" />
    {/* Tall Stem */}
    <path d="M50 54 L50 20" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Left Leaves */}
    <path d="M50 42 Q36 38 38 44 Q46 45 50 42" fill="#10B981" />
    <path d="M50 30 Q36 26 38 32 Q46 33 50 30" fill="#10B981" />
    {/* Right Leaves */}
    <path d="M50 36 Q64 32 62 38 Q54 39 50 36" fill="#10B981" />
    <path d="M50 24 Q64 20 62 26 Q54 27 50 24" fill="#10B981" />
    {/* Red Flower Bud at top */}
    <path d="M50 20 Q47 14 50 8 Q53 14 50 20 Z" fill="#EF4444" />
  </svg>
);

export const PlantFlowerIcon = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={{ width: '80px', height: '80px', ...style }}>
    {/* Cute pot */}
    <path d="M25 60 L75 60 L68 85 L32 85 Z" fill="#D97706" />
    <rect x="20" y="52" width="60" height="8" rx="3" fill="#B45309" />
    {/* Smiley Face */}
    <circle cx="43" cy="70" r="2.5" fill="#1F2937" />
    <circle cx="57" cy="70" r="2.5" fill="#1F2937" />
    <path d="M47 75 Q50 78 53 75" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="54" rx="26" ry="4" fill="#78350F" />
    {/* Stem */}
    <path d="M50 54 L50 24" stroke="#059669" strokeWidth="6" fill="none" strokeLinecap="round" />
    {/* Leaves */}
    <path d="M50 42 Q32 36 30 46 Q45 48 50 42" fill="#10B981" />
    <path d="M50 32 Q68 26 70 36 Q55 38 50 32" fill="#10B981" />
    {/* Red Flower petals */}
    <circle cx="50" cy="14" r="8" fill="#EF4444" />
    <circle cx="40" cy="20" r="8" fill="#EF4444" />
    <circle cx="60" cy="20" r="8" fill="#EF4444" />
    <circle cx="44" cy="30" r="8" fill="#EF4444" />
    <circle cx="56" cy="30" r="8" fill="#EF4444" />
    {/* Flower center */}
    <circle cx="50" cy="22" r="6" fill="#FBBF24" />
  </svg>
);

const getPlantStage = (points) => {
  if (points <= 0) {
    return { 
      label: 'Hạt giống', 
      component: PlantSeedIcon, 
      emoji: '🌱', 
      title: 'Mầm Xanh Mới Gieo', 
      quote: 'Những nỗ lực đầu tiên sắp được gieo xuống mảnh đất tri thức màu mỡ.', 
      scale: 0.8 
    };
  }
  if (points <= 9) {
    return { 
      label: 'Nảy mầm', 
      component: PlantSproutIcon, 
      emoji: '🌿', 
      title: 'Cây Con Chăm Chỉ', 
      quote: 'Mầm xanh đã hé nở, hãy tiếp tục tưới tắm bằng tinh thần học tập hăng say!', 
      scale: 1.0 
    };
  }
  if (points <= 14) {
    return { 
      label: 'Cây non', 
      component: PlantSaplingIcon, 
      emoji: '☘️', 
      title: 'Nhà Bảo Vệ Vườn', 
      quote: 'Thân cây cứng cáp dần vươn cao, sẵn sàng đón nhận những bài học bổ ích tiếp theo.', 
      scale: 1.2 
    };
  }
  if (points <= 24) {
    return { 
      label: 'Nụ hoa', 
      component: PlantBudIcon, 
      emoji: '🪴', 
      title: 'Chuyên Gia Săn Sóc Cây', 
      quote: 'Những nụ hoa xinh xắn bắt đầu e ấp xuất hiện, hứa hẹn ngày rực rỡ.', 
      scale: 1.4 
    };
  }
  return { 
    label: 'Ra hoa/Quả', 
    component: PlantFlowerIcon, 
    emoji: '🌸', 
    title: 'Bậc Thầy Làm Vườn', 
    quote: 'Chúc mừng thành quả xuất sắc của bạn, khu vườn đã nở hoa rạng rỡ!', 
    scale: 1.6 
  };
};

export default getPlantStage;
