import React, { useState, useEffect, useRef } from 'react';
import type { Column } from '@tanstack/react-table';
import type { Client } from '../types';
import './ColumnMenu.css';

interface ColumnMenuProps {
  column: Column<Client, unknown>;
  onClose: () => void;
  position: { x: number; y: number };
}

export function ColumnMenu({ column, onClose, position }: ColumnMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    // Adjust position if menu would go off-screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSortAsc = () => {
    if (column.getCanSort()) {
      column.toggleSorting(false);
      onClose();
    }
  };

  const handleSortDesc = () => {
    if (column.getCanSort()) {
      column.toggleSorting(true);
      onClose();
    }
  };

  const handleClearSort = () => {
    if (column.getCanSort()) {
      column.clearSorting();
      onClose();
    }
  };

  const handleClearFilter = () => {
    column.setFilterValue(undefined);
    onClose();
  };

  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();
  const isFiltered = column.getIsFiltered();

  return (
    <div
      ref={menuRef}
      className="k2-column-menu"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      <div className="k2-column-menu-header">
        {column.columnDef.header as string}
      </div>

      {canSort && (
        <>
          <button
            className="k2-column-menu-item"
            onClick={handleSortAsc}
            disabled={isSorted === 'asc'}
          >
            <span className="k2-menu-icon">↑</span>
            Sort Ascending
          </button>
          <button
            className="k2-column-menu-item"
            onClick={handleSortDesc}
            disabled={isSorted === 'desc'}
          >
            <span className="k2-menu-icon">↓</span>
            Sort Descending
          </button>
          {isSorted && (
            <button className="k2-column-menu-item" onClick={handleClearSort}>
              <span className="k2-menu-icon">✕</span>
              Clear Sort
            </button>
          )}
          <div className="k2-column-menu-divider" />
        </>
      )}

      {isFiltered && (
        <>
          <button className="k2-column-menu-item" onClick={handleClearFilter}>
            <span className="k2-menu-icon">⊗</span>
            Clear Filter
          </button>
          <div className="k2-column-menu-divider" />
        </>
      )}

      <button
        className="k2-column-menu-item k2-column-menu-close"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
