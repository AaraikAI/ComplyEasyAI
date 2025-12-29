/**
 * Real-time Analytics Dashboard
 * Comprehensive analytics with real-time updates, visualizations, and historical trends
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Metric {
  id: string;
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

const RealTimeAnalytics: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMetrics();
    
    // Set up real-time updates every 5 seconds
    intervalRef.current = setInterval(() => {
      loadMetrics();
      setLastUpdate(new Date());
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simulate real-time metrics (in production, use WebSocket or polling)
      const mockMetrics: Metric[] = [
        {
          id: 'compliance-score',
          label: 'Compliance Score',
          value: '94.2%',
          change: 2.3,
          trend: 'up',
          icon: <Shield className="w-5 h-5" />,
          color: 'text-green-600',
        },
        {
          id: 'active-users',
          label: 'Active Users',
          value: '1,247',
          change: 5.1,
          trend: 'up',
          icon: <Users className="w-5 h-5" />,
          color: 'text-blue-600',
        },
        {
          id: 'risks-detected',
          label: 'Risks Detected',
          value: '23',
          change: -12.5,
          trend: 'down',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-red-600',
        },
        {
          id: 'controls-passed',
          label: 'Controls Passed',
          value: '892',
          change: 3.2,
          trend: 'up',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
        },
        {
          id: 'avg-response-time',
          label: 'Avg Response Time',
          value: '142ms',
          change: -8.7,
          trend: 'down',
          icon: <Clock className="w-5 h-5" />,
          color: 'text-blue-600',
        },
        {
          id: 'frameworks-active',
          label: 'Active Frameworks',
          value: '12',
          change: 0,
          trend: 'neutral',
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'text-purple-600',
        },
      ];
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 p-2 hover:bg-white rounded-lg transition-colors"
          >
            ← Back
          </button>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Real-time Analytics</h1>
            <p className="text-slate-600 mt-1">Live compliance metrics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-sm text-slate-600">Live</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadMetrics}
              className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Compliance Score Trend"
            type="line"
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                label: 'Score',
                data: [92, 93, 94, 93.5, 94.2, 94.5, 94.2],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
              }],
            }}
          />
          <ChartCard
            title="Risk Distribution"
            type="pie"
            data={{
              labels: ['Critical', 'High', 'Medium', 'Low'],
              datasets: [{
                label: 'Risks',
                data: [5, 8, 7, 3],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: [
                  'rgba(239, 68, 68, 0.8)',
                  'rgba(249, 115, 22, 0.8)',
                  'rgba(234, 179, 8, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                ],
              }],
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Framework Compliance"
            type="bar"
            data={{
              labels: ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'PCI DSS'],
              datasets: [{
                label: 'Compliance %',
                data: [95, 92, 88, 94, 90],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
              }],
            }}
          />
          <ChartCard
            title="Control Status Over Time"
            type="line"
            data={{
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [
                {
                  label: 'Passed',
                  data: [850, 865, 880, 892],
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                },
                {
                  label: 'Failed',
                  data: [50, 45, 40, 23],
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                },
              ],
            }}
          />
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Real-time Activity</h2>
            <button className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <div className={`${metric.color}`}>
          {metric.icon}
        </div>
        {metric.trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-sm ${
            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {metric.trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(metric.change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
      <p className="text-sm text-slate-600">{metric.label}</p>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; type: 'line' | 'bar' | 'pie'; data: ChartData }> = ({ title, type, data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
        {/* In production, use Chart.js or Recharts here */}
        <div className="text-center text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">Chart visualization</p>
          <p className="text-xs mt-1">({type} chart - integrate Chart.js/Recharts)</p>
        </div>
      </div>
    </div>
  );
};

const ActivityFeed: React.FC = () => {
  const [activities] = useState([
    { id: 1, type: 'success', message: 'Control CC6.1 passed compliance check', time: '2 seconds ago' },
    { id: 2, type: 'warning', message: 'New risk detected in Framework ISO 27001', time: '15 seconds ago' },
    { id: 3, type: 'success', message: 'User access verified via Zero Trust', time: '1 minute ago' },
    { id: 4, type: 'info', message: 'Compliance report generated', time: '2 minutes ago' },
    { id: 5, type: 'success', message: 'Policy updated successfully', time: '3 minutes ago' },
  ]);

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg">
          <div className={`w-2 h-2 rounded-full mt-2 ${
            activity.type === 'success' ? 'bg-green-500' :
            activity.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`} />
          <div className="flex-1">
            <p className="text-sm text-slate-900">{activity.message}</p>
            <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealTimeAnalytics;

