import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Book, FileText, Home, GraduationCap, Code, BookOpen, User } from 'lucide-react';
import PropTypes from 'prop-types';

export default function Header({ onToggleCheatSheet }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!user) return null;

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <Book className="logo-icon" size={24} />
            <span className="logo-text">SQL Learning Game</span>
          </Link>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="nav-links desktop-nav">
            <Link to="/">Dashboard</Link>
            <Link to="/learn">Learn</Link>
            <Link to="/problems">Problems</Link>
            <Link to="/flashcards">Flashcards</Link>
            <Link to="/assessment">Assessment</Link>
            <button
              className="cheatsheet-btn"
              onClick={onToggleCheatSheet}
              title="View SQL Cheat Sheet"
            >
              <FileText size={18} />
              <span>Cheat Sheet</span>
            </button>
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

      {/* Mobile Bottom Navigation - Visible Only on Mobile */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/learn" className={`nav-item ${isActive('/learn') ? 'active' : ''}`}>
          <GraduationCap size={20} />
          <span>Learn</span>
        </Link>
        <Link to="/problems" className={`nav-item ${isActive('/problems') ? 'active' : ''}`}>
          <Code size={20} />
          <span>Problems</span>
        </Link>
        <Link to="/flashcards" className={`nav-item ${isActive('/flashcards') ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Cards</span>
        </Link>
        <button
          className={`nav-item nav-button`}
          onClick={onToggleCheatSheet}
          title="View SQL Cheat Sheet"
        >
          <FileText size={20} />
          <span>Sheet</span>
        </button>
      </nav>
    </>
  );
}

Header.propTypes = {
  onToggleCheatSheet: PropTypes.func.isRequired,
};
