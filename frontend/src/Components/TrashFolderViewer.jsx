import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { AuthContext } from '../Contexts/AuthContext';
import { CiFileOn } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { MdLabel } from "react-icons/md";
import { typeDisplay, sizeDisplay } from '../utils/functions';
import { getTrashContents as apiGetTrashContents } from '../utils/folderApi';
import { permanentlyDeleteFile as apiPermDelete } from '../utils/fileApi'
import '../Styles/FolderViewer.css'

function TrashFolderViewer() {
    const [contents, setContents] = useState(null)
    const [fileToDelete, setFileToDelete] = useState(null)
    const [error, setError] = useState(null)
    const [refetch, setRefetch] = useState(false)
    const [midDeletion, setMidDeletion] = useState(false)
    const { isAuthorized } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()
    const dialogRef = useRef(null);

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
            } finally {
                setRefetch(false)
            }
        }
        loadTrashFolderContents()
    }, [refetch])

    function goBack() {
        navigate('/', { state: { id: location.state.lastFolderId } })
    }

    async function handlePermDeletion() {
        console.log('id:', fileToDelete)
        try {
            const deletion = await apiPermDelete(fileToDelete)
            console.log(deletion)
            resetModal()
            setRefetch(true)
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    function resetModal() {
        if (!dialogRef.current) { return }
        setMidDeletion(false)
        dialogRef.current.close();
    }

    async function presentDeletionModal(e) {
        const parentRow = e.target.closest('.trashFileRow');
        const fileId = parentRow.id;
        setFileToDelete(fileId);
        setMidDeletion(true);
        dialogRef.current.close();
    }

    console.log('Render state:', {
        contents,
        error
    });

    return (
        isAuthorized && contents ?
            <>
                <dialog ref={dialogRef}>
                    <div>
                        Are you sure you want to delete this file?
                        If you do, it will no longer exist in our systems and
                        we will not be able to recover it.
                    </div>
                    <button onClick={resetModal}>
                        Nevermind
                    </button>
                    <button onClick={handlePermDeletion}>
                        Yes, permanently delete
                    </button>
                </dialog>
                {midDeletion && dialogRef.current.showModal()}
                <div id='trashFolderViewer'>
                    <div className='trashFolder'>
                        <FaTrashAlt /> 
                        <span>Trash</span>
                        {sizeDisplay(contents.sizeKB)} / 500 KB
                    </div>
                    <div className='trashLabelRow'>
                        <MdLabel />
                        <span>name</span>
                        <span>type</span>
                        <span>size</span>
                        <span>created at</span>
                        <span>last updated at</span>
                        <span style={{color: "red"}}>DELETE</span>
                    </div>
                    {contents.files.length > 0
                        ? <>
                            {contents.files.map((file) => {
                                return <div
                                    key={file.id}
                                    id={file.id}
                                    className="trashFileRow"
                                >
                                    <CiFileOn />
                                    <span className='trashFileField'>
                                        {file.name}
                                    </span>
                                    <span className='trashFileField'>
                                        {typeDisplay(file.type)}
                                    </span>
                                    <span className='trashFileField'>
                                        {sizeDisplay(file.sizeKB)}
                                    </span>
                                    <span className='trashFileField'>
                                        {format(
                                            file.createdAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                    <span className='trashFileField'>
                                        {format(
                                            file.updatedAt,
                                            'M-dd-yyy, h:mm aaa'
                                        )}
                                    </span>
                                    <button
                                        className='permDelete'
                                        type="button"
                                        onClick={presentDeletionModal}
                                    >
                                        <MdDeleteForever />
                                    </button>

                                </div>
                            })}
                        </>
                        : <div>No trash yet</div>
                    }
                </div>
                <button id='backButton' type="button" onClick={goBack}>
                    go back
                </button>
            </>
            : <div>please login to continue</div>
    )
}

export default TrashFolderViewer