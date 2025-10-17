import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(""); // your publishable key

// A small helper component for the card form
const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          // Example items — prices must be validated server-side
          items: [
            { name: "Premium Plan", price: 2000, quantity: 1 } // price in cents
          ],
          currency: "usd",
          metadata: { userId: "user_123" }
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
        // Optionally call backend to record or fulfill the order
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Enter Card Details</h2>
      <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}>
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      <button type="submit" disabled={!stripe || loading} style={{ padding: "8px 16px" }}>
        {loading ? "Processing…" : "Pay $20"}
      </button>

      {errorMsg && <div style={{ color: "red", marginTop: 12 }}>{errorMsg}</div>}
      {success && <div style={{ color: "green", marginTop: 12 }}>{success}</div>}
    </form>
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
