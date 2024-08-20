import { useState, useEffect } from 'react'
import { getFolderContents as apiGetFolderContents } from '../utils/folderApi';
import UploadForm from './UploadForm';
import AddFolderForm from './AddFolderForm';

function FolderViewer() {
    const [folderId, setFolderId] = useState(null)
    const [folderName, setFolderName] = useState(null)
    const [subFolders, setSubFolders] = useState(null)
    const [files, setFiles] = useState(null)
    const [refetch, setRefetch] = useState(false)
    const [error, setError] = useState(null)


    useEffect(() => {
        async function loadFolderContents(folderId = null) {
            console.log('commencing folder content retrieval')
            try {
                const contents = await apiGetFolderContents(folderId)
                setFolderName(contents.name)
                setFolderId(contents.id)
                setSubFolders(contents.childFolders)
                setFiles(contents.files)
                setRefetch(false)
            } catch (err) {
                setError(err)
                console.error(err)
            }
        }
        loadFolderContents()
    }, [refetch])

    if (!files || !subFolders) return <div>issue loading</div>

    console.log('Render state:', {
        folderId,
        folderName,
        subFolders,
        files,
        error
    });
    return (

        <div id='folderViewer'>
            <h4>{folderName}</h4>
            <UploadForm folderId={folderId} refetch={setRefetch}/>
            <AddFolderForm folderId={folderId} refetch={setRefetch}/>
            {subFolders &&
                subFolders.map((folder) => {
                    return <p key={folder.id}>{folder.name}</p>
                })
            }
            {files &&
                files.map((file) => {
                    return <p key={file.id}>{file.name}</p>
                })
            }
        </div>
    )
}

export default FolderViewer