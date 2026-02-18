import { NavLink } from 'react-router-dom';

const linkStyle = ({ isActive }) => ({
  padding: '8px 12px',
  textDecoration: 'none',
  color: isActive ? '#0b5fff' : '#333',
  fontWeight: isActive ? 700 : 500,
});

export default function Nav() {
  return (
    <nav style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid #eee' }}>
      <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
      <NavLink to="/upload" style={linkStyle}>Upload</NavLink>
      <NavLink to="/" style={linkStyle} end>Sign Out</NavLink>
      
    </nav>
  );
}