import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PersonalizedNamesProvider } from './contexts/PersonalizedNamesContext'
import App from './App'
import './index.css'

console.log('🔍 Step 1: All imports including App.tsx successful')
console.log('🔍 Step 2: About to render with full App component')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PersonalizedNamesProvider>
          <App />
        </PersonalizedNamesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

console.log('🔍 Step 3: Render with full App completed')