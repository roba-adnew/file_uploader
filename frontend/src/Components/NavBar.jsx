import { useContext } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { AuthContext } from '../Contexts/AuthContext'
import { IoLogOut } from "react-icons/io5";
import '../Styles/NavBar.css'

function NavBar() {
    const { isAuthorized, updateLogout, username } = useContext(AuthContext)
    const location = useLocation()

    if (isAuthorized) {
        return (
            <div id='navbar'>
                <h3 id='greeting'>{username}&apos;s stuff...</h3>
                <div id='trashLogout'>
                    <Link to="/" onClick={updateLogout}>
                        <IoLogOut />
                    </Link>
                </div>
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
