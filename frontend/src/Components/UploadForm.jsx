import { useState, useRef } from "react";
import { upload as apiUpload } from '../utils/manageApi'
import PropTypes from 'prop-types'

function UploadForm({ folderId = null }) {
    const [file, setFile] = useState(null)
    const [addingFile, setAddingFile] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    function handleFileSelection(e) { setFile(e.target.files[0]) }

    function toggleAddingFile() { setAddingFile(!addingFile) }

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
            setAddingFile(false)
        }
    }

    console.log('Render state:', { file, uploading, error });

    return (
            <div>
                <form
                    action="/stats"
                    onSubmit={uploadFile}
                    encType="multipart/form-data"
                    method="post"
                >
                    <div className="form-group">
                        {addingFile &&
                            <>
                                <input
                                    type="file"
                                    id="fileAdder"
                                    name="uploaded_file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelection}
                                />
                                <input
                                    type="submit"
                                    value="upload"
                                    id="uploadButton"
                                />
                            </>
                        }
                        {!addingFile &&
                            <>
                                <input
                                    type="button"
                                    value="add a file"
                                    id="addFileButton"
                                    onClick={toggleAddingFile}
                                />
                            </>
                        }
                    </div>
                </form>
            </div>
    )
}

UploadForm.propTypes = { folderId: PropTypes.string }

export default UploadForm;