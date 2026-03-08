import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer 
} from 'recharts';

interface EmotionalRadarChartProps {
  dimensions?: {
    healing: number;
    companion: number;
    vitality: number;
    beauty: number;
    growth: number;
  };
}

export const EmotionalRadarChart = ({ dimensions }: EmotionalRadarChartProps) => {
  const data = [
    { subject: '治愈力', A: dimensions?.healing ?? 80, fullMark: 100 },
    { subject: '陪伴感', A: dimensions?.companion ?? 70, fullMark: 100 },
    { subject: '生命力', A: dimensions?.vitality ?? 85, fullMark: 100 },
    { subject: '美感', A: dimensions?.beauty ?? 75, fullMark: 100 },
    { subject: '成长性', A: dimensions?.growth ?? 90, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 -mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }} 
          />
          <Radar
            name="Plant"
            dataKey="A"
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
