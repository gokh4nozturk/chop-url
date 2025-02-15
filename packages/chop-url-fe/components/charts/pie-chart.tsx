import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_COLORS } from './constants';
import { ChartTooltip } from './tooltip';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter: (value: number) => string;
  title: string;
  subtitle: string;
}

export function PieChart({
  data,
  valueFormatter,
  title,
  subtitle,
}: PieChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              cornerRadius={6}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS.light[index % CHART_COLORS.light.length]}
                  className="stroke-background hover:opacity-80"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-bold"
            >
              {total}
            </text>
            <Tooltip
              content={(props) => (
                <ChartTooltip {...props} valueFormatter={valueFormatter} />
              )}
            />
            <Legend
              verticalAlign="bottom"
              height={50}
              content={({ payload }) => {
                if (!payload) return null;
                return (
                  <div className="mt-2 flex max-h-[60px] flex-wrap items-start justify-center gap-2 overflow-y-auto px-4 text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
                    {payload.map((entry) => (
                      <div
                        key={entry.value}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted/50"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
