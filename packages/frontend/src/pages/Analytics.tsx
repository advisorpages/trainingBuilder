import { useState, useEffect } from 'react';
import KPIKard from '../components/features/analytics/KPIKard';
import DateRangeSelector from '../components/features/analytics/DateRangeSelector';
import { useAuth } from '../contexts/AuthContext';

interface KpiData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'stable';
}

const AnalyticsPage = () => {
  const { token } = useAuth();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('last-30-days');

  useEffect(() => {
    document.title = 'Analytics Dashboard - Training Builder';
  }, []);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/overview?dateRange=${dateRange}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();

        const formattedData: KpiData[] = [
          {
            title: 'Total Sessions',
            value: data.totalSessions.value.toString(),
            change: `${data.totalSessions.change}%`,
            changeType: data.totalSessions.trend,
          },
          {
            title: 'Total Registrations',
            value: data.totalRegistrations.value.toString(),
            change: `${data.totalRegistrations.change}%`,
            changeType: data.totalRegistrations.trend,
          },
          {
            title: 'Average Attendance Rate',
            value: `${data.averageAttendance.value}%`,
            change: `${data.averageAttendance.change}%`,
            changeType: data.averageAttendance.trend,
          },
          {
            title: 'Active Trainers',
            value: data.activeTrainers.value.toString(),
            change: data.activeTrainers.change.toString(),
            changeType: data.activeTrainers.trend,
          },
        ];

        setKpiData(formattedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalyticsData();
    }
  }, [token, dateRange]);

  const handleDateRangeChange = (newDateRange: string) => {
    setDateRange(newDateRange);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-gray-600">Key metrics for training session performance.</p>
        </div>
        <div>
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
        </div>
      </header>
      <main>
        {error && <p>Error: {error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <KPIKard loading />
              <KPIKard loading />
              <KPIKard loading />
              <KPIKard loading />
            </>
          ) : (
            kpiData.map((kpi, index) => (
              <KPIKard key={index} title={kpi.title} value={kpi.value} change={kpi.change} changeType={kpi.changeType} />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
