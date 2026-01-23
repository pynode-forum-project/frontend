import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Contact from "../pages/Contact";
import Message from "../pages/Message";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      // default route
      { index: true, element: <Navigate to="/users/login" replace /> },

      { path: "/users/login", element: <Login /> },
      { path: "/users/register", element: <Register /> },
      { path: "/contact", element: <Contact /> },

      // later: wrap these with ProtectedRoute
      { path: "/home", element: <Home /> },
      { path: "/users/profile", element: <Profile /> },
      { path: "/messages", element: <Message /> },

      // 404
      { path: "*", element: <div className="container mt-4">404 Not Found</div> },
    ],
  },
]);
