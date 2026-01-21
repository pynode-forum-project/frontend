import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Register.css";

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    const newFieldErrors = {};

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

      // mock register success
      setTimeout(() => {
        setSuccess(
          "Registration successful. Please check your email to verify your account."
        );
        setLoading(false);

        setTimeout(() => {
          navigate("/users/login", { replace: true });
        }, 1500);
      }, 800);
    } catch (err) {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2 className="register-title">Register</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Registration successful. Please check your email to verify your account.
            <br />
            Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              type="text"
              name="firstName"
              className="form-control"
              value={formData.firstName}
              onChange={handleChange}
            />
            {fieldErrors.firstName && (
              <div className="text-danger small">{fieldErrors.firstName}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              name="lastName"
              className="form-control"
              value={formData.lastName}
              onChange={handleChange}
            />
            {fieldErrors.lastName && (
              <div className="text-danger small">{fieldErrors.lastName}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <div className="text-danger small">{fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
            />
            {fieldErrors.password && (
              <div className="text-danger small">{fieldErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {fieldErrors.confirmPassword && (
              <div className="text-danger small">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/users/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
