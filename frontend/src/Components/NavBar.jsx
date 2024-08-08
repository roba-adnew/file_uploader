import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../Contexts/AuthContext'

function NavBar() {
    const { isAuthorized, updateLogout } = useAuth()
    const location = useLocation()

    if (isAuthorized) {
        return <Link to="/" onClick={updateLogout}>logout</Link>
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
