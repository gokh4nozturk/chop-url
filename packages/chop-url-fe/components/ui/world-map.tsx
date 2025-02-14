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
              scale: isDark
                ? ['hsl(var(--primary) / 0.2)', 'hsl(var(--primary))']
                : ['hsl(var(--primary) / 0.1)', 'hsl(var(--primary))'],
              normalizeFunction: 'polynomial',
            },
          ],
        }}
        regionStyle={{
          initial: {
            fill: isDark
              ? 'hsl(var(--muted))'
              : 'hsl(var(--muted-foreground) / 0.1)',
            fillOpacity: 1,
            stroke: 'none',
            strokeWidth: 0,
            strokeOpacity: 0,
          },
          hover: {
            fillOpacity: 0.8,
            cursor: 'pointer',
          },
          selected: {
            fill: 'hsl(var(--primary))',
          },
          selectedHover: {},
        }}
      />
    </div>
  );
}
