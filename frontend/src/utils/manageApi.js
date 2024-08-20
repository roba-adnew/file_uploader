const domain = import.meta.env.VITE_API_DEV_URL
    || import.meta.env.VITE_API_PROD_URL
const base_url = `${domain}/file`

async function upload(file, folderId) {
    const formData = new FormData();
    formData.append('uploaded_file', file);
    if (folderId !== null) formData.append('folderId', folderId);

    console.log('formData:', formData)
    console.log('parentFolderID', folderId)

    const url = base_url;
    const options = {
        method: 'POST',
        credentials: 'include',
        body: formData
    }
    try {
        const response = await fetch(url, options)
        console.log('upload response', response)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        return response.json()
    } catch (err) {
        console.error('upload error:', err)
        throw err
    }
}

export { upload }