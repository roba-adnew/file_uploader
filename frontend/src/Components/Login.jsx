import { useState, useContext } from 'react'
import { login as apiLogin } from '../utils/authApi'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../Contexts/AuthContext'

function Login() {
    const { authorize, isAuthorized, setUsername } = useContext(AuthContext)
    const [credentials, setCredentials] = useState({
        usernameOrEmail: '',
        password: ''
    })
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    function updateUserLogin(e) {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        })
    }

    async function handleLogin(e) {
        e.preventDefault();
        console.log('started handling')
        try {
            console.log('logging in, credentials:', credentials)
            const response = await apiLogin(credentials)
            console.log('login response', response.user.username)
            authorize();
            setUsername(response.user.username)
            navigate('/', { state: { id: response.folderId } })
        } catch (err) {
            setError(err)
            console.error(err)
        }
    }

    console.log('Render state:', { credentials, error });

    return (
        <>
            {!isAuthorized &&
                <div id='login'>
                    <form onSubmit={handleLogin} method='POST'>
                        <p>login</p>
                        <input
                            value={credentials.usernameOrEmail}
                            name='usernameOrEmail'
                            placeholder='username or email'
                            onChange={updateUserLogin}
                        />
                        <input
                            value={credentials.password}
                            type='password'
                            name='password'
                            placeholder='password'
                            onChange={updateUserLogin}
                        />
                        <button type='submit'>login</button>
                    </form>
                </div>}
            {isAuthorized && navigate('/')}
        </>

    )
}

export default Login