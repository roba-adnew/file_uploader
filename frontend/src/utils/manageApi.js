const domain = import.meta.env.VITE_API_DEV_URL 
    || import.meta.env.VITE_API_PROD_URL
const base_url = `${domain}/manage`

async function upload(file) {
    const formData = new FormData();
    formData.append('uploaded_file', file);
    // formData.append('fileName', 'uploaded_file');
    console.log(formData)
    const url = `${base_url}/file`
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        // file: 'uploaded_file',
        body: formData
    }
    console.log('new upload', file)
    const response = await fetch(url, options)
    console.log('signup response', response)
    return response.ok
}

export { upload }