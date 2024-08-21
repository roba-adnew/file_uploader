import { useContext } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { AuthContext } from '../Contexts/AuthContext'
import '../Styles/NavBar.css'

function NavBar() {
    const { isAuthorized, updateLogout } = useContext(AuthContext)
    const location = useLocation()

    if (isAuthorized) {
        return (
            <div id='navbar'>
                <Link to="/" onClick={updateLogout}>logout</Link>
            </div>
        )
    }

    switch (location.pathname) {
        case '/':
            return (
                <div id='navbar'>
                    <Link to="/sign-up">signup</Link>
                    <Link to="/login">login</Link>
                </div>
            )
        case '/login':
            return (
                <div id='navbar'>
                    <Link to="/">home</Link>
                    <Link to="/sign-up">signup</Link>
                </div>
            )
        case '/sign-up':
            return (
                <div id='navbar'>
                    <Link to="/">home</Link>
                    <Link to="/login">login</Link>
                </div>
            )
    }
}

export default NavBar;
