import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { email, password } = formData;

    if (!email || !password) {
      return "Email and password are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!emailRegex.test(email)) {
      return "Email must be a valid .com address (e.g. user@example.com).";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

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
    <div className="container mt-5" style={{ maxWidth: "450px" }}>
      <h2 className="mb-4 text-center">Login</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
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
  );
};

export default Login;
