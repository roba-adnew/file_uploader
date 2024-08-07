import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'
import { logout as apiLogout } from '../utils/authApi'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const navigate = useNavigate();

    function authenticate() { setIsAuthenticated(true) }
    function unAuthenticate() { setIsAuthenticated(false) }

    async function updateLogout() {
        try {
            console.log('starting logout process')
            const loggedOut = await apiLogout()
            if (loggedOut) unAuthenticate();
            console.log('logout bool:', loggedOut)
        } catch (err) {
            console.error(err)
            throw err
        } finally {
            navigate('/')
        } 
    }

    const contextData = { isAuthenticated, authenticate, updateLogout }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}

function useAuth() { return useContext(AuthContext) }

AuthProvider.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element)
}

export { AuthProvider, useAuth }