import { useState, useEffect } from 'react';
import { MapPin, Trash2, Plus, Navigation, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

interface Location {
  latitude: number;
  longitude: number;
}

interface Route {
  _id: string;
  routeName?: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  assignedBins: string[];
  optimizedPath?: Location[];
  directionsUrl?: string;
  createdAt: string;
  mapUrl?: string;
}

export default function MyRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [error, setError] = useState('');
  const [editingRouteId, setEditingRouteId] = useState('');

  // Form states
  const [routeName, setRouteName] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/routes`, {
        credentials: 'include'
      });
      const data = await response.json();
      setRoutes(data);
      
      // If a route is currently selected, update it with fresh data
      if (selectedRoute) {
        const updatedSelectedRoute = data.find((r: Route) => r._id === selectedRoute._id);
        if (updatedSelectedRoute) {
          setSelectedRoute(updatedSelectedRoute);
        }
      }
      
      setError('');
    } catch (err) {
      setError('Failed to load routes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const extractCoordinatesFromUrl = (url: string): Location | null => {
    try {
      // Extract coordinates from Google Maps URL formats
      // Format 1: /@latitude,longitude,zoom
      const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (atMatch) {
        return {
          latitude: parseFloat(atMatch[1]),
          longitude: parseFloat(atMatch[2])
        };
      }
      
      // Format 2: /place/coordinates or ?q=coordinates
      const placeMatch = url.match(/place\/(-?\d+\.?\d*)[,+](-?\d+\.?\d*)/);
      if (placeMatch) {
        return {
          latitude: parseFloat(placeMatch[1]),
          longitude: parseFloat(placeMatch[2])
        };
      }
      
      // Format 3: DMS format (degrees, minutes, seconds)
      const dmsMatch = url.match(/(\d+)%C2%B0(\d+)'([\d.]+)%22N.*?(\d+)%C2%B0(\d+)'([\d.]+)%22E/);
      if (dmsMatch) {
        const lat = parseInt(dmsMatch[1]) + parseInt(dmsMatch[2])/60 + parseFloat(dmsMatch[3])/3600;
        const lng = parseInt(dmsMatch[4]) + parseInt(dmsMatch[5])/60 + parseFloat(dmsMatch[6])/3600;
        return { latitude: lat, longitude: lng };
      }
      
      return null;
    } catch (err) {
      console.error('Error extracting coordinates:', err);
      return null;
    }
  };



  const updateRouteStatus = async (id: string, newStatus: Route['status']) => {
    try {
      const response = await fetch(`${API_BASE}/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchRoutes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRoute = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/routes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchRoutes();
        if (selectedRoute?._id === id) setSelectedRoute(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setRouteName('');
    setMapUrl('');
    setEditingRouteId('');
  };



  const getStatusColor = (status: Route['status']): string => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Route['status']) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'InProgress': return <Navigation className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCreateSubmit = async () => {
    // Clear any previous errors
    setError('');
    
    // Trim values
    const trimmedRouteName = routeName.trim();
    const trimmedMapUrl = mapUrl.trim();
    
    // Validate inputs
    if (!trimmedRouteName) {
      setError('Please provide a route name');
      return;
    }
    
    if (!trimmedMapUrl) {
      setError('Please provide a Google Maps URL');
      return;
    }
    
    if (!trimmedMapUrl.includes('google.com/maps')) {
      setError('Please provide a valid Google Maps URL');
      return;
    }
    
    // Call createRoute with trimmed values
    await createRouteWithData(trimmedRouteName, trimmedMapUrl);
  };

  const createRouteWithData = async (name: string, url: string) => {
    try {
      console.log('Creating route with:', { routeName: name, mapUrl: url });
      
      const response = await fetch(`${API_BASE}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          routeName: name,
          mapUrl: url
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        await fetchRoutes();
        setShowCreateModal(false);
        resetForm();
        setError('');
      } else {
        setError(data.message || 'Failed to create route');
      }
    } catch (err) {
      console.error('Create route error:', err);
      setError('Failed to create route: ' + (err as Error).message);
    }
  };

  const updateRoute = async () => {
    try {
      const coords = extractCoordinatesFromUrl(mapUrl);
      
      if (!coords) {
        setError('Could not extract coordinates from the Google Maps URL. Please check the URL format.');
        return;
      }

      const response = await fetch(`${API_BASE}/routes/${editingRouteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          routeName,
          startLocation: coords
        })
      });

      if (response.ok) {
        await fetchRoutes();
        setShowEditModal(false);
        resetForm();
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update route');
      }
    } catch (err) {
      setError('Failed to update route');
      console.error(err);
    }
  };

  const handleEditSubmit = async () => {
    // Clear any previous errors
    setError('');
    
    // Validate inputs
    if (!routeName.trim()) {
      setError('Please provide a route name');
      return;
    }
    
    if (!mapUrl.trim()) {
      setError('Please provide a Google Maps URL to update the route');
      return;
    }
    
    if (!mapUrl.includes('google.com/maps')) {
      setError('Please provide a valid Google Maps URL');
      return;
    }
    
    await updateRoute();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Create and manage collection routes</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Create and manage collection routes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Route
        </button>
      </div>

      {error && !showCreateModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Routes</h2>
          
          {routes.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No routes found. Create your first route!</p>
            </div>
          ) : (
            routes.map((route) => (
              <div
                key={route._id}
                className={`bg-white p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                  selectedRoute?._id === route._id
                    ? 'border-emerald-500'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {route.routeName || `Route #${route._id.slice(-6)}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {route.assignedBins?.length || 0} bins assigned
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                    {getStatusIcon(route.status)}
                    {route.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <select
                    value={route.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateRouteStatus(route._id, e.target.value as Route['status']);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoute(route._id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedRoute ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedRoute.routeName || `Route #${selectedRoute._id.slice(-6)}`}
                </h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRoute.status)}`}>
                  {getStatusIcon(selectedRoute.status)}
                  {selectedRoute.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Route Details</p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assigned Bins:</span>
                      <span className="font-medium">{selectedRoute.assignedBins?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Waypoints:</span>
                      <span className="font-medium">{selectedRoute.optimizedPath?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(selectedRoute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRoute.optimizedPath && selectedRoute.optimizedPath.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Optimized Path</p>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto space-y-2">
                      {selectedRoute.optimizedPath.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <span className="text-gray-700">
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRoute.directionsUrl && (
                  <a
                    href={selectedRoute.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Navigation className="w-5 h-5" />
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Route Selected</h3>
              <p className="text-gray-600">Select a route from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Route</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g., Collection Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Maps URL *
                </label>
                <textarea
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Right-click on a location in Google Maps and select "Copy link"
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>How it works:</strong> Paste a Google Maps URL of your starting location.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Create Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => {
          setShowEditModal(false);
          resetForm();
          setError('');
        }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Route</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g., Anamaduwa Collection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Google Maps URL *
                </label>
                <textarea
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Provide a new starting location to re-optimize the route
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Note:</strong> Updating the map URL will recalculate the optimized route 
                  based on the new starting location.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Update Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}