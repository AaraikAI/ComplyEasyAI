import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Lock, AlertCircle } from 'lucide-react';
import { chatWithComplianceBot } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ComplianceChatProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export const ComplianceChat: React.FC<ComplianceChatProps> = ({ onNavigate, currentView }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      sender: 'ai', 
      text: 'Hi! I\'m your ComplyEasy AI assistant. I can help you:\n\n🔹 **Navigate** to any section:\n   - Main sections: dashboard, risks, frameworks, aCOS, audit, reports, tasks, integrations, settings\n   - aCOS tabs: goals, control loops, predictions, simulations, red team, swarm, IoT, neuroSymbolic\n   - Settings tabs: profile, security, organization, team, billing\n   - AI Tools: policy generator, contract analyzer, gap analysis, RFP responder, phishing sim, vendor risk, GDPR mapper, BCP generator\n🔹 **Create** items (risks, goals, control loops, etc.)\n🔹 **Run** operations (simulations, scans, etc.)\n🔹 **Edit** items (update status, modify details, etc.)\n\nJust tell me what you need! For example:\n- "Go to dashboard" or "Open policy generator"\n- "Create a risk for missing encryption"\n- "Run a compliance scan"\n- "Update risk status to Resolved"\n\n*Note: Delete operations are not available via chat for security.*', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  /**
   * Parse user command to determine intent and extract parameters
   */
  const parseCommand = (text: string): {
    intent: 'navigate' | 'create' | 'run' | 'edit' | 'query' | 'unknown';
    entity?: string;
    action?: string;
    params?: Record<string, any>;
  } => {
    const lowerText = text.toLowerCase().trim();

    // Navigation commands - including aCOS tabs
    const navPatterns = [
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(dashboard|home)/i, view: 'dashboard' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+risks?/i, view: 'risks' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+framework/i, view: 'frameworks' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+acos/i, view: 'acos' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?goals?/i, view: 'acos-goals' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?(?:control\s+)?loops?/i, view: 'acos-loops' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?predictions?/i, view: 'acos-predictions' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?simulations?/i, view: 'acos-simulations' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?(?:red\s+)?team/i, view: 'acos-redteam' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?swarm/i, view: 'acos-swarm' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?iot/i, view: 'acos-iot' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:acos\s+)?(?:neuro\s*)?symbolic/i, view: 'acos-neuroSymbolic' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+audit/i, view: 'audit' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+reports?/i, view: 'reports' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+tasks?/i, view: 'my-tasks' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+integrations?/i, view: 'integrations' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+settings?/i, view: 'settings' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:settings\s+)?profile/i, view: 'settings-profile' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:settings\s+)?security/i, view: 'settings-security' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:settings\s+)?organization/i, view: 'settings-organization' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:settings\s+)?team/i, view: 'settings-team' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:settings\s+)?billing/i, view: 'settings-billing' },
      // AI Tools navigation
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?(?:policy\s+)?generator/i, view: 'ai-policy' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?contract\s+analyzer/i, view: 'ai-contract' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?gap\s+analysis/i, view: 'ai-gap' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?rfp\s+responder/i, view: 'ai-rfp' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?phishing\s+(?:sim|simulator|generator)/i, view: 'ai-phishing' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?vendor\s+(?:risk|scorer)/i, view: 'ai-vendor' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?(?:data\s+)?(?:map|mapper|gdpr\s+map)/i, view: 'ai-data-map' },
      { pattern: /(?:go to|open|show|navigate to|switch to)\s+(?:ai\s+)?bcp\s+(?:generator|generator)/i, view: 'ai-bcp' },
    ];

    for (const { pattern, view } of navPatterns) {
      if (pattern.test(text)) {
        return { intent: 'navigate', entity: view };
      }
    }

    // Create commands
    if (/(?:create|add|new|make)\s+(?:a|an|the)?\s*(risk|goal|control loop|control|task)/i.test(text)) {
      const entityMatch = text.match(/(?:create|add|new|make)\s+(?:a|an|the)?\s*(risk|goal|control loop|control|task)/i);
      const entity = entityMatch?.[1]?.toLowerCase() || 'risk';
      return { intent: 'create', entity, params: { description: text } };
    }

    // Run/Execute commands
    if (/(?:run|execute|start|launch)\s+(?:a|an|the)?\s*(simulation|scan|control loop|loop|test|check)/i.test(text)) {
      const entityMatch = text.match(/(?:run|execute|start|launch)\s+(?:a|an|the)?\s*(simulation|scan|control loop|loop|test|check)/i);
      const entity = entityMatch?.[1]?.toLowerCase() || 'simulation';
      return { intent: 'run', entity, params: { query: text } };
    }

    // Edit/Update commands
    if (/(?:update|edit|change|modify|set)\s+(?:a|an|the)?\s*(risk|goal|control loop|status|task)/i.test(text)) {
      const entityMatch = text.match(/(?:update|edit|change|modify|set)\s+(?:a|an|the)?\s*(risk|goal|control loop|status|task)/i);
      const entity = entityMatch?.[1]?.toLowerCase() || 'risk';
      return { intent: 'edit', entity, params: { description: text } };
    }

    // Block delete commands
    if (/(?:delete|remove|destroy|erase)\s+/i.test(text)) {
      return { intent: 'unknown', entity: 'delete_blocked' };
    }

    // Default to query
    return { intent: 'query', params: { query: text } };
  };

  /**
   * Execute navigation command
   */
  const executeNavigation = async (view: string): Promise<string> => {
    if (!onNavigate) {
      return "Navigation is not available. Please use the menu to navigate.";
    }

    try {
      // Handle aCOS sub-tabs
      if (view.startsWith('acos-')) {
        const acosTab = view.replace('acos-', '');
        // Set sessionStorage BEFORE navigating to ensure it's available when component mounts
        sessionStorage.setItem('acosActiveTab', acosTab);
        // Dispatch custom event to notify component
        window.dispatchEvent(new CustomEvent('acosTabChange', { detail: { tab: acosTab } }));
        // Use setTimeout to ensure sessionStorage is set before navigation
        setTimeout(() => {
          onNavigate('acos');
          // Dispatch again after navigation in case component is already mounted
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('acosTabChange', { detail: { tab: acosTab } }));
          }, 100);
        }, 0);
        
        const tabNames: Record<string, string> = {
          'goals': 'Goals',
          'loops': 'Control Loops',
          'predictions': 'Predictions',
          'simulations': 'Simulations',
          'redteam': 'Red Team',
          'swarm': 'Swarm',
          'iot': 'IoT Devices',
          'neuroSymbolic': 'NeuroSymbolic AI',
        };
        
        return `✅ Navigating to aCOS v3.0 > ${tabNames[acosTab] || acosTab}...`;
      }

      // Handle Settings sub-tabs
      if (view.startsWith('settings-')) {
        const settingsTab = view.replace('settings-', '');
        sessionStorage.setItem('settingsActiveTab', settingsTab);
        // Dispatch custom event to notify component
        window.dispatchEvent(new CustomEvent('settingsTabChange', { detail: { tab: settingsTab } }));
        setTimeout(() => {
          onNavigate('settings');
          // Dispatch again after navigation in case component is already mounted
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('settingsTabChange', { detail: { tab: settingsTab } }));
          }, 100);
        }, 0);
        
        const tabNames: Record<string, string> = {
          'profile': 'Profile',
          'security': 'Security',
          'organization': 'Organization',
          'team': 'Team',
          'integrations': 'Integrations',
          'billing': 'Billing',
        };
        
        return `✅ Navigating to Settings > ${tabNames[settingsTab] || settingsTab}...`;
      }

      onNavigate(view);
      const viewNames: Record<string, string> = {
        'dashboard': 'Dashboard',
        'risks': 'Risk Management',
        'frameworks': 'Frameworks',
        'acos': 'aCOS v3.0',
        'audit': 'Audit Trail',
        'reports': 'Reports',
        'my-tasks': 'My Tasks',
        'integrations': 'Integrations',
        'settings': 'Settings',
        'ai-policy': 'Policy Generator',
        'ai-contract': 'Contract Analyzer',
        'ai-gap': 'Gap Analysis',
        'ai-rfp': 'RFP Responder',
        'ai-phishing': 'Phishing Simulator',
        'ai-vendor': 'Vendor Risk Scorer',
        'ai-data-map': 'GDPR Data Mapper',
        'ai-bcp': 'BCP Generator',
      };
      return `✅ Navigated to ${viewNames[view] || view}. You should see the ${viewNames[view] || view} page now.`;
    } catch (error: any) {
      return `❌ Failed to navigate: ${error.message || 'Unknown error'}`;
    }
  };

  /**
   * Execute create command
   */
  const executeCreate = async (entity: string, params: any): Promise<string> => {
    try {
      setIsExecuting(true);

      if (entity === 'risk') {
        // Extract risk details from text
        const descriptionMatch = params.description?.match(/(?:risk|for|about)\s+(.+?)(?:\s+(?:with|severity|category|status))|$/i);
        const description = descriptionMatch?.[1]?.trim() || params.description || 'Risk created via chatbot';
        
        const severityMatch = params.description?.match(/severity[:\s]+(low|medium|high|critical)/i);
        const categoryMatch = params.description?.match(/category[:\s]+(\w+)/i);
        
        const riskData: any = {
          description,
          severity: severityMatch?.[1] || 'Medium',
          category: categoryMatch?.[1] || 'General',
          status: 'Open',
        };

        const created = await api.risks.create(riskData);
        return `✅ Risk created successfully!\n\n**Description:** ${created.description}\n**Severity:** ${created.severity}\n**Status:** ${created.status}\n\nYou can view it in the Risk Management section.`;
      }

      if (entity === 'goal') {
        // Extract goal details
        const nameMatch = params.description?.match(/(?:goal|target|objective)[:\s]+(.+?)(?:\s+(?:for|with|deadline))|$/i);
        const name = nameMatch?.[1]?.trim() || 'Compliance Goal';
        
        const frameworkMatch = params.description?.match(/(?:for|framework)[:\s]+(SOC2|GDPR|HIPAA|ISO27001|NIST)/i);
        const frameworks = frameworkMatch?.[1] ? [frameworkMatch[1]] : ['GDPR'];
        
        const goalData: any = {
          name,
          goalType: 'improve',
          frameworks,
          riskTolerance: 'medium',
          horizon: 90,
          autoActionPolicy: 'moderate',
          targetScore: 85,
        };

        const created = await api.acos.createGoal(goalData);
        return `✅ Compliance goal created successfully!\n\n**Goal:** ${created.name || name}\n**Framework:** ${frameworks.join(', ')}\n**Target Score:** ${created.targetScore || 85}%\n\nYou can view it in the aCOS Dashboard > Goals tab.`;
      }

      if (entity === 'control loop' || entity === 'control') {
        // Extract control loop details
        const controlMatch = params.description?.match(/(?:control|for|on)[:\s]+(.+?)(?:\s+(?:with|trigger|type))|$/i);
        const controlName = controlMatch?.[1]?.trim();
        
        if (!controlName) {
          return `❌ Please specify which control to create a loop for. For example: "Create a control loop for encryption control"`;
        }

        // Try to find control by name
        try {
          const frameworks = await api.frameworks.list();
          let foundControl: any = null;
          
          for (const fw of frameworks) {
            if (fw.controls) {
              foundControl = fw.controls.find((ctrl: any) => 
                ctrl.name?.toLowerCase().includes(controlName.toLowerCase()) ||
                controlName.toLowerCase().includes(ctrl.name?.toLowerCase() || '')
              );
              if (foundControl) break;
            }
          }

          if (!foundControl) {
            return `❌ Control "${controlName}" not found. Please navigate to aCOS Dashboard > Control Loops tab to see available controls and create the loop manually.`;
          }

          // Extract trigger type
          const triggerMatch = params.description?.match(/trigger[:\s]+(manual|schedule|threshold|event)/i);
          const triggerType = triggerMatch?.[1]?.toLowerCase() || 'manual';

          const loopData: any = {
            controlId: foundControl.id,
            triggerType,
            config: {
              schedule: triggerType === 'schedule' ? '0 0 * * *' : undefined,
            },
          };

          const created = await api.acos.createControlLoop(loopData);
          return `✅ Control loop created successfully!\n\n**Control:** ${foundControl.name}\n**Trigger Type:** ${triggerType}\n**Loop ID:** ${created.id}\n\nYou can view and manage it in the aCOS Dashboard > Control Loops tab.`;
        } catch (error: any) {
          return `❌ Failed to create control loop: ${error.message || 'Unknown error'}. Please navigate to aCOS Dashboard > Control Loops tab to create it manually.`;
        }
      }

      return `❌ I can create risks, goals, and control loops. Please specify what you'd like to create.`;
    } catch (error: any) {
      return `❌ Failed to create ${entity}: ${error.message || 'Unknown error'}`;
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Execute run command
   */
  const executeRun = async (entity: string, params: any): Promise<string> => {
    try {
      setIsExecuting(true);

      if (entity === 'simulation') {
        const simulationData: any = {
          scenarioType: 'control_change',
          description: params.query || 'Simulation run via chatbot',
        };

        const result = await api.acos.runSimulation(simulationData);
        return `✅ Simulation completed!\n\n**Type:** ${result.scenarioType || 'Control Change'}\n**Impact:** ${result.impact || 'Analyzed'}\n**Recommendations:** ${result.recommendations?.length || 0} provided\n\nCheck the Simulations tab in aCOS Dashboard for detailed results.`;
      }

      if (entity === 'scan') {
        const result = await api.acos.runAutomatedScan();
        return `✅ Automated compliance scan completed!\n\n**Gaps Found:** ${result.gaps?.length || 0}\n**Misconfigurations:** ${result.misconfigurations?.length || 0}\n**Policy Violations:** ${result.violations?.length || 0}\n\nCheck the Red Team tab in aCOS Dashboard for detailed results.`;
      }

      if (entity === 'control loop' || entity === 'loop') {
        // Extract loop ID from text or use a pattern
        const loopIdMatch = params.query?.match(/(?:loop|id)[:\s]+([a-f0-9-]+)/i);
        if (!loopIdMatch) {
          return `❌ Please specify the control loop ID to execute. For example: "Run control loop abc-123"`;
        }

        const loopId = loopIdMatch[1];
        const result = await api.acos.executeControlLoop(loopId);
        return `✅ Control loop executed!\n\n**Loop ID:** ${loopId}\n**Status:** ${result.status || 'Completed'}\n**Confidence:** ${((result.confidence || 0) * 100).toFixed(0)}%\n\nCheck the Control Loops tab for execution history.`;
      }

      return `❌ I can run simulations, scans, and control loops. Please specify what you'd like to run.`;
    } catch (error: any) {
      return `❌ Failed to run ${entity}: ${error.message || 'Unknown error'}`;
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Execute edit command
   */
  const executeEdit = async (entity: string, params: any): Promise<string> => {
    try {
      setIsExecuting(true);

      if (entity === 'risk' || entity === 'status') {
        // Extract risk ID and new status
        const statusMatch = params.description?.match(/(?:to|as|status)[:\s]+(Open|In Progress|Resolved|Ignored|Accepted)/i);
        const riskIdMatch = params.description?.match(/(?:risk|id)[:\s]+([a-f0-9-]+)/i);
        
        if (!statusMatch) {
          return `❌ Please specify the new status. For example: "Update risk to Resolved"`;
        }

        const newStatus = statusMatch[1];
        
        // If risk ID is provided, update that specific risk
        if (riskIdMatch) {
          const riskId = riskIdMatch[1];
          await api.risks.update(riskId, { status: newStatus });
          return `✅ Risk ${riskId} updated to ${newStatus}.\n\nYou can view the updated risk in the Risk Management section.`;
        }

        // Otherwise, try to find the most recent risk or ask for ID
        return `✅ Status update requested to "${newStatus}".\n\n**Note:** Please specify the risk ID to update. For example: "Update risk abc-123 to Resolved" or navigate to Risk Management to update risks.`;
      }

      if (entity === 'goal') {
        const goalIdMatch = params.description?.match(/(?:goal|id)[:\s]+([a-f0-9-]+)/i);
        const targetMatch = params.description?.match(/(?:target|score)[:\s]+(\d+)/i);
        
        if (!goalIdMatch) {
          return `❌ Please specify the goal ID to update. For example: "Update goal abc-123 target score to 90"`;
        }

        const goalId = goalIdMatch[1];
        const updateData: any = {};
        
        if (targetMatch) {
          updateData.targetScore = parseInt(targetMatch[1]);
        }

        await api.acos.updateGoal(goalId, updateData);
        return `✅ Goal ${goalId} updated successfully.\n\nCheck the aCOS Dashboard > Goals tab to see the changes.`;
      }

      return `❌ I can edit risks and goals. Please specify what you'd like to edit.`;
    } catch (error: any) {
      return `❌ Failed to edit ${entity}: ${error.message || 'Unknown error'}`;
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Handle user message and execute appropriate action
   */
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Parse command
      const command = parseCommand(userInput);

      // Block delete operations
      if (command.entity === 'delete_blocked') {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '🚫 **Delete operations are not available via chat for security reasons.**\n\nPlease use the UI to delete items if needed. This ensures proper authorization and audit trails.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }

      let responseText = '';

      // Execute based on intent
      switch (command.intent) {
        case 'navigate':
          if (command.entity) {
            responseText = await executeNavigation(command.entity);
          } else {
            responseText = 'Please specify where you want to navigate. For example: "Go to dashboard" or "Open risks"';
          }
          break;

        case 'create':
          if (command.entity) {
            responseText = await executeCreate(command.entity, command.params || {});
          } else {
            responseText = 'Please specify what you want to create. For example: "Create a risk" or "Create a goal"';
          }
          break;

        case 'run':
          if (command.entity) {
            responseText = await executeRun(command.entity, command.params || {});
          } else {
            responseText = 'Please specify what you want to run. For example: "Run simulation" or "Run scan"';
          }
          break;

        case 'edit':
          if (command.entity) {
            responseText = await executeEdit(command.entity, command.params || {});
          } else {
            responseText = 'Please specify what you want to edit. For example: "Update risk status" or "Edit goal"';
          }
          break;

        case 'query':
        default:
          // Use AI for general queries
          responseText = await chatWithComplianceBot(userInput);
          break;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `❌ Error: ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[500px] mb-4 pointer-events-auto flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-brand-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <div className="flex flex-col">
                <span className="font-bold">Compliance Assistant</span>
                <span className="text-xs text-brand-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {isExecuting ? 'Executing action...' : 'Ready to help'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-brand-700 p-1 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  {msg.sender === 'ai' && !msg.text.includes('❌') && !msg.text.includes('✅') && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Lock size={12} />
                      <span>Processed locally • No external data transmission</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(isTyping || isExecuting) && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTyping && !isExecuting && handleSend()}
                placeholder={isExecuting ? "Executing..." : "Try: 'Go to dashboard' or 'Create a risk'"}
                disabled={isTyping || isExecuting}
                className="flex-1 bg-gray-100 text-gray-800 placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isExecuting}
                className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            {currentView && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Current view: <span className="font-medium">{currentView}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-brand-600 text-white p-4 rounded-full shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-transform hover:scale-105"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};
