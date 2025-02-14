'use client';

import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AreaChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  index: string;
  categories: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
}

export function AreaChart({
  data,
  index,
  categories,
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
}: AreaChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data}>
        {showXAxis && (
          <XAxis
            dataKey={index}
            stroke={isDark ? '#a1a1aa' : '#71717a'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
        )}
        {showYAxis && (
          <YAxis
            stroke={isDark ? '#a1a1aa' : '#71717a'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
        )}
        {showTooltip && (
          <Tooltip
            formatter={valueFormatter}
            contentStyle={{
              backgroundColor: isDark ? 'hsl(var(--background))' : 'white',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              color: isDark ? 'white' : 'black',
            }}
          />
        )}
        {categories?.map((category, i) => (
          <Area
            key={category}
            type="monotone"
            dataKey="value"
            stroke={isDark ? '#60a5fa' : '#2563eb'}
            fill={isDark ? '#60a5fa' : '#2563eb'}
            fillOpacity={0.2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
