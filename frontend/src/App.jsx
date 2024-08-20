import { Outlet } from 'react-router-dom'
import { AuthProvider } from './Contexts/AuthContext'
import NavBar from './Components/NavBar'
import { ErrorBoundary } from 'react-error-boundary'
import PropTypes from 'prop-types'
import './App.css'

function ErrorHandler({ error }) {
  return (
    <div role="alert">
      <p>An error occurred:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorHandler}>
      <AuthProvider>
        <NavBar />
        <Outlet />
      </AuthProvider>
    </ErrorBoundary>
  )
}

ErrorHandler.propTypes = {
  error: PropTypes.object
}

export default App
