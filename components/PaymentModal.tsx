
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface PaymentModalProps {
  plan: string;
  price: string;
  billingCycle?: 'monthly' | 'annual';
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, price, billingCycle = 'annual', onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStep('processing');

    try {
      const response: any = await api.billing.createCheckout(plan as import('../types').TierName, billingCycle);
      if (response?.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      const msg = error?.message || 'Failed to create checkout session.';
      const hint = msg.includes('not configured') || msg.includes('Stripe is not configured')
        ? ' Add Stripe price IDs to server .env (see API_KEYS_SETUP.md) or contact support.'
        : '';
      alert(msg + hint);
      setLoading(false);
      setStep('form');
    }
  };

  // Basic formatting for visual realism
  const formatCard = (val: string) => {
    return val.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        {step === 'success' ? (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Payment Successful</h3>
            <p className="text-gray-500 mt-2">You have been upgraded to the {plan} Plan.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold text-gray-900">Secure Checkout</h3>
                <div className="flex items-center text-gray-400">
                  <Lock size={14} className="mr-1" />
                  <span className="text-xs font-medium uppercase">Encrypted</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Upgrading to <strong className="text-gray-800">{plan}</strong> ({price}/mo)</p>
            </div>

            {step === 'processing' ? (
              <div className="p-12 flex flex-col items-center">
                <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                <p className="font-medium text-gray-600">Redirecting to secure checkout...</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You will be redirected to Stripe's secure checkout page to complete your payment.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-bold text-gray-900">{plan}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Price</span>
                    <span className="font-bold text-gray-900">{price}/mo</span>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2" size={20} />
                      Continue to Secure Checkout
                    </>
                  )}
                </button>
                
                <p className="text-xs text-center text-gray-500">
                  Powered by Stripe. Your payment information is secure and encrypted.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
