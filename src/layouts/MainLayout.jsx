import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ padding: '16px' }}>
        <Outlet />
      </main>
    </>
  )
}

export default MainLayout
