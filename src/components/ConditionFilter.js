'use client';

import { useEffect } from 'react';

export default function ConditionFilter({ selectedConditions, onConditionChange }) {
  const conditions = [
    { id: 'new', label: 'New' },
    { id: 'openBox', label: 'Open Box' },
    { id: 'refurbished', label: 'Refurbished' },
    { id: 'used', label: 'Used' }
  ];

  // For debugging - log whenever selectedConditions changes
  useEffect(() => {
    console.log('ConditionFilter re-rendered with condition:', selectedConditions);
  }, [selectedConditions]);

  const handleConditionClick = (conditionId) => {
    console.log(`Condition button clicked: ${conditionId}`);
    console.log(`Current selected condition: ${selectedConditions}`);
    
    // Pass the updated condition to the parent
    onConditionChange(conditionId);
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-black">Condition</h3>
      <div className="flex flex-wrap gap-2">
        {conditions.map(condition => {
          const isSelected = selectedConditions === condition.id;
          
          return (
            <button
              key={condition.id}
              onClick={() => handleConditionClick(condition.id)}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-red-500 bg-red-50 text-red-600 font-bold'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50 text-black'
                }
              `}
              type="button"
            >
              {condition.label} {isSelected ? '✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
} 