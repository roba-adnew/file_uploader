import App from '../App'
import Login from '../Components/Login';
import SignUpForm from '../Components/SignUpForm';
import FolderViewer from '../Components/FolderViewer';
import FileViewer from '../Components/FileViewer';

const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <FolderViewer />
      },
      {
        path: "/file",
        element: <FileViewer />
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