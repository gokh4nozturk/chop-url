import {
  AreaChart as RechartsAreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, CHART_GRID_CLASSNAMES } from './constants';
import { ChartTooltip } from './tooltip';

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter: (value: number) => string;
  title: string;
  description?: string;
  loading?: boolean;
}

export function BarChart({
  data,
  valueFormatter,
  title,
  description,
  loading,
}: BarChartProps) {
  if (loading) {
    return <div className="h-[350px] animate-pulse bg-muted" />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <RechartsAreaChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            className={CHART_GRID_CLASSNAMES.stroke}
          />
          <XAxis
            type="number"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 'dataMax']}
            className={CHART_GRID_CLASSNAMES.fill}
          />
          <YAxis
            type="category"
            dataKey="name"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={100}
            className={CHART_GRID_CLASSNAMES.fill}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} valueFormatter={valueFormatter} />
            )}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS.light[index % CHART_COLORS.light.length]}
                className="hover:opacity-80"
              />
            ))}
          </Bar>
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
