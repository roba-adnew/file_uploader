import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthContext';
import { getFolderContents as apiGetFolderContents } from '../utils/folderApi';
import UploadForm from './UploadForm';
import AddFolderForm from './AddFolderForm';
import ParentFolderButton from './ParentFolderButton';
import { CiFolderOn, CiFileOn } from "react-icons/ci";
import { FaFolderOpen } from "react-icons/fa";
import '../Styles/FolderViewer.css'

function FolderViewer() {
    const [folderId, setFolderId] = useState(null)
    const [parentFolderId, setParentFolderId] = useState(null)
    const [folderName, setFolderName] = useState(null)
    const [subFolders, setSubFolders] = useState([])
    const [files, setFiles] = useState([])
    const [refetch, setRefetch] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (location.state?.id) {
            setFolderId(location.state.id)
        }
    }, [location.state])

    useEffect(() => {
        async function loadFolderContents() {
            console.log('commencing folder content retrieval')
            try {
                console.log('folder to get', folderId)
                const contents = await apiGetFolderContents(folderId)
                setFolderId(contents.id);
                setFolderName(contents.name)
                setSubFolders(contents.childFolders)
                setFiles(contents.files)
                setParentFolderId(contents.parentFolderId)
                setRefetch(false)
            } catch (err) {
                setError(err)
                console.error(err)
            }
        }
        loadFolderContents()
    }, [refetch, folderId])

    function loadNewFolder(e) { setFolderId(e.target.id) }

    function loadFile(e) { navigate('/file', { state: { id: e.target.id } }) }

    if (!files || !subFolders) return <div>issue loading</div>

    console.log('Render state:', {
        folderId,
        parentFolderId,
        folderName,
        subFolders,
        files,
        error
    });

    return (
        isAuthorized ?
            <div id='folderViewer'>
                {parentFolderId !== undefined && parentFolderId !== null
                    && <ParentFolderButton parentId={parentFolderId} />}
                <div className='currentFolder'>
                    <FaFolderOpen /> {folderName === "root" ? "/" : folderName}
                </div>

                {subFolders.length > 0 &&
                    <>
                        {subFolders.map((folder) => {
                            return <div
                                key={folder.id}
                                id={folder.id}
                                className="folderRow"
                                onClick={loadNewFolder}
                            >
                                <CiFolderOn />  {folder.name}
                            </div>
                        })}
                    </>
                }
                {files.length > 0 &&
                    <>
                        {files.map((file) => {
                            return <div
                                key={file.id}
                                id={file.id}
                                className="fileRow"
                                onClick={loadFile}
                            >
                                <CiFileOn />  {file.name}
                            </div>
                        })}
                    </>
                }
                <UploadForm folderId={folderId} refetch={setRefetch} />
                <AddFolderForm folderId={folderId} refetch={setRefetch} />
            </div>

            : <div>please login to continue</div>
    )
}

export default FolderViewer