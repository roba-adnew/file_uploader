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

async function login(credentials) {
    console.log('url', base_url)
    const url = `${base_url}/login`
    const options = {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(credentials)
    }
    try {
        console.log('logging in for', credentials)
        const response = await fetch(url, options)
        console.log(response)
        const data = await response.json()
        return data
    } catch (err) {
        console.error(err)
        throw err
    }
}

export { signup, login }