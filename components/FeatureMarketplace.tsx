/**
 * Feature Marketplace Component
 * 
 * Production-ready component for browsing and purchasing a-la-carte features.
 * Displays all available features, their pricing, and subscription status.
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ShoppingCart,
  Sparkles,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Brain,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'enterprise' | 'acos' | 'visionary' | 'support';
  basePriceAnnual: number;
  basePriceMonthly: number;
  requiresTier?: string;
  availableAsAddOn: boolean;
}

interface FeatureAvailability {
  feature: Feature;
  isIncluded: boolean;
  isSubscribed: boolean;
  currentPrice: number;
  canSubscribe: boolean;
  reason?: string;
}

interface FeatureSubscription {
  id: string;
  featureId: string;
  status: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  startsAt: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ai: <Sparkles className="w-5 h-5" />,
  enterprise: <Users className="w-5 h-5" />,
  acos: <TrendingUp className="w-5 h-5" />,
  visionary: <Brain className="w-5 h-5" />,
  support: <Shield className="w-5 h-5" />,
  core: <Zap className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  ai: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-blue-100 text-blue-800',
  acos: 'bg-green-100 text-green-800',
  visionary: 'bg-indigo-100 text-indigo-800',
  support: 'bg-yellow-100 text-yellow-800',
  core: 'bg-gray-100 text-gray-800',
};

export default function FeatureMarketplace() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<FeatureAvailability[]>([]);
  const [subscriptions, setSubscriptions] = useState<FeatureSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    loadFeatures();
    loadSubscriptions();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await api.getAvailableFeatures();
      setFeatures(response.features || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await api.getFeatureSubscriptions();
      setSubscriptions(response.subscriptions || []);
    } catch (err: any) {
      console.error('Failed to load subscriptions', err);
    }
  };

  const handleSubscribe = async (featureId: string) => {
    try {
      setSubscribing(featureId);
      setError(null);
      await api.subscribeToFeature(featureId, billingCycle);
      await loadFeatures();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to feature');
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (featureId: string) => {
    if (!confirm('Are you sure you want to cancel this feature subscription? It will remain active until the end of the billing period.')) {
      return;
    }

    try {
      setSubscribing(featureId);
      setError(null);
      await api.unsubscribeFromFeature(featureId);
      await loadFeatures();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe from feature');
    } finally {
      setSubscribing(null);
    }
  };

  const groupedFeatures = features.reduce((acc, item) => {
    const category = item.feature.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, FeatureAvailability[]>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Marketplace</h2>
          <p className="text-gray-600 mt-1">Purchase individual features to customize your plan</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg font-medium ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {Object.entries(groupedFeatures).map(([category, items]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className={`px-6 py-4 border-b border-gray-200 ${CATEGORY_COLORS[category] || 'bg-gray-100'}`}>
            <div className="flex items-center space-x-2">
              {CATEGORY_ICONS[category]}
              <h3 className="text-lg font-semibold capitalize">{category} Features</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const price = billingCycle === 'annual' 
                  ? item.currentPrice 
                  : Math.round(item.currentPrice / 12);
                const isSubscribing = subscribing === item.feature.id;

                return (
                  <div
                    key={item.feature.id}
                    className={`border rounded-lg p-4 ${
                      item.isIncluded || item.isSubscribed
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.feature.name}</h4>
                      {item.isIncluded && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Included
                        </span>
                      )}
                      {item.isSubscribed && !item.isIncluded && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{item.feature.description}</p>
                    <div className="flex items-center justify-between">
                      {!item.isIncluded && (
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {billingCycle === 'annual' ? '/year' : '/month'}
                          </div>
                        </div>
                      )}
                      {item.isIncluded && <div></div>}
                      {item.isIncluded ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : item.isSubscribed ? (
                        <button
                          onClick={() => handleUnsubscribe(item.feature.id)}
                          disabled={isSubscribing}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {isSubscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      ) : item.canSubscribe ? (
                        <button
                          onClick={() => handleSubscribe(item.feature.id)}
                          disabled={isSubscribing}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {isSubscribing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs ml-1">{item.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {features.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No features available for your tier.</p>
        </div>
      )}
    </div>
  );
}

