import App from '../App'
import UploadForm from '../Components/UploadForm';
import Login from '../Components/Login';
import SignUpForm from '../Components/SignUpForm';

const routes = [
  {
    path: "/",
    element: <App />
    ,children: [
      {
        index: true,
        element: <UploadForm />
      },
      {
        path: "/sign-up",
        element: <SignUpForm/>,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ]
  }
];

export default routes;