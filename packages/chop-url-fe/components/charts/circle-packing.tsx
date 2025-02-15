import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import { CHART_COLORS, CHART_TOOLTIP_STYLES } from './constants';

interface CirclePackingProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  title: string;
  description?: string;
}

export function CirclePacking({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
  title,
  description,
}: CirclePackingProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Transform data for circle packing
  const transformedData = {
    name: 'cities',
    value: data.reduce((sum, item) => sum + item.value, 0),
    children: data.map((item) => ({
      name: item.name,
      value: item.value,
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
        <ResponsiveCirclePacking
          data={transformedData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          id="name"
          value="value"
          colors={CHART_COLORS.light}
          colorBy="depth"
          inheritColorFromParent={false}
          enableLabels={true}
          labelsFilter={() => true}
          labelsSkipRadius={8}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 3]],
          }}
          borderWidth={2}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.3]],
          }}
          animate={true}
          motionConfig="gentle"
          tooltip={({ data }) => (
            <div className={CHART_TOOLTIP_STYLES.wrapper}>
              <p className={CHART_TOOLTIP_STYLES.title}>{data.name}</p>
              <p className={CHART_TOOLTIP_STYLES.value}>
                {data.value ? valueFormatter(data.value) : ''}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
