import App from '../App'
import UploadForm from '../Components/UploadForm';
import Login from '../Components/Login';
import SignUpForm from '../Components/SignUpForm';
import FolderViewer from '../Components/FolderViewer';

const routes = [
  {
    path: "/",
    element: <App />
    , children: [
      {
        index: true,
        element:
          <>
            <UploadForm />
            <FolderViewer />
          </>
      },
      {
        path: "/sign-up",
        element: <SignUpForm />,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ]
  }
];

export default routes;