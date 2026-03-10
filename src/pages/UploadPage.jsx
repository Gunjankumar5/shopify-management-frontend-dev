import React, { useState } from 'react';
import { API_BASE_URL } from '../api/config';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editedRows, setEditedRows] = useState({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(null);
    setEditedRows({});
  };

  const previewFile = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/preview`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to preview file');
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/parse`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to parse file');
      const data = await response.json();
      setFullData(data);
      setEditedRows({});

      // Validate
      validateProducts(data.data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const validateProducts = async (products) => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
      });

      if (!response.ok) throw new Error('Failed to validate');
      const result = await response.json();
      setValidationResult(result);
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const handleCellChange = (rowIndex, field, value) => {
    setEditedRows(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value
      }
    }));
  };

  const pushToShopify = async () => {
    if (!fullData) return;

    const productsToCreate = fullData.data.map((product, idx) => ({
      ...product,
      ...editedRows[idx]
    }));

    if (!window.confirm(`Push ${productsToCreate.length} products to Shopify?`)) return;

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/upload/push-to-shopify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productsToCreate)
      });

      if (!response.ok) throw new Error('Failed to push products');
      const result = await response.json();
      
      let message = `✅ Created: ${result.created}\n`;
      if (result.skipped_count > 0) {
        message += `⏭️  Skipped: ${result.skipped_count} (already exist)\n`;
      }
      if (result.errors.length > 0) {
        message += `❌ Failed: ${result.errors.length}`;
      }
      
      alert(message);
      
      setFile(null);
      setPreview(null);
      setFullData(null);
      setEditedRows({});
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-3 py-6 md:px-6 md:py-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 w-full">
        {/* Header */}
        <div className="px-2 md:px-0">
          <h1 className="section-title text-white">📤 Upload Products</h1>
          <p className="section-subtitle text-gray-300">Import products from CSV or Excel files with automatic duplicate detection</p>
        </div>

        {/* File Upload Step */}
        <div className="card card-hover p-5 md:p-8 animate-fadeIn w-full">
          <h2 className="text-xl font-bold text-white mb-6">Step 1: Select File</h2>
          
          <div className="border-2 border-dashed border-white bg-gray-800 rounded-xl p-6 md:p-10 text-center">
            <div className="text-4xl mb-4">🗂️</div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full max-w-full cursor-pointer"
            />
            <p className="text-slate-600 mt-4 font-medium">Supported formats: CSV, XLSX, XLS</p>
            {file && (
              <div className="mt-4 inline-flex max-w-full items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold break-all">
                ✓ {file.name}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 md:gap-4">
            <button
              onClick={previewFile}
              disabled={!file}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👁️ Preview Data
            </button>
            <button
              onClick={parseFile}
              disabled={!file}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 Parse Full Data
            </button>
          </div>
        </div>

        {/* Preview Step */}
        {preview && !fullData && (
          <div className="card card-hover p-5 md:p-8 animate-fadeIn w-full">
            <h2 className="text-xl font-bold text-white mb-4">Step 2: Preview</h2>
            <p className="text-gray-300 mb-4">
              📊 Total rows: <span className="font-bold text-white">{preview.total_rows}</span>
            </p>
            <div className="max-w-full overflow-x-auto rounded-lg border border-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-950 border-b border-white">
                    {preview.columns.map(col => (
                      <th key={col} className="px-6 py-3 text-left text-sm font-semibold text-white">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                      {preview.columns.map(col => (
                        <td key={col} className="px-6 py-3 text-sm text-white">
                          {row[col] || <span className="text-gray-500">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Data with Validation & Push */}
        {fullData && (
          <div className="card card-hover p-5 md:p-8 animate-fadeIn w-full">
            <h2 className="text-xl font-bold text-white mb-6">Step 3: Review & Push</h2>
            
            {/* Validation Results */}
            {validationResult && (
              <div className="mb-8 rounded-xl border border-gray-700 bg-gray-950/70 p-4 md:p-6 space-y-3">
                {/* Main Validation Status */}
                <div className={`p-4 rounded-lg font-semibold ${
                  validationResult.valid 
                    ? 'bg-green-900 text-green-100 border border-green-700' 
                    : 'bg-yellow-900 text-yellow-100 border border-yellow-700'
                }`}>
                  {validationResult.valid ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span>All {validationResult.valid_products} products are valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <span>Found {validationResult.error_count} errors and {validationResult.duplicate_count} duplicates</span>
                    </div>
                  )}
                </div>
                
                {/* Validation Errors */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="bg-red-900 border-2 border-red-700 rounded-lg p-4">
                    <div className="font-bold text-red-100 mb-3 flex items-center gap-2">
                      <span>❌</span> Validation Errors
                    </div>
                    <div className="space-y-2">
                      {validationResult.errors.map((err, idx) => (
                        <div key={idx} className="text-sm text-red-100 ml-6">
                          <span className="font-semibold">Row {err.row}:</span> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* File Duplicates */}
                {validationResult.duplicates && validationResult.duplicates.length > 0 && (
                  <div className="bg-orange-900 border-2 border-orange-700 rounded-lg p-4">
                    <div className="font-bold text-orange-100 mb-3 flex items-center gap-2">
                      <span>🔄</span> Duplicates in File
                    </div>
                    <div className="space-y-2">
                      {validationResult.duplicates.map((dup, idx) => (
                        <div key={idx} className="text-sm text-orange-100 ml-6">
                          <span className="font-semibold">Row {dup.row}:</span> "{dup.title}" - {dup.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Existing Shopify Products */}
                {validationResult.existing_duplicates && validationResult.existing_duplicates.length > 0 && (
                  <div className="bg-blue-900 border-2 border-blue-700 rounded-lg p-4">
                    <div className="font-bold text-blue-100 mb-3 flex items-center gap-2">
                      <span>⏭️</span> Already in Shopify (will be skipped)
                    </div>
                    <div className="space-y-2">
                      {validationResult.existing_duplicates.map((dup, idx) => (
                        <div key={idx} className="text-sm text-blue-100 ml-6">
                          <span className="font-semibold">Row {dup.row}:</span> "{dup.title}" {dup.sku && `(SKU: ${dup.sku})`} - {dup.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Table */}
            <div className="mb-6 rounded-xl border border-gray-700 bg-gray-950/70 p-3 md:p-5 w-full">
              <h3 className="text-lg font-bold text-white mb-4">Product Data (Showing {fullData.data.length} rows)</h3>
              <div className="max-w-full overflow-x-auto overflow-y-auto max-h-[28rem] rounded-lg border border-slate-600">
                <table className="min-w-[900px] w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {fullData.columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fullData.data.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                        {fullData.columns.map(col => (
                          <td key={`${rowIdx}-${col}`} className="px-4 py-2">
                            <input
                              type="text"
                              value={editedRows[rowIdx]?.[col] ?? row[col] ?? ''}
                              onChange={(e) =>
                                handleCellChange(rowIdx, col, e.target.value)
                              }
                              className="w-full min-w-[140px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 md:gap-4 pt-6 border-t border-slate-700">
              <button
                onClick={pushToShopify}
                disabled={uploading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span> Pushing...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Push to Shopify
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setFullData(null);
                  setPreview(null);
                  setValidationResult(null);
                }}
                className="btn-secondary"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
