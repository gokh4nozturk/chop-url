'use client';

import { useTheme } from 'next-themes';
import {
  Cell,
  Legend,
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
  valueFormatter?: (value: number) => string;
  showTooltip?: boolean;
}

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
    };
  }>;
  total: number;
  valueFormatter: (value: number) => string;
}

const COLORS = {
  light: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#84cc16'],
  dark: ['#60a5fa', '#a78bfa', '#fb7185', '#fdba74', '#bef264'],
};

const CustomTooltip = ({
  active,
  payload,
  total,
  valueFormatter,
}: CustomTooltipProps) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const percentage = ((data.value / total) * 100).toFixed(1);

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <p
        style={{
          color: 'hsl(var(--foreground))',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '4px',
        }}
      >
        {data.name}
      </p>
      <p
        style={{
          color: 'hsl(var(--muted-foreground))',
          fontSize: '12px',
        }}
      >
        {valueFormatter(data.value)} ({percentage}%)
      </p>
    </div>
  );
};

export function PieChart({
  data,
  valueFormatter = (value: number) => value.toString(),
  showTooltip = true,
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
    name,
  }: CustomizedLabelProps) => {
    if (percent < 0.15) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isDark ? 'white' : 'black'}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          opacity: 0.9,
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '20px',
            fontWeight: 600,
            fill: isDark ? '#e4e4e7' : '#3f3f46',
          }}
        >
          {total}
        </text>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={2}
          cornerRadius={4}
          strokeWidth={1}
          stroke={isDark ? 'hsl(var(--background))' : 'white'}
          labelLine={false}
          label={renderCustomizedLabel}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={colors[index % colors.length]}
              style={{
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))',
                opacity: 0.9,
              }}
            />
          ))}
        </Pie>
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: '24px',
          }}
          iconSize={8}
          iconType="circle"
          formatter={(value) => (
            <span
              style={{
                color: isDark ? '#e4e4e7' : '#3f3f46',
                fontSize: '11px',
                display: 'inline-block',
                padding: '0 8px',
                opacity: 0.8,
              }}
            >
              {value}
            </span>
          )}
        />
        {showTooltip && (
          <Tooltip
            content={
              <CustomTooltip total={total} valueFormatter={valueFormatter} />
            }
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
