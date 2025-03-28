'use client';

import { useState } from 'react';
import CategorySelector from './CategorySelector';
import ConditionFilter from './ConditionFilter';

export default function PriceSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [timeResults, setTimeResults] = useState(null);
  const [emptySearchError, setEmptySearchError] = useState(false);

  const fetchPriceData = async (searchQuery, timeRange, condition) => {
    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();
    const conditionParam = condition ? `&conditions=${condition}` : '';
    
    const response = await fetch(
      `/api/ebay?query=${encodeURIComponent(searchQuery)}&timeRange=${timeRange}${conditionParam}&exactMatch=true&_t=${timestamp}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || 'Failed to fetch data');
    }

    return await response.json();
  };

  const handleSearch = async (e) => {
    console.log('Search initiated with:', {
      query,
      selectedCategory,
      selectedCondition
    });
    
    e?.preventDefault();
    
    // Clear any previous errors
    setError(null);
    setEmptySearchError(false);
    
    // Check if search field is empty
    if (!query.trim()) {
      setEmptySearchError(true);
      return;
    }
    
    setLoading(true);
    setResults(null);
    setTimeResults(null);

    try {
      // Build the search query - DO NOT include category info in the query
      let searchQuery = query.trim();
      
      // Log, but don't actually include category in the query
      if (selectedCategory) {
        console.log(`Building search with category: ${selectedCategory.mainCategoryName} ${selectedCategory.name}`);
      }

      console.log('Fetching data with condition:', selectedCondition);
      
      // Fetch data for each time range with explicit condition parameter
      const [weekData, monthData, yearData] = await Promise.all([
        fetchPriceData(searchQuery, 'week', selectedCondition),
        fetchPriceData(searchQuery, 'month', selectedCondition),
        fetchPriceData(searchQuery, 'year', selectedCondition)
      ]);
      
      console.log('Received data:', {
        weekItems: weekData.items?.length,
        monthItems: monthData.items?.length,
        yearItems: yearData.items?.length,
        condition: selectedCondition
      });

      // Calculate overall average from all time periods
      const combinedItems = [
        ...weekData.items || [],
        ...monthData.items || [],
        ...yearData.items || []
      ];

      // Remove duplicates based on item ID if available
      const uniqueItems = Array.from(new Map(
        combinedItems.map(item => [item.link, item])
      ).values());

      // Set results using the week data for the display list
      setResults(weekData);

      // Calculate overall average price
      const validPrices = uniqueItems
        .map(item => parseFloat(item.price))
        .filter(price => !isNaN(price));
      
      const overallAverage = validPrices.length > 0
        ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
        : 0;

      // Store all time period results
      setTimeResults({
        week: weekData,
        month: monthData,
        year: yearData,
        overallAverage,
        totalUniqueItems: uniqueItems.length
      });

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConditionChange = (conditionId) => {
    // Only proceed if the condition is actually changing
    if (selectedCondition === conditionId) {
      console.log('Removing condition filter');
      setSelectedCondition(null);
      
      // If we already have results, do a new search with the condition removed
      if (results && query) {
        // We'll create a new function that runs the search with the updated condition
        const searchWithNewCondition = async () => {
          try {
            setLoading(true);
            
            // Build search query with category - DO NOT include category in query
            let searchQuery = query.trim();
            if (selectedCategory) {
              console.log(`Building search with category: ${selectedCategory.mainCategoryName} ${selectedCategory.name}`);
            }
            
            // Create explicit query parameters
            const queryParams = new URLSearchParams({
              query: searchQuery,
              exactMatch: 'true',
              _t: new Date().getTime() // Cache busting
            });
            
            // No condition - it was removed
            
            // Make three separate requests for different time periods
            const weekResp = await fetch(`/api/ebay?${queryParams}&timeRange=week`);
            const monthResp = await fetch(`/api/ebay?${queryParams}&timeRange=month`);
            const yearResp = await fetch(`/api/ebay?${queryParams}&timeRange=year`);
            
            if (!weekResp.ok || !monthResp.ok || !yearResp.ok) {
              throw new Error('One or more requests failed');
            }
            
            const [weekData, monthData, yearData] = await Promise.all([
              weekResp.json(),
              monthResp.json(),
              yearResp.json()
            ]);
            
            // Process the data
            const combinedItems = [
              ...weekData.items || [],
              ...monthData.items || [],
              ...yearData.items || []
            ];
            
            const uniqueItems = Array.from(new Map(
              combinedItems.map(item => [item.link, item])
            ).values());
            
            setResults(weekData);
            
            const validPrices = uniqueItems
              .map(item => parseFloat(item.price))
              .filter(price => !isNaN(price));
            
            const overallAverage = validPrices.length > 0
              ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
              : 0;
            
            setTimeResults({
              week: weekData,
              month: monthData,
              year: yearData,
              overallAverage,
              totalUniqueItems: uniqueItems.length
            });
            
          } catch (err) {
            console.error('Search with updated condition failed:', err);
            setError(err.message || 'Failed to update search with new condition');
          } finally {
            setLoading(false);
          }
        };
        
        searchWithNewCondition();
      }
    } else {
      console.log(`Setting condition to: ${conditionId}`);
      setSelectedCondition(conditionId);
      
      // If we already have results, do a new search with the updated condition
      if (results && query) {
        // We'll create a new function that runs the search with the updated condition
        const searchWithNewCondition = async () => {
          try {
            setLoading(true);
            
            // Build search query with category - DO NOT include category in query
            let searchQuery = query.trim();
            if (selectedCategory) {
              console.log(`Building search with category: ${selectedCategory.mainCategoryName} ${selectedCategory.name}`);
            }
            
            // Create explicit query parameters
            const queryParams = new URLSearchParams({
              query: searchQuery,
              exactMatch: 'true',
              conditions: conditionId,
              _t: new Date().getTime() // Cache busting
            });
            
            // Make three separate requests for different time periods
            const weekResp = await fetch(`/api/ebay?${queryParams}&timeRange=week`);
            const monthResp = await fetch(`/api/ebay?${queryParams}&timeRange=month`);
            const yearResp = await fetch(`/api/ebay?${queryParams}&timeRange=year`);
            
            if (!weekResp.ok || !monthResp.ok || !yearResp.ok) {
              throw new Error('One or more requests failed');
            }
            
            const [weekData, monthData, yearData] = await Promise.all([
              weekResp.json(),
              monthResp.json(),
              yearResp.json()
            ]);
            
            // Process the data
            const combinedItems = [
              ...weekData.items || [],
              ...monthData.items || [],
              ...yearData.items || []
            ];
            
            const uniqueItems = Array.from(new Map(
              combinedItems.map(item => [item.link, item])
            ).values());
            
            setResults(weekData);
            
            const validPrices = uniqueItems
              .map(item => parseFloat(item.price))
              .filter(price => !isNaN(price));
            
            const overallAverage = validPrices.length > 0
              ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
              : 0;
            
            setTimeResults({
              week: weekData,
              month: monthData,
              year: yearData,
              overallAverage,
              totalUniqueItems: uniqueItems.length
            });
            
          } catch (err) {
            console.error('Search with updated condition failed:', err);
            setError(err.message || 'Failed to update search with new condition');
          } finally {
            setLoading(false);
          }
        };
        
        searchWithNewCondition();
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSearch} className="space-y-6" noValidate>
        <CategorySelector onCategorySelect={setSelectedCategory} />
        
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (emptySearchError) setEmptySearchError(false);
            }}
            placeholder="Enter product name..."
            className={`w-full p-4 text-black placeholder-black/70 border-2 ${emptySearchError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm text-lg`}
          />
          {emptySearchError && (
            <p className="text-red-500 text-sm mt-1">Please enter a product name to search</p>
          )}
        </div>

        <ConditionFilter
          selectedConditions={selectedCondition}
          onConditionChange={handleConditionChange}
        />

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

      {timeResults && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Last Week</h2>
              <p className="text-2xl font-bold text-red-600">
                £{timeResults.week.averagePrice.toFixed(2)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                {timeResults.week.totalItems} items
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Last Month</h2>
              <p className="text-2xl font-bold text-red-600">
                £{timeResults.month.averagePrice.toFixed(2)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                {timeResults.month.totalItems} items
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Last Year</h2>
              <p className="text-2xl font-bold text-red-600">
                £{timeResults.year.averagePrice.toFixed(2)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                {timeResults.year.totalItems} items
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2 text-black">Overall Average</h2>
              <p className="text-2xl font-bold text-red-600">
                £{timeResults.overallAverage.toFixed(2)}
              </p>
              <p className="text-sm text-black/70 mt-1">
                Based on {timeResults.totalUniqueItems} unique items
              </p>
            </div>
          </div>

          {results.items?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="text-xl font-bold p-6 border-b text-black">Recent Sales</h2>
              <div className="divide-y">
                {results.items
                  .slice(0, showAllResults ? 25 : 10)
                  .map((item, index) => {
                    console.log(`Displaying item ${index}:`, { 
                      title: item.title, 
                      condition: item.condition,
                      price: item.price
                    });
                    
                    return (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-blue-600 hover:underline">{item.title}</h3>
                              <p className="text-sm text-black mt-1">
                                Condition: <span className="font-semibold">{item.condition}</span> • Sold: {item.soldDate || 'Unknown date'}
                              </p>
                            </div>
                            <span className="font-semibold ml-4 whitespace-nowrap text-black">
                              {item.currency} {parseFloat(item.price).toFixed(2)}
                            </span>
                          </div>
                        </a>
                      </div>
                    );
                  })}
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