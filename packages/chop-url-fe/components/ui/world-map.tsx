'use client';

import { VectorMap } from '@react-jvectormap/core';
import { worldMill } from '@react-jvectormap/world';
import { useTheme } from 'next-themes';

interface WorldMapProps {
  data: Record<string, number>;
  onRegionClick?: (code: string) => void;
}

export function WorldMap({ data, onRegionClick }: WorldMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[400px] w-full">
      <VectorMap
        map={worldMill}
        backgroundColor="transparent"
        zoomOnScroll={false}
        style={{
          width: '100%',
          height: '400px',
        }}
        onRegionClick={(_, code: string) => onRegionClick?.(code)}
        series={{
          regions: [
            {
              attribute: 'fill',
              values: data,
              scale: isDark ? ['#3b82f6', '#60a5fa'] : ['#93c5fd', '#2563eb'],
              normalizeFunction: 'polynomial',
            },
          ],
        }}
        regionStyle={{
          initial: {
            fill: isDark ? '#27272a' : '#f4f4f5',
            fillOpacity: 1,
            stroke: isDark ? '#18181b' : '#e4e4e7',
            strokeWidth: 1,
            strokeOpacity: 0.5,
          },
          hover: {
            fillOpacity: 0.8,
            cursor: 'pointer',
            stroke: isDark ? '#3b82f6' : '#2563eb',
            strokeWidth: 2,
          },
          selected: {
            fill: isDark ? '#60a5fa' : '#2563eb',
          },
          selectedHover: {
            stroke: isDark ? '#3b82f6' : '#2563eb',
            strokeWidth: 2,
          },
        }}
      />
    </div>
  );
}
