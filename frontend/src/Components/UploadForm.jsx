import { useState, useContext, useRef } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import { upload as apiUpload } from '../utils/manageApi'
import PropTypes from 'prop-types'

function UploadForm({ folderId = null }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)
    const fileInputRef = useRef(null)

    function handleFileSelection(e) { setFile(e.target.files[0])}

    async function uploadFile(e) {
        e.preventDefault();
        try {
            setUploading(true)
            console.log('kicking off upload from component:', file, folderId)
            const success = await apiUpload(file, folderId)
            if (success) {
                console.log('file uploaded successfully')
                setFile(null)
                fileInputRef.current.value = '';
            } else {
                console.log('upload failed')
            }
        } catch (err) {
            console.error(err)
            setError(err)
            throw err
        } finally {
            setUploading(false)
        }
    }

    console.log('Render state:', { file, uploading, error });

    return (
        isAuthorized ?
            <div>
                <form
                    action="/stats"
                    onSubmit={uploadFile}
                    encType="multipart/form-data"
                    method="post"
                >
                    <div className="form-group">
                        <input
                            type="file"
                            className="form-control-file"
                            name="uploaded_file"
                            ref={fileInputRef}
                            onChange={handleFileSelection}
                        />
                        <input
                            type="submit"
                            value="upload"
                            className="upload btn"
                        />
                    </div>
                </form>
            </div>
            : <div>please login to upload</div>
    )
}

UploadForm.propTypes = { folderId: PropTypes.string }

export default UploadForm;