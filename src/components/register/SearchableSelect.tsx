import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  nombre?: string;
  name?: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLabel = (opt: Option) => opt.nombre || opt.name || '';

  const selectedOption = options.find((o) => o.id === value);
  const selectedLabel = selectedOption ? getLabel(selectedOption) : '';

  const filtered = search
    ? options.filter((o) =>
        getLabel(o).toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={`w-full border rounded px-3 py-2 text-left flex items-center justify-between gap-2 bg-white ${
          disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-blue-400'
        }`}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              &times;
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <ul className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    opt.id === value ? 'bg-blue-100 font-medium' : ''
                  }`}
                >
                  {getLabel(opt)}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
