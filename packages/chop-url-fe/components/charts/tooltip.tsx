import { TooltipProps } from 'recharts';
import { CHART_TOOLTIP_STYLES } from './constants';

type ValueType = string | number | Array<string | number>;
type NameType = string | number;

export function ChartTooltip({
  active,
  payload,
  valueFormatter,
}: TooltipProps<ValueType, NameType> & {
  valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as { name: string; value: number };

  return (
    <div className={CHART_TOOLTIP_STYLES.wrapper}>
      <p className={CHART_TOOLTIP_STYLES.title}>{data.name}</p>
      <p className={CHART_TOOLTIP_STYLES.value}>{valueFormatter(data.value)}</p>
    </div>
  );
}
