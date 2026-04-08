'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ActivityChartProps {
  data: { minute: number; submissions: number; accepted: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
          <XAxis
            dataKey="minute"
            stroke="#555555"
            fontSize={10}
            tickFormatter={(v) => `${v}m`}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#555555" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(v) => `Minute ${v}`}
          />
          <Bar dataKey="submissions" fill="#3f3f46" name="Submissions" />
          <Bar dataKey="accepted" fill="#d946ef" name="Accepted" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
