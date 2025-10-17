import { useState, useEffect } from "react";
import { Trash2, Plus, Edit2, Trash, MapPin, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface Bin {
  _id: string;
  wasteType: "Organic" | "Plastic" | "Metal" | "Paper" | "Glass" | "Other";
  location: { latitude: number; longitude: number };
  locationName: string;
  status: "Ready" | "Collected" | "Pending" | "Canceled";
  userId: string;
  fillLevel: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = "http://localhost:4000/api/bins";
const USER_ID = "68ee0bd5198bb3fc043ede1a";

export default function MyBins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [formData, setFormData] = useState<{
    wasteType: Bin['wasteType'];
    locationUrl: string;
    locationName: string;
    status: Bin['status'];
    fillLevel: number;
  }>({
    wasteType: "Organic",
    locationUrl: "",
    locationName: "",
    status: "Pending",
    fillLevel: 0,
  });

  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/user/${USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch bins");
      const data = await response.json();
      setBins(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bins");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.locationUrl || !formData.locationName) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        userId: USER_ID,
      };

      if (editingBin) {
        const response = await fetch(`${API_BASE_URL}/${editingBin._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update bin");
      } else {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create bin");
      }

      setFormData({ wasteType: "Organic", locationUrl: "", locationName: "", status: "Pending", fillLevel: 0 });
      setEditingBin(null);
      setShowForm(false);
      await fetchBins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bin");
    }
  };

  const handleEdit = (bin: Bin) => {
    setEditingBin(bin);
    setFormData({
      wasteType: bin.wasteType,
      locationUrl: `https://www.google.com/maps/place/@${bin.location.latitude},${bin.location.longitude}`,
      locationName: bin.locationName,
      status: bin.status,
      fillLevel: bin.fillLevel,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bin?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete bin");
      await fetchBins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bin");
    }
  };

  const getStatusIcon = (status: Bin['status']) => {
    switch (status) {
      case "Ready":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "Collected":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "Canceled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getWasteTypeColor = (type: Bin['wasteType']) => {
    const colors: Record<string, string> = {
      Organic: "bg-green-100 text-green-800",
      Plastic: "bg-blue-100 text-blue-800",
      Metal: "bg-gray-100 text-gray-800",
      Paper: "bg-yellow-100 text-yellow-800",
      Glass: "bg-purple-100 text-purple-800",
      Other: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bins</h1>
          <p className="text-gray-600">View and manage your assigned bins</p>
        </div>
        <button
          onClick={() => {
            setEditingBin(null);
            setFormData({ wasteType: "Organic", locationUrl: "", locationName: "", status: "Pending", fillLevel: 0 });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Bin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
          <h2 className="text-xl font-semibold">{editingBin ? "Edit Bin" : "Create New Bin"}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
            <select
              value={formData.wasteType}
              onChange={(e) => setFormData({ ...formData, wasteType: e.target.value as Bin['wasteType'] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Organic">Organic</option>
              <option value="Plastic">Plastic</option>
              <option value="Metal">Metal</option>
              <option value="Paper">Paper</option>
              <option value="Glass">Glass</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="e.g., THE GREEN RESORT"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps URL</label>
            <input
              type="url"
              value={formData.locationUrl}
              onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
              placeholder="Paste Google Maps URL"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Bin['status'] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Ready">Ready</option>
              <option value="Pending">Pending</option>
              <option value="Collected">Collected</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fill Level (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.fillLevel}
              onChange={(e) => setFormData({ ...formData, fillLevel: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {editingBin ? "Update Bin" : "Create Bin"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your bins...</p>
        </div>
      ) : bins.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bins Yet</h2>
          <p className="text-gray-600">Create your first waste bin to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map((bin) => (
            <div key={bin._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWasteTypeColor(bin.wasteType)}`}>
                  {bin.wasteType}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(bin.status)}
                  <span className="text-sm font-medium text-gray-700">{bin.status}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{bin.locationName}</p>
                    <p className="text-xs text-gray-500">
                      {bin.location.latitude.toFixed(4)}, {bin.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fill Level</span>
                    <span className="font-medium">{bin.fillLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        bin.fillLevel >= 90 ? "bg-red-500" : bin.fillLevel >= 50 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${bin.fillLevel}%` }}
                    ></div>
                  </div>
                </div>

                {bin.weight > 0 && <p className="text-sm text-gray-600">Weight: <span className="font-medium">{bin.weight} kg</span></p>}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(bin)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bin._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}