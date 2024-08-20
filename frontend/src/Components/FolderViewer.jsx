import { useState } from 'react'

function FolderViewer() {
    const [folderId, setFolderId] = useState(null)
    const [error, setError] = useState(null)

    async function getFolderContents(e, folderId = null) {
        e.preventDefault();
        console.log('commencing folder content retrieval')
        try {
            const response = await apiGetFolderContents(id)
            console.log('response', response)
        } catch (err) {
            setError(err)
            console.error(err)
        }
    }
}

export default FolderViewer