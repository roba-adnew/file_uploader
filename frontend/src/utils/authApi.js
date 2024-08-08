const domain = import.meta.env.VITE_API_DEV_URL 
    || import.meta.env.VITE_API_PROD_URL
const base_url = `${domain}/user`

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
<<<<<<< HEAD
        body: JSON.stringify(loginDetails),
        credentials: 'include'
=======
        body: JSON.stringify(loginDetails)
>>>>>>> 9e009b80201b5ffcc263e1f6ad0b88ff06052d5e
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
<<<<<<< HEAD
=======
        const data = await response.json()
        console.log(data)
>>>>>>> 9e009b80201b5ffcc263e1f6ad0b88ff06052d5e
        return response.ok
    } catch (err) {
        console.error(err)
        throw err
    }
}

async function checkAuth() {
    const url = `${base_url}/check-auth`
<<<<<<< HEAD
    const options = { credentials: 'include' }
    try {
        const response = await fetch(url, options)
=======
    try {
        const response = await fetch(url)
>>>>>>> 9e009b80201b5ffcc263e1f6ad0b88ff06052d5e
        console.log(response)
        return response.status
    } catch (err) {
        console.error(err)
        throw err
    }
}

export { signup, login, logout, checkAuth }