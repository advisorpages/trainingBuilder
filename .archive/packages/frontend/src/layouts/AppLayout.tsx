import { Outlet } from 'react-router-dom'
import SessionTimeoutWarning from '../components/auth/SessionTimeoutWarning'

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
      <SessionTimeoutWarning warningThreshold={5} />
    </div>
  )
}

export default AppLayout

