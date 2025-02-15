'use client';

import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
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
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? '#27272a' : '#e4e4e7'}
          vertical={false}
        />
        {showXAxis && (
          <XAxis
            dataKey={index}
            stroke={isDark ? '#a1a1aa' : '#71717a'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
        )}
        {showYAxis && (
          <YAxis
            stroke={isDark ? '#a1a1aa' : '#71717a'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`;
              }
              return value;
            }}
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
              fontSize: '12px',
              padding: '8px',
            }}
            cursor={{
              stroke: isDark ? '#a1a1aa' : '#71717a',
              strokeWidth: 1,
              strokeDasharray: '3 3',
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
            strokeWidth={2}
            dot={{
              stroke: isDark ? '#60a5fa' : '#2563eb',
              fill: isDark ? '#18181b' : 'white',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              stroke: isDark ? '#60a5fa' : '#2563eb',
              fill: isDark ? '#60a5fa' : '#2563eb',
              strokeWidth: 2,
              r: 6,
            }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
