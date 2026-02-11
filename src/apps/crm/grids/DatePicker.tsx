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
    <input
      type="date"
      className="k2-date-picker"
      value={localValue}
      onChange={handleChange}
    />
  );
});
