import { useLocation, Link } from 'react-router-dom'

function NavBar() {
    const location = useLocation()
    const loggedIn = true // figure out how to check for a user with sessions

    if (loggedIn) {return <Link to="/" >logout</Link>}

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
