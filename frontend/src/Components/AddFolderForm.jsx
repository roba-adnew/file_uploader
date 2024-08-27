import { useState, useContext } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import { addFolder as apiAddFolder } from '../utils/folderApi';
import PropTypes from 'prop-types';

function AddFolderForm({ folderId, refetch }) {
    const [newFolderName, setNewFolderName] = useState(null)
    // const [uploading, setUploading] = useState(false)
    const [addingFolder, setAddingFolder] = useState(false)
    const [error, setError] = useState(null)
    const { isAuthorized } = useContext(AuthContext)

    function updateNewFolderName(e) { setNewFolderName(e.target.value) }

    function toggleAddingFolder() { setAddingFolder(!addingFolder) }

    async function addFolder(e) {
        e.preventDefault();
        try {
            // setUploading(true)
            console.log('starting new folder addition from UI:', newFolderName)
            const success = await apiAddFolder(folderId, newFolderName)
            if (success) {
                console.log('file uploaded successfully')
                setNewFolderName(null)
                toggleAddingFolder()
                refetch(true)
            } else {
                console.log('upload failed')
            }
        } catch (err) {
            console.error(err)
            setError(err)
            throw err
        } finally {
            // setUploading(false)
        }
    }

    console.log('Render state:', { newFolderName, error });

    return (
        isAuthorized ?
            <div className="folderRowForm">
                <form
                    onSubmit={addFolder}
                    method="post"
                >
                        {addingFolder &&
                            <div>
                                <input
                                    type="text"
                                    name="uploaded_file"
                                    autoFocus
                                    onChange={updateNewFolderName}
                                />
                                <button
                                    type="button"
                                    className="toggle btn"
                                    onClick={addFolder}
                                >submit
                                    </button>
                                <button
                                    type="button"
                                    className="cancelNewFolderButton"
                                    onClick={toggleAddingFolder}
                                >cancel</button>
                            </div>
                        }
                        {!addingFolder &&
                            <input
                                type="button"
                                value="+ add a new folder"
                                id="addFolderToggle"
                                onClick={toggleAddingFolder}
                            />
                        }
                </form>
            </div>
            : <div>please login to add folder</div>
    )
}

AddFolderForm.propTypes = {
    folderId: PropTypes.string,
    refetch: PropTypes.func
}

export default AddFolderForm;