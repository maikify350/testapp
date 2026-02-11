import { useState, useEffect, useRef } from 'react';
import './FontSelector.css';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    description: 'Coding font with ligatures'
  },
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    description: 'Modern UI sans-serif'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    description: 'Material Design default'
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    description: 'Humanist sans-serif'
  },
  {
    id: 'system',
    name: 'System',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    description: 'Native OS font'
  }
];

interface FontSelectorProps {
  currentFont: string;
  onFontChange: (fontFamily: string) => void;
}

export function FontSelector({ currentFont, onFontChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = FONT_OPTIONS.find(opt => opt.family === currentFont) || FONT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleSelect(option: FontOption) {
    onFontChange(option.family);
    setIsOpen(false);
  }

  return (
    <div className="k2-font-wrapper" ref={dropdownRef}>
      <button
        className="k2-font-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Select grid font"
        aria-label="Select grid font"
      >
        <span className="k2-font-icon">Aa</span>
        <span className="k2-font-label">{currentOption.name}</span>
        <span className={`k2-font-arrow ${isOpen ? 'k2-font-arrow-open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="k2-font-dropdown">
          {FONT_OPTIONS.map(option => (
            <button
              key={option.id}
              className={`k2-font-option ${currentFont === option.family ? 'k2-font-option-active' : ''}`}
              onClick={() => handleSelect(option)}
              style={{ fontFamily: option.family }}
            >
              <div className="k2-font-option-main">
                <span className="k2-font-option-name">{option.name}</span>
                {currentFont === option.family && (
                  <span className="k2-font-option-check">✓</span>
                )}
              </div>
              <span className="k2-font-option-desc">{option.description}</span>
              <div className="k2-font-option-preview" style={{ fontFamily: option.family }}>
                The quick brown fox jumps 0123456789
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
