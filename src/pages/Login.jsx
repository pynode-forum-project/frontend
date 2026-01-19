import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/auth.css";


const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useContext(AuthContext);

  // Logged-in users should not see the login page.
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { email, password } = formData;
    const newFieldErrors = {};

    if (!email) newFieldErrors.email = "Email is required.";
    if (!password) newFieldErrors.password = "Password is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email))
      newFieldErrors.email = "Email must be a valid address (e.g. user@example.com).";

    if (password && password.length < 8)
      newFieldErrors.password = "Password must be at least 8 characters.";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return "Please correct the highlighted fields.";
    }

    setFieldErrors({});
    return null;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // !!! TODO: integrate with Gateway later
      // const res = await fetch("http://localhost:8080/users/login", {...})

      // mock login success
      setTimeout(() => {
        login("mock-token"); // !!! only for demo purposes
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper auth-center">
      <div className="auth-card">
        <h2 className="mb-4 text-center">Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <div className="text-danger small">{fieldErrors.email}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          {fieldErrors.password && (
            <div className="text-danger small">{fieldErrors.password}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        </form>

        <div className="mt-3 text-center">
          <p>
            Don’t have an account?{" "}
            <Link to="/users/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
