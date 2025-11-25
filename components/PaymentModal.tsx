
import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface PaymentModalProps {
  plan: string;
  price: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, price, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');

    try {
      // Simulate Stripe Confirmation
      await api.billing.upgrade(plan as any);
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Payment failed');
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {step === 'processing' ? (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                  <p className="font-medium text-gray-600">Processing secure payment...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Card Number</label>
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        maxLength={19}
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCard(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-gray-700"
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Expiry</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="MM / YY"
                        maxLength={5}
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-gray-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">CVC</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="123"
                        maxLength={3}
                        value={cvc}
                        onChange={e => setCvc(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-gray-700 text-center"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center"
                    >
                      Pay {price}
                    </button>
                    <div className="mt-4 flex justify-center space-x-2 opacity-50 grayscale">
                       {/* Mock Logos */}
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};
