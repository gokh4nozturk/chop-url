import { Card, CardContent } from '@/components/ui/card';
import { WorldMap } from '@/components/ui/world-map';
import { AreaChart } from './area-chart';
import { BarChart } from './bar-chart';
import { PieChart } from './pie-chart';

interface ChartData {
  name: string;
  value: number;
}

interface ChartGroupProps {
  timeSeriesData?: Array<ChartData>;
  deviceData?: Record<string, number>;
  browserData?: Record<string, number>;
  osData?: Record<string, number>;
  sourceData?: Record<string, number>;
  campaignData?: Record<string, number>;
  countryData?: Record<string, number>;
  cityData?: Record<string, number>;
  loading?: boolean;
  totalEvents?: number;
}

export function ChartGroup({
  timeSeriesData = [],
  deviceData = {},
  browserData = {},
  osData = {},
  sourceData = {},
  campaignData = {},
  countryData = {},
  cityData = {},
  loading = false,
  totalEvents = 0,
}: ChartGroupProps) {
  const percentageFormatter = (value: number) =>
    `${((value / (totalEvents || 1)) * 100).toFixed(1)}%`;

  return (
    <>
      {/* Time Series and Map */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <AreaChart
              data={timeSeriesData}
              valueFormatter={(value) => `${value} clicks`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <WorldMap data={countryData} />
          </CardContent>
        </Card>
      </div>

      {/* Device, Browser, OS Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <PieChart
              data={Object.entries(deviceData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Device Distribution"
              subtitle="Distribution of clicks by device type"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <PieChart
              data={Object.entries(browserData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Browser Distribution"
              subtitle="Distribution of clicks by browser"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <PieChart
              data={Object.entries(osData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Operating System"
              subtitle="Distribution of clicks by OS"
            />
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources and Campaigns */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <BarChart
              data={Object.entries(sourceData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Traffic Sources"
              description="Distribution of traffic by source"
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <BarChart
              data={Object.entries(campaignData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Campaigns"
              description="Distribution of traffic by campaign"
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <BarChart
              data={Object.entries(countryData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Top Countries"
              description="Distribution of traffic by country"
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <BarChart
              data={Object.entries(cityData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }))}
              valueFormatter={percentageFormatter}
              title="Top Cities"
              description="Distribution of traffic by city"
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
