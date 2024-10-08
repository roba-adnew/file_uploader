const domain = import.meta.env.VITE_API_DEV_URL 
    || import.meta.env.VITE_API_PROD_URL
const base_url = `${domain}/user`

async function signup(formData) {
    const url = `${base_url}/signup`
    const options = {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(formData)
    }
    console.log('new account form data', formData)
    const response = await fetch(url, options)
    console.log('signup response')
    return response.ok
}

async function login(loginDetails) {
    const url = `${base_url}/login`
    const options = {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(loginDetails),
        credentials: 'include'
    }
    try {
        console.log('logging in for', loginDetails)
        const response = await fetch(url, options)
        const data = await response.json()
        return data
    } catch (err) {
        console.error(err)
        throw err
    }
}

async function logout() {
    const url = `${base_url}/logout`
    const options = { method: 'POST', credentials: 'include' }
    try {
        const response = await fetch(url, options)
        return response.ok
    } catch (err) {
        console.error(err)
        throw err
    }
}

async function checkAuth() {
    const url = `${base_url}/check-auth`;
    const options = { 
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendResponse: true }) 
    };

    try {
        const response = await fetch(url, options)
        const results = await response.json()
        console.log('check auth response', response)
        return results;
    } catch (err) {
        console.error(err)
        throw err
    }
}

export { signup, login, logout, checkAuth }