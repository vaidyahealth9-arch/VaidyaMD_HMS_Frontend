'use client';

import React from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  fillColor?: string;
  height?: number;
  width?: number;
  className?: string;
}

export default function MiniSparkline({
  data,
  color = '#4f46e5',
  fillColor,
  height = 28,
  width = 80,
  className = '',
}: MiniSparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ height, width }} className={className} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalized points
  const points = data.map((val, idx) => {
    const x = (idx / Math.max(data.length - 1, 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const fill = fillColor || `${color}15`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <path d={areaD} fill={fill} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  );
}

