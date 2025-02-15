import { ChoroplethBoundFeature, ResponsiveChoropleth } from '@nivo/geo';
import { CHART_TOOLTIP_STYLES } from './constants';
import worldCountries from './data/world-countries.json';

const countryNameToCode: Record<string, string> = {
  'United States': 'USA',
  'United Kingdom': 'GBR',
  Turkey: 'TUR',
  Germany: 'DEU',
  France: 'FRA',
  Spain: 'ESP',
  Italy: 'ITA',
  Netherlands: 'NLD',
  Russia: 'RUS',
  China: 'CHN',
  Japan: 'JPN',
  India: 'IND',
  Brazil: 'BRA',
  Canada: 'CAN',
  Australia: 'AUS',
};

const countryCodeToName = Object.entries(countryNameToCode).reduce(
  (acc, [name, code]) => Object.assign(acc, { [code]: name }),
  {} as Record<string, string>
);

interface ChoroplethMapProps {
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  title: string;
  description?: string;
}

export function ChoroplethMap({
  data,
  valueFormatter = (value) => `${value}`,
  loading = false,
  title,
  description,
}: ChoroplethMapProps) {
  if (loading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  console.log('ChoroplethMap data:', data);
  console.log(
    'Available country IDs:',
    worldCountries.features.map((f) => f.id)
  );

  // Convert country names to ISO codes
  const mapData = data.map((item) => ({
    id: countryNameToCode[item.name] || item.name.toUpperCase(),
    value: item.value,
    formattedValue: valueFormatter(item.value),
  }));

  console.log('Mapped data:', mapData);

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="h-[360px]">
        <ResponsiveChoropleth
          data={mapData}
          features={worldCountries.features}
          margin={{ top: 20, right: 40, bottom: 60, left: 40 }}
          colors="spectral"
          domain={[0, maxValue]}
          unknownColor="#F4F4F4"
          label="properties.name"
          valueFormat=".2s"
          projectionTranslation={[0.5, 0.5]}
          projectionRotation={[0, 0, 0]}
          enableGraticule={true}
          graticuleLineColor="rgba(0, 0, 0, .2)"
          borderWidth={0.5}
          borderColor="#152538"
          legends={[
            {
              anchor: 'bottom-left',
              direction: 'column',
              justify: true,
              translateX: 20,
              translateY: -20,
              itemsSpacing: 0,
              itemWidth: 94,
              itemHeight: 18,
              itemDirection: 'left-to-right',
              itemTextColor: 'var(--foreground)',
              itemOpacity: 0.85,
              symbolSize: 18,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: 'var(--foreground)',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          tooltip={({ feature }: { feature: ChoroplethBoundFeature }) => {
            if (!feature.data) return null;
            const name = countryCodeToName[feature.data.id] || feature.data.id;
            return (
              <div className={CHART_TOOLTIP_STYLES.wrapper}>
                <p className={CHART_TOOLTIP_STYLES.title}>{name}</p>
                <p className={CHART_TOOLTIP_STYLES.value}>
                  {feature.data.formattedValue}
                </p>
              </div>
            );
          }}
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
