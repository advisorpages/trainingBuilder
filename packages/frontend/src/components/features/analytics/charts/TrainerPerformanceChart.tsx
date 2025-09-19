import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrainerData {
  name: string;
  sessionCount: number;
  avgAttendanceRate: number;
  totalRegistrations: number;
}

interface TrainerPerformanceChartProps {
  data: TrainerData[];
  loading?: boolean;
}

const TrainerPerformanceChart: React.FC<TrainerPerformanceChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="animate-pulse text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-2">👨‍🏫</div>
          <p>No trainer data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-blue-600">
              <span className="font-medium">Sessions:</span> {data.sessionCount}
            </p>
            <p className="text-green-600">
              <span className="font-medium">Avg Attendance:</span> {data.avgAttendanceRate}%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Total Registrations:</span> {data.totalRegistrations}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Sort data by session count for better visualization
  const sortedData = [...data].sort((a, b) => b.sessionCount - a.sessionCount);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Trainer Performance</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="horizontal"
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
            tick={{ textAnchor: 'end' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="sessionCount"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-600">
        <p>Bars show session count. Hover for detailed metrics including attendance rates.</p>
      </div>
    </div>
  );
};

export default TrainerPerformanceChart;