'use client';

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

export function PieChart({
  data,
  colors = ['primary', 'secondary', 'accent', 'muted'],
  valueFormatter = (value: number) => value.toString(),
  showTooltip = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        {showTooltip && (
          <Tooltip
            formatter={valueFormatter}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
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
          stroke="hsl(var(--background))"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={`hsl(var(--${
                colors[data.indexOf(entry) % colors.length]
              }))`}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
