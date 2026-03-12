import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { Succulent, Cactus, Pothos, Sunflower, Monstera, SnakePlant } from './PlantCharacters';

interface PlantAvatarProps {
  health?: number;
  humidity?: number;
  temp?: number;
  mood?: string;
  theme?: 'kinship' | 'romance' | 'friendship' | 'solo';
  type?: 'succulent' | 'cactus' | 'pothos' | 'sunflower' | 'monstera' | 'snakeplant' | 'fern'; // fern mapped to pothos for now
  className?: string;
  size?: number;
  isWatering?: boolean;
  isFertilizing?: boolean;
}

export function PlantAvatar({ 
  health = 100, 
  humidity = 50, 
  temp = 25, 
  mood = 'happy', 
  theme = 'solo',
  type = 'succulent',
  className,
  size = 300,
  isWatering = false,
  isFertilizing = false
}: PlantAvatarProps) {
  
  // Calculate visual properties based on sensor data
  const isThirsty = humidity < 30;
  const isHot = temp > 32;
  const isHealthy = health > 80;
  
  // Color palette based on theme
  const colors = {
    kinship: { leaf: '#FFBB00', stalk: '#FF8800', glow: 'rgba(255, 187, 0, 0.4)' },
    romance: { leaf: '#FF77BC', stalk: '#E11D48', glow: 'rgba(255, 119, 188, 0.4)' },
    friendship: { leaf: '#4ADE80', stalk: '#166534', glow: 'rgba(74, 222, 128, 0.4)' },
    solo: { leaf: '#5EEAD4', stalk: '#0F766E', glow: 'rgba(94, 234, 212, 0.4)' },
  }[theme] || { leaf: '#2F4F4F', stalk: '#1E293B', glow: 'rgba(47, 79, 79, 0.2)' };

  const renderPlantCharacter = () => {
    const props = { mood, isThirsty, isHealthy, isWatering, isFertilizing, colors };
    
    switch (type) {
      case 'cactus':
        return <Cactus {...props} />;
      case 'fern':
      case 'pothos':
        return <Pothos {...props} />;
      case 'sunflower':
        return <Sunflower {...props} />;
      case 'monstera':
        return <Monstera {...props} />;
      case 'snakeplant':
        return <SnakePlant {...props} />;
      case 'succulent':
      default:
        return <Succulent {...props} />;
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Background Glow */}
      <Motion.div 
        animate={{ 
          scale: isFertilizing ? [1, 1.4, 1] : [1, 1.1, 1],
          opacity: isFertilizing ? [0.6, 0.9, 0.6] : [0.3, 0.6, 0.3],
          backgroundColor: isFertilizing ? '#F59E0B' : (isWatering ? '#3B82F6' : colors.glow)
        }}
        transition={{ duration: isFertilizing || isWatering ? 1 : 4, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-[40px] transition-colors duration-500"
      />

      <Motion.svg 
        width={size} 
        height={size} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        animate={isWatering ? { scale: [1, 1.05, 1], y: [0, -5, 0] } : (isFertilizing ? { scale: [1, 1.1, 1] } : {})}
        transition={{ duration: 0.5, repeat: isWatering || isFertilizing ? Infinity : 0 }}
      >
        {/* Pot */}
        <rect x="70" y="160" width="60" height="30" rx="4" fill="#E5E7EB" />
        <rect x="65" y="155" width="70" height="10" rx="2" fill="#D1D5DB" />
        
        {/* Plant Character */}
        {renderPlantCharacter()}

        {/* Fertilizer Sparkles */}
        {isFertilizing && (
           <Motion.g
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
              {[...Array(6)].map((_, i) => (
                <Motion.circle
                  key={i}
                  r={2 + Math.random() * 2}
                  fill="#FACC15"
                  initial={{ cx: 100, cy: 160, opacity: 1 }}
                  animate={{ 
                    cx: 100 + (Math.random() - 0.5) * 120,
                    cy: 40 + Math.random() * 80,
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeOut" 
                  }}
                />
              ))}
           </Motion.g>
        )}


        {/* Heart icon if Romance mode */}
        {theme === 'romance' && (
          <Motion.path
            d="M100 40C95 35 85 35 80 40C75 45 75 55 80 60L100 80L120 60C125 55 125 45 120 40C115 35 105 35 100 40Z"
            fill="#FF4D4D"
            initial={{ scale: 0 }}
            animate={{ scale: [0.8, 1.2, 0.8], y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Sparkles if Friendship mode */}
        {theme === 'friendship' && (
          <Motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <circle cx="140" cy="50" r="3" fill="#FACC15" />
            <circle cx="60" cy="80" r="2" fill="#FACC15" />
            <circle cx="160" cy="100" r="4" fill="#FACC15" />
          </Motion.g>
        )}
      </Motion.svg>
      
      {/* Interaction Overlay: Watering Drops */}
      {isWatering && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {[...Array(8)].map((_, i) => (
            <Motion.div
              key={i}
              initial={{ y: -50, x: 50 + Math.random() * (size - 100), opacity: 0 }}
              animate={{ y: size, opacity: [0, 1, 1, 0] }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.1,
                ease: "linear"
              }}
              className="absolute text-blue-400 text-lg"
              style={{ left: 0 }}
            >
              💧
            </Motion.div>
          ))}
        </div>
      )}

      {/* Emotional Overlay: Thirsty Bubbles */}
      {isThirsty && !isWatering && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <Motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: -60, opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 text-blue-400 text-xs font-black"
              style={{ bottom: '40%' }}
            >
              💧
            </Motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
