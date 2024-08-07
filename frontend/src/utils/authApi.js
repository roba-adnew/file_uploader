const base_url = `
    ${import.meta.env.VITE_API_DEV_URL || import.meta.env.VITE_API_DEV_URL}/user`

async function signup(formData) {
    const url = `${base_url}/signup`
    const options = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
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
        body: JSON.stringify(loginDetails)
    }
    try {
        console.log('logging in for', loginDetails)
        const response = await fetch(url, options)
        const data = await response.json()
        console.log(data)
        return response
    } catch (err) {
        console.error(err)
        throw err
    }
}

async function logout() {
    const url = `${base_url}/logout`
    const options = { credentials: 'include' }
    try {
        const response = await fetch(url, options)
        const data = await response.json()
        console.log(data)
        return response.ok
    } catch (err) {
        console.error(err)
        throw err
    }
}

async function checkAuth() {
    const url = `${base_url}/check-auth`
    try {
        const response = await fetch(url)
        console.log(response)
        return response.status
    } catch (err) {
        console.error(err)
        throw err
    }
}

export { signup, login, logout, checkAuth }