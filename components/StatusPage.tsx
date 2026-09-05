import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Clock, Activity,
  RefreshCw, Bell,
  ChevronDown, ChevronUp, ExternalLink, Calendar, TrendingUp,
  AlertCircle, Info
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  /** Measured 90-day availability; absent when there is no per-service telemetry. */
  uptime?: number;
  /** Measured latency in ms; absent when the probe does not time this component. */
  responseTime?: number;
  lastChecked: string;
  icon?: React.ComponentType<any>;
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

/**
 * Components reported by the API's /health probe, in display order. `critical`
 * components take the page to a major outage when they fail; the rest degrade it.
 */
const HEALTH_COMPONENTS: Array<{ key: string; name: string; description: string; critical: boolean }> = [
  { key: 'database', name: 'Database', description: 'Primary PostgreSQL database', critical: true },
  { key: 'websocket', name: 'Real-time updates', description: 'WebSocket notifications and live views', critical: false },
  { key: 'jobQueue', name: 'Background jobs', description: 'Evidence collection and scheduled processing', critical: false },
  { key: 'cache', name: 'Cache', description: 'Response and session cache', critical: false },
  { key: 'memory', name: 'Application memory', description: 'API server memory headroom', critical: false },
  { key: 'region', name: 'Region routing', description: 'Data-residency region resolution', critical: false },
];

const HEALTHY_CHECK_STATES = new Set(['connected', 'ok']);

function checkToServiceStatus(state: string, critical: boolean): ServiceStatus['status'] {
  if (HEALTHY_CHECK_STATES.has(state)) return 'operational';
  if (state === 'warning') return 'degraded';
  return critical ? 'major_outage' : 'partial_outage';
}

/** Derive the per-component list from the /health payload's `checks` object. */
function servicesFromHealth(health: any): ServiceStatus[] {
  const checks = health?.checks;
  if (!checks || typeof checks !== 'object') return [];
  const overall: ServiceStatus['status'] =
    health.status === 'healthy' ? 'operational' : health.status === 'unhealthy' ? 'major_outage' : 'degraded';
  const checkedAt = typeof health.timestamp === 'string' ? health.timestamp : new Date().toISOString();
  const services: ServiceStatus[] = [
    {
      name: 'API',
      description: 'ComplyEasyAI application server',
      status: overall,
      responseTime: typeof health.responseTime === 'number' ? health.responseTime : undefined,
      lastChecked: checkedAt,
    },
  ];
  for (const component of HEALTH_COMPONENTS) {
    const check = checks[component.key];
    if (!check || typeof check !== 'object') continue;
    services.push({
      name: component.name,
      description: component.description,
      status: checkToServiceStatus(String(check.status), component.critical),
      responseTime: typeof check.responseTime === 'number' ? check.responseTime : undefined,
      lastChecked: checkedAt,
    });
  }
  return services;
}

interface UptimeData {
  date: string;
  uptime: number;
  incidents: number;
}

// Generic fallback icon used when a live service entry omits its own glyph.

export const StatusPage: React.FC = () => {
  const { t } = useI18n();
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [subscribedMaintenance, setSubscribedMaintenance] = useState<Set<string>>(new Set());
  const [liveServices, setLiveServices] = useState<ServiceStatus[] | null>(null);
  const [servicesLoading, setLoading] = useState(true);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [scheduledMaintenance, setScheduledMaintenance] = useState<MaintenanceWindow[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [uptimeHistory, setUptimeHistory] = useState<UptimeData[]>([]);
  const [uptimeLoading, setUptimeLoading] = useState(true);

  // Map backend incident status enum to the UI-friendly union used in this file.
  const mapIncidentStatus = (s: string): Incident['status'] => {
    const lower = s.toLowerCase();
    if (lower === 'investigating' || lower === 'identified' || lower === 'monitoring' || lower === 'resolved') {
      return lower;
    }
    return 'investigating';
  };

  const mapIncidentSeverity = (s: string): Incident['severity'] => {
    const lower = s.toLowerCase();
    if (lower === 'minor' || lower === 'major' || lower === 'critical') return lower;
    return 'minor';
  };

  const mapMaintenanceStatus = (s: string): MaintenanceWindow['status'] => {
    const lower = s.toLowerCase().replace(/-/g, '_');
    if (lower === 'scheduled' || lower === 'in_progress' || lower === 'completed') return lower;
    return 'scheduled';
  };

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        // The liveness probe lives at /health (its own CloudFront behaviour), not
        // under /api — that path never existed and came back as the SPA shell.
        // It answers 503 when a dependency is down but still carries the JSON
        // body, so read it regardless of status: an outage should render as an
        // outage, not as "live status unavailable".
        const response = await fetch('/health', { credentials: 'include' });
        const data = await response.json().catch(() => null);
        if (cancelled || !data) return;
        if (Array.isArray(data.services) && data.services.length > 0) {
          setLiveServices(data.services);
        } else {
          const derived = servicesFromHealth(data);
          if (derived.length > 0) setLiveServices(derived);
        }
      } catch {
        // No reachable liveness probe: leave the list empty so the page shows
        // its neutral unavailable state rather than fabricated figures.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/status/incidents?limit=10', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const list = Array.isArray(body?.data) ? body.data : [];
        if (cancelled) return;
        setRecentIncidents(list.map((inc: any) => ({
          id: inc.id,
          title: inc.title,
          status: mapIncidentStatus(inc.status),
          severity: mapIncidentSeverity(inc.severity),
          affectedServices: Array.isArray(inc.affectedServices) ? inc.affectedServices : [],
          createdAt: inc.createdAt,
          updatedAt: inc.updatedAt,
          updates: Array.isArray(inc.updates) ? inc.updates : [],
        })));
      } catch (error: any) {
        if (!cancelled) setIncidentsError(error?.message || 'Failed to load incidents');
      } finally {
        if (!cancelled) setIncidentsLoading(false);
      }
    };

    const fetchMaintenance = async () => {
      try {
        const response = await fetch('/api/status/maintenance', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const list = Array.isArray(body?.data) ? body.data : [];
        if (cancelled) return;
        setScheduledMaintenance(list.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          scheduledStart: m.scheduledStart,
          scheduledEnd: m.scheduledEnd,
          affectedServices: Array.isArray(m.affectedServices) ? m.affectedServices : [],
          status: mapMaintenanceStatus(m.status),
        })));
      } catch (error: any) {
        if (!cancelled) setMaintenanceError(error?.message || 'Failed to load maintenance windows');
      } finally {
        if (!cancelled) setMaintenanceLoading(false);
      }
    };

    const fetchUptime = async () => {
      try {
        const response = await fetch('/api/status/uptime?days=90', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const list = Array.isArray(body?.data) ? body.data : [];
        if (cancelled) return;
        setUptimeHistory(list.map((d: any) => ({
          date: typeof d.date === 'string' ? d.date.split('T')[0] : String(d.date),
          uptime: typeof d.uptime === 'number' ? d.uptime : Number(d.uptime) || 0,
          incidents: typeof d.incidents === 'number' ? d.incidents : Number(d.incidents) || 0,
        })));
      } catch {
        // No uptime-history feed available; the chart is hidden rather than
        // rendering synthetic availability numbers on the public page.
        if (!cancelled) setUptimeHistory([]);
      } finally {
        if (!cancelled) setUptimeLoading(false);
      }
    };

    void fetchStatus();
    void fetchIncidents();
    void fetchMaintenance();
    void fetchUptime();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Only ever render real, live service telemetry. When the liveness probe
  // returns no per-service detail, the list stays empty and the page shows a
  // neutral "live status unavailable" state instead of fabricated figures.
  const activeServices = liveServices ?? [];
  const hasLiveServices = activeServices.length > 0;

  const getOverallStatus = () => {
    if (!hasLiveServices) {
      return { status: 'unknown', text: 'Live Status Unavailable', color: 'slate' };
    }
    const hasOutage = activeServices.some(s => s.status === 'major_outage');
    const hasPartialOutage = activeServices.some(s => s.status === 'partial_outage');
    const hasDegraded = activeServices.some(s => s.status === 'degraded');
    const hasMaintenance = activeServices.some(s => s.status === 'maintenance');

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
  // Derive headline metrics from the live service set when available so the
  // public page reflects real data instead of the static fallback list.
  // Availability comes from the measured 90-day history feed, never from
  // per-component numbers the probe does not actually measure.
  const overallUptime = uptimeHistory.length > 0
    ? (uptimeHistory.reduce((acc, d) => acc + d.uptime, 0) / uptimeHistory.length).toFixed(3)
    : '—';

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
                <div className="text-3xl font-bold text-white">{activeServices.length}</div>
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
            {!hasLiveServices ? (
              <div className="p-8 text-center text-slate-400">
                {servicesLoading
                  ? 'Loading live service status...'
                  : 'Live service status is currently unavailable. Per-service availability and response times will appear here once the monitoring feed reports them.'}
              </div>
            ) : (
            <div className="divide-y divide-slate-700">
              {activeServices.map((service) => {
                const Icon = service.icon ?? Activity;
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
                          <div className="text-white">{service.uptime !== undefined ? `${service.uptime}%` : '—'}</div>
                          <div className="text-slate-500">Uptime</div>
                        </div>
                        <div className="text-right hidden md:block">
                          <div className="text-white">{service.responseTime !== undefined ? `${service.responseTime}ms` : '—'}</div>
                          <div className="text-slate-500">Response</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </section>

        {/* 90-Day Uptime — rendered only when a real uptime feed is available */}
        {(uptimeLoading || uptimeHistory.length > 0) && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            90-Day Uptime History
          </h2>
          {uptimeLoading ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center text-slate-400">
              Loading uptime history...
            </div>
          ) : (
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
          )}
        </section>
        )}

        {/* Scheduled Maintenance */}
        {(scheduledMaintenance.length > 0 || maintenanceLoading || maintenanceError) && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Scheduled Maintenance
            </h2>
            {maintenanceLoading ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center text-slate-400">
                Loading scheduled maintenance...
              </div>
            ) : maintenanceError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
                Unable to load maintenance schedule: {maintenanceError}
              </div>
            ) : (
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
                    <button
                      onClick={() => setSubscribedMaintenance((prev) => {
                        const next = new Set(prev);
                        if (next.has(maintenance.id)) {
                          next.delete(maintenance.id);
                        } else {
                          next.add(maintenance.id);
                        }
                        return next;
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        subscribedMaintenance.has(maintenance.id)
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                      }`}
                    >
                      {subscribedMaintenance.has(maintenance.id) ? 'Subscribed' : 'Subscribe to Updates'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Recent Incidents */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recent Incidents
          </h2>
          {incidentsLoading ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
              Loading incident history...
            </div>
          ) : incidentsError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
              Unable to load incident history: {incidentsError}
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No recent incidents</p>
              <p className="text-slate-500 text-sm mt-1">All systems have been operating normally.</p>
            </div>
          ) : (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIncident(expandedIncident === incident.id ? null : incident.id);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
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
          )}
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
