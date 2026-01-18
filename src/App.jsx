import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Contact from './pages/Contact'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/users/:id/profile" element={<Profile />} />
        <Route path="/contactus" element={<Contact />} />
      </Route>
    </Routes>
  )
}

export default App
