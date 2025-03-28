'use client';

import { useState, useRef } from 'react';
import CategorySelector from './CategorySelector';
import ConditionFilter from './ConditionFilter';
import SavedSearches from './SavedSearches';

export default function PriceSearch() {
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const savedSearchesRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Build the search query with category
      let searchQuery = query;
      if (selectedCategory) {
        searchQuery = `${searchQuery} ${selectedCategory.mainCategoryName} ${selectedCategory.name}`.trim();
      }

      const response = await fetch(
        `/api/ebay?query=${encodeURIComponent(searchQuery)}&timeRange=${timeRange}${selectedCondition ? `&conditions=${selectedCondition}` : ''}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to fetch data');
      }

      const data = await response.json();
      setResults(data);

      // Save search if we have the ref
      if (savedSearchesRef?.current?.saveSearch) {
        savedSearchesRef.current.saveSearch({
          query,
          category: selectedCategory,
          condition: selectedCondition,
          timeRange
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavedSearchSelect = (search) => {
    setQuery(search.query);
    setSelectedCategory(search.category);
    setSelectedCondition(search.condition);
    setTimeRange(search.timeRange);
    handleSearch();
  };

  const handleConditionChange = (conditionId) => {
    setSelectedCondition(selectedCondition === conditionId ? null : conditionId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <SavedSearches
        ref={savedSearchesRef}
        onSearchSelect={handleSavedSearchSelect}
      />

      <form onSubmit={handleSearch} className="space-y-6">
        <CategorySelector onCategorySelect={setSelectedCategory} />
        
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter product name..."
            className="w-full p-4 text-black placeholder-black/70 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm text-lg"
            required
          />
        </div>

        <ConditionFilter
          selectedConditions={selectedCondition}
          onConditionChange={handleConditionChange}
        />

        <div className="flex flex-wrap gap-4">
          <label className="flex-1 min-w-[200px]">
            <input
              type="radio"
              name="timeRange"
              value="week"
              checked={timeRange === 'week'}
              onChange={(e) => setTimeRange(e.target.value)}
              className="sr-only peer"
            />
            <div className="w-full p-4 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 hover:border-red-300 hover:bg-red-50/50 text-black">
              Last Week
            </div>
          </label>
          
          <label className="flex-1 min-w-[200px]">
            <input
              type="radio"
              name="timeRange"
              value="month"
              checked={timeRange === 'month'}
              onChange={(e) => setTimeRange(e.target.value)}
              className="sr-only peer"
            />
            <div className="w-full p-4 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 hover:border-red-300 hover:bg-red-50/50 text-black">
              Last Month
            </div>
          </label>
          
          <label className="flex-1 min-w-[200px]">
            <input
              type="radio"
              name="timeRange"
              value="year"
              checked={timeRange === 'year'}
              onChange={(e) => setTimeRange(e.target.value)}
              className="sr-only peer"
            />
            <div className="w-full p-4 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 hover:border-red-300 hover:bg-red-50/50 text-black">
              Last Year
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 shadow-sm transition-colors text-lg font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Average Price</h2>
              <p className="text-3xl font-bold text-red-600">
                £{results.averagePrice.toFixed(2)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                Based on {results.totalItems} sold items
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Time Range</h2>
              <p className="text-lg text-red-600">
                Last {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                From {new Date(Date.now() - getTimeRangeInMs(timeRange)).toLocaleDateString()}
              </p>
            </div>
          </div>

          {results.items?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b text-black">Recent Sales</h2>
              <div className="divide-y">
                {results.items
                  .slice(0, showAllResults ? 25 : 10)
                  .map((item, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-blue-600 hover:underline">{item.title}</h3>
                            <p className="text-sm text-black mt-1">
                              Condition: {item.condition} • Sold: {item.soldDate || 'Unknown date'}
                            </p>
                          </div>
                          <span className="font-semibold ml-4 whitespace-nowrap text-black">
                            {item.currency} {parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      </a>
                    </div>
                  ))}
              </div>
              {results.items.length > 10 && (
                <div className="p-4 border-t text-center">
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="text-red-600 hover:text-red-800"
                  >
                    {showAllResults ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeRangeInMs(timeRange) {
  switch (timeRange) {
    case 'week':
      return 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return 30 * 24 * 60 * 60 * 1000;
    case 'year':
      return 365 * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
} 