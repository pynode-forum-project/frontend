import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  // only need isAuthenticated and logout from AuthContext
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/users/login");
  };

  return (
    <header className="app-navbar">
      <div className="navbar-inner">
        <Link className="brand" to="/">
          Forum
        </Link>

        <ul className="nav-items">
          {!isAuthenticated && (
            <>
              <li>
                <Link className="nav-link" to="/users/login">
                  Login
                </Link>
              </li>
              <li>
                <Link className="nav-link" to="/users/register">
                  Register
                </Link>
              </li>
            </>
          )}

          {isAuthenticated && (
            <>
              <li>
                <Link className="nav-link" to="/home">
                  Home
                </Link>
              </li>
              <li>
                <Link className="nav-link" to="/posts">
                  Posts
                </Link>
              </li>
              <li>
                <Link className="nav-link" to="/users/profile">
                  Profile
                </Link>
              </li>
              <li>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
