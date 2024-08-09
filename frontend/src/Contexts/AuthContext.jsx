import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'
import { 
    logout as apiLogout, checkAuth as apiAuth } from '../utils/authApi'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const navigate = useNavigate();

    function authorize() { setIsAuthorized(true) }
    function unAuthorize() { setIsAuthorized(false) }

    useEffect(() => {
        checkAuthorization()
        const authInterval = setInterval(checkAuthorization, 5*60*1000)
        return () => clearInterval(authInterval)
    })

    async function checkAuthorization() {
        try {
            const authorization = await apiAuth()
            if (authorization) authorize()
            if (!authorization) unAuthorize()
        } catch (err) {
            console.error(err)
            unAuthorize()
            throw err
        }
    }
    async function updateLogout() {
        try {
            console.log('starting logout process')
            const loggedOut = await apiLogout()
            if (loggedOut) unAuthorize();
            console.log('logout bool:', loggedOut)
        } catch (err) {
            console.error(err)
            throw err
        } finally {
            navigate('/')
        } 
    }


    const contextData = { isAuthorized, authorize, updateLogout }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}

AuthProvider.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element)
}

export { AuthProvider, AuthContext }