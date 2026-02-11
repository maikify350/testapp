import React, { useState } from 'react'
import './ExportDialog.css'

interface ExportDialogProps {
  totalRows: number
  onClose: () => void
  onExportExcel: (rowLimit: number, excludeHeaders: boolean) => void
  onExportCSV: (rowLimit: number, excludeHeaders: boolean) => void
  onExportPDF: (rowLimit: number, excludeHeaders: boolean) => void
  onExportJSON: (rowLimit: number, excludeHeaders: boolean) => void
  onExportXML: (rowLimit: number, excludeHeaders: boolean) => void
}

export function ExportDialog({ totalRows, onClose, onExportExcel, onExportCSV, onExportPDF, onExportJSON, onExportXML }: ExportDialogProps) {
  const [rowLimit, setRowLimit] = useState<string>('')
  const [excludeHeaders, setExcludeHeaders] = useState(false)

  const getRowCount = () => {
    const limit = parseInt(rowLimit, 10)
    if (!rowLimit || limit <= 0 || isNaN(limit)) {
      return totalRows
    }
    return Math.min(limit, totalRows)
  }

  const getRowText = () => {
    const count = getRowCount()
    if (count === totalRows) {
      return `all ${totalRows} rows`
    }
    return `first ${count} of ${totalRows} rows`
  }

  const handleExport = (exportFn: (limit: number, excludeHeaders: boolean) => void) => {
    exportFn(getRowCount(), excludeHeaders)
    onClose()
  }

  return (
    <div className="k2-export-dialog-overlay" onClick={onClose}>
      <div className="k2-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="k2-export-dialog-header">
          <h3>Export Data</h3>
          <button className="k2-export-dialog-close" onClick={onClose}>×</button>
        </div>

        <div className="k2-export-dialog-options">
          <div className="k2-export-row-limit">
            <label htmlFor="rowLimit">Number of rows (0 or empty = all):</label>
            <input
              id="rowLimit"
              type="number"
              min="0"
              placeholder="0"
              value={rowLimit}
              onChange={(e) => setRowLimit(e.target.value)}
              className="k2-export-row-input"
            />
            <span className="k2-export-row-info">Will export {getRowText()}</span>
          </div>
          <div className="k2-export-headers-option">
            <label className="k2-export-checkbox-label">
              <input
                type="checkbox"
                checked={excludeHeaders}
                onChange={(e) => setExcludeHeaders(e.target.checked)}
                className="k2-export-checkbox"
              />
              <span>Exclude Column Headers</span>
            </label>
          </div>
        </div>

        <div className="k2-export-dialog-body">
          <button
            className="k2-export-option"
            onClick={() => handleExport(onExportExcel)}
          >
            <span className="k2-export-icon">📊</span>
            <div className="k2-export-option-text">
              <div className="k2-export-option-title">Export to Excel</div>
              <div className="k2-export-option-desc">Download as .xls file</div>
            </div>
          </button>

          <button
            className="k2-export-option"
            onClick={() => handleExport(onExportCSV)}
          >
            <span className="k2-export-icon">📄</span>
            <div className="k2-export-option-text">
              <div className="k2-export-option-title">Export to CSV</div>
              <div className="k2-export-option-desc">Download as .csv file</div>
            </div>
          </button>

          <button
            className="k2-export-option"
            onClick={() => handleExport(onExportPDF)}
          >
            <span className="k2-export-icon">📋</span>
            <div className="k2-export-option-text">
              <div className="k2-export-option-title">Export to PDF</div>
              <div className="k2-export-option-desc">Print or save as PDF (landscape)</div>
            </div>
          </button>

          <button
            className="k2-export-option"
            onClick={() => handleExport(onExportJSON)}
          >
            <span className="k2-export-icon">📦</span>
            <div className="k2-export-option-text">
              <div className="k2-export-option-title">Export to JSON</div>
              <div className="k2-export-option-desc">Download as .json file with metadata</div>
            </div>
          </button>

          <button
            className="k2-export-option"
            onClick={() => handleExport(onExportXML)}
          >
            <span className="k2-export-icon">📰</span>
            <div className="k2-export-option-text">
              <div className="k2-export-option-title">Export to XML</div>
              <div className="k2-export-option-desc">Download as .xml file for enterprise systems</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
