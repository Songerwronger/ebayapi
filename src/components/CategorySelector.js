'use client';

import { useState } from 'react';

export default function CategorySelector({ onCategorySelect }) {
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  const categories = {
    electronics: {
      name: 'Electronics',
      subcategories: [
        { id: 'phones', name: 'Phones & Smartphones' },
        { id: 'laptops', name: 'Laptops & Computers' },
        { id: 'cameras', name: 'Cameras & Photography' },
        { id: 'gaming', name: 'Gaming Consoles' },
        { id: 'tablets', name: 'Tablets & E-Readers' },
        { id: 'audio', name: 'Audio Equipment' }
      ]
    },
    tools: {
      name: 'Tools',
      subcategories: [
        { id: 'power_tools', name: 'Power Tools' },
        { id: 'hand_tools', name: 'Hand Tools' },
        { id: 'garden_tools', name: 'Garden Tools' },
        { id: 'measuring', name: 'Measuring & Layout' },
        { id: 'workshop', name: 'Workshop Equipment' }
      ]
    },
    bikes: {
      name: 'Bikes',
      subcategories: [
        { id: 'electric_bikes', name: 'Electric Bikes' },
        { id: 'mountain_bikes', name: 'Mountain Bikes' },
        { id: 'road_bikes', name: 'Road Bikes' },
        { id: 'hybrid_bikes', name: 'Hybrid Bikes' },
        { id: 'bike_parts', name: 'Bike Parts' }
      ]
    }
  };

  const handleMainCategoryClick = (category) => {
    if (selectedMain === category) {
      setSelectedMain(null);
      setSelectedSub(null);
      onCategorySelect(null);
    } else {
      setSelectedMain(category);
      setSelectedSub(null);
    }
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSub(subcategory.id);
    onCategorySelect({
      id: subcategory.id,
      name: subcategory.name,
      mainCategory: selectedMain,
      mainCategoryName: categories[selectedMain].name
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-black">Category</h3>
      
      {/* Main categories */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => handleMainCategoryClick(key)}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all
              ${selectedMain === key
                ? 'border-red-500 bg-red-50 text-red-600'
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50 text-black'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {selectedMain && (
        <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-200">
          {categories[selectedMain].subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              onClick={() => handleSubcategoryClick(subcategory)}
              className={`
                px-3 py-1.5 rounded-lg border transition-all
                ${selectedSub === subcategory.id
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50 text-black'
                }
              `}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 