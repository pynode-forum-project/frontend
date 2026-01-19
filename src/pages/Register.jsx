import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { email, password, confirmPassword } = formData;

    if (!email || !password || !confirmPassword) {
      return "Email, password and confirm password are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!emailRegex.test(email)) {
      return "Email must be a valid .com address (e.g. user@example.com).";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

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
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="mb-4 text-center">Register</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">
          Registration successful. Please check your email to verify your account.
          <br />
          Redirecting to login...
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
          {/* form fields */}
        </form>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">First Name</label>
          <input
            type="text"
            name="firstName"
            className="form-control"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            className="form-control"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
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
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
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
  );
};

export default Register;
