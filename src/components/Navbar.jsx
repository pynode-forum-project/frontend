import { Link } from 'react-router-dom'
import '../styles/navbar.css'

const Navbar = () => {
  return (
    <nav className="navbar">
      <h3>Forum</h3>
      <div className="nav-links">
        <Link to="/">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/home">Home</Link>
        <Link to="/contactus">Contact</Link>
      </div>
    </nav>
  )
}

export default Navbar
