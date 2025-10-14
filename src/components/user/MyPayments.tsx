export default function MyPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-gray-600">View bills and payment history</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">💳</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">My Payments</h2>
        <p className="text-gray-600">This section will show your payment history and bills</p>
      </div>
    </div>
  )
}
