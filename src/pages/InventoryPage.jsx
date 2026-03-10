import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

export default function InventoryPage() {
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch locations
      const locResponse = await fetch(`${API_BASE_URL}/inventory/locations`);
      if (!locResponse.ok) throw new Error('Failed to fetch locations');
      const locData = await locResponse.json();
      setLocations(locData.locations || []);
      
      // Fetch inventory
      const invResponse = await fetch(`${API_BASE_URL}/inventory/levels`);
      if (!invResponse.ok) throw new Error('Failed to fetch inventory');
      const invData = await invResponse.json();
      setInventory(invData.inventory_levels || []);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, locationId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/update?inventory_item_id=${itemId}&location_id=${locationId}&quantity=${quantity}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to update inventory');
      await fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleFetchFromShopify = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
      <div className="card p-12 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-white font-medium">Loading inventory...</p>
      </div>
    </div>
  );

  const filteredInventory = selectedLocation
    ? inventory.filter(item => item.location_id === selectedLocation)
    : inventory;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="section-title">📦 Inventory Management</h1>
            <p className="section-subtitle">Manage stock levels across your warehouse locations</p>
          </div>
          <button
            onClick={handleFetchFromShopify}
            disabled={loading || refreshing}
            className="btn-secondary px-4 py-2 rounded-lg border border-slate-500 bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Fetching...' : 'Fetch from Shopify'}
          </button>
        </div>

        {error && <div className="alert-error mb-6 animate-fadeIn">{error}</div>}

        {/* Location Filter */}
        <div className="card card-hover p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Warehouse Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedLocation(null)}
              className={`p-4 rounded-lg font-semibold transition-all ${
                selectedLocation === null
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 border-2 border-slate-600 text-white hover:border-blue-400'
              }`}
            >
              <div className="text-lg">📍</div>
              <div className="mt-2">All Locations</div>
              <div className="text-xs mt-1 opacity-75">View entire inventory</div>
            </button>
            {locations.map(location => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`p-4 rounded-lg text-left transition-all ${
                  selectedLocation === location.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 border-2 border-slate-600 hover:border-blue-400 text-white'
                }`}
              >
                <div className="font-bold text-lg">{location.name}</div>
                <div className={`text-sm mt-1 ${selectedLocation === location.id ? 'opacity-90' : 'text-slate-300'}`}>
                  {location.address1 || 'Address not set'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card card-hover p-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Inventory Levels <span className="text-slate-300 font-normal">({filteredInventory.length} items)</span>
          </h2>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white text-lg">📭 No inventory items found for this location</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-600">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-600">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Product ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Product Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Inventory Item ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Quantity</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <code className="bg-slate-800 px-3 py-1 rounded text-sm font-mono text-white border border-slate-600">
                          {item.product_id || '-'}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-white font-medium max-w-xs">
                        <div className="truncate" title={item.product_title || 'Unknown product'}>
                          {item.product_title || 'Unknown product'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-800 px-3 py-1 rounded text-sm font-mono text-white border border-slate-600">
                          {item.inventory_item_id}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {locations.find(l => l.id === item.location_id)?.name || `Location ${item.location_id}`}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          defaultValue={item.available}
                          className="w-32 px-4 py-2 border-2 border-slate-600 bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-semibold"
                          onBlur={(e) =>
                            handleUpdateQuantity(item.inventory_item_id, item.location_id, parseInt(e.target.value))
                          }
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            const newQty = prompt('New quantity:');
                            if (newQty !== null) {
                              handleUpdateQuantity(item.inventory_item_id, item.location_id, parseInt(newQty));
                            }
                          }}
                          className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          ✏️ Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
