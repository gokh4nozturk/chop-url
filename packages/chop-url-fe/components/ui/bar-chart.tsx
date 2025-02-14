'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ['primary'],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data}>
        {showXAxis && <XAxis dataKey={index} />}
        {showYAxis && <YAxis />}
        {showTooltip && <Tooltip formatter={valueFormatter} />}
        {categories?.map((category, i) => (
          <Bar
            key={category}
            dataKey="value"
            fill={`hsl(var(--${colors[i % colors.length]}))`}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
