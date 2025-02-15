import { Card, CardContent } from '@/components/ui/card';
import { WorldMap } from '@/components/ui/world-map';
import { AreaChart } from './area-chart';
import { BarChart } from './bar-chart';
import { HorizontalBarChart } from './horizontal-bar-chart';
import { PieChart } from './pie-chart';
import { TreemapChart } from './treemap-chart';

interface ChartGroupProps {
  timeSeriesData: Array<{ name: string; value: number }>;
  deviceData: Array<{ name: string; value: number }>;
  browserData: Array<{ name: string; value: number }>;
  osData: Array<{ name: string; value: number }>;
  sourceData: Array<{ name: string; value: number }>;
  campaignData: Array<{ name: string; value: number }>;
  countryData: Array<{ name: string; value: number }>;
  cityData: Array<{ name: string; value: number }>;
  loading: boolean;
  totalEvents: number;
  sections?: Array<'timeSeries' | 'devices' | 'traffic' | 'geography'>;
}

export function ChartGroup({
  timeSeriesData,
  deviceData,
  browserData,
  osData,
  sourceData,
  campaignData,
  countryData,
  cityData,
  loading,
  totalEvents,
  sections = ['timeSeries', 'devices', 'traffic', 'geography'],
}: ChartGroupProps) {
  const percentageFormatter = (value: number) =>
    `${((value / (totalEvents || 1)) * 100).toFixed(1)}%`;

  const renderTimeSeries = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <AreaChart
            data={timeSeriesData}
            valueFormatter={(value) => `${value} clicks`}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <WorldMap
            data={Object.fromEntries(
              countryData.map(({ name, value }) => [name, value])
            )}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderDevices = () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <PieChart
            data={deviceData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Device Distribution"
            subtitle="Distribution of clicks by device type"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <PieChart
            data={browserData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Browser Distribution"
            subtitle="Distribution of clicks by browser"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <PieChart
            data={osData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Operating System"
            subtitle="Distribution of clicks by OS"
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderTraffic = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <TreemapChart
            data={sourceData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Traffic Sources"
            description="Distribution of traffic by source"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <TreemapChart
            data={campaignData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Campaigns"
            description="Distribution of traffic by campaign"
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderGeography = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <BarChart
            data={countryData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Top Countries"
            description="Distribution of traffic by country"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <BarChart
            data={cityData}
            valueFormatter={percentageFormatter}
            loading={loading}
            title="Top Cities"
            description="Distribution of traffic by city"
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {sections.includes('timeSeries') && renderTimeSeries()}
      {sections.includes('devices') && renderDevices()}
      {sections.includes('traffic') && renderTraffic()}
      {sections.includes('geography') && renderGeography()}
    </div>
  );
}
