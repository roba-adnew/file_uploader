import { Outlet } from 'react-router-dom'
import { AuthProvider } from './Contexts/AuthContext'
import NavBar from './Components/NavBar'
import './App.css'


function App() {

  return (
    <AuthProvider>
      <NavBar />
      <Outlet />
    </AuthProvider>
  )
}

export default App
