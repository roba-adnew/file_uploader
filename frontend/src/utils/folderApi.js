const domain = import.meta.env.VITE_API_DEV_URL
    || import.meta.env.VITE_API_PROD_URL
const base_url = `${domain}/folder`


async function getFolderContents(folderId = null) {
    console.log('folderId to retrieve', folderId)
    const url = `${base_url}/view`;
    const options = {
        method: 'POST', 
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
    }
    if (folderId !== null) options['body'] = JSON.stringify(
       { folderId : folderId }
    );
    console.log('folder call options', options)
    try {
        const response = await fetch(url, options)
        console.log('file retrieval response', response)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        const contents = await response.json()
        console.log('file retrieval contents', contents)
        return contents.results
    } catch (err) {
        console.error('upload error:', err)
        throw err
    }
}

async function addFolder(parentFolderId, folderName) {
    const newFolderDetails = {
        name: folderName,
        parentFolderId: parentFolderId
    }
    console.log('body details:', newFolderDetails)

    const url = `${base_url}/add`;
    const options = {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newFolderDetails)
    }
    try {
        const response = await fetch(url, options)
        console.log('add folder response', response)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        return response.json()
    } catch (err) {
        console.error('folder addition error:', err)
        throw err
    }
}

export { getFolderContents, addFolder }