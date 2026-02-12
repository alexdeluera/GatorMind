import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Upload from './pages/Upload.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Team from './pages/Team.jsx';
import SignIn from './pages/SignIn.jsx';

export default function App() {
  return (
    <>
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/team" element={<Team />} />
        <Route path="/signin" element={<SignIn/>} />
        {/* Optional catch-all for 404s */}
        <Route path="*" element={<h1 style={{ padding: 24 }}>Not Found</h1>} />
      </Routes>
    </>
  );
}
