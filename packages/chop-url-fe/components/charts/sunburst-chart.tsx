import { ResponsiveSunburst } from '@nivo/sunburst';
import { CHART_COLORS, CHART_TOOLTIP_STYLES } from './constants';

interface SunburstChartProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  title: string;
  description?: string;
}

interface CityData {
  name: string;
  value: number;
  formattedValue: string;
}

interface CountryData {
  cities: CityData[];
  total: number;
}

export function SunburstChart({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
  title,
  description,
}: SunburstChartProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  // Transform data for sunburst
  const transformedData = {
    name: 'locations',
    value: data.reduce((sum, item) => sum + item.value, 0),
    formattedValue: valueFormatter(
      data.reduce((sum, item) => sum + item.value, 0)
    ),
    children: Object.entries(
      data.reduce(
        (acc, item) => {
          const [city, country] = item.name.split(', ');
          const countryName = country || 'Unknown';

          if (!acc[countryName]) {
            acc[countryName] = {
              cities: [],
              total: 0,
            };
          }

          acc[countryName].cities.push({
            name: city,
            value: item.value,
            formattedValue: valueFormatter(item.value),
          });
          acc[countryName].total += item.value;

          return acc;
        },
        {} as Record<string, CountryData>
      )
    )
      .map(([country, data]) => ({
        name: country,
        value: data.total,
        formattedValue: valueFormatter(data.total),
        children: data.cities.sort((a, b) => b.value - a.value),
      }))
      .sort((a, b) => b.value - a.value),
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
        <ResponsiveSunburst
          data={transformedData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="name"
          value="value"
          cornerRadius={3}
          borderWidth={1}
          borderColor="var(--background)"
          colors={CHART_COLORS.light}
          inheritColorFromParent={true}
          childColor={{
            from: 'color',
            modifiers: [['brighter', 0.2]],
          }}
          enableArcLabels={true}
          arcLabel={(node) =>
            node.depth === 0
              ? 'Total'
              : `${node.data.name} (${node.data.formattedValue})`
          }
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 3]],
          }}
          transitionMode="pushIn"
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
