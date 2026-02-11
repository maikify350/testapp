import React, { useState, useCallback } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  defaultValue: string; // ISO date string
  onValueChange: (field: string, val: string) => void;
  fieldKey: string;
}

export const DatePicker = React.memo(({
  defaultValue,
  onValueChange,
  fieldKey
}: DatePickerProps) => {
  // Convert ISO timestamp to YYYY-MM-DD format for input
  const initialDate = defaultValue ? new Date(defaultValue).toISOString().split('T')[0] : '';
  const [localValue, setLocalValue] = useState(initialDate);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value; // YYYY-MM-DD
    setLocalValue(dateStr);
    // Convert to ISO string for storage
    if (dateStr) {
      const isoDate = new Date(dateStr + 'T00:00:00').toISOString();
      onValueChange(fieldKey, isoDate);
    } else {
      onValueChange(fieldKey, '');
    }
  }, [fieldKey, onValueChange]);

  return (
    <div className="k2-date-picker-wrapper">
      <input
        type="date"
        className="k2-date-picker"
        value={localValue}
        onChange={handleChange}
      />
      <svg className="k2-date-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  );
});
