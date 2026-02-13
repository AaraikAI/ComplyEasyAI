---
name: visionary-frontend
description: Design world-class, visionary frontends for enterprise applications with comprehensive design systems, sophisticated data visualization, cutting-edge AI/ML integration patterns, and production-ready React/Next.js/TypeScript code. Specializes in compliance platforms, AI agent interfaces, enterprise dashboards, and innovative UX that differentiates from competitors.
---

# Visionary Frontend Design Skill

Transform applications into world-class, production-ready frontends with comprehensive design systems, enterprise-grade polish, and innovative user experiences.

## Core Capabilities

This skill creates:
- **Complete design systems** from scratch (colors, typography, spacing, components, patterns)
- **Enterprise dashboards** with sophisticated data visualization
- **AI agent interfaces** following Anthropic's LLM/agent UX principles
- **Landing pages** and marketing sites with conversion optimization
- **Compliance-specific UX patterns** (audit trails, risk dashboards, policy management)
- **Production-ready React/Next.js/TypeScript code** with best practices

## When to Use This Skill

Trigger this skill when the user wants to:
- Create or improve frontend layouts and designs
- Build a comprehensive design system
- Design enterprise dashboards or admin panels
- Create AI chat or agent interfaces
- Build compliance, audit, or risk management UIs
- Develop sophisticated data visualization
- Improve existing application layouts
- Generate production-ready frontend code

## Design Philosophy

### 1. Enterprise-Grade Excellence

**Visual Polish**
- Pixel-perfect alignment and spacing
- Consistent visual hierarchy
- Professional color palettes with accessibility (WCAG AA+)
- Sophisticated typography systems
- Subtle animations and micro-interactions
- Glass-morphism, neumorphism, or modern gradients (contextually appropriate)

**Production Quality**
- Fully responsive (mobile-first approach)
- Accessible (ARIA labels, keyboard navigation, screen reader support)
- Performance-optimized (lazy loading, code splitting, optimized assets)
- Error states, loading states, empty states
- Comprehensive component documentation

### 2. Innovative UX Differentiation

**Stand Out From Competitors**
- Unique visual identity and brand personality
- Innovative interaction patterns (e.g., command palettes, contextual menus)
- Delightful micro-interactions and transitions
- Smart defaults and progressive disclosure
- AI-powered features prominently showcased

**Cutting-Edge Patterns**
- Real-time collaboration indicators
- Inline AI assistance and copilots
- Natural language search and commands
- Contextual help and onboarding
- Advanced data visualization (custom D3.js, Recharts, or Chart.js)

### 3. AI/ML Integration Excellence

Following Anthropic's principles for LLM/agent UX:

**Transparency and Visibility**
- Show agent plans, reasoning, and actions
- Display confidence levels and reasoning chains
- Provide edit/approve flows for AI-generated content
- Surface verification steps (tests, validations, checks)

**Fast Feedback Loops**
- Tight "plan → execute → verify → show results" cycles
- Allow human intervention at critical points
- Show progress with detailed status indicators
- Enable quick iterations and corrections

**Context Management**
- Clear session/context boundaries
- Visual indicators of what's in context
- Easy context reset or checkpoint restore
- Project-level instructions (visible and editable)

**Mode Separation**
- Distinct UI for explore/plan/implement phases
- Clear mode switching controls
- Different visual treatments per mode

## Design System Creation Methodology

### Step 1: Brand Foundation

**Color System**
- Primary palette (3-5 colors with full tint/shade scales)
- Semantic colors (success, warning, error, info)
- Neutral grays (10-12 shades for hierarchy)
- Surface colors (backgrounds, cards, elevated surfaces)
- Compliance-specific colors (risk levels, audit statuses)

**Typography**
- Font families (primary for UI, secondary for headings, monospace for code)
- Type scale (base 16px, modular scale: 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72)
- Font weights (light: 300, regular: 400, medium: 500, semibold: 600, bold: 700)
- Line heights and letter spacing

**Spacing System**
- Base unit (typically 4px or 8px)
- Scale: 0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64 (multiples of base)
- Consistent margin, padding, gap usage

### Step 2: Component Library

**Core Components**
- Buttons (primary, secondary, tertiary, ghost, danger)
- Inputs (text, select, checkbox, radio, switch, textarea)
- Cards and panels (elevation levels, borders, shadows)
- Navigation (top nav, sidebar, breadcrumbs, tabs)
- Data display (tables, lists, grids, stats)
- Feedback (alerts, toasts, modals, popovers)
- Forms (layouts, validation, multi-step)

**Advanced Components**
- Command palette (Cmd+K)
- Data visualization (charts, graphs, heatmaps)
- Real-time updates (live data, notifications)
- AI chat interface (message bubbles, thinking indicators, tool use display)
- Audit trail (timeline, change history)
- Risk dashboard (gauges, status cards, trend charts)

### Step 3: Layout Patterns

**Dashboard Layouts**
- Top nav + sidebar (collapsible)
- Grid systems (12-column, CSS Grid, flexbox)
- Responsive breakpoints (sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536)
- Card-based layouts for metrics
- Tabbed interfaces for complex data

**Information Architecture**
- Clear visual hierarchy (F-pattern, Z-pattern)
- Scannable content (headers, lists, highlights)
- Progressive disclosure (show more, expand/collapse)
- Contextual actions (hover menus, quick actions)

### Step 4: Animation & Motion

**Micro-interactions**
- Button hover/active states (scale, color shift)
- Input focus rings (smooth transitions)
- Loading skeletons (shimmer effects)
- Page transitions (fade, slide)
- Data updates (smooth number counting, chart animations)

**Performance-Optimized**
- CSS transforms (translate, scale, rotate) over position changes
- RequestAnimationFrame for smooth animations
- Respect prefers-reduced-motion
- 60fps animations (avoid jank)

## Compliance-Specific UX Patterns

### Audit Trail Interface
```
Components:
- Timeline view (chronological events)
- Filterable/searchable history
- Expandable event details
- User attribution with avatars
- Diff views for changes
- Export to PDF/CSV
```

### Risk Dashboard
```
Components:
- Risk heat map (color-coded severity)
- Trend charts (risk over time)
- Risk score gauges
- Compliance status cards
- Alert notifications (high-priority risks)
- Drill-down to detailed risk analysis
```

### Policy Management
```
Components:
- Policy library (searchable, categorized)
- Version history and comparison
- Approval workflows (visual pipeline)
- Impact analysis (affected systems)
- Policy editor (rich text or markdown)
```

### AI-Powered Compliance Chat
```
Components:
- Chat interface with context cards
- Show reasoning and sources
- Display confidence levels
- Quick actions (generate reports, create policies)
- Conversation history and bookmarks
```

## React/Next.js/TypeScript Best Practices

### Component Architecture

**Atomic Design Pattern**
```typescript
// Atoms: Basic building blocks
export const Button: React.FC<ButtonProps> = ({ variant, size, children, ...props }) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200";
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  
  return (
    <button 
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size])}
      {...props}
    >
      {children}
    </button>
  );
};

// Molecules: Combinations of atoms
export const SearchInput: React.FC = () => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
      <Input className="pl-10" placeholder="Search..." />
    </div>
  );
};

// Organisms: Complex UI sections
export const DashboardHeader: React.FC = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <SearchInput />
        <UserMenu />
      </div>
    </header>
  );
};
```

### State Management

**Use appropriate tools for state complexity**
```typescript
// Simple: useState, useContext
// Medium: Zustand, Jotai
// Complex: Redux Toolkit, TanStack Query (for server state)

// Example with Zustand
import { create } from 'zustand';

interface ComplianceStore {
  riskLevel: number;
  auditLogs: AuditLog[];
  setRiskLevel: (level: number) => void;
  addAuditLog: (log: AuditLog) => void;
}

export const useComplianceStore = create<ComplianceStore>((set) => ({
  riskLevel: 0,
  auditLogs: [],
  setRiskLevel: (level) => set({ riskLevel: level }),
  addAuditLog: (log) => set((state) => ({ 
    auditLogs: [...state.auditLogs, log] 
  })),
}));
```

### Data Visualization

**Recharts for Declarative Charts**
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ComplianceTrendChart: React.FC<{ data: TrendData[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

**D3.js for Custom Visualizations**
```typescript
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export const RiskHeatmap: React.FC<{ data: RiskData[][] }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([10, 0]);
    
    // Create heatmap cells
    svg.selectAll('rect')
      .data(data.flat())
      .join('rect')
      .attr('x', (d, i) => (i % 7) * 50)
      .attr('y', (d, i) => Math.floor(i / 7) * 50)
      .attr('width', 48)
      .attr('height', 48)
      .attr('fill', d => colorScale(d.value))
      .attr('rx', 4);
  }, [data]);
  
  return <svg ref={svgRef} width={350} height={350} />;
};
```

### AI Chat Interface

**Following Anthropic's Principles**
```typescript
export const AIComplianceChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentState, setAgentState] = useState<'idle' | 'planning' | 'executing' | 'verifying'>('idle');
  
  return (
    <div className="flex flex-col h-full">
      {/* Mode indicator */}
      <ModeIndicator mode={agentState} />
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            showReasoning={msg.type === 'assistant'}
            showToolUse={msg.toolCalls}
            showVerification={msg.verification}
          />
        ))}
        
        {agentState !== 'idle' && <ThinkingIndicator state={agentState} />}
      </div>
      
      {/* Context display */}
      <ContextPanel documents={currentContext} onReset={resetContext} />
      
      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};
```

### Styling with Tailwind CSS

**Design token mapping**
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... full scale
          900: '#1e3a8a',
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#991b1b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // 4px base unit
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
```

## Workflow

When the user requests frontend design or improvements, follow this workflow:

### 1. Discovery (Always Start Here)
```
Ask:
- What is the application/feature?
- Who are the primary users?
- What are the key user goals?
- Any existing brand guidelines or design preferences?
- Any technical constraints?
- What differentiates this from competitors?
```

### 2. Design System Setup
```
If no design system exists:
1. Create color palette (brand + semantic + neutrals)
2. Define typography scale
3. Set spacing system
4. Document component variants
5. Define animation principles

If improving existing:
1. Audit current system
2. Identify inconsistencies
3. Propose refinements
4. Create migration plan
```

### 3. Information Architecture
```
1. Map user flows
2. Define page hierarchy
3. Organize content sections
4. Plan navigation structure
5. Identify data relationships
```

### 4. Component Design
```
For each component:
1. Define purpose and use cases
2. List all states (default, hover, active, disabled, loading, error)
3. Show responsive behavior
4. Document accessibility requirements
5. Provide code implementation
```

### 5. Layout Creation
```
1. Create wireframe structure
2. Define grid system
3. Establish visual hierarchy
4. Add responsive breakpoints
5. Implement with production code
```

### 6. Polish & Refinement
```
1. Add micro-interactions
2. Refine spacing and alignment
3. Optimize performance
4. Ensure accessibility
5. Test responsive behavior
6. Document component usage
```

## Output Format

Always provide:

### 1. Design System Documentation
```markdown
# Design System

## Colors
[Color palette with hex codes and usage guidelines]

## Typography
[Font families, sizes, weights, line heights]

## Spacing
[Spacing scale and usage rules]

## Components
[Component library with variants and states]
```

### 2. Component Code
```typescript
// Fully typed, production-ready React components
// With prop interfaces, variants, and documentation
```

### 3. Layout Implementation
```tsx
// Complete page layouts with responsive design
// Using modern CSS (Grid, Flexbox, Container queries)
```

### 4. Usage Examples
```tsx
// Real-world examples showing components in context
// With different states and configurations
```

### 5. Design Rationale
```
Explain:
- Why specific design decisions were made
- How it differentiates from competitors
- Accessibility considerations
- Performance optimizations
```

## Advanced Patterns

### Command Palette (Cmd+K)
```typescript
import { Command } from 'cmdk';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  
  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Search for policies, audits, or actions..." />
      <Command.List>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => createPolicy()}>
            Create new policy
          </Command.Item>
          <Command.Item onSelect={() => runAudit()}>
            Run compliance audit
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Recent">
          {recentItems.map(item => (
            <Command.Item key={item.id} onSelect={() => navigate(item)}>
              {item.title}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};
```

### Real-time Collaboration Indicators
```typescript
export const CollaborativeEditor: React.FC = () => {
  const { activeUsers } = useCollaboration();
  
  return (
    <div className="relative">
      {/* Active user avatars */}
      <div className="absolute top-4 right-4 flex -space-x-2">
        {activeUsers.map(user => (
          <Avatar 
            key={user.id}
            src={user.avatar}
            className="ring-2 ring-white"
            tooltip={`${user.name} is viewing`}
          />
        ))}
      </div>
      
      {/* Editor with live cursors */}
      <Editor 
        cursors={activeUsers.map(u => u.cursor)}
        onCursorMove={broadcastCursor}
      />
    </div>
  );
};
```

### Progressive Loading States
```typescript
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery('dashboard', fetchDashboard);
  
  if (isLoading) return <DashboardSkeleton />;
  
  return <ActualDashboard data={data} />;
};
```

## Quality Checklist

Before delivering, ensure:

- [ ] All colors have sufficient contrast (WCAG AA)
- [ ] Components have all states (default, hover, active, disabled, loading, error)
- [ ] Responsive at all breakpoints (mobile, tablet, desktop)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)
- [ ] Loading states for all async operations
- [ ] Error boundaries and error states
- [ ] Empty states with helpful messages
- [ ] Animations are smooth (60fps)
- [ ] Code is fully typed (TypeScript)
- [ ] Components are documented
- [ ] Performance optimized (lazy loading, code splitting)
- [ ] Design rationale provided

## Examples of Excellence

**Compliance Dashboard**
- Real-time risk scoring with animated gauges
- Interactive audit timeline with drill-down
- AI chat assistant with reasoning display
- Command palette for quick actions
- Multi-level filtering and search
- Export capabilities (PDF, CSV, Excel)

**AI Agent Interface**
- Clear mode indicators (explore/plan/execute)
- Thinking process visualization
- Tool use transparency
- Verification step display
- Context management UI
- Human approval checkpoints

**Enterprise Data Visualization**
- Custom D3.js charts for complex data
- Responsive chart resizing
- Interactive tooltips and legends
- Drill-down and filtering
- Export chart as image/data
- Real-time data updates

## Conclusion

This skill creates world-class, production-ready frontends that combine:
- **Enterprise polish** (pixel-perfect, accessible, performant)
- **Innovation** (unique UX, cutting-edge patterns, delightful interactions)
- **Sophistication** (complex data viz, AI integration, real-time features)
- **Production quality** (TypeScript, best practices, comprehensive documentation)

Every output should make users think: "This is better than anything I've seen before."
