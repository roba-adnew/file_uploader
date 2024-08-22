import { useState, useEffect, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns'
import { AuthContext } from '../Contexts/AuthContext';
import { getFileDetails as apiGetFile, deleteFile as apiDeleteFile }
    from '../utils/manageApi';
import { sizeDisplay, typeDisplay } from '../utils/functions';
import ParentFolderButton from './ParentFolderButton';

function FileViewer() {
    const { isAuthorized } = useContext(AuthContext)
    const [file, setFile] = useState(null)
    let location = useLocation();
    const navigate = useNavigate();
    const fileId = location.state?.id;

    useEffect(() => {
        async function getFile() {
            const fileObject = await apiGetFile(fileId);
            setFile(fileObject)
        }
        getFile()
    }, [fileId])

    if (!file || !file.details) {
        return <div>No file data available</div>;
    }

    function handleDownload() {
        if (file && file.content) {
            const link = document.createElement('a');
            link.href = file.content;
            link.download = file.details.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    async function handleDeletion(e) {
        const deletion = await apiDeleteFile(e.target.id)
        console.log(deletion)
        navigate("/", { state: { id: file.details.parentFolderId } })
    }

    const FileDetails = () => (
        file.details
            ? <table>
                <tbody>
                    <tr>
                        <td>name</td>
                        <td>{file.details.name}</td>
                    </tr>
                    <tr>
                        <td>size</td>
                        <td>{sizeDisplay(parseInt(file.details.sizeKB))}</td>
                    </tr>
                    <tr>
                        <td>type</td>
                        <td>{typeDisplay(file.details.type)}</td>
                    </tr>
                    <tr>
                        <td>created at</td>
                        <td>{format(file.details.createdAt, 'M-dd-YYY, h:mm aaa')}</td>
                    </tr>
                    <tr>
                        <td>last updated at</td>
                        <td>{format(file.details.updatedAt, 'M-dd-YYY, h:mm aaa')}</td>
                    </tr>
                    <tr>
                        <td>downloads</td>
                        <td>{file.details.downloads}</td>
                    </tr>
                </tbody>
            </table>
            : <div>no file loaded </div>
    )

    console.log('file', file)
    return (
        isAuthorized ?
            <>
                <ParentFolderButton parentId={file.details.parentFolderId} />
                {file.details.type.startsWith('image')
                    ? <img src={file.content} alt={file.details.name} />
                    : <div>Preview for {file.details.name} not available </div>
                }
                <FileDetails />
                <button
                    className="downloadButton"
                    onClick={handleDownload}
                >
                    Download {file.details.name}
                </button>
                <button
                    id={file.details.id}
                    className="deleteButton"
                    onClick={handleDeletion}
                >
                    Delete {file.details.name}
                </button>
            </>
            : <div>please login to view file</div>
    )
}

export default FileViewer