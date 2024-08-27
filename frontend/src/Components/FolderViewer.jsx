import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { AuthContext } from '../Contexts/AuthContext';
import {
    getFolderContents as apiGetFolderContents,
    moveFolder as apiMoveFolder
} from '../utils/folderApi';
import { moveFile as apiMoveFile } from '../utils/fileApi';
import { sizeDisplay, typeDisplay } from '../utils/functions'
import UploadForm from './UploadForm';
import AddFolderForm from './AddFolderForm';
import ParentFolderButton from './ParentFolderButton';
import { CiFolderOn, CiFileOn } from "react-icons/ci";
import { FaFolderOpen } from "react-icons/fa";
import { MdLabel } from "react-icons/md";
import '../Styles/FolderViewer.css'

function FolderViewer() {
    const [folderId, setFolderId] = useState(null)
    const [parentFolderId, setParentFolderId] = useState(null)
    const [folderName, setFolderName] = useState(null)
    const [subFolders, setSubFolders] = useState([])
    const [files, setFiles] = useState([])
    const [size, setSize] = useState(null)
    const [refetch, setRefetch] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (location.state?.id) {
            setFolderId(location.state.id)
        }
    }, [location])

    useEffect(() => {
        async function loadFolderContents() {
            console.log('commencing folder content retrieval')
            try {
                console.log('folder to get', folderId)
                const contents = await apiGetFolderContents(folderId)
                console.log('folder contents', contents)
                setFolderId(contents.id);
                setFolderName(contents.name)
                setSubFolders(contents.childFolders)
                setFiles(contents.files)
                setSize(contents.sizeKB);
                setParentFolderId(contents.parentFolderId)
                setRefetch(false)
            } catch (err) {
                setError(err)
                console.error(err)
            }
        }
        loadFolderContents()
    }, [refetch, folderId])

    function loadNewFolder(e) {
        const clickedField = e.target.closest('.folderField');
        if (clickedField) {
            setFolderId(clickedField.parentElement.id)
            return
        }
        setFolderId(e.target.id)
    }

    function loadFile(e) {
        const clickedField = e.target.closest('.fileField');
        const fileId =
            clickedField ? clickedField.parentElement.id : e.target.id;
        navigate('/file', { state: { id: fileId } })
    }

    function goToTrash() {
        navigate('/trash', { state: { lastFolderId: folderId } })
    }

    function allowDrop(e) { e.preventDefault() }

    function grabFileId(e) { e.dataTransfer.setData('file', e.target.id) }

    function grabFolderId(e) { e.dataTransfer.setData('folder', e.target.id) }

    async function updateParentFolder(e) {
        e.preventDefault();
        const moveFunction = { file: apiMoveFile, folder: apiMoveFolder }
        const type = e.dataTransfer.types[0];
        const apiMoveFunc = moveFunction[type]
        const child = e.target.closest(`.${type}Field`);
        const newParentFolder = child ? child.parentElement.id : e.target.id;
        const fileOrFolderId = e.dataTransfer.getData(type)

        try {
            const response = await apiMoveFunc(fileOrFolderId, newParentFolder)
            const results = response.json()
            console.log('move results', results)
        } catch (err) {
            console.error(err)
            throw err
        } finally {
            setRefetch(true)
        }
    }

    if (!files || !subFolders) return <div>nothing to load, add stuff!</div>

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
                <div className='labelRow'>
                    <MdLabel />
                    <span>name</span>
                    <span>type</span>
                    <span>size</span>
                    <span>created at</span>
                    <span>last updated at</span>
                </div>
                {subFolders.length > 0 &&
                    <>
                        {subFolders.map((folder) => {
                            return (
                                <div
                                    key={folder.id}
                                    id={folder.id}
                                    className="folderRow"
                                    draggable="true"
                                    onClick={loadNewFolder}
                                    onDragStart={grabFolderId}
                                    onDragOver={allowDrop}
                                    onDrop={updateParentFolder}
                                >
                                    <CiFolderOn />
                                    <span className='folderField'>
                                        {folder.name}
                                    </span>
                                    <span className='folderField'>
                                        &nbsp;&nbsp;&nbsp;-
                                    </span>
                                    <span className='folderField'>
                                        {sizeDisplay(folder.sizeKB)}
                                    </span>
                                    <span className='folderField'>
                                        {format(
                                            folder.createdAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                    <span className='folderField'>
                                        {format(
                                            folder.updatedAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </>
                }
                <AddFolderForm
                    className='folderRow'
                    folderId={folderId}
                    refetch={setRefetch}
                />
                {
                    files.length > 0 &&
                    <>
                        {files.map((file) => {
                            return (
                                <div
                                    key={file.id}
                                    id={file.id}
                                    draggable="true"
                                    className="fileRow"
                                    onClick={loadFile}
                                    onDragStart={grabFileId}
                                >
                                    <CiFileOn />
                                    <span className='fileField'>
                                        {file.name}
                                    </span>
                                    <span className='fileField'>
                                        {typeDisplay(file.type)}
                                    </span>
                                    <span className='fileField'>
                                        {sizeDisplay(file.sizeKB)}
                                    </span>
                                    <span className='fileField'>
                                        {format(
                                            file.createdAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                    <span className='fileField'>
                                        {format(
                                            file.updatedAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </>
                }
                <UploadForm folderId={folderId} refetch={setRefetch} />
                <button type="button" onClick={goToTrash}>view trash</button>
            </div >

            : <div>please login to continue</div>
    )
}

export default FolderViewer