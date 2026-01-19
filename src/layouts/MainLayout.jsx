import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MainLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
