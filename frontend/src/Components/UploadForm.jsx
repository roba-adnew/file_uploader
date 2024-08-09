import { useContext } from "react";
import { AuthContext } from "../Contexts/AuthContext";

function UploadForm() {
    const { isAuthorized } = useContext(AuthContext)

    return (
        isAuthorized ? 
        <div>
            <form action="/stats" encType="multipart/form-data" method="post">
                <div className="form-group">
                    <input
                        type="file"
                        className="form-control-file"
                        name="uploaded_file"
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