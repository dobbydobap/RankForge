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
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a38" />
          <XAxis
            dataKey="minute"
            stroke="#6A6A67"
            fontSize={10}
            tickFormatter={(v) => `${v}m`}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#6A6A67" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1c1b",
              border: "1px solid #3a3a38",
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(v) => `Minute ${v}`}
          />
          <Bar dataKey="submissions" fill="#3f3f46" name="Submissions" />
          <Bar dataKey="accepted" fill="#C1C1A9" name="Accepted" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
