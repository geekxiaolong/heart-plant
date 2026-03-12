import React from 'react';
import { motion } from 'framer-motion';

interface PlantCharacterProps {
  mood: string;
  isThirsty: boolean;
  isHealthy: boolean;
  isWatering: boolean;
  isFertilizing: boolean;
  colors: { leaf: string; stalk: string; glow: string };
}

// 通用：极简面部表情 (融入式)
const SubtleFace = ({ isThirsty, mood, x = 0, y = 0, rotate = 0, scale = 1 }: any) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`} opacity="0.4">
    {/* 眼睛：深色圆点，不描边 */}
    <circle cx="-6" cy="-2" r="1.5" fill="#000" />
    <circle cx="6" cy="-2" r="1.5" fill="#000" />
    
    {/* 嘴巴：极细线条 */}
    {isThirsty ? (
       <path d="M-3 4 Q0 2 3 4" stroke="#000" strokeWidth="1" fill="none" opacity="0.8" />
    ) : mood === 'happy' ? (
       <path d="M-4 2 Q0 5 4 2" stroke="#000" strokeWidth="1" fill="none" opacity="0.8" />
    ) : (
       <line x1="-2" y1="3" x2="2" y2="3" stroke="#000" strokeWidth="1" opacity="0.6" />
    )}
    
    {/* 腮红 (仅开心时) */}
    {!isThirsty && mood === 'happy' && (
      <>
        <circle cx="-10" cy="0" r="2" fill="#FF0000" opacity="0.2" />
        <circle cx="10" cy="0" r="2" fill="#FF0000" opacity="0.2" />
      </>
    )}
  </g>
);

// 1. 多肉植物 (Succulent) - 晶莹剔透，层叠
export const Succulent = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  const breatheTransition = {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  return (
    <motion.g
      initial={{ scale: 0.9 }}
      animate={isThirsty ? { scale: 0.85 } : { scale: [0.9, 0.95, 0.9] }}
      transition={breatheTransition}
    >
      {/* 阴影层 */}
      <ellipse cx="100" cy="150" rx="50" ry="15" fill="#000" opacity="0.1" />

      {/* 后层叶片 */}
      <path d="M50 130 Q30 110 50 90 Q70 110 100 130" fill={colors.leaf} filter="brightness(0.8)" />
      <path d="M150 130 Q170 110 150 90 Q130 110 100 130" fill={colors.leaf} filter="brightness(0.8)" />
      <path d="M100 80 Q70 80 60 110 Q80 130 100 130" fill={colors.leaf} filter="brightness(0.9)" />
      <path d="M100 80 Q130 80 140 110 Q120 130 100 130" fill={colors.leaf} filter="brightness(0.9)" />

      {/* 中层叶片 */}
      <motion.path 
        d="M100 130 Q60 120 60 90 Q80 70 100 100" 
        fill={colors.leaf} 
        filter="brightness(1.0)"
      />
      <motion.path 
        d="M100 130 Q140 120 140 90 Q120 70 100 100" 
        fill={colors.leaf} 
        filter="brightness(1.0)"
      />

      {/* 核心叶片 (脸部) */}
      <path d="M100 125 Q80 90 100 60 Q120 90 100 125" fill={colors.leaf} filter="brightness(1.1)" />
      
      {/* 顶部高光 */}
      <ellipse cx="100" cy="70" rx="5" ry="2" fill="#FFF" opacity="0.3" />

      <SubtleFace isThirsty={isThirsty} mood={mood} x={100} y={95} />
    </motion.g>
  );
};

// 2. 仙人掌 (Cactus) - 柱状，纹理
export const Cactus = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  return (
    <motion.g
      initial={{ rotate: 0 }}
      animate={isThirsty ? { rotate: 5 } : { rotate: [-1, 1, -1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 阴影 */}
      <ellipse cx="100" cy="165" rx="30" ry="8" fill="#000" opacity="0.1" />

      {/* 左分枝 */}
      <path 
        d="M85 110 Q50 110 50 70 Q50 40 70 50 Q85 60 85 90" 
        fill={colors.leaf} 
        filter="brightness(0.9)"
      />
      {/* 右分枝 */}
      <path 
        d="M115 100 Q150 100 150 60 Q150 30 130 40 Q115 50 115 80" 
        fill={colors.leaf} 
        filter="brightness(0.9)"
      />

      {/* 主干 */}
      <path 
        d="M75 160 L75 60 Q75 20 100 20 Q125 20 125 60 L125 160 Z" 
        fill={colors.leaf} 
      />

      {/* 棱线纹理 (无黑边) */}
      <path d="M90 160 L90 30" stroke="#000" strokeOpacity="0.1" strokeWidth="2" fill="none" />
      <path d="M110 160 L110 30" stroke="#000" strokeOpacity="0.1" strokeWidth="2" fill="none" />

      {/* 刺 (细小的点) */}
      {[
        {x:75,y:50}, {x:75,y:90}, {x:75,y:130},
        {x:125,y:50}, {x:125,y:90}, {x:125,y:130},
        {x:50,y:70}, {x:150,y:60}
      ].map((p, i) => (
        <path key={i} d={`M${p.x} ${p.y} L${p.x < 100 ? p.x-3 : p.x+3} ${p.y-2}`} stroke="#FFF" strokeWidth="1" opacity="0.6" />
      ))}

      {/* 顶部小花 */}
      <circle cx="90" cy="25" r="5" fill="#F472B6" />
      <circle cx="100" cy="20" r="6" fill="#F472B6" />
      <circle cx="110" cy="25" r="5" fill="#F472B6" />

      <SubtleFace isThirsty={isThirsty} mood={mood} x={100} y={80} />
    </motion.g>
  );
};

// 3. 绿萝 (Pothos) - 自然垂坠，心形叶
export const Pothos = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  const sway = {
    rotate: [-2, 2, -2],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
  };

  const Leaf = ({ x, y, scale = 1, r = 0, color = colors.leaf }: any) => (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${r})`}>
      <path 
        d="M0 0 Q-15 -20 0 -40 Q15 -20 0 0" 
        fill={color} 
      />
      <path d="M0 0 Q0 -20 0 -35" stroke="#FFF" strokeOpacity="0.2" strokeWidth="1" fill="none" />
    </g>
  );

  return (
    <motion.g animate={sway}>
      {/* 盆口阴影 */}
      <ellipse cx="100" cy="40" rx="40" ry="10" fill="#000" opacity="0.1" />

      {/* 藤蔓线条 */}
      <path d="M100 40 Q80 80 60 120" stroke={colors.stalk} strokeWidth="2" fill="none" />
      <path d="M100 40 Q120 90 140 140" stroke={colors.stalk} strokeWidth="2" fill="none" />
      <path d="M100 40 Q100 100 100 160" stroke={colors.stalk} strokeWidth="2" fill="none" />

      {/* 叶片群 */}
      <Leaf x="60" y="120" scale="1.2" r="-20" color={colors.leaf} />
      <Leaf x="140" y="140" scale="1.1" r="20" color={colors.leaf} />
      <Leaf x="100" y="160" scale="1.3" r="0" color={colors.leaf} />
      
      <Leaf x="80" y="80" scale="1" r="-10" />
      <Leaf x="120" y="90" scale="1" r="10" />
      
      {/* 顶部主叶群 */}
      <Leaf x="90" y="50" scale="1.4" r="-30" filter="brightness(0.9)" />
      <Leaf x="110" y="50" scale="1.4" r="30" filter="brightness(0.9)" />
      <Leaf x="100" y="60" scale="1.6" r="0" filter="brightness(1.1)" />

      {/* 脸在最大的叶子上 */}
      <SubtleFace isThirsty={isThirsty} mood={mood} x={100} y={45} scale={0.8} />
    </motion.g>
  );
};

// 4. 向日葵 (Sunflower) - 细节花盘
export const Sunflower = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  return (
    <motion.g
      animate={isThirsty ? { rotate: 10 } : { rotate: [-2, 2, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ originX: '100px', originY: '180px' }}
    >
      {/* 茎 */}
      <path d="M100 180 L100 80" stroke={colors.stalk} strokeWidth="8" />
      
      {/* 叶子 */}
      <path d="M100 140 Q60 130 50 110 Q60 150 100 145" fill={colors.leaf} />
      <path d="M100 150 Q140 140 150 120 Q140 160 100 155" fill={colors.leaf} />

      {/* 花头 */}
      <g transform="translate(100, 70)">
        {/* 后层花瓣 */}
        {[...Array(16)].map((_, i) => (
          <ellipse
            key={`b-${i}`}
            cx="0" cy="-45" rx="6" ry="25"
            fill="#F59E0B"
            transform={`rotate(${i * 22.5})`}
          />
        ))}
        {/* 前层花瓣 */}
        {[...Array(16)].map((_, i) => (
          <ellipse
            key={`f-${i}`}
            cx="0" cy="-40" rx="5" ry="20"
            fill="#FCD34D"
            transform={`rotate(${i * 22.5 + 11})`}
          />
        ))}
        
        {/* 花盘外圈 */}
        <circle r="35" fill="#78350F" />
        {/* 花盘内圈 (种子区) */}
        <circle r="25" fill="#92400E" />
        
        {/* 种子质感点缀 */}
        <circle cx="-10" cy="-10" r="2" fill="#78350F" opacity="0.5" />
        <circle cx="10" cy="-10" r="2" fill="#78350F" opacity="0.5" />
        <circle cx="0" cy="15" r="2" fill="#78350F" opacity="0.5" />

        <SubtleFace isThirsty={isThirsty} mood={mood} x={0} y={0} scale={1.2} />
      </g>
    </motion.g>
  );
};

// 5. 龟背竹 (Monstera) - 阔叶，裂纹
export const Monstera = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  const swayTransition = {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  return (
    <g>
      {/* 茎 */}
      <path d="M100 180 Q90 140 80 120" stroke={colors.stalk} strokeWidth="4" fill="none" />
      <path d="M100 180 Q110 150 130 130" stroke={colors.stalk} strokeWidth="4" fill="none" />

      {/* 左侧叶 */}
      <motion.g
        initial={{ rotate: -10 }}
        animate={{ rotate: [-12, -8, -12] }}
        transition={swayTransition}
        style={{ originX: '80px', originY: '120px' }}
      >
        <path
          d="M80 120 C60 100 40 110 30 130 C40 150 70 140 80 120"
          fill={colors.leaf}
          filter="brightness(0.9)"
        />
      </motion.g>

      {/* 右侧大叶 (带裂口) */}
      <motion.g
        initial={{ rotate: 10 }}
        animate={{ rotate: [8, 12, 8] }}
        transition={swayTransition}
        style={{ originX: '130px', originY: '130px' }}
      >
        <path
          d="M130 130 C110 100 130 60 160 60 C190 60 200 100 180 130 C160 150 140 150 130 130 Z"
          fill={colors.leaf}
        />
        {/* 裂口 - 使用蒙版色块模拟 */}
        <path d="M175 75 Q165 80 175 85 L190 80 Z" fill="#FFF" fillOpacity="1" style={{ mixBlendMode: 'destination-out' as any }} />
        <path d="M170 95 Q160 100 170 105 L185 100 Z" fill="#FFF" fillOpacity="1" style={{ mixBlendMode: 'destination-out' as any }} />
        
        {/* 叶脉 */}
        <path d="M160 60 Q165 95 155 130" stroke="#FFF" strokeOpacity="0.2" strokeWidth="1" fill="none" />

        <SubtleFace isThirsty={isThirsty} mood={mood} x={155} y={100} rotate={-10} />
      </motion.g>
    </g>
  );
};

// 6. 虎皮兰 (Snake Plant) - 挺拔，金边
export const SnakePlant = ({ mood, isThirsty, colors }: PlantCharacterProps) => {
  return (
    <g>
      {/* 阴影 */}
      <ellipse cx="100" cy="170" rx="20" ry="5" fill="#000" opacity="0.1" />

      {/* 后排叶子 */}
      <path
        d="M90 170 Q80 110 85 70 L90 50 L95 70 Q100 110 90 170"
        fill={colors.leaf}
        stroke="#FDE047" strokeWidth="1"
        filter="brightness(0.8)"
      />
      <path
        d="M110 170 Q120 110 115 70 L110 50 L105 70 Q100 110 110 170"
        fill={colors.leaf}
        stroke="#FDE047" strokeWidth="1"
        filter="brightness(0.8)"
      />

      {/* 前排主叶 */}
      <motion.g
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 1.01, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ originY: '170px' }}
      >
        <path
          d="M100 170 Q85 100 100 40 Q115 100 100 170"
          fill={colors.leaf}
        />
        {/* 金边 */}
        <path
          d="M100 170 Q85 100 100 40 Q115 100 100 170"
          fill="none"
          stroke="#FDE047"
          strokeWidth="2"
          opacity="0.8"
        />
        
        {/* 横纹 */}
        <path d="M92 140 H108 M90 120 H110 M89 100 H111 M90 80 H110 M94 60 H106" 
          stroke="#FFF" strokeOpacity="0.2" strokeWidth="2" 
        />

        <SubtleFace isThirsty={isThirsty} mood={mood} x={100} y={110} />
      </motion.g>
    </g>
  );
};
