import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/auth.types'
import { analyticsService, AnalyticsOverviewResponse } from '../services/analytics.service'
import {
  AttendanceTrendChart,
  RegistrationBarChart,
  TopicDistributionChart,
  TrainerPerformanceChart
} from '../components/features/analytics/charts'
import ExportModal from '../components/features/analytics/export/ExportModal'

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const [selectedDateRange, setSelectedDateRange] = useState('last-30-days')
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Performance chart data
  const [attendanceData, setAttendanceData] = useState([])
  const [registrationData, setRegistrationData] = useState([])
  const [topicData, setTopicData] = useState([])
  const [trainerData, setTrainerData] = useState([])
  const [chartsLoading, setChartsLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  // Date range options
  const dateRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-90-days', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' }
  ]

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user || user.role.name !== UserRole.CONTENT_DEVELOPER) {
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await analyticsService.getOverview(selectedDateRange)
        setAnalyticsData(data)
      } catch (err: any) {
        console.error('Failed to load analytics data:', err)
        setError(err.response?.data?.message || 'Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyticsData()
    loadPerformanceData()
  }, [user, selectedDateRange])

  // Load performance chart data
  const loadPerformanceData = async () => {
    if (!user || user.role.name !== UserRole.CONTENT_DEVELOPER) {
      return
    }

    try {
      setChartsLoading(true)

      const [startDate, endDate] = getDateRangeFromSelection(selectedDateRange)
      const apiParams = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeRange: 'month'
      }

      const [attendanceData, registrationData, topicData, trainerData] = await Promise.all([
        analyticsService.getSessionPerformance(apiParams),
        analyticsService.getSessionTrends(apiParams),
        analyticsService.getTopicsPopularity(apiParams),
        analyticsService.getTrainersPerformance(apiParams)
      ])

      setAttendanceData(attendanceData)
      setRegistrationData(registrationData)
      setTopicData(topicData)
      setTrainerData(trainerData)
    } catch (err) {
      console.error('Failed to load performance data:', err)
    } finally {
      setChartsLoading(false)
    }
  }

  const getDateRangeFromSelection = (range: string): [Date, Date] => {
    const now = new Date()
    const endDate = new Date(now)
    let startDate: Date

    switch (range) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last-30-days':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    return [startDate, endDate]
  }

  // Handle date range change
  const handleDateRangeChange = (newDateRange: string) => {
    setSelectedDateRange(newDateRange)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>
      case 'down':
        return <span className="text-red-500">↘</span>
      default:
        return <span className="text-gray-500">→</span>
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!user || user.role.name !== UserRole.CONTENT_DEVELOPER) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need Content Developer permissions to access analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">Training session performance metrics and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading || chartsLoading}
            >
              📊 Export Data
            </button>
            <select
              value={selectedDateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleDateRangeChange(selectedDateRange)}
                    className="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {analyticsData?.totalSessions.value || 0}
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${getTrendColor(analyticsData?.totalSessions.trend || 'stable')}`}>
                    {getTrendIcon(analyticsData?.totalSessions.trend || 'stable')}
                    <span className="ml-1">
                      {formatPercentage(analyticsData?.totalSessions.change || 0)} from previous period
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Total Registrations Card */}
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Total Registrations</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {analyticsData?.totalRegistrations.value || 0}
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${getTrendColor(analyticsData?.totalRegistrations.trend || 'stable')}`}>
                    {getTrendIcon(analyticsData?.totalRegistrations.trend || 'stable')}
                    <span className="ml-1">
                      {formatPercentage(analyticsData?.totalRegistrations.change || 0)} from previous period
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Average Attendance Rate Card */}
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Average Attendance Rate</h3>
                  <span className="text-2xl">📈</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {analyticsData?.averageAttendance.value || 0}%
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${getTrendColor(analyticsData?.averageAttendance.trend || 'stable')}`}>
                    {getTrendIcon(analyticsData?.averageAttendance.trend || 'stable')}
                    <span className="ml-1">
                      {formatPercentage(analyticsData?.averageAttendance.change || 0)} from previous period
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Trainers Card */}
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Active Trainers</h3>
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {analyticsData?.activeTrainers.value || 0}
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${getTrendColor(analyticsData?.activeTrainers.trend || 'stable')}`}>
                    {getTrendIcon(analyticsData?.activeTrainers.trend || 'stable')}
                    <span className="ml-1">
                      {(analyticsData?.activeTrainers.change || 0) === 0
                        ? 'No change'
                        : `${formatPercentage(analyticsData?.activeTrainers.change || 0)} from previous period`
                      }
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance Analytics Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <AttendanceTrendChart data={attendanceData} loading={chartsLoading} />
          <RegistrationBarChart data={registrationData} loading={chartsLoading} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <TopicDistributionChart data={topicData} loading={chartsLoading} />
          <TrainerPerformanceChart data={trainerData} loading={chartsLoading} />
        </div>

        {/* Navigation Back */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          currentFilters={{
            dateRange: selectedDateRange,
            startDate: getDateRangeFromSelection(selectedDateRange)[0].toISOString(),
            endDate: getDateRangeFromSelection(selectedDateRange)[1].toISOString()
          }}
        />
      </div>
    </div>
  )
}

export default AnalyticsPage