import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, CHART_GRID_CLASSNAMES } from './constants';
import { ChartTooltip } from './tooltip';

export interface AreaChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
}

export function AreaChart({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
}: AreaChartProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={CHART_COLORS.light[0]}
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor={CHART_COLORS.light[0]}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          className={CHART_GRID_CLASSNAMES.stroke}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
          className={CHART_GRID_CLASSNAMES.fill}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dx={-10}
          className={CHART_GRID_CLASSNAMES.fill}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip {...props} valueFormatter={valueFormatter} />
          )}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.light[0]}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
