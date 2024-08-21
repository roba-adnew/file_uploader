import { useState, useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns'
import { AuthContext } from '../Contexts/AuthContext';
import { getFileDetails as apiGetFile } from '../utils/manageApi';
import { sizeDisplay, typeDisplay } from '../utils/functions';

function FileViewer() {
    const { isAuthorized } = useContext(AuthContext)
    const [file, setFile] = useState(null)
    let location = useLocation();
    const fileId = location.state?.key;

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
                <td>{format(file.details.createdAt,'M-dd-YYY, h:mm aaa' )}</td>
            </tr>
            <tr>
                <td>last updated at</td>
                <td>{format(file.details.updatedAt,'M-dd-YYY, h:mm aaa' )}</td>
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
            {file.details.type.startsWith('image') 
               ? <img src={file.content} alt={file.details.name} />
               : <div>Preview for {file.details.name} not available </div>
            }
                <FileDetails />
                <button onClick={handleDownload} className="download-button">
                    Download {file.details.name}
                </button>
            </>
            : <div>please login to view file</div>
    )
}

export default FileViewer