import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

type WasteRecord = {
  _id: string
  recordId: string
  wasteType?: string
  weight?: number
  totalAmount: number
  createdAt: string
}

export default function MyWasteRecords() {
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`${API_URL}/waste-records/my`, { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load records')
        setRecords(data.records || [])
      } catch (e: any) {
        setError(e.message || 'Failed to load records')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Waste Records</h1>
        <p className="text-gray-600">All automatically created records after approval</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded">{error}</div>
      )}

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div>Loading…</div>
        ) : records.length === 0 ? (
          <div className="text-center text-gray-600">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Record</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Weight (kg)</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{r.recordId}</td>
                    <td className="py-2 pr-4">{r.wasteType || '-'}</td>
                    <td className="py-2 pr-4">{r.weight ?? '-'}</td>
                    <td className="py-2 pr-4">LKR {r.totalAmount.toFixed(2)}</td>
                    <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


