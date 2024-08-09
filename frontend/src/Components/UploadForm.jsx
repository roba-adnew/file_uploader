import { useState, useContext } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import { upload as apiUpload } from '../utils/manageApi'

function UploadForm() {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)

    function handleFileSelection(e) { setFile(e.target.files[0])}

    async function uploadFile(e) {
        e.preventDefault();
        try {
            setUploading(true)
            console.log('kicking off upload from component with', file)
            const success = await apiUpload(file)
            if (success) {
                console.log('file uploaded successfully')
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
            : <div>please login to play</div>
    )
}

export default UploadForm;