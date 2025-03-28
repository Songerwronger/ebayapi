'use client';

export default function ConditionFilter({ selectedConditions, onConditionChange }) {
  const conditions = [
    { id: 'new', label: 'New' },
    { id: 'openBox', label: 'Open Box' },
    { id: 'refurbished', label: 'Refurbished' },
    { id: 'used', label: 'Used' }
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-black">Condition</h3>
      <div className="flex flex-wrap gap-2">
        {conditions.map(condition => (
          <button
            key={condition.id}
            onClick={() => onConditionChange(condition.id)}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all
              ${selectedConditions === condition.id
                ? 'border-red-500 bg-red-50 text-red-600'
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50 text-black'
              }
            `}
          >
            {condition.label}
          </button>
        ))}
      </div>
    </div>
  );
} 