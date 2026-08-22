import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import '../App.css'; 

const POPULAR_SEARCHES = ['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS'];

const SmartSearch = ({ onSelect, initialValue = '', placeholder = 'Search stocks or companies', buttonText = 'Analyze', isLoading = false }) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  const searchStocks = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    
    try {
      const res = await api.get(`stocks/search/?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data);
      setSelectedIndex(-1);
    } catch (err) {
      console.error("Search failed", err);
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length > 0) {
      setLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        searchStocks(val);
      }, 400); 
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  const handleSelect = (symbol) => {
    // Basic validation to only save Indian stocks to recent
    if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) return;
    
    setQuery(symbol);
    setIsOpen(false);
    
    const newRecents = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 5);
    setRecentSearches(newRecents);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(newRecents));
    } catch (e) {}

    if (onSelect) {
      onSelect(symbol);
    }
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    const listLength = query.trim() ? results.length : (recentSearches.length > 0 ? recentSearches.length : POPULAR_SEARCHES.length);
    
    if (listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < listLength - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (query.trim()) {
          handleSelect(results[selectedIndex].symbol);
        } else if (recentSearches.length > 0) {
          handleSelect(recentSearches[selectedIndex]);
        } else {
          handleSelect(POPULAR_SEARCHES[selectedIndex]);
        }
      } else if (query.trim() && results.length > 0) {
        handleSelect(results[0].symbol);
      } else if (query.trim()) {
        handleSelect(query.toUpperCase());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect(query.toUpperCase());
    }
  };

  const renderDropdown = () => {
    if (loading) {
      return (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Searching stocks...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--danger-color)', fontSize: '0.9rem' }}>
          Unable to search stocks. Please try again.
        </div>
      );
    }

    if (query.trim()) {
      if (results.length === 0) {
        return (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No Indian stocks found</div>
            <div style={{ fontSize: '0.85rem' }}>Try searching by company name or NSE symbol.</div>
          </div>
        );
      }

      return (
        <ul style={{ listStyle: 'none', margin: 0, padding: '0.5rem' }}>
          {results.map((res, index) => (
            <li 
              key={`${res.symbol}-${index}`}
              onClick={() => handleSelect(res.symbol)}
              style={{
                padding: '0.75rem 1rem',
                margin: '0.25rem 0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: selectedIndex === index ? 'rgba(79, 70, 229, 0.05)' : '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                minHeight: '60px',
                transition: 'background 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{res.name || res.symbol}</span>
                <span style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                  {res.symbol} <span style={{ opacity: 0.5 }}>•</span> {res.exchange} <span style={{ opacity: 0.5 }}>•</span> {res.type || 'EQUITY'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (recentSearches.length > 0) {
      return (
        <div>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Recent Searches</span>
            <span onClick={clearRecent} style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>Clear</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {recentSearches.map((sym, index) => (
              <li 
                key={`recent-${sym}`}
                onClick={() => handleSelect(sym)}
                style={{
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: 'var(--text-main)',
                  background: selectedIndex === index ? 'var(--bg-main)' : 'transparent'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <svg style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {sym}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div>
        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Popular Stocks
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {POPULAR_SEARCHES.map((sym, index) => (
            <li 
              key={`pop-${sym}`}
              onClick={() => handleSelect(sym)}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontWeight: 500,
                color: 'var(--text-main)',
                background: selectedIndex === index ? 'var(--bg-main)' : 'transparent'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <svg style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              {sym}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            className="premium-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            aria-label="Search stocks"
            style={{ 
              width: '100%', 
              paddingLeft: '38px', 
              boxSizing: 'border-box',
              textTransform: 'uppercase'
            }}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="primary-btn" disabled={isLoading} style={{ whiteSpace: 'nowrap', width: 'auto', padding: '0.5rem 1.5rem' }}>
          {isLoading ? 'Analyzing...' : buttonText}
        </button>
      </form>

      {isOpen && (
        <div 
          className="animate-fade-in"
          style={{
            marginTop: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            maxHeight: '350px',
            overflowY: 'auto',
            width: '100%'
          }}
        >
          {renderDropdown()}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
