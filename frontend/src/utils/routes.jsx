import App from '../App'
import Login from '../Components/Login';
import SignUpForm from '../Components/SignUpForm';
import FolderViewer from '../Components/FolderViewer';
import FileViewer from '../Components/FileViewer';
import TrashFolderViewer from '../Components/TrashFolderViewer';

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
        path: "/sign-up",
        element: <SignUpForm />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/file",
        element: <FileViewer />
      },
      {
        path: "/trash",
        element: <TrashFolderViewer />
      }
    ]
  }
];

export default routes;