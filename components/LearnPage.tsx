import React, { useState } from 'react';
import {
  Shield, BookOpen, Video, FileText, GraduationCap, Award, Clock,
  Play, CheckCircle, ArrowRight, Search, Filter, Star, Users,
  Zap, Target, Lock, Globe, ChevronRight, ExternalLink, Download,
  Bookmark, ThumbsUp, MessageSquare, Calendar, TrendingUp, Brain,
  Lightbulb, Rocket, Code, Database, Cloud, ShieldCheck
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  modules: number;
  enrolled: number;
  rating: number;
  image: string;
  featured?: boolean;
  certification?: boolean;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  type: 'video' | 'article' | 'interactive';
  views: number;
}

interface Webinar {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  speaker: string;
  speakerRole: string;
  registered: number;
  live: boolean;
}

const courses: Course[] = [
  {
    id: '1',
    title: 'SOC 2 Compliance Masterclass',
    description: 'Complete guide to achieving SOC 2 Type II certification. Learn about Trust Service Criteria, control implementation, and audit preparation.',
    duration: '4 hours',
    level: 'Beginner',
    category: 'Compliance Frameworks',
    modules: 12,
    enrolled: 2847,
    rating: 4.9,
    image: 'soc2',
    featured: true,
    certification: true,
  },
  {
    id: '2',
    title: 'ISO 27001 Implementation Guide',
    description: 'Step-by-step implementation of ISO 27001 Information Security Management System. From gap analysis to certification.',
    duration: '6 hours',
    level: 'Intermediate',
    category: 'Compliance Frameworks',
    modules: 15,
    enrolled: 1923,
    rating: 4.8,
    image: 'iso27001',
    certification: true,
  },
  {
    id: '3',
    title: 'GDPR & Data Privacy Essentials',
    description: 'Master GDPR compliance requirements, data subject rights, breach notification, and privacy by design principles.',
    duration: '3 hours',
    level: 'Beginner',
    category: 'Privacy',
    modules: 8,
    enrolled: 3156,
    rating: 4.7,
    image: 'gdpr',
    featured: true,
  },
  {
    id: '4',
    title: 'EU AI Act Compliance',
    description: 'Comprehensive guide to EU AI Act requirements, risk classification, conformity assessment, and documentation.',
    duration: '5 hours',
    level: 'Advanced',
    category: 'AI Regulations',
    modules: 10,
    enrolled: 1245,
    rating: 4.9,
    image: 'euaiact',
    certification: true,
  },
  {
    id: '5',
    title: 'HIPAA for Healthcare Tech',
    description: 'Learn HIPAA Privacy and Security Rules, PHI handling, BAA requirements, and compliance strategies for HealthTech.',
    duration: '4 hours',
    level: 'Intermediate',
    category: 'Healthcare',
    modules: 11,
    enrolled: 1567,
    rating: 4.8,
    image: 'hipaa',
  },
  {
    id: '6',
    title: 'aCOS: Autonomous Compliance',
    description: 'Master our autonomous compliance operations system. Configure AI agents, set up self-healing, and optimize automation.',
    duration: '3 hours',
    level: 'Advanced',
    category: 'Platform Features',
    modules: 9,
    enrolled: 892,
    rating: 4.9,
    image: 'acos',
    featured: true,
  },
  {
    id: '7',
    title: 'Risk Management Fundamentals',
    description: 'Learn risk identification, assessment, treatment strategies, and continuous monitoring best practices.',
    duration: '2.5 hours',
    level: 'Beginner',
    category: 'Risk Management',
    modules: 7,
    enrolled: 2134,
    rating: 4.6,
    image: 'risk',
  },
  {
    id: '8',
    title: 'Evidence Collection Automation',
    description: 'Set up automated evidence collection, integrate with cloud providers, and maintain audit-ready documentation.',
    duration: '2 hours',
    level: 'Intermediate',
    category: 'Platform Features',
    modules: 6,
    enrolled: 1678,
    rating: 4.7,
    image: 'evidence',
  },
];

const tutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Getting Started in 30 Minutes',
    description: 'Quick start guide to set up your account, configure your first framework, and collect initial evidence.',
    duration: '30 min',
    category: 'Getting Started',
    type: 'interactive',
    views: 15234,
  },
  {
    id: '2',
    title: 'Connecting AWS Integration',
    description: 'Step-by-step guide to connect AWS using CloudFormation or IAM roles for automated evidence collection.',
    duration: '15 min',
    category: 'Integrations',
    type: 'video',
    views: 8756,
  },
  {
    id: '3',
    title: 'Using AI Policy Generator',
    description: 'Generate compliant security policies in minutes using our AI-powered policy generator.',
    duration: '10 min',
    category: 'AI Features',
    type: 'video',
    views: 12089,
  },
  {
    id: '4',
    title: 'Setting Up Control Monitoring',
    description: 'Configure automated control monitoring and receive alerts for compliance drift.',
    duration: '20 min',
    category: 'Monitoring',
    type: 'article',
    views: 6543,
  },
  {
    id: '5',
    title: 'Preparing for Your First Audit',
    description: 'Complete checklist and best practices for audit preparation and auditor communication.',
    duration: '25 min',
    category: 'Audit',
    type: 'article',
    views: 9876,
  },
  {
    id: '6',
    title: 'Multi-Framework Management',
    description: 'Learn to manage multiple compliance frameworks efficiently with cross-control mapping.',
    duration: '20 min',
    category: 'Advanced',
    type: 'video',
    views: 4532,
  },
];

const webinars: Webinar[] = [
  {
    id: '1',
    title: 'SOC 2 in 2026: What\'s Changed',
    description: 'Learn about the latest updates to SOC 2 requirements and how to adapt your compliance program.',
    date: '2026-02-15',
    time: '11:00 AM EST',
    speaker: 'Sarah Chen',
    speakerRole: 'Head of Compliance',
    registered: 456,
    live: false,
  },
  {
    id: '2',
    title: 'EU AI Act: Practical Implementation',
    description: 'Deep dive into EU AI Act compliance with real-world implementation strategies.',
    date: '2026-02-22',
    time: '2:00 PM EST',
    speaker: 'Dr. Marcus Weber',
    speakerRole: 'AI Governance Expert',
    registered: 623,
    live: false,
  },
  {
    id: '3',
    title: 'Autonomous Compliance with aCOS',
    description: 'See how aCOS can automate 80% of your compliance operations with AI agents.',
    date: '2026-01-30',
    time: '10:00 AM EST',
    speaker: 'Alex Rivera',
    speakerRole: 'Product Lead',
    registered: 892,
    live: true,
  },
];

const categories = [
  'All',
  'Getting Started',
  'Compliance Frameworks',
  'Platform Features',
  'Integrations',
  'AI Features',
  'Risk Management',
  'Privacy',
  'Healthcare',
  'AI Regulations',
];

const certifications = [
  {
    title: 'ComplyEasyAI Certified Professional',
    description: 'Demonstrate mastery of compliance automation principles and platform expertise.',
    courses: 3,
    examDuration: '90 min',
    validity: '2 years',
  },
  {
    title: 'SOC 2 Implementation Specialist',
    description: 'Certified expertise in SOC 2 implementation using ComplyEasyAI platform.',
    courses: 2,
    examDuration: '60 min',
    validity: '2 years',
  },
  {
    title: 'AI Compliance Expert',
    description: 'Specialized certification for EU AI Act and AI governance compliance.',
    courses: 2,
    examDuration: '75 min',
    validity: '1 year',
  },
];

export const LearnPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'tutorials' | 'webinars' | 'certifications'>('courses');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'All' || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Advanced': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'interactive': return Zap;
      default: return BookOpen;
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
                <span className="text-slate-400 text-sm ml-2 hidden sm:block">| Learning Center</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                Documentation
              </a>
              <a href="/community" className="text-slate-400 hover:text-white transition-colors text-sm">
                Community
              </a>
              <a href="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-purple-600/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 mb-6">
              <GraduationCap className="w-4 h-4 text-brand-400" />
              <span className="text-brand-400 text-sm font-medium">ComplyEasyAI Learning Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Master Compliance with Expert-Led Training
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Free courses, tutorials, and certifications to help you achieve compliance excellence. 
              Learn from industry experts and get certified in weeks, not months.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses, tutorials, and resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-slate-400 text-sm">Free Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">200+</div>
                <div className="text-slate-400 text-sm">Tutorials</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">15,000+</div>
                <div className="text-slate-400 text-sm">Learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.8</div>
                <div className="text-slate-400 text-sm">Avg Rating</div>
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
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'tutorials', label: 'Tutorials', icon: Video },
              { id: 'webinars', label: 'Webinars', icon: Play },
              { id: 'certifications', label: 'Certifications', icon: Award },
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
        {/* Category Filter */}
        {(activeTab === 'courses' || activeTab === 'tutorials') && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            {/* Featured Courses */}
            {selectedCategory === 'All' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Featured Courses
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {filteredCourses.filter(c => c.featured).map((course) => (
                    <div key={course.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all group">
                      <div className="h-40 bg-gradient-to-br from-brand-600 to-purple-600 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield className="w-16 h-16 text-white/30" />
                        </div>
                        {course.certification && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Certification
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          <span className="text-slate-500 text-xs">{course.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {course.modules} modules
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            {course.rating}
                          </div>
                        </div>
                        <button className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
                          Start Course
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Courses */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedCategory === 'All' ? 'All Courses' : selectedCategory}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.filter(c => selectedCategory !== 'All' || !c.featured).map((course) => (
                  <div key={course.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-brand-500/50 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      {course.certification && (
                        <Award className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrolled.toLocaleString()} enrolled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredTutorials.map((tutorial) => {
              const TypeIcon = getTypeIcon(tutorial.type);
              return (
                <div key={tutorial.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-brand-500/50 transition-all group flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tutorial.type === 'video' ? 'bg-red-500/10 text-red-400' :
                    tutorial.type === 'article' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">{tutorial.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{tutorial.duration}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">{tutorial.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{tutorial.views.toLocaleString()} views</span>
                      <button className="text-brand-400 text-sm font-medium hover:text-brand-300 flex items-center gap-1">
                        {tutorial.type === 'video' ? 'Watch' : tutorial.type === 'article' ? 'Read' : 'Start'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Webinars Tab */}
        {activeTab === 'webinars' && (
          <div>
            {/* Live/Upcoming Webinar */}
            {webinars.filter(w => w.live).map((webinar) => (
              <div key={webinar.id} className="bg-gradient-to-r from-brand-600/20 to-purple-600/20 border border-brand-500/30 rounded-2xl p-8 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    LIVE NOW
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-3">{webinar.title}</h2>
                    <p className="text-slate-300 mb-4">{webinar.description}</p>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {webinar.date}
                      </span>
                      <span>{webinar.time}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
                        {webinar.speaker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{webinar.speaker}</div>
                        <div className="text-sm text-slate-400">{webinar.speakerRole}</div>
                      </div>
                    </div>
                    <button className="bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                      <Play className="w-5 h-5" />
                      Join Live Webinar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Upcoming Webinars */}
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Webinars</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {webinars.filter(w => !w.live).map((webinar) => (
                <div key={webinar.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-brand-500/50 transition-all">
                  <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {webinar.date} at {webinar.time}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{webinar.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{webinar.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {webinar.speaker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-sm">
                        <div className="text-white">{webinar.speaker}</div>
                        <div className="text-slate-500 text-xs">{webinar.speakerRole}</div>
                      </div>
                    </div>
                    <button className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all">
                      Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div>
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-10 h-10 text-yellow-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Get Certified</h2>
                  <p className="text-slate-300">Validate your expertise with industry-recognized certifications</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">3</div>
                  <div className="text-slate-400 text-sm">Available Certifications</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">2,500+</div>
                  <div className="text-slate-400 text-sm">Certified Professionals</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">Free</div>
                  <div className="text-slate-400 text-sm">For Platform Users</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {certifications.map((cert, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{cert.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{cert.description}</p>
                  <div className="space-y-2 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {cert.courses} required courses
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {cert.examDuration} exam
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Valid for {cert.validity}
                    </div>
                  </div>
                  <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">
                    View Requirements
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CTA Section */}
      <section className="border-t border-slate-700 bg-slate-800/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Sign up for a free trial and get unlimited access to all learning resources, 
            including courses, tutorials, and certification exams.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/signup"
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="/docs"
              className="border border-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-700/50 transition-all"
            >
              Browse Documentation
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
              <span className="text-slate-500 text-sm">Learning Center</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/docs" className="hover:text-white transition-colors">Docs</a>
              <a href="/community" className="hover:text-white transition-colors">Community</a>
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

export default LearnPage;
