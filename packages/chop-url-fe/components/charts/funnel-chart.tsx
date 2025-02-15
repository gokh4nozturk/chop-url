import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CHART_COLORS, CHART_GRID_CLASSNAMES } from './constants';
import { ChartTooltip } from './tooltip';

export interface FunnelChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  title: string;
  description?: string;
  loading?: boolean;
}

export function FunnelChart({
  data,
  valueFormatter = (value) => `${value}`,
  title,
  description,
  loading = false,
}: FunnelChartProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Calculate max value for scaling
  const maxValue = sortedData[0]?.value || 0;

  // Transform data for funnel visualization
  const funnelData = sortedData.map((item, index) => ({
    ...item,
    // Scale the bar width based on value
    value: item.value,
    // Center the bars by adding left padding
    padding: (maxValue - item.value) / 2,
    fill: CHART_COLORS.light[index % CHART_COLORS.light.length],
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={funnelData}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 120 }}
        >
          <XAxis type="number" hide domain={[0, maxValue]} />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} valueFormatter={valueFormatter} />
            )}
          />
          {/* Padding bars to center the funnel */}
          <Bar dataKey="padding" stackId="stack" fill="transparent" />
          {/* Actual value bars */}
          <Bar dataKey="value" stackId="stack" radius={[4, 4, 4, 4]}>
            {funnelData.map((entry, index) => (
              <rect
                key={entry.name}
                fill={entry.fill}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        {funnelData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground">
              {item.name} ({valueFormatter(item.value)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
