import React, { useState } from 'react';
import './ColumnManager.css';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean; // For select and actions columns
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onApply: (columns: ColumnConfig[]) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ColumnManager({ columns, onApply, onReset, onClose }: ColumnManagerProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleToggleVisibility = (id: string) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === id && !col.locked ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleDragStart = (index: number) => {
    if (localColumns[index].locked) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (localColumns[index].locked) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || localColumns[index].locked) return;

    const newColumns = [...localColumns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedCol);

    setLocalColumns(newColumns);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleApply = () => {
    onApply(localColumns);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const visibleCount = localColumns.filter(c => c.visible && !c.locked).length;

  return (
    <div className="k2-column-manager-overlay" onClick={onClose}>
      <div className="k2-column-manager" onClick={(e) => e.stopPropagation()}>
        <div className="k2-column-manager-header">
          <h3>Manage Columns</h3>
          <button className="k2-column-manager-close" onClick={onClose}>×</button>
        </div>

        <div className="k2-column-manager-info">
          <span>{visibleCount} columns visible</span>
        </div>

        <div className="k2-column-manager-list">
          {localColumns.map((col, index) => (
            <div
              key={col.id}
              className={`k2-column-item ${col.locked ? 'k2-column-locked' : ''} ${
                dragOverIndex === index ? 'k2-column-drag-over' : ''
              }`}
              draggable={!col.locked}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
            >
              <div className="k2-column-item-left">
                {!col.locked && (
                  <span className="k2-column-drag-handle" title="Drag to reorder">
                    ☰
                  </span>
                )}
                <label className="k2-column-item-label">
                  <input
                    type="checkbox"
                    className="k2-checkbox"
                    checked={col.visible}
                    onChange={() => handleToggleVisibility(col.id)}
                    disabled={col.locked}
                  />
                  <span>{col.label}</span>
                </label>
              </div>
              {col.locked && (
                <span className="k2-column-locked-badge" title="Cannot be hidden or reordered">
                  🔒
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="k2-column-manager-actions">
          <button className="k2-column-btn k2-column-btn-reset" onClick={handleReset}>
            Reset to Default
          </button>
          <div className="k2-column-manager-actions-right">
            <button className="k2-column-btn k2-column-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="k2-column-btn k2-column-btn-apply" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
