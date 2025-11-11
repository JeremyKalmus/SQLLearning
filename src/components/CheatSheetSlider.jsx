import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cheatSheetSections } from '../data/cheatsheet';
import CheatSheetSection from './CheatSheet/CheatSheetSection';

export default function CheatSheetSlider({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when slider is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Helper function to check if section matches search term
  const sectionMatchesSearch = (section, searchTerm) => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return true;

    const lowerSearchTerm = trimmedTerm.toLowerCase();
    const lowerTitle = section.title.toLowerCase();

    // Check title (exact match gets priority)
    if (lowerTitle === lowerSearchTerm) {
      return true;
    }
    if (lowerTitle.includes(lowerSearchTerm)) {
      return true;
    }

    // Check search terms array
    if (section.searchTerms.some(term => term.toLowerCase().includes(lowerSearchTerm))) {
      return true;
    }

    // Check items content (subtitles and code)
    for (const item of section.items) {
      // Check subtitle
      if (item.subtitle && item.subtitle.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }

      // Check code
      if (item.code && item.code.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }

      // Check description
      if (item.description && item.description.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }

      // Check list items
      if (item.list) {
        for (const listItem of item.list) {
          if (listItem.toLowerCase().includes(lowerSearchTerm)) {
            return true;
          }
        }
      }
    }

    // Check for individual word matches (if multiple words)
    const searchWords = lowerSearchTerm.split(/\s+/).filter(word => word.length > 0);
    if (searchWords.length > 1) {
      // All words must be present somewhere in the section
      return searchWords.every(word => {
        // Check in title
        if (lowerTitle.includes(word)) return true;

        // Check in search terms
        if (section.searchTerms.some(term => term.toLowerCase().includes(word))) return true;

        // Check in items
        return section.items.some(item => {
          if (item.subtitle && item.subtitle.toLowerCase().includes(word)) return true;
          if (item.code && item.code.toLowerCase().includes(word)) return true;
          if (item.description && item.description.toLowerCase().includes(word)) return true;
          if (item.list && item.list.some(li => li.toLowerCase().includes(word))) return true;
          return false;
        });
      });
    }

    return false;
  };

  const filteredSections = searchTerm
    ? cheatSheetSections.filter(section =>
        sectionMatchesSearch(section, searchTerm)
      )
    : cheatSheetSections;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="cheatsheet-backdrop" onClick={onClose} />
      )}

      {/* Slider */}
      <div className={`cheatsheet-slider ${isOpen ? 'open' : ''}`}>
        <div className="cheatsheet-header">
          <h2>SQL Cheat Sheet</h2>
          <button className="cheatsheet-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cheatsheet-search">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cheatsheet-search-input"
          />
        </div>

        <div className="cheatsheet-content">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <CheatSheetSection key={section.id} section={section} />
            ))
          ) : (
            <div className="cheatsheet-no-results">
              <p>No sections found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

CheatSheetSlider.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
