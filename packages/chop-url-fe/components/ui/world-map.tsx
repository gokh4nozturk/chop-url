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
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <VectorMap
        map={worldMill}
        backgroundColor="transparent"
        zoomOnScroll={true}
        zoomMax={12}
        zoomMin={1}
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
              scale: isDark
                ? ['#1d4ed8', '#3b82f6', '#60a5fa']
                : ['#1e40af', '#2563eb', '#93c5fd'],
              normalizeFunction: 'polynomial',
            },
          ],
        }}
        regionStyle={{
          initial: {
            fill: isDark ? '#27272a' : '#e5e7eb',
            fillOpacity: 1,
            stroke: isDark ? '#18181b' : '#d1d5db',
            strokeWidth: 0.5,
            strokeOpacity: 1,
          },
          hover: {
            fillOpacity: 0.8,
            cursor: 'pointer',
            stroke: isDark ? '#3b82f6' : '#1e40af',
            strokeWidth: 1,
            transition: 'all 250ms ease-in-out',
          },
          selected: {
            fill: isDark ? '#3b82f6' : '#1e40af',
            stroke: isDark ? '#60a5fa' : '#2563eb',
            strokeWidth: 1,
          },
          selectedHover: {
            fillOpacity: 1,
            stroke: isDark ? '#60a5fa' : '#1e40af',
            strokeWidth: 1.5,
            transition: 'all 250ms ease-in-out',
          },
        }}
      />
    </div>
  );
}
