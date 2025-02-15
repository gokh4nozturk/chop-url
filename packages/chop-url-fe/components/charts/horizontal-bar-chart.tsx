import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, CHART_GRID_CLASSNAMES } from './constants';
import { ChartTooltip } from './tooltip';

export interface HorizontalBarChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  title: string;
  description?: string;
  loading?: boolean;
}

export function HorizontalBarChart({
  data,
  valueFormatter = (value) => `${value}`,
  title,
  description,
  loading = false,
}: HorizontalBarChartProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Sort data by value in descending order
  const sortedData = [...data]
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
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
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, sortedData.length * 50)}
      >
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 120 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            className={CHART_GRID_CLASSNAMES.stroke}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            className={CHART_GRID_CLASSNAMES.fill}
            tickFormatter={valueFormatter}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={100}
            className={CHART_GRID_CLASSNAMES.fill}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} valueFormatter={valueFormatter} />
            )}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 4, 4]}
            label={{
              position: 'right',
              formatter: valueFormatter,
              className: 'fill-muted-foreground text-xs',
            }}
          >
            {sortedData.map((entry) => (
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
        {sortedData.map((item) => (
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
