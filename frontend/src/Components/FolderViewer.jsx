import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { CiFolderOn, CiFileOn } from "react-icons/ci";
import { FaFolderOpen } from "react-icons/fa";
import { MdLabel } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import PropTypes from "prop-types";

import { AuthContext } from "../Contexts/AuthContext";
import {
    getFolderContents as apiGetFolderContents,
    moveFolder as apiMoveFolder,
    updateFolderName as apiUpdateFolderName,
} from "../utils/folderApi";
import {
    moveFile as apiMoveFile,
    updateFileName as apiUpdateFileName,
} from "../utils/fileApi";
import { sizeDisplay, typeDisplay } from "../utils/functions";
import UploadForm from "./UploadForm";
import AddFolderForm from "./AddFolderForm";
import ParentFolderButton from "./ParentFolderButton";
import "../Styles/FolderViewer.css";

function FolderRow({ folder, loadNewFolder, updateParentFolder, refetch }) {
    const [newName, setNewName] = useState(folder.name);
    const [editing, setEditing] = useState(false);

    function allowChange(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function updateName(e) {
        setNewName(e.target.value);
    }

    function toggleForm(e) {
        allowChange(e);
        setEditing(!editing);
    }

    function revert(e) {
        setNewName(folder.name);
        toggleForm(e);
    }

    function grabFolderId(e) {
        allowChange(e);
        e.dataTransfer.setData("folder", e.target.id);
    }

    async function handleSubmission(e) {
        e.preventDefault();
        try {
            console.log("commencing folder name change");
            const response = await apiUpdateFolderName(folder.id, newName);
            console.log("response", response);
            console.log("folder name changed");
            toggleForm(e);
            refetch(true);
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    function EditFolderNameForm() {
        return (
            <div className="editNameDiv" onClick={allowChange}>
                <form className="editNameForm" method="PUT">
                    <input value={newName} onChange={updateName} autoFocus />
                    <div className="formButtons">
                        <button className="addBtn" onClick={handleSubmission}>
                            update name -&nbsp;
                        </button>
                        <button className="cancelBtn" onClick={revert}>
                            cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div
            id={folder.id}
            className="folderRow"
            draggable="true"
            onClick={loadNewFolder}
            onDragStart={grabFolderId}
            onDragOver={allowChange}
            onDrop={updateParentFolder}
        >
            <CiFolderOn />
            {editing ? (
                <EditFolderNameForm />
            ) : (
                <span className="folderFieldName" onDoubleClick={toggleForm}>
                    {newName}
                </span>
            )}
            <span className="folderField">&nbsp;&nbsp;&nbsp;-</span>
            <span className="folderField">{sizeDisplay(folder.sizeKB)}</span>
            <span className="folderField">
                {format(folder.createdAt, "M-dd-yyy, h:mm aaa")}
            </span>
            <span className="folderField">
                {format(folder.updatedAt, "M-dd-yyy, h:mm aaa")}
            </span>
        </div>
    );
}

function FileRow({ file, refetch }) {
    const [newName, setNewName] = useState(file.name);
    const [editing, setEditing] = useState(false);
    const navigate = useNavigate();

    function allowChange(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function toggleForm(e) {
        allowChange(e);
        setEditing(!editing);
    }

    function revert(e) {
        setNewName(file.name);
        toggleForm(e);
    }

    function updateName(e) {
        setNewName(e.target.value);
    }

    function loadFile(e) {
        const clickedField = e.target.closest(".fileField");
        const fileId = clickedField
            ? clickedField.parentElement.id
            : e.target.id;
        navigate("/file", { state: { id: fileId } });
    }
    function grabFileId(e) {
        e.stopPropagation();
        e.dataTransfer.setData("file", e.target.id);
    }

    async function handleSubmission(e) {
        allowChange(e);
        try {
            console.log("commencing file name change", file.id, newName);
            const response = await apiUpdateFileName(file.id, newName);
            console.log("response", response);
            console.log("file name changed");
            toggleForm(e);
            refetch(true);
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    function EditFileNameForm() {
        const nameAlone = newName.slice(
            0,
            ((newName.lastIndexOf(".") - 1) >>> 0) + 1
        );
        const ext = file.name.slice(
            ((file.name.lastIndexOf(".") - 1) >>> 0) + 1
        );

        return (
            <div className="editNameDiv">
                <form className="editNameForm" method="PUT">
                    <input value={nameAlone} onChange={updateName} autoFocus />
                    <span className="extField">{ext}</span>
                    <div className="formButtons">
                        <button className="addBtn" onClick={handleSubmission}>
                            update name -&nbsp;
                        </button>
                        <button className="cancelBtn" onClick={revert}>
                            cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div
            id={file.id}
            draggable="true"
            className="fileRow"
            onClick={loadFile}
            onDragStart={grabFileId}
        >
            <CiFileOn />
            {editing ? (
                <EditFileNameForm />
            ) : (
                <span
                    className="fileFieldName"
                    onClick={allowChange}
                    onDoubleClick={toggleForm}
                >
                    {newName}
                </span>
            )}
            <span className="fileField">{typeDisplay(file.type)}</span>
            <span className="fileField">{sizeDisplay(file.sizeKB)}</span>
            <span className="fileField">
                {format(file.createdAt, "M-dd-yyy, h:mm aaa")}
            </span>
            <span className="fileField">
                {format(file.updatedAt, "M-dd-yyy, h:mm aaa")}
            </span>
        </div>
    );
}

function FolderViewer() {
    const [folderId, setFolderId] = useState(null);
    const [parentFolderId, setParentFolderId] = useState(null);
    const [folderName, setFolderName] = useState(null);
    const [subFolders, setSubFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [size, setSize] = useState(null);
    const [refetch, setRefetch] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthorized } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.id) {
            setFolderId(location.state.id);
        }
    }, [location]);

    useEffect(() => {
        async function loadFolderContents() {
            console.log("commencing folder content retrieval");
            try {
                console.log("folder to get", folderId);
                const contents = await apiGetFolderContents(folderId);
                console.log("folder contents", contents);
                setFolderId(contents.id);
                setFolderName(contents.name);
                setSubFolders(contents.childFolders);
                setFiles(contents.files);
                setSize(contents.sizeKB);
                setParentFolderId(contents.parentFolderId);
                setRefetch(false);
            } catch (err) {
                setError(err);
                console.error(err);
            }
        }
        loadFolderContents();
    }, [refetch, folderId]);

    function loadNewFolder(e) {
        const clickedField = e.target.closest(".folderField");
        if (clickedField) {
            setFolderId(clickedField.parentElement.id);
            return;
        }
        setFolderId(e.target.id);
    }

    function goToTrash() {
        navigate("/trash", { state: { lastFolderId: folderId } });
    }

    function allowDrop(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async function updateParentFolder(e) {
        e.preventDefault();
        e.stopPropagation();
        const moveFunction = { file: apiMoveFile, folder: apiMoveFolder };
        const type = e.dataTransfer.types[0];
        const apiMoveFunc = moveFunction[type];
        const newParentFolderId = e.currentTarget.id;
        const fileOrFolderId = e.dataTransfer.getData(type);

        console.log("type", type);
        console.log("parent ID:", newParentFolderId);
        console.log("func", moveFunction[type]);

        if (fileOrFolderId === newParentFolderId) return;

        try {
            const response = await apiMoveFunc(
                fileOrFolderId,
                newParentFolderId
            );
            const results = response.json();
            console.log("move results", results);
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setRefetch(true);
        }
    }

    if (!files || !subFolders) return <div>nothing to load, add stuff!</div>;

    console.log("Render state:", {
        folderId,
        parentFolderId,
        folderName,
        subFolders,
        files,
        error,
    });

    return isAuthorized ? (
        <>
            <div id="folderViewer">
                {parentFolderId !== undefined && parentFolderId !== null && (
                    <div id={parentFolderId} className="parentFolder">
                        <ParentFolderButton
                            parentId={parentFolderId}
                            allowDrop={allowDrop}
                            updateParentFolder={updateParentFolder}
                        />
                    </div>
                )}

                <div className="currentFolder">
                    <FaFolderOpen />
                    &nbsp;{folderName === "root" ? "/" : folderName}
                    <span>
                        {sizeDisplay(size)}
                        {folderName === "root" && " / 5 MB"}
                    </span>
                </div>

                <div className="labelRow">
                    <MdLabel />
                    <span>name</span>
                    <span>type</span>
                    <span>size</span>
                    <span>created at</span>
                    <span>last viewed</span>
                </div>

                {subFolders.length > 0 && (
                    <>
                        {subFolders.map((folder) => {
                            return (
                                <FolderRow
                                    key={folder.id}
                                    folder={folder}
                                    loadNewFolder={loadNewFolder}
                                    updateParentFolder={updateParentFolder}
                                    refetch={setRefetch}
                                />
                            );
                        })}
                    </>
                )}

                <AddFolderForm
                    className="folderRow"
                    folderId={folderId}
                    refetch={setRefetch}
                />

                {files.length > 0 &&
                    files.map((file) => {
                        return (
                            <FileRow
                                key={file.id}
                                file={file}
                                refetch={setRefetch}
                            />
                        );
                    })}

                <UploadForm folderId={folderId} refetch={setRefetch} />
            </div>

            <button id="trashButton" type="button" onClick={goToTrash}>
                <FaTrashAlt /> View Trash
            </button>
        </>
    ) : (
        <div>please login to continue</div>
    );
}

FolderRow.propTypes = {
    folder: PropTypes.object,
    loadNewFolder: PropTypes.func,
    updateParentFolder: PropTypes.func,
    refetch: PropTypes.func,
};

FileRow.propTypes = {
    file: PropTypes.object,
    refetch: PropTypes.func,
};

export default FolderViewer;
