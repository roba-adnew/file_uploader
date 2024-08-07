import { useState } from 'react'
import { login as apiLogin } from '../utils/authApi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Contexts/AuthContext'

function Login() {
    const { authenticate, isAuthenticated } = useAuth()
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
            if (response.ok) authenticate()
            console.log('response', response)
            navigate('/')
        } catch (err) {
            setError(err)
            console.error(err)
        }
    }

    console.log('Render state:', { credentials, error });
    return (
        <>
            {!isAuthenticated &&
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
            {isAuthenticated && navigate('/')}
        </>

    )
}

export default Login