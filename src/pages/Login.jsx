import React from "react";
import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login as apiLogin } from "../services/authApi";

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
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

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
      // Call Gateway -> Auth Service
      const res = await apiLogin({ email: formData.email, password: formData.password });

      if (res.ok && res.body && res.body.token) {
        // store token via AuthContext (AuthContext.login stores token in localStorage)
        login(res.body.token);
        setLoading(false);
        navigate('/home', { replace: true });
        return;
      }

      // handle error shapes: prefer field-level details/errors over global message
      const details = res.body && (res.body.details || res.body.errors);
      if (details && typeof details === 'object' && Object.keys(details).length > 0) {
        const mapped = {};
        if (details.email) mapped.email = details.email;
        if (details.password) mapped.password = details.password;
        setFieldErrors(mapped);
        // focus first field with error
        const firstKey = Object.keys(mapped)[0];
        if (firstKey === 'email') emailRef.current?.focus();
        else if (firstKey === 'password') passwordRef.current?.focus();
        setLoading(false);
        return;
      }

      const msg = (res.body && (res.body.error || res.body.message)) || 'Invalid email or password.';
      setError(msg);
      setLoading(false);
    } catch (err) {
      setError("Unexpected error while logging in.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper auth-center">
      <div className="auth-card">
        <h2 className="mb-4">Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              ref={emailRef}
            />
            {fieldErrors.email && (
              <div className="text-danger small">{fieldErrors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              ref={passwordRef}
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
