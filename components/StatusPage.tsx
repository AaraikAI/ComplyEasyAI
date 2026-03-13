import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Clock, Activity,
  Server, Database, Globe, Cloud, Lock, Zap, RefreshCw, Bell,
  ChevronDown, ChevronUp, ExternalLink, Calendar, TrendingUp,
  Wifi, HardDrive, Cpu, BarChart3, AlertCircle, Info
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  uptime: number;
  responseTime: number;
  lastChecked: string;
  icon: React.ComponentType<any>;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affectedServices: string[];
  createdAt: string;
  updatedAt: string;
  updates: {
    timestamp: string;
    status: string;
    message: string;
  }[];
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  affectedServices: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface UptimeData {
  date: string;
  uptime: number;
  incidents: number;
}

const services: ServiceStatus[] = [
  {
    name: 'Web Application',
    description: 'Main application interface (app.complyeasyai.com)',
    status: 'operational',
    uptime: 99.99,
    responseTime: 145,
    lastChecked: '1 minute ago',
    icon: Globe,
  },
  {
    name: 'API Services',
    description: 'REST API endpoints for all platform features',
    status: 'operational',
    uptime: 99.98,
    responseTime: 89,
    lastChecked: '1 minute ago',
    icon: Server,
  },
  {
    name: 'Database Cluster',
    description: 'Primary and replica database servers',
    status: 'operational',
    uptime: 99.999,
    responseTime: 12,
    lastChecked: '1 minute ago',
    icon: Database,
  },
  {
    name: 'AI Processing Engine',
    description: 'AI inference and model serving infrastructure',
    status: 'operational',
    uptime: 99.95,
    responseTime: 234,
    lastChecked: '1 minute ago',
    icon: Cpu,
  },
  {
    name: 'Evidence Storage',
    description: 'Encrypted file storage for compliance evidence',
    status: 'operational',
    uptime: 99.999,
    responseTime: 67,
    lastChecked: '1 minute ago',
    icon: HardDrive,
  },
  {
    name: 'Authentication Services',
    description: 'SSO, MFA, and identity management',
    status: 'operational',
    uptime: 99.99,
    responseTime: 78,
    lastChecked: '1 minute ago',
    icon: Lock,
  },
  {
    name: 'Integration Gateway',
    description: 'Third-party integration connections (AWS, Azure, GitHub)',
    status: 'operational',
    uptime: 99.97,
    responseTime: 156,
    lastChecked: '1 minute ago',
    icon: Wifi,
  },
  {
    name: 'aCOS Automation Engine',
    description: 'Autonomous compliance operations system',
    status: 'operational',
    uptime: 99.96,
    responseTime: 189,
    lastChecked: '1 minute ago',
    icon: Zap,
  },
  {
    name: 'Notification Services',
    description: 'Email, Slack, and webhook notifications',
    status: 'operational',
    uptime: 99.98,
    responseTime: 45,
    lastChecked: '1 minute ago',
    icon: Bell,
  },
  {
    name: 'Analytics Pipeline',
    description: 'Real-time metrics and reporting engine',
    status: 'operational',
    uptime: 99.94,
    responseTime: 234,
    lastChecked: '1 minute ago',
    icon: BarChart3,
  },
];

const recentIncidents: Incident[] = [
  {
    id: '1',
    title: 'Elevated API response times',
    status: 'resolved',
    severity: 'minor',
    affectedServices: ['API Services'],
    createdAt: '2026-01-20T14:30:00Z',
    updatedAt: '2026-01-20T15:15:00Z',
    updates: [
      {
        timestamp: '2026-01-20T15:15:00Z',
        status: 'Resolved',
        message: 'The issue has been resolved. API response times have returned to normal levels.',
      },
      {
        timestamp: '2026-01-20T14:45:00Z',
        status: 'Monitoring',
        message: 'We have deployed a fix and are monitoring the situation.',
      },
      {
        timestamp: '2026-01-20T14:30:00Z',
        status: 'Investigating',
        message: 'We are investigating reports of elevated API response times.',
      },
    ],
  },
  {
    id: '2',
    title: 'Scheduled database maintenance',
    status: 'resolved',
    severity: 'minor',
    affectedServices: ['Database Cluster'],
    createdAt: '2026-01-15T02:00:00Z',
    updatedAt: '2026-01-15T04:00:00Z',
    updates: [
      {
        timestamp: '2026-01-15T04:00:00Z',
        status: 'Completed',
        message: 'Database maintenance has been completed successfully. All services are operational.',
      },
      {
        timestamp: '2026-01-15T02:00:00Z',
        status: 'In Progress',
        message: 'Scheduled database maintenance has begun. Some operations may be slower than usual.',
      },
    ],
  },
];

const scheduledMaintenance: MaintenanceWindow[] = [
  {
    id: '1',
    title: 'Infrastructure upgrade - US-East region',
    description: 'Upgrading server infrastructure for improved performance. Minimal impact expected.',
    scheduledStart: '2026-02-01T03:00:00Z',
    scheduledEnd: '2026-02-01T05:00:00Z',
    affectedServices: ['Web Application', 'API Services'],
    status: 'scheduled',
  },
];

const uptimeHistory: UptimeData[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  return {
    date: date.toISOString().split('T')[0],
    uptime: 99.9 + Math.random() * 0.1,
    incidents: Math.random() > 0.95 ? 1 : 0,
  };
});

export const StatusPage: React.FC = () => {
  const { t } = useI18n();
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getOverallStatus = () => {
    const hasOutage = services.some(s => s.status === 'major_outage');
    const hasPartialOutage = services.some(s => s.status === 'partial_outage');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const hasMaintenance = services.some(s => s.status === 'maintenance');

    if (hasOutage) return { status: 'major_outage', text: 'Major System Outage', color: 'red' };
    if (hasPartialOutage) return { status: 'partial_outage', text: 'Partial System Outage', color: 'orange' };
    if (hasDegraded) return { status: 'degraded', text: 'Degraded Performance', color: 'yellow' };
    if (hasMaintenance) return { status: 'maintenance', text: 'Maintenance in Progress', color: 'blue' };
    return { status: 'operational', text: 'All Systems Operational', color: 'green' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'partial_outage': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'major_outage': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'maintenance': return <Clock className="w-5 h-5 text-blue-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'partial_outage': return 'bg-orange-500';
      case 'major_outage': return 'bg-red-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'major': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-red-500/10 text-red-400';
      case 'identified': return 'bg-orange-500/10 text-orange-400';
      case 'monitoring': return 'bg-blue-500/10 text-blue-400';
      case 'resolved': return 'bg-green-500/10 text-green-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const overall = getOverallStatus();
  const overallUptime = (services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2">
                <div className="bg-brand-600 p-2 rounded-xl">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-white">ComplyEasy AI</span>
              </a>
              <span className="text-slate-400 text-sm hidden sm:block">| System Status</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  autoRefresh 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                Auto-refresh {autoRefresh ? 'on' : 'off'}
              </button>
              <a 
                href="/signup" 
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Overall Status Banner */}
      <section className={`py-12 ${
        overall.color === 'green' ? 'bg-green-500/10' :
        overall.color === 'yellow' ? 'bg-yellow-500/10' :
        overall.color === 'orange' ? 'bg-orange-500/10' :
        overall.color === 'red' ? 'bg-red-500/10' :
        'bg-blue-500/10'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                overall.color === 'green' ? 'bg-green-500/20' :
                overall.color === 'yellow' ? 'bg-yellow-500/20' :
                overall.color === 'orange' ? 'bg-orange-500/20' :
                overall.color === 'red' ? 'bg-red-500/20' :
                'bg-blue-500/20'
              }`}>
                {overall.status === 'operational' ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : overall.status === 'degraded' ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                ) : overall.status === 'partial_outage' ? (
                  <AlertCircle className="w-8 h-8 text-orange-400" />
                ) : overall.status === 'major_outage' ? (
                  <XCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <Clock className="w-8 h-8 text-blue-400" />
                )}
              </div>
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold ${
                  overall.color === 'green' ? 'text-green-400' :
                  overall.color === 'yellow' ? 'text-yellow-400' :
                  overall.color === 'orange' ? 'text-orange-400' :
                  overall.color === 'red' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {overall.text}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{overallUptime}%</div>
                <div className="text-slate-400 text-sm">Overall Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{services.length}</div>
                <div className="text-slate-400 text-sm">Services Monitored</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Services Status */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            {t('common.status')}
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-700">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.name} className="p-4 hover:bg-slate-700/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{service.name}</span>
                            {getStatusIcon(service.status)}
                          </div>
                          <p className="text-sm text-slate-400">{service.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right hidden sm:block">
                          <div className="text-white">{service.uptime}%</div>
                          <div className="text-slate-500">Uptime</div>
                        </div>
                        <div className="text-right hidden md:block">
                          <div className="text-white">{service.responseTime}ms</div>
                          <div className="text-slate-500">Response</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 90-Day Uptime */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            90-Day Uptime History
          </h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-end gap-0.5 h-20 mb-4">
              {uptimeHistory.map((day, index) => (
                <div 
                  key={index}
                  className="flex-1 group relative"
                  title={`${day.date}: ${day.uptime.toFixed(2)}% uptime`}
                >
                  <div 
                    className={`w-full rounded-sm transition-all ${
                      day.uptime >= 99.9 ? 'bg-green-500 hover:bg-green-400' :
                      day.uptime >= 99.5 ? 'bg-yellow-500 hover:bg-yellow-400' :
                      day.uptime >= 99.0 ? 'bg-orange-500 hover:bg-orange-400' :
                      'bg-red-500 hover:bg-red-400'
                    }`}
                    style={{ height: `${Math.max(20, (day.uptime - 99) * 800)}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                      <div className="font-medium text-white">{day.date}</div>
                      <div className="text-slate-400">{day.uptime.toFixed(3)}% uptime</div>
                      {day.incidents > 0 && (
                        <div className="text-yellow-400">{day.incidents} incident(s)</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <span className="text-sm text-slate-400">99.9%+ uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                <span className="text-sm text-slate-400">99.5-99.9%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                <span className="text-sm text-slate-400">99.0-99.5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                <span className="text-sm text-slate-400">&lt; 99.0%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Scheduled Maintenance */}
        {scheduledMaintenance.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Scheduled Maintenance
            </h2>
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => (
                <div key={maintenance.id} className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                          {maintenance.status === 'scheduled' ? 'Scheduled' : 
                           maintenance.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{maintenance.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">{maintenance.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(maintenance.scheduledStart).toLocaleDateString()} {new Date(maintenance.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(maintenance.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {maintenance.affectedServices.map((service) => (
                          <span key={service} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap">
                      Subscribe to Updates
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Incidents */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recent Incidents
          </h2>
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-slate-700/30 transition-all"
                  onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getIncidentStatusColor(incident.status)}`}>
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{incident.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Duration: {(() => {
                            const start = new Date(incident.createdAt);
                            const end = new Date(incident.updatedAt);
                            const diff = Math.round((end.getTime() - start.getTime()) / 60000);
                            return diff >= 60 ? `${Math.round(diff / 60)}h ${diff % 60}m` : `${diff}m`;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {incident.affectedServices.map((service) => (
                          <span key={service} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      {expandedIncident === incident.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
                {expandedIncident === incident.id && (
                  <div className="border-t border-slate-700 p-6 bg-slate-900/30">
                    <h4 className="text-sm font-semibold text-white mb-4">Incident Timeline</h4>
                    <div className="space-y-4">
                      {incident.updates.map((update, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              update.status === 'Resolved' || update.status === 'Completed' ? 'bg-green-500' :
                              update.status === 'Monitoring' ? 'bg-blue-500' :
                              update.status === 'In Progress' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            {index < incident.updates.length - 1 && (
                              <div className="w-0.5 h-full bg-slate-700 mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm">{update.status}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(update.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400">{update.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe Section */}
        <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Subscribe to Status Updates</h3>
              <p className="text-slate-400">Get notified about incidents and maintenance windows via email, Slack, or webhook.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all">
                <Bell className="w-4 h-4" />
                Subscribe
              </button>
              <a 
                href="/docs/api/status"
                className="border border-slate-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-700/50 flex items-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Status API
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-white">ComplyEasy AI</span>
              <span className="text-slate-500 text-sm">System Status</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/learn" className="hover:text-white transition-colors">Learn</a>
              <a href="/docs" className="hover:text-white transition-colors">Docs</a>
              <a href="/community" className="hover:text-white transition-colors">Community</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 ComplyEasy AI Inc.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StatusPage;
