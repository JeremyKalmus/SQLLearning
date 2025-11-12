import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Book, FileText, Menu, X } from 'lucide-react';
import PropTypes from 'prop-types';

export default function Header({ onToggleCheatSheet }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    closeMobileMenu();
  };

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <Book className="logo-icon" size={24} />
          <span className="logo-text">SQL Learning Game</span>
        </Link>

        {/* Hamburger Menu Button - Mobile Only */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" onClick={handleNavClick}>Dashboard</Link>
          <Link to="/learn" onClick={handleNavClick}>Learn</Link>
          <Link to="/problems" onClick={handleNavClick}>Problems</Link>
          <Link to="/flashcards" onClick={handleNavClick}>Flashcards</Link>
          <Link to="/assessment" onClick={handleNavClick}>Assessment</Link>
          <button
            className="cheatsheet-btn"
            onClick={() => {
              onToggleCheatSheet();
              closeMobileMenu();
            }}
            title="View SQL Cheat Sheet"
          >
            <FileText size={18} />
            <span>Cheat Sheet</span>
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

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

Header.propTypes = {
  onToggleCheatSheet: PropTypes.func.isRequired,
};
