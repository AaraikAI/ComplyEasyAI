import React, { useState } from 'react';
import {
  Shield, Users, MessageSquare, Heart, Star, Award, Calendar,
  TrendingUp, ExternalLink, ArrowRight, Search, Filter, ThumbsUp,
  MessageCircle, Eye, Clock, CheckCircle, Zap, BookOpen, Code,
  GitBranch, Globe, Slack, Video, FileText, HelpCircle, Lightbulb,
  Trophy, Target, Share2, Bookmark, Bell, ChevronRight, Hash
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorBadge?: string;
  category: string;
  replies: number;
  views: number;
  likes: number;
  lastActivity: string;
  solved?: boolean;
  pinned?: boolean;
}

interface Event {
  id: string;
  title: string;
  type: 'meetup' | 'workshop' | 'hackathon' | 'conference';
  date: string;
  time: string;
  location: string;
  attendees: number;
  virtual: boolean;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'template' | 'integration' | 'plugin' | 'guide';
  downloads: number;
  author: string;
  rating: number;
}

const forumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Best practices for SOC 2 evidence organization?',
    author: 'Jennifer M.',
    authorBadge: 'Champion',
    category: 'Best Practices',
    replies: 23,
    views: 1456,
    likes: 45,
    lastActivity: '2 hours ago',
    solved: true,
    pinned: true,
  },
  {
    id: '2',
    title: 'How to integrate ComplyEasyAI with Azure DevOps?',
    author: 'David K.',
    authorBadge: 'Expert',
    category: 'Integrations',
    replies: 15,
    views: 892,
    likes: 28,
    lastActivity: '5 hours ago',
    solved: true,
  },
  {
    id: '3',
    title: 'EU AI Act: Risk classification examples needed',
    author: 'Maria S.',
    category: 'EU Regulations',
    replies: 31,
    views: 2134,
    likes: 67,
    lastActivity: '1 hour ago',
  },
  {
    id: '4',
    title: 'aCOS autonomous healing - share your experience',
    author: 'Alex R.',
    authorBadge: 'Champion',
    category: 'Platform Features',
    replies: 18,
    views: 756,
    likes: 34,
    lastActivity: '3 hours ago',
  },
  {
    id: '5',
    title: 'Custom framework for FedRAMP - template sharing',
    author: 'Thomas W.',
    authorBadge: 'Contributor',
    category: 'Templates',
    replies: 12,
    views: 543,
    likes: 21,
    lastActivity: '6 hours ago',
  },
  {
    id: '6',
    title: 'HIPAA compliance checklist - community validated',
    author: 'Sarah L.',
    authorBadge: 'Expert',
    category: 'Healthcare',
    replies: 45,
    views: 3210,
    likes: 89,
    lastActivity: '30 minutes ago',
    pinned: true,
  },
];

const events: Event[] = [
  {
    id: '1',
    title: 'Compliance Automation Summit 2026',
    type: 'conference',
    date: '2026-03-15',
    time: '9:00 AM - 5:00 PM EST',
    location: 'San Francisco, CA',
    attendees: 1250,
    virtual: true,
  },
  {
    id: '2',
    title: 'EU AI Act Workshop: Hands-on Implementation',
    type: 'workshop',
    date: '2026-02-10',
    time: '2:00 PM EST',
    location: 'Virtual',
    attendees: 320,
    virtual: true,
  },
  {
    id: '3',
    title: 'NYC Compliance Meetup',
    type: 'meetup',
    date: '2026-02-05',
    time: '6:30 PM EST',
    location: 'New York, NY',
    attendees: 85,
    virtual: false,
  },
  {
    id: '4',
    title: 'Compliance Hackathon: Build Integrations',
    type: 'hackathon',
    date: '2026-02-20',
    time: '48 hours',
    location: 'Virtual',
    attendees: 156,
    virtual: true,
  },
];

const resources: Resource[] = [
  {
    id: '1',
    title: 'SOC 2 Policy Template Pack',
    description: 'Complete set of 15 policies required for SOC 2 certification.',
    type: 'template',
    downloads: 4567,
    author: 'ComplyEasyAI Team',
    rating: 4.9,
  },
  {
    id: '2',
    title: 'Datadog Integration Plugin',
    description: 'Custom Datadog integration for enhanced monitoring evidence.',
    type: 'integration',
    downloads: 1234,
    author: 'Community',
    rating: 4.7,
  },
  {
    id: '3',
    title: 'GDPR Data Mapping Template',
    description: 'Pre-built data flow mapping for GDPR Article 30 compliance.',
    type: 'template',
    downloads: 2890,
    author: 'Privacy Experts',
    rating: 4.8,
  },
  {
    id: '4',
    title: 'Control Monitoring Dashboard',
    description: 'Custom Grafana dashboard for real-time control status.',
    type: 'plugin',
    downloads: 876,
    author: 'Community',
    rating: 4.6,
  },
];

const categories = [
  { name: 'All Discussions', count: 1234 },
  { name: 'Getting Started', count: 245 },
  { name: 'Best Practices', count: 312 },
  { name: 'Integrations', count: 189 },
  { name: 'Platform Features', count: 278 },
  { name: 'Templates', count: 156 },
  { name: 'EU Regulations', count: 134 },
  { name: 'Healthcare', count: 98 },
  { name: 'Feature Requests', count: 167 },
];

const topContributors = [
  { name: 'Jennifer M.', badge: 'Champion', points: 12450, posts: 234, helped: 189 },
  { name: 'David K.', badge: 'Expert', points: 9870, posts: 178, helped: 156 },
  { name: 'Sarah L.', badge: 'Expert', points: 8540, posts: 156, helped: 134 },
  { name: 'Alex R.', badge: 'Champion', points: 7890, posts: 145, helped: 112 },
  { name: 'Thomas W.', badge: 'Contributor', points: 5670, posts: 98, helped: 87 },
];

export const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forum' | 'events' | 'resources' | 'showcase'>('forum');
  const [selectedCategory, setSelectedCategory] = useState('All Discussions');
  const [searchQuery, setSearchQuery] = useState('');

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Champion': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Expert': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Contributor': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'conference': return 'bg-purple-500/10 text-purple-400';
      case 'workshop': return 'bg-blue-500/10 text-blue-400';
      case 'meetup': return 'bg-green-500/10 text-green-400';
      case 'hackathon': return 'bg-orange-500/10 text-orange-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'template': return FileText;
      case 'integration': return GitBranch;
      case 'plugin': return Code;
      case 'guide': return BookOpen;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <a href="/" className="flex items-center space-x-2">
                <div className="bg-brand-600 p-2 rounded-xl">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-white">ComplyEasy AI</span>
                <span className="text-slate-400 text-sm ml-2 hidden sm:block">| Community</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/learn" className="text-slate-400 hover:text-white transition-colors text-sm">
                Learn
              </a>
              <a href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                Docs
              </a>
              <a href="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Join Community
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">15,000+ Members</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join the Compliance Community
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Connect with compliance professionals, share best practices, get expert help, 
              and contribute to the future of compliance automation.
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a 
                href="https://slack.complyeasyai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
              >
                <Slack className="w-5 h-5" />
                Join Slack
                <ExternalLink className="w-4 h-4" />
              </a>
              <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all">
                <MessageSquare className="w-5 h-5" />
                Start a Discussion
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">15K+</div>
                <div className="text-slate-400 text-sm">Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-slate-400 text-sm">Discussions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">92%</div>
                <div className="text-slate-400 text-sm">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-slate-400 text-sm">Resources Shared</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700 bg-slate-800/50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'forum', label: 'Forum', icon: MessageSquare },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'resources', label: 'Resources', icon: BookOpen },
              { id: 'showcase', label: 'Showcase', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-brand-400 border-b-2 border-brand-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search community..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
              />
            </div>

            {/* Categories */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-brand-400" />
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === cat.name
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Top Contributors
              </h3>
              <div className="space-y-3">
                {topContributors.slice(0, 5).map((contributor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {contributor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">{contributor.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getBadgeColor(contributor.badge)}`}>
                          {contributor.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{contributor.points.toLocaleString()} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Forum Tab */}
            {activeTab === 'forum' && (
              <div>
                {/* New Post Button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {selectedCategory === 'All Discussions' ? 'Recent Discussions' : selectedCategory}
                  </h2>
                  <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-sm">
                    <MessageSquare className="w-4 h-4" />
                    New Discussion
                  </button>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {forumPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`bg-slate-800/50 border rounded-xl p-5 hover:border-brand-500/50 transition-all cursor-pointer ${
                        post.pinned ? 'border-yellow-500/30' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {post.pinned && (
                              <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                                Pinned
                              </span>
                            )}
                            {post.solved && (
                              <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Solved
                              </span>
                            )}
                            <span className="text-xs text-slate-500">{post.category}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2 hover:text-brand-400 transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              {post.author}
                              {post.authorBadge && (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getBadgeColor(post.authorBadge)}`}>
                                  {post.authorBadge}
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {post.replies} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {post.views.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.lastActivity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-8">
                  <button className="text-brand-400 font-medium hover:text-brand-300 flex items-center gap-1 mx-auto">
                    Load more discussions
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                  <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-sm">
                    <Calendar className="w-4 h-4" />
                    Submit Event
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-brand-500/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="bg-brand-600/20 rounded-xl p-3 text-center min-w-[70px]">
                          <div className="text-brand-400 text-xs font-medium">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-white text-2xl font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getEventTypeColor(event.type)}`}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </span>
                            {event.virtual && (
                              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Virtual
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.attendees} attending
                            </span>
                          </div>
                        </div>
                        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all flex-shrink-0">
                          Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Community Resources</h2>
                  <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-sm">
                    <Share2 className="w-4 h-4" />
                    Share Resource
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {resources.map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <div key={resource.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-brand-500/50 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-brand-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-500 capitalize">{resource.type}</span>
                            </div>
                            <h3 className="font-semibold text-white mb-1">{resource.title}</h3>
                            <p className="text-sm text-slate-400 mb-3">{resource.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{resource.downloads.toLocaleString()} downloads</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  {resource.rating}
                                </span>
                              </div>
                              <button className="text-brand-400 text-sm font-medium hover:text-brand-300 flex items-center gap-1">
                                Download
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Showcase Tab */}
            {activeTab === 'showcase' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Community Showcase</h2>
                  <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all text-sm">
                    <Trophy className="w-4 h-4" />
                    Submit Your Story
                  </button>
                </div>

                {/* Success Stories */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {[
                    {
                      company: 'TechFlow Inc.',
                      industry: 'FinTech',
                      achievement: 'SOC 2 Type II in 45 days',
                      quote: 'ComplyEasyAI automated 80% of our evidence collection. We went from zero to certified in record time.',
                      author: 'Sarah Chen, CTO',
                    },
                    {
                      company: 'MedSecure',
                      industry: 'HealthTech',
                      achievement: 'HIPAA + SOC 2 simultaneously',
                      quote: 'Managing two frameworks felt impossible until we found ComplyEasyAI. The cross-mapping feature saved us months.',
                      author: 'Dr. James Wilson, CISO',
                    },
                  ].map((story, index) => (
                    <div key={index} className="bg-gradient-to-br from-brand-600/10 to-purple-600/10 border border-brand-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                          Success Story
                        </span>
                        <span className="text-slate-500 text-xs">{story.industry}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{story.company}</h3>
                      <p className="text-brand-300 font-semibold mb-4">{story.achievement}</p>
                      <p className="text-slate-300 italic mb-4">"{story.quote}"</p>
                      <div className="text-sm text-slate-400">— {story.author}</div>
                    </div>
                  ))}
                </div>

                {/* Integration Showcase */}
                <h3 className="text-lg font-bold text-white mb-4">Featured Integrations</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Terraform Provider', author: 'HashiCorp', stars: 234 },
                    { name: 'VS Code Extension', author: 'Community', stars: 189 },
                    { name: 'GitHub Action', author: 'ComplyEasyAI', stars: 456 },
                  ].map((integration, index) => (
                    <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-brand-500/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <Code className="w-8 h-8 text-brand-400" />
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star className="w-4 h-4 fill-current" />
                          {integration.stars}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white">{integration.name}</h4>
                      <p className="text-sm text-slate-400">by {integration.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <section className="border-t border-slate-700 bg-slate-800/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Become Part of the Community</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of compliance professionals sharing knowledge, building connections, 
            and shaping the future of compliance automation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://slack.complyeasyai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Slack className="w-5 h-5" />
              Join Slack Community
            </a>
            <a 
              href="/signup"
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-white">ComplyEasy AI</span>
              <span className="text-slate-500 text-sm">Community</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/learn" className="hover:text-white transition-colors">Learn</a>
              <a href="/docs" className="hover:text-white transition-colors">Docs</a>
              <a href="/status" className="hover:text-white transition-colors">Status</a>
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

export default CommunityPage;
