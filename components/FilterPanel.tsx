'use client';

import { useState } from 'react';
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

  const handleLunchToggle = () => {
    onFiltersChange({ ...filters, openForLunch: !filters.openForLunch });
  };

  const handleBoroughToggle = (borough: string) => {
    const newBoroughs = filters.boroughs.includes(borough)
      ? filters.boroughs.filter(b => b !== borough)
      : [...filters.boroughs, borough];
    onFiltersChange({ ...filters, boroughs: newBoroughs });
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
    });
    setShowSearchInput(false);
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.boroughs.length > 0 || 
    filters.openForLunch;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3 overflow-x-auto">
          {/* Lunch Toggle */}
          <button
            onClick={handleLunchToggle}
            className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filters.openForLunch
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Lunch
          </button>

          {/* Borough Toggles */}
          {BOROUGHS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleBoroughToggle(id)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filters.boroughs.includes(id)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Search */}
          {showSearchInput ? (
            <div className="flex-shrink-0 flex items-center gap-1">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear
            </button>
          )}

          {/* Restaurant Count */}
          <div className="flex-shrink-0 ml-auto text-sm font-medium text-gray-600 dark:text-gray-400">
            ({filteredCount})
          </div>
        </div>
      </div>
    </div>
  );
}
