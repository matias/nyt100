'use client';

import { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { FilterState } from '@/types/restaurant';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filteredCount: number;
}

const BOROUGHS = [
  { id: 'Manhattan', label: 'MN' },
  { id: 'Brooklyn', label: 'BK' },
  { id: 'Queens', label: 'QN' },
  { id: 'Bronx', label: 'BX' },
  { id: 'Staten Island', label: 'SI' }
];

export default function FilterPanel({ filters, onFiltersChange, filteredCount }: FilterPanelProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleLunchToggle = () => {
    onFiltersChange({ ...filters, openForLunch: !filters.openForLunch });
  };

  const handleBoroughToggle = (borough: string) => {
    const newBoroughs = filters.boroughs.includes(borough)
      ? filters.boroughs.filter(b => b !== borough)
      : [...filters.boroughs, borough];
    onFiltersChange({ ...filters, boroughs: newBoroughs });
  };

  const handlePublicationToggle = (publication: string) => {
    const newPublications = filters.publications.includes(publication)
      ? filters.publications.filter(p => p !== publication)
      : [...filters.publications, publication];
    onFiltersChange({ ...filters, publications: newPublications });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
    if (!value) {
      setShowSearchInput(false);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      boroughs: [],
      openForLunch: false,
      publications: ['NYT', 'NYM'], // Reset to default (both selected)
    });
    setShowSearchInput(false);
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.boroughs.length > 0 || 
    filters.openForLunch ||
    (filters.publications.length !== 2); // Active if not both selected

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {/* Borough Toggles - First */}
          {BOROUGHS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleBoroughToggle(id)}
              className={`flex-shrink-0 px-1 py-1.5 min-w-[30px] text-sm font-medium rounded-md transition-colors ${
                filters.boroughs.includes(id)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Lunch Toggle */}
          <button
            onClick={handleLunchToggle}
            className={`flex-shrink-0 px-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filters.openForLunch
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Lunch
          </button>

          {/* Publication Filters (with favicons) - wrapped in container that moves to second line when space is tight */}
          <div className="flex items-center gap-2 flex-shrink-0 max-[360px]:basis-full max-[360px]:w-full">
            <button
              onClick={() => handlePublicationToggle('NYT')}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                filters.publications.includes('NYT')
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
              aria-label="New York Times"
            >
              <img 
                src="/favicons/nyt.ico" 
                alt="NYT" 
                className="w-5 h-5"
              />
            </button>
            <button
              onClick={() => handlePublicationToggle('NYM')}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                filters.publications.includes('NYM')
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
              aria-label="New York Magazine"
            >
              <img 
                src="/favicons/nym.ico" 
                alt="NYM" 
                className="w-5 h-5"
              />
            </button>
          </div>

          {/* Line break for small screens (below 800px) */}
          <div className="hidden max-[685px]:block w-full"></div>

          {/* Search - Fourth */}
          {showSearchInput ? (
            <div className="flex-shrink-0 flex items-center gap-1">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-48 max-[400px]:flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => {
                  handleSearchChange('');
                  setShowSearchInput(false);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Search
            </button>
          )}

          
          {/* Restaurant Count and Info - Last */}
          <div className="flex-shrink-0 ml-auto flex items-center gap-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {filteredCount} result{filteredCount === 1 ? '' : 's'}
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="About this app"
            >
              <FaQuestionCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About This App</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This web app displays the best restaurants in New York City, combining recommendations from 
              The New York Times and Grub Street. Browse restaurants by borough, cuisine, and other filters, 
              and explore them on an interactive map.
            </p>
            <div className="space-y-3 mb-6">
              Sources:
              <ul>
                <li>
                  <a
                    href="https://www.nytimes.com/interactive/2025/dining/best-nyc-restaurants.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    New York Times: 100 Best Restaurants in NYC 2025
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.grubstreet.com/article/the-best-restaurants-in-nyc.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Grub Street: The 43 Best Restaurants in New York
                  </a>
                </li>
              </ul>
              <div>
                <a
                  href="https://github.com/matias/nyt100"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                GitHub Project
                </a>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
