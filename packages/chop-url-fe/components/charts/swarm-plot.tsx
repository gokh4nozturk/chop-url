import { ResponsiveSwarmPlot } from '@nivo/swarmplot';
import { CHART_COLORS, CHART_TOOLTIP_STYLES } from './constants';

interface SwarmPlotProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  title: string;
  description?: string;
}

export function SwarmPlot({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
  title,
  description,
}: SwarmPlotProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Transform data for swarm plot
  const transformedData = data.map((item) => ({
    id: item.name,
    group: 'cities',
    value: item.value,
    size: item.value,
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
        <ResponsiveSwarmPlot
          data={transformedData}
          groups={['cities']}
          value="value"
          valueScale={{ type: 'linear', min: 0, max: 'auto' }}
          size={{
            key: 'size',
            values: [4, 20],
            sizes: [6, 20],
          }}
          forceStrength={4}
          simulationIterations={100}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.6]],
          }}
          margin={{ top: 20, right: 20, bottom: 20, left: 100 }}
          axisLeft={{
            tickSize: 10,
          }}
          tooltip={({ data }) => (
            <div className={CHART_TOOLTIP_STYLES.wrapper}>
              <p className={CHART_TOOLTIP_STYLES.title}>{data.id}</p>
              <p className={CHART_TOOLTIP_STYLES.value}>
                {valueFormatter(data.value)}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
