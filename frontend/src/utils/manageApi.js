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

async function getFileDetails(fileId) {
    const download_url = `${base_url}/download`;
    const details_url = `${base_url}/details`;

    const options = {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ fileId: fileId })
    }
    try {
        const downloadResponse = await fetch(download_url, options)
        const detailsResponse = await fetch(details_url, options)

        if (!detailsResponse.ok) {
            const errorData = await detailsResponse.json();
            throw new Error(errorData.message || 'Upload failed');
        }

        if (!downloadResponse.ok) {
            const errorData = await downloadResponse.json();
            throw new Error(errorData.message || 'Upload failed');
        }

        // const downloadResults = await downloadResponse.json()
        const detailsResults = await detailsResponse.json()
        console.log('details results', detailsResults)
        console.log('download response', downloadResponse)

        return true
    } catch (err) {
        console.error('file details retrieval error:', err)
        throw err
    }
}

export { upload, getFileDetails }