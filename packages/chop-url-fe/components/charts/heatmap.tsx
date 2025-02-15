import { ResponsiveHeatMap } from '@nivo/heatmap';
import { CHART_COLORS, CHART_TOOLTIP_STYLES } from './constants';

interface HeatmapProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  title: string;
  description?: string;
}

export function Heatmap({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
  title,
  description,
}: HeatmapProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  const heatmapData = data.map((item) => ({
    id: item.name,
    data: [{ x: 'value', y: item.value }],
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="h-[350px]">
        <ResponsiveHeatMap
          data={heatmapData}
          margin={{ top: 20, right: 20, bottom: 60, left: 120 }}
          valueFormat={valueFormatter}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          colors={{
            type: 'sequential',
            scheme: 'blues',
          }}
          emptyColor="var(--muted)"
          borderColor="var(--border)"
          labelTextColor="var(--foreground)"
          tooltip={({ cell }) => (
            <div className={CHART_TOOLTIP_STYLES.wrapper}>
              <p className={CHART_TOOLTIP_STYLES.title}>{cell.serieId}</p>
              <p className={CHART_TOOLTIP_STYLES.value}>
                {valueFormatter(cell.data.y)}
              </p>
            </div>
          )}
          theme={{
            text: {
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              fill: 'var(--muted-foreground)',
            },
          }}
        />
      </div>
    </div>
  );
}
