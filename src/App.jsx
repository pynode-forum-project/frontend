import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

const App = () => {
  const MOCK = import.meta.env.VITE_MOCK_AUTH === 'true';

  return (
    <div className="app-shell">
      {MOCK && (
        <div style={{ position: 'fixed', right: 12, bottom: 12, background: '#ffecef', color: '#7a0b0b', padding: '6px 10px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 9999, fontSize: '0.85rem' }}>
          DEV MOCK AUTH
        </div>
      )}
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
