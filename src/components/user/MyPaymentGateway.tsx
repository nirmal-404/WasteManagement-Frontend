import React, { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLocation, useNavigate } from 'react-router-dom'

const stripePromise = loadStripe(
  "pk_test_51RNZXfFKNCvYN31F0poJ7xmd6sa1GEQ5N89oXBPn3o7CW0JI2L0hszJ7bZKjrtygSDCFtl9IdEbHzbSUpJ0bNZBw00VYCfWjWv"
);

// A small helper component for the card form
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const billId = params.get('billId');
  const amountParam = params.get('amount');
  const amount = amountParam ? parseFloat(amountParam) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) Call backend to create PaymentIntent
      const res = await fetch("http://localhost:4000/api/payment/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { name: billId ? `Bill ${billId}` : "Payment", price: Math.round(amount * 100), quantity: 1 }
          ],
          currency: "usd",
          metadata: { billId: billId || '' }
        }),
      });

      const data = await res.json();
      const clientSecret = data.clientSecret;
      if (!clientSecret) throw new Error("No client secret returned from server");

      // 2) Confirm the payment on client with CardElement
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card Element not found");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: "Customer Name",
            email: "customer@example.com",
          },
        },
      });

      if (result.error) {
        // Show error to customer
        setErrorMsg(result.error.message || "Payment failed");
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        setSuccess("Payment succeeded! Thank you.");
        // Mark bill paid in backend if billId provided
        if (billId) {
          try {
            await fetch(`${API_URL}/payment-bills/${billId}/pay`, { method: 'POST', credentials: 'include' })
          } catch {}
        }
        setTimeout(() => navigate('/user/payments'), 1200)
      } else {
        setErrorMsg("Unexpected payment status");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
              <p className="text-sm text-gray-600 mt-1">Review your bill details before paying</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Test Mode</span>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bill</span>
              <span className="font-medium text-gray-900">{billId || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">LKR {Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-gray-700">Total</span>
              <span className="text-emerald-600 font-bold text-lg">LKR {Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}</span>
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500">
            Powered by Stripe. Use test card 4242 4242 4242 4242, any future date, any CVC.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Enter Card Details</h3>

          <div className="mt-4 p-3 border rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
            <CardElement options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111827',
                  '::placeholder': { color: '#9CA3AF' }
                },
                invalid: { color: '#EF4444' }
              }
            }} />
          </div>

          {errorMsg && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded">{errorMsg}</div>
          )}
          {success && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded">{success}</div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Back</button>
            <button type="submit" disabled={!stripe || loading || !Number.isFinite(amount) || amount <= 0} className="px-5 py-2.5 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Processing…' : `Pay LKR ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`}
            </button>
          </div>

          <div className="mt-4 flex items-center text-xs text-gray-500 gap-2">
            <span>🔒</span>
            <span>Secure and encrypted</span>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default PaymentPage;
