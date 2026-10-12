import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from './ui';
import { faNum, tomanShort } from '@/lib/format';

const PALETTE = ['#0f684c', '#1fa271', '#45bd8b', '#f9a307', '#1d4ed8', '#be185d', '#6d28d9', '#0e7490', '#dc2626', '#64748b'];

const tooltipStyle = {
  contentStyle: {
    direction: 'rtl' as const,
    fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    fontSize: 12,
    borderRadius: 12,
    border: '1px solid #d9dee7',
    boxShadow: '0 8px 24px -12px rgba(16,24,40,.3)',
  },
  labelStyle: { fontWeight: 700, marginBottom: 4 },
};

export const ChartCard = ({
  title,
  subtitle,
  children,
  height = 260,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  action?: React.ReactNode;
}) => (
  <Card>
    <div className="mb-3 flex items-start justify-between gap-2">
      <div>
        <p className="text-[13.5px] font-extrabold text-ink-900 dark:text-ink-50">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>{children as never}</ResponsiveContainer>
    </div>
  </Card>
);

export const SalesAreaChart = ({ data }: { data: { label: string; sales: number; orders: number }[] }) => (
  <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
    <defs>
      <linearGradient id="grad-sales" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1fa271" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#1fa271" stopOpacity={0.03} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf0" vertical={false} />
    <XAxis dataKey="label" reversed tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" />
    <YAxis tickFormatter={(v) => tomanShort(Number(v))} tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" width={78} orientation="right" />
    <Tooltip
      {...tooltipStyle}
      formatter={(v: number, n) => [n === 'sales' ? tomanShort(v) : `${faNum(v)} سفارش`, n === 'sales' ? 'فروش' : 'تعداد سفارش']}
    />
    <Area type="monotone" dataKey="sales" stroke="#0f684c" strokeWidth={2.5} fill="url(#grad-sales)" name="sales" />
  </AreaChart>
);

export const OrdersBarChart = ({ data }: { data: { label: string; orders: number; returns: number }[] }) => (
  <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf0" vertical={false} />
    <XAxis dataKey="label" reversed tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" />
    <YAxis tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" orientation="right" width={44} />
    <Tooltip {...tooltipStyle} formatter={(v: number, n) => [faNum(v), n === 'orders' ? 'سفارش' : 'مرجوعی']} />
    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
    <Bar dataKey="orders" fill="#1fa271" radius={[6, 6, 0, 0]} name="سفارش" />
    <Bar dataKey="returns" fill="#f9a307" radius={[6, 6, 0, 0]} name="مرجوعی" />
  </BarChart>
);

export const CategoryPieChart = ({ data }: { data: { name: string; value: number }[] }) => (
  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={2}>
      {data.map((_, i) => (
        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
      ))}
    </Pie>
    <Tooltip {...tooltipStyle} formatter={(v: number) => tomanShort(v)} />
    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
  </PieChart>
);

export const MultiLineChart = ({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string; color: string }[];
}) => (
  <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf0" vertical={false} />
    <XAxis dataKey="label" reversed tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" />
    <YAxis tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke="#8e9bb1" orientation="right" width={48} />
    <Tooltip {...tooltipStyle} />
    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
    {series.map((s) => (
      <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.4} dot={false} />
    ))}
  </LineChart>
);

export const RadarMetrics = ({ data }: { data: { subject: string; value: number }[] }) => (
  <RadarChart data={data} outerRadius="72%">
    <PolarGrid stroke="#d9dee7" />
    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
    <Radar dataKey="value" stroke="#0f684c" fill="#1fa271" fillOpacity={0.45} />
    <Tooltip {...tooltipStyle} />
  </RadarChart>
);

export { PALETTE };
