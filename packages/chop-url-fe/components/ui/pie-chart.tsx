'use client';

import { useTheme } from 'next-themes';
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showTooltip?: boolean;
}

const COLORS = {
  light: ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#65a30d'],
  dark: ['#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#a3e635'],
};

export function PieChart({
  data,
  valueFormatter = (value: number) => value.toString(),
  showTooltip = true,
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
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
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={60}
          paddingAngle={2}
          strokeWidth={2}
          stroke={isDark ? 'hsl(var(--background))' : 'white'}
          label={(entry) => entry.name}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={colors[index % colors.length]}
              style={{
                filter: isDark ? 'brightness(1.2)' : 'brightness(1)',
                opacity: 0.9,
              }}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
