import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

type Bill = {
  _id: string
  billId: string
  totalAmount: number
  paidAmount: number
  status: 'pending' | 'paid' | 'overdue'
  createdAt: string
  wasteRecordId?: { recordId: string; totalAmount: number }
}

export default function MyPayments() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`${API_URL}/payment-bills/me/my`, { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load bills')
        setBills(data.bills || [])
      } catch (e: any) {
        setError(e.message || 'Failed to load bills')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePay = (bill: Bill) => {
    const amount = bill.totalAmount
    navigate(`/user/payment-gateway?billId=${encodeURIComponent(bill._id)}&label=${encodeURIComponent(bill.billId)}&amount=${encodeURIComponent(amount)}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bills & Payments</h1>
        <p className="text-gray-600">View and pay your bills</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded">{error}</div>
      )}

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div>Loading…</div>
        ) : bills.length === 0 ? (
          <div className="text-center text-gray-600">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Bill</th>
                  <th className="py-2 pr-4">Waste Record</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"/>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{b.billId}</td>
                    <td className="py-2 pr-4">{b.wasteRecordId?.recordId || '-'}</td>
                    <td className="py-2 pr-4">LKR {b.totalAmount.toFixed(2)}</td>
                    <td className="py-2 pr-4 capitalize">{b.status}</td>
                    <td className="py-2 pr-4 text-right">
                      {b.status !== 'paid' && (
                        <button onClick={() => handlePay(b)} className="px-3 py-1.5 bg-emerald-600 text-white rounded">
                          Pay
                        </button>
                      )}
                    </td>
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
