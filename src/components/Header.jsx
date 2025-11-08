import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Book } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <Book className="logo-icon" size={24} />
          <span className="logo-text">SQL Learning Game</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/flashcards">Flashcards</Link>
          <Link to="/problems">Problems</Link>
        </nav>

        <div className="user-menu">
          <button
            className="user-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="user-avatar">{user.email[0].toUpperCase()}</span>
            <span className="user-email">{user.email}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                Settings
              </Link>
              <button onClick={handleSignOut}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
