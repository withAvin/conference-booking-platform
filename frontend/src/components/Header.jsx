// components/Header.jsx
// C-04 Header — variants: attendee, organizer.
// The nav links differ by role, which is the visible half of the
// role separation that SC-06 tests on the server.

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const links =
    user.role === 'organizer'
      ? [{ to: '/conferences', label: 'Conferences' }]
      : [
          { to: '/browse', label: 'Browse' },
          { to: '/my-bookings', label: 'My bookings' },
        ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 px-6 flex justify-between items-center bg-surface border-b border-line">
      <div className="flex items-center gap-6">
        <span className="px-2 py-1 rounded bg-page text-[13px] text-ink-soft">CBP</span>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm ${
              pathname === link.to ? 'text-ink font-medium' : 'text-ink-soft'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[13px] text-ink-soft">
        <span>{user.username}</span>
        <button onClick={handleLogout} className="underline">
          Log out
        </button>
      </div>
    </header>
  );
};

export default Header;
