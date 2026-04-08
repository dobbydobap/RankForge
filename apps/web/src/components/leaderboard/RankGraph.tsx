'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RankGraphProps {
  frames: {
    minute: number;
    standings: { userId: string; username: string; rank: number; score: number }[];
  }[];
  users: { userId: string; username: string }[];
  /** Which users to highlight (show all if empty) */
  highlightUsers?: string[];
  mode: 'rank' | 'score';
}

const COLORS = [
  '#C1C1A9', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

export function RankGraph({ frames, users, highlightUsers, mode }: RankGraphProps) {
  // Transform frames into chart data
  const chartData = frames.map((frame) => {
    const point: any = { minute: frame.minute };
    for (const standing of frame.standings) {
      const key = standing.username;
      point[key] = mode === 'rank' ? standing.rank : standing.score;
    }
    return point;
  });

  const displayUsers = highlightUsers?.length
    ? users.filter((u) => highlightUsers.includes(u.userId))
    : users.slice(0, 10); // max 10 lines

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
          <XAxis
            dataKey="minute"
            stroke="#555555"
            fontSize={11}
            tickFormatter={(v) => `${v}m`}
          />
          <YAxis
            stroke="#555555"
            fontSize={11}
            reversed={mode === 'rank'}
            domain={mode === 'rank' ? [1, 'auto'] : [0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(v) => `Minute ${v}`}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {displayUsers.map((user, idx) => (
            <Line
              key={user.userId}
              type="stepAfter"
              dataKey={user.username}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
