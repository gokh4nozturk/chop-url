import { ResponsiveTreeMap } from '@nivo/treemap';
import { CHART_COLORS, CHART_TOOLTIP_STYLES } from './constants';

export interface TreemapChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  title: string;
  description?: string;
  loading?: boolean;
}

interface TreemapData {
  id: string;
  value: number;
  color: string;
  formattedValue: string;
}

export function TreemapChart({
  data,
  valueFormatter = (value) => `${value}`,
  title,
  description,
  loading = false,
}: TreemapChartProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Sort data by value in descending order and transform for treemap
  const treeData = {
    id: 'root',
    children: [...data]
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        id: item.name,
        value: item.value,
        color: CHART_COLORS.treemap[index % CHART_COLORS.treemap.length],
        formattedValue: valueFormatter(item.value),
      })),
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="h-[350px]">
        <ResponsiveTreeMap
          data={treeData}
          identity="id"
          value="value"
          valueFormat={valueFormatter}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          labelSkipSize={36}
          label={(node: unknown) => (node as { data: { id: string } }).data.id}
          tooltip={({ node }: { node: unknown }) => {
            const data = (node as { data: TreemapData }).data;
            return (
              <div className={CHART_TOOLTIP_STYLES.wrapper}>
                <p className={CHART_TOOLTIP_STYLES.title}>{data.id}</p>
                <p className={CHART_TOOLTIP_STYLES.value}>
                  {data.formattedValue}
                </p>
              </div>
            );
          }}
          theme={{
            labels: {
              text: {
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                fill: 'var(--foreground)',
              },
            },
          }}
          colors={(node: unknown) =>
            (node as { data: { color: string } }).data.color
          }
          colorBy="id"
          nodeOpacity={1}
          borderWidth={2}
          borderColor="var(--background)"
          animate={true}
          motionConfig="gentle"
        />
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        {treeData.children.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">
              {item.id} ({item.formattedValue})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
