import React from "react";
import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { register as apiRegister } from "../services/authApi";

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const refs = {
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    const newFieldErrors = {};

    if (!firstName || !firstName.trim()) newFieldErrors.firstName = "First name is required.";
    if (!lastName || !lastName.trim()) newFieldErrors.lastName = "Last name is required.";
    if (!email) newFieldErrors.email = "Email is required.";
    if (!password) newFieldErrors.password = "Password is required.";
    if (!confirmPassword)
      newFieldErrors.confirmPassword = "Confirm password is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email))
      newFieldErrors.email = "Email must be a valid address (e.g. user@example.com).";

    if (password && password.length < 8)
      newFieldErrors.password = "Password must be at least 8 characters.";

    if (password && confirmPassword && password !== confirmPassword)
      newFieldErrors.confirmPassword = "Passwords do not match.";

    // optional: trim/length checks for names
    if (firstName && firstName.trim().length > 50)
      newFieldErrors.firstName = "First name is too long.";
    if (lastName && lastName.trim().length > 50)
      newFieldErrors.lastName = "Last name is too long.";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      // focus first invalid field
      const firstKey = Object.keys(newFieldErrors)[0];
      if (firstKey && refs[firstKey] && refs[firstKey].current) refs[firstKey].current.focus();
      return "Please correct the highlighted fields.";
    }

    setFieldErrors({});
    return null;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      // Call Gateway -> Auth Service
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      const res = await apiRegister(payload);

      if (res.ok && res.status === 201) {
        setSuccess("Registration successful. Please check your email to verify your account.");
        setLoading(false);
        setTimeout(() => navigate('/users/login', { replace: true }), 1200);
        return;
      }

      // Handle 4xx user errors and field-level details
      if (res.body && res.body.details && typeof res.body.details === 'object') {
        setFieldErrors(res.body.details);
        // focus first field with error
        const firstKey = Object.keys(res.body.details)[0];
        if (firstKey && refs[firstKey] && refs[firstKey].current) refs[firstKey].current.focus();
      }

      const msg = (res.body && (res.body.error || res.body.message)) || 'Registration failed.';
      setError(msg);
      setLoading(false);
    } catch (err) {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="mb-4">Register</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Registration successful. Please check your email to verify your account.
            <br />
            Redirecting to login...
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="firstName" className="form-label">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              className="form-control"
              value={formData.firstName}
              onChange={handleChange}
              ref={refs.firstName}
            />
            <div className="text-danger small field-error">{fieldErrors.firstName || '\u00A0'}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="lastName" className="form-label">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              className="form-control"
              value={formData.lastName}
              onChange={handleChange}
              ref={refs.lastName}
            />
            <div className="text-danger small field-error">{fieldErrors.lastName || '\u00A0'}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              ref={refs.email}
            />
            <div className="text-danger small field-error">{fieldErrors.email || '\u00A0'}</div>
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
              ref={refs.password}
            />
            <div className="text-danger small field-error">{fieldErrors.password || '\u00A0'}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              ref={refs.confirmPassword}
            />
            <div className="text-danger small field-error">{fieldErrors.confirmPassword || '\u00A0'}</div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account?{" "}
          <Link to="/users/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
