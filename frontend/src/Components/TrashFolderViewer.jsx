import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../Contexts/AuthContext';
import { getTrashContents as apiGetTrashContents } from '../utils/folderApi';
import { CiFileOn } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import '../Styles/FolderViewer.css'

function TrashFolderViewer() {
    const [contents, setContents] = useState(null)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)


    useEffect(() => {
        async function loadTrashFolderContents() {
            console.log('commencing trash folder content retrieval')
            try {
                console.log('getting the trash')
                const results = await apiGetTrashContents()
                console.log('trash api returns', results)
                setContents(results)
            } catch (err) {
                setError(err)
                console.error(err)
            }
        }
        loadTrashFolderContents()
    }, [])

    console.log('Render state:', {
        contents,
        error
    });

    return (
        isAuthorized ?
            <div id='trashFolderViewer'>
                <div className='currentFolder'>
                    <FaTrashAlt /> Trash
                </div>
                {contents.files.length > 0
                    ? <>
                        {contents.files.map((file) => {
                            return <div
                                key={file.id}
                                id={file.id}
                                className="trashFileRow"
                            >
                                <CiFileOn />  {file.name}
                            </div>
                        })}
                    </>
                    : <div>No trash yet</div>
                }
            </div>
            : <div>please login to continue</div>
    )
}

export default TrashFolderViewer