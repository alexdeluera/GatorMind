import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Upload from './pages/Upload.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Nav from './components/Nav.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Optional catch-all for 404s */}
        <Route path="*" element={<h1 style={{ padding: 24 }}>Not Found</h1>} />
      </Routes>
    </>
  );
}
