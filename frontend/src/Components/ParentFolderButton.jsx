import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { LuFolderOutput } from "react-icons/lu";
import { getFolderContents as apiGetFolderContents } from '../utils/folderApi';
import '../Styles/FolderViewer.css'

function ParentFolderButton({ parentId }) {
    const [name, setName] = useState(null)
    const navigate = useNavigate()

    console.log('parent ID in button:', parentId)
    useEffect(() => {
        async function getParentFolder() {
            const contents = await apiGetFolderContents(parentId)
            setName(contents.name)
        }
        getParentFolder()
    })

    function loadParentFolder() { navigate('/', { state: { id: parentId } }) }

    return (
        <div id='parentFolder' onClick={loadParentFolder}>
            <LuFolderOutput /> {name}
        </div>
    )
}

ParentFolderButton.propTypes = { parentId: PropTypes.string }

export default ParentFolderButton;