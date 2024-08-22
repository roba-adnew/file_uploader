import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types';
import { signup } from '../utils/authApi'


function CreationStatusModal({ creatingFlag, successFlag }) {
    const dialogRef = useRef(null);
    const showModal = creatingFlag || successFlag

    useEffect(() => {
        if (!dialogRef.current) {
            console.log('dialogRef currently null')
            return
        }
        if (showModal) dialogRef.current.showModal();
        if (!showModal) {
            console.log('closing')
            dialogRef.current.close();
        }
    }, [showModal])

    if (!showModal) return null

    return (
        <>
            <dialog ref={dialogRef}>
                {creatingFlag && <p>Creating your account</p>}
                {successFlag && <p>Account created</p>}
                <button id='modalButton'><Link to="/login">login</Link></button>
            </dialog>
        </>
    )
}

function SignUpForm() {
    const [userInfo, setUserInfo] = useState({
        username: '',
        email:'',
        password: ''
    })
    const [pwdsMatch, setPwdsMatch] = useState(false)
    const [pwdConfExists, setPwdConfExists] = useState(false)
    const [creatingAccount, setCreatingAccount] = useState(false)
    const [accountCreated, setAccountCreated] = useState(false)
    const [error, setError] = useState(null)

    function updateUserInfo(e) {
        const updateValue = e.target.name === 'author' ?
            e.target.checked : e.target.value
        setUserInfo({
            ...userInfo,
            [e.target.name]: updateValue
        })
    }

    function checkPwdConf(e) {
        const pwdConfField = e.target
        if (pwdConfField.name !== 'pwdConf') return

        if (pwdConfField.value.length === 0) { setPwdConfExists(false) }
        else { setPwdConfExists(true) }

        if (userInfo.password !== pwdConfField.value) { setPwdsMatch(false) }
        else { setPwdsMatch(true) }
    }

    async function createNewAccount(e) {
        e.preventDefault();
        try {
            setCreatingAccount(true)
            console.log('Attempting account creation')
            const accountCreated = await signup(userInfo);
            if (accountCreated) {
                console.log('Account successfully created')
                setAccountCreated(true)
            }
            else {
                console.log('Account not created')
            }
        } catch (err) {
            setError(err)
            console.error('Issue creating account:', err)
        } finally {
            setCreatingAccount(false)
        }
    }

    console.log('Render state:', { userInfo, error, pwdsMatch, pwdConfExists });

    return (
        <>
            <div id='signup'>
                <form onSubmit={createNewAccount} method='POST'>
                    <p>sign-up for an account</p>
                    <input
                        value={userInfo.email}
                        name='email'
                        placeholder='email'
                        onChange={updateUserInfo}
                    />
                    <input
                        value={userInfo.username}
                        name='username'
                        placeholder='username'
                        onChange={updateUserInfo}
                    />
                    <input
                        value={userInfo.password}
                        name='password'
                        type='password'
                        placeholder='password'
                        onChange={updateUserInfo}
                    />
                    <input
                        name='pwdConf'
                        type='password'
                        placeholder='re-enter password'
                        onBlur={checkPwdConf}
                    />
                    {
                        pwdConfExists && !pwdsMatch
                        && <p id='pwValidator'>passwords don&apos;t match</p>
                    }
                    <button id='submit' type='submit'>sign-up</button>
                </form>
            </div>
            <CreationStatusModal
                creatingFlag={creatingAccount}
                successFlag={accountCreated}
            />
        </>
    )
}

CreationStatusModal.propTypes = {
    creatingFlag: PropTypes.bool,
    successFlag: PropTypes.bool,
}

export default SignUpForm