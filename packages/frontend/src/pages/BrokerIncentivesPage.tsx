import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Incentive } from '../../../shared/src/types'
import { incentiveService } from '../services/incentive.service'
import IncentiveCard from '../components/incentives/IncentiveCard'

const BrokerIncentivesPage = () => {
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActiveIncentives = async () => {
      try {
        setLoading(true)
        const activeIncentives = await incentiveService.getActiveIncentives()

        // Sort incentives by end date (expiring soon first)
        const sortedIncentives = activeIncentives.sort((a, b) => {
          const dateA = new Date(a.endDate).getTime()
          const dateB = new Date(b.endDate).getTime()
          return dateA - dateB
        })

        setIncentives(sortedIncentives)
      } catch (err) {
        console.error('Error fetching active incentives:', err)
        setError('Unable to load incentives. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchActiveIncentives()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Available Incentives & Offers</h2>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading incentives...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            <p>{error}</p>
            <button
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {incentives.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incentives.map((incentive) => (
                  <IncentiveCard key={incentive.id} incentive={incentive} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">No active incentives</h4>
                <p className="text-gray-600">Check back soon for new offers and incentives!</p>
              </div>
            )}
          </>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">About Incentives</h3>
          <p className="text-blue-700">
            These incentives are special offers and rewards available to participants.
            Each incentive has specific eligibility criteria and expiration dates.
            Contact your training coordinator for more information on how to qualify.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BrokerIncentivesPage