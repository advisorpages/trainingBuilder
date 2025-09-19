import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RegistrationData {
  period: string;
  registrations: number;
  sessions: number;
}

interface RegistrationBarChartProps {
  data: RegistrationData[];
  loading?: boolean;
  timeRange?: 'day' | 'week' | 'month';
}

const RegistrationBarChart: React.FC<RegistrationBarChartProps> = ({
  data,
  loading = false,
  timeRange = 'month'
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
          <div className="text-3xl mb-2">📊</div>
          <p>No registration data available</p>
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
            <p className="text-green-600">
              <span className="font-medium">Registrations:</span> {data.registrations}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Sessions:</span> {data.sessions}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Avg per Session:</span> {
                data.sessions > 0 ? (data.registrations / data.sessions).toFixed(1) : '0'
              }
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    switch (timeRange) {
      case 'day':
        return 'Daily Registration Counts';
      case 'week':
        return 'Weekly Registration Counts';
      case 'month':
      default:
        return 'Monthly Registration Counts';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{getTitle()}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="period"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="registrations"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegistrationBarChart;