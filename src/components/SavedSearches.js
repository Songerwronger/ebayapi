'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const SavedSearches = forwardRef(({ onSearchSelect }, ref) => {
  const [savedSearches, setSavedSearches] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  useImperativeHandle(ref, () => ({
    saveSearch: (search) => {
      const existingIndex = savedSearches.findIndex(
        s => s.query === search.query &&
        s.category?.id === search.category?.id &&
        JSON.stringify(s.conditions) === JSON.stringify(search.conditions) &&
        s.timeRange === search.timeRange
      );

      if (existingIndex === -1) {
        setSavedSearches(prev => [{
          ...search,
          id: Date.now(),
          savedAt: new Date().toISOString(),
          note: ''
        }, ...prev].slice(0, 10)); // Keep only the 10 most recent searches
      }
    }
  }));

  const handleDelete = (id) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const startEditingNote = (search) => {
    setEditingNoteId(search.id);
    setNoteContent(search.note || '');
  };

  const saveNote = () => {
    setSavedSearches(prev => prev.map(search =>
      search.id === editingNoteId
        ? { ...search, note: noteContent }
        : search
    ));
    setEditingNoteId(null);
    setNoteContent('');
  };

  if (savedSearches.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className="p-4 border-b bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold text-black">Saved Searches</h2>
        <button className="text-gray-500">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="divide-y">
          {savedSearches.map(search => (
            <div key={search.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <button
                    onClick={() => onSearchSelect(search)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {search.query}
                  </button>
                  <div className="text-sm text-black/70 mt-1">
                    {search.category?.name && (
                      <span className="mr-2">
                        Category: {search.category.name}
                      </span>
                    )}
                    {search.conditions?.length > 0 && (
                      <span className="mr-2">
                        Conditions: {search.conditions.join(', ')}
                      </span>
                    )}
                    <span>
                      Time Range: {search.timeRange}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditingNote(search)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    📝
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editingNoteId === search.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="flex-1 px-3 py-1 border rounded-lg text-sm"
                    placeholder="Add a note..."
                    autoFocus
                  />
                  <button
                    onClick={saveNote}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Save
                  </button>
                </div>
              ) : search.note ? (
                <p className="mt-2 text-sm text-black/70">
                  Note: {search.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SavedSearches.displayName = 'SavedSearches';

export default SavedSearches; 