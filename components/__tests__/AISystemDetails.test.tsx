import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

const { mockSystem } = vi.hoisted(() => {
  const mockSystem = {
  id: 'sys-1',
  name: 'Test AI System',
  description: 'A machine learning system',
  status: 'Deployed',
  systemType: 'Machine Learning',
  useCase: 'Risk prediction',
  deploymentContext: 'Cloud',
  lifecycleStage: 'Deploy_and_Operate',
  autonomyLevel: 'Human_in_Loop',
  riskLevel: 'Medium',
  overallTrustworthinessScore: 85,
  trustworthinessCharacteristics: [
    { id: 'tw-1', characteristic: 'Valid_and_Reliable', description: 'The system is valid', score: 80, assessmentNotes: 'Good' },
    { id: 'tw-2', characteristic: 'Safe', description: 'The system is safe', score: 70, assessmentNotes: '' },
  ],
  coreFunctions: [
    {
      id: 'cf-1', functionName: 'GOVERN', description: 'Governance function', completionPercent: 60,
      categories: [
        {
          id: 'cat-1', categoryId: 'GV.1', name: 'Governance Policies', description: 'Policies desc', completionPercent: 50,
          subcategories: [
            { id: 'sub-1', subcategoryId: 'GV.1.1', name: 'Policy Definition', description: 'Define policies', status: 'In_Progress', evidence: '', notes: '' },
          ],
        },
      ],
    },
    { id: 'cf-2', functionName: 'MAP', description: 'Mapping function', completionPercent: 40, categories: [] },
    { id: 'cf-3', functionName: 'MEASURE', description: 'Measure function', completionPercent: 30, categories: [] },
    { id: 'cf-4', functionName: 'MANAGE', description: 'Manage function', completionPercent: 20, categories: [] },
  ],
  lifecycleStages: [
    { id: 'ls-1', stage: 'Plan_and_Design', status: 'Completed', startDate: '2025-01-01', completionDate: '2025-03-01', notes: 'Planning done' },
    { id: 'ls-2', stage: 'Collect_and_Process', status: 'In_Progress', startDate: '2025-03-15', completionDate: null, notes: '' },
    { id: 'ls-3', stage: 'Build_and_Validate', status: 'Not_Started', startDate: null, completionDate: null, notes: '' },
    { id: 'ls-4', stage: 'Deploy_and_Operate', status: 'Not_Started', startDate: null, completionDate: null, notes: '' },
    { id: 'ls-5', stage: 'Monitor_and_Maintain', status: 'Not_Started', startDate: null, completionDate: null, notes: '' },
  ],
  riskActivities: [
    { id: 'ra-1', activityType: 'Risk_Identification', relatedFunction: 'GOVERN', description: 'Identified data risk', riskLevel: 'High', status: 'Open', mitigationPlan: 'Encrypt data', targetDate: '2026-06-01', owner: { name: 'John' }, ownerId: 'u1' },
    { id: 'ra-2', activityType: 'Risk_Assessment', relatedFunction: 'MAP', description: 'Assessed bias risk', riskLevel: 'Medium', status: 'In_Progress', mitigationPlan: '', targetDate: null, owner: null, ownerId: null },
  ],
  actors: [
    { id: 'ac-1', name: 'Data Scientist', role: 'Model Developer', actorType: 'Developer', user: { name: 'Alice', email: 'alice@test.com' }, responsibilities: ['Model training', 'Testing'], involvementStages: ['Build_and_Validate'] },
    { id: 'ac-2', name: 'Compliance Officer', role: 'Reviewer', actorType: 'Reviewer', user: null, responsibilities: [], involvementStages: [] },
  ],
};
  return { mockSystem };
});

vi.mock('@/services/api', () => ({
  api: {
    aiRmf: {
      getAISystemById: vi.fn().mockResolvedValue(mockSystem),
      updateAISystem: vi.fn().mockResolvedValue({}),
      updateSubcategory: vi.fn().mockResolvedValue({}),
      updateTrustworthinessCharacteristic: vi.fn().mockResolvedValue({}),
      calculateTrustworthinessScore: vi.fn().mockResolvedValue({ score: 90 }),
      getAssessments: vi.fn().mockResolvedValue([
        {
          id: 'assess-1', assessmentType: 'Pre_Deployment', assessmentDate: '2026-01-15',
          overallScore: 75, assessedBy: 'u1', assessedByUser: { name: 'Test User', email: 'test@test.com' },
          functionScores: { GOVERN: 80, MAP: 70, MEASURE: 75, MANAGE: 75 },
          recommendations: ['Improve MAP scores', 'Add more evidence'],
        },
      ]),
      createAssessment: vi.fn().mockResolvedValue({ id: 'new-assess' }),
      deleteAssessment: vi.fn().mockResolvedValue({}),
      updateLifecycleStage: vi.fn().mockResolvedValue({}),
      createRiskActivity: vi.fn().mockResolvedValue({ id: 'new-ra' }),
      updateRiskActivity: vi.fn().mockResolvedValue({}),
      addActor: vi.fn().mockResolvedValue({ id: 'new-ac' }),
      removeActor: vi.fn().mockResolvedValue({}),
    },
    team: { list: vi.fn().mockResolvedValue([{ id: 'u1', name: 'Test User', email: 'test@test.com' }]) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/components/AISystemDetails_Modals', () => ({
  CreateRiskActivityModal: ({ onClose }: any) => (
    <div data-testid="create-risk-activity-modal">
      <button onClick={onClose}>Close Risk Modal</button>
    </div>
  ),
  CreateActorModal: ({ onClose }: any) => (
    <div data-testid="create-actor-modal">
      <button onClick={onClose}>Close Actor Modal</button>
    </div>
  ),
  EditRiskActivityModal: ({ onClose }: any) => (
    <div data-testid="edit-risk-activity-modal">
      <button onClick={onClose}>Close Edit Modal</button>
    </div>
  ),
}));

import { AISystemDetails } from '@/components/AISystemDetails';

describe('AISystemDetails', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Loading State ----

  it('shows loading spinner initially', () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ---- System Not Found ----

  it('shows "AI System not found" when system is null', async () => {
    const { api } = await import('@/services/api');
    (api.aiRmf.getAISystemById as any).mockResolvedValueOnce(null);
    render(<AISystemDetails systemId="nonexistent" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('AI System not found')).toBeInTheDocument();
    });
  });

  it('shows Go Back button when system not found and calls onBack', async () => {
    const { api } = await import('@/services/api');
    (api.aiRmf.getAISystemById as any).mockResolvedValueOnce(null);
    render(<AISystemDetails systemId="nonexistent" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  // ---- Successful Load ----

  it('renders system name and type after loading', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test AI System')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    });
  });

  it('displays trustworthiness score in header', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Trustworthiness Score')).toBeInTheDocument();
    });
  });

  it('displays status badge', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Deployed')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test AI System')).toBeInTheDocument();
    });
    const backButton = screen.getByTestId('icon-ArrowLeft').closest('button');
    if (backButton) fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('fetches system details on mount', async () => {
    const { api } = await import('@/services/api');
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(api.aiRmf.getAISystemById).toHaveBeenCalledWith('sys-1');
    });
  });

  // ---- Tab Navigation ----

  it('displays all tab buttons', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Core Functions')).toBeInTheDocument();
      expect(screen.getByText('Trustworthiness')).toBeInTheDocument();
      expect(screen.getByText('Lifecycle')).toBeInTheDocument();
      expect(screen.getByText('Assessments')).toBeInTheDocument();
      expect(screen.getByText('Risk Activities')).toBeInTheDocument();
      expect(screen.getByText('Actors')).toBeInTheDocument();
    });
  });

  it('defaults to Overview tab', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('System Information')).toBeInTheDocument();
    });
  });

  // ---- Overview Tab ----

  it('shows all editable fields on overview tab', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('System Type')).toBeInTheDocument();
      expect(screen.getByText('Use Case')).toBeInTheDocument();
    });
  });

  it('shows field values from system data', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('A machine learning system')).toBeInTheDocument();
      expect(screen.getByText('Risk prediction')).toBeInTheDocument();
      expect(screen.getByText('Cloud')).toBeInTheDocument();
    });
  });

  it('enters edit mode when Edit icon is clicked on a field', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test AI System')).toBeInTheDocument();
    });
    // Click the first Edit icon (for the Name field)
    const editIcons = screen.getAllByTestId('icon-Edit');
    fireEvent.click(editIcons[0]);
    // Now we should see Save and X icons for the editing state
    expect(screen.getByTestId('icon-Save')).toBeInTheDocument();
  });

  it('saves field update when Save is clicked', async () => {
    const { api } = await import('@/services/api');
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test AI System')).toBeInTheDocument();
    });
    const editIcons = screen.getAllByTestId('icon-Edit');
    fireEvent.click(editIcons[0]);
    const saveButton = screen.getByTestId('icon-Save').closest('button');
    if (saveButton) fireEvent.click(saveButton);
    await waitFor(() => {
      expect(api.aiRmf.updateAISystem).toHaveBeenCalled();
    });
  });

  it('cancels edit when X is clicked', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Test AI System')).toBeInTheDocument();
    });
    const editIcons = screen.getAllByTestId('icon-Edit');
    fireEvent.click(editIcons[0]);
    // Find the cancel X button in the edit row (not the tab X)
    const cancelButtons = screen.getAllByTestId('icon-X');
    const cancelButton = cancelButtons[cancelButtons.length - 1].closest('button');
    if (cancelButton) fireEvent.click(cancelButton);
    // Should return to view mode - no Save icon visible
    expect(screen.queryByTestId('icon-Save')).not.toBeInTheDocument();
  });

  // ---- Core Functions Tab ----

  it('switches to Core Functions tab', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Core Functions')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Core Functions'));
    await waitFor(() => {
      expect(screen.getByText('GOVERN')).toBeInTheDocument();
      expect(screen.getByText('MAP')).toBeInTheDocument();
      expect(screen.getByText('MEASURE')).toBeInTheDocument();
      expect(screen.getByText('MANAGE')).toBeInTheDocument();
    });
  });

  it('shows completion percentages for core functions', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Core Functions'));
    fireEvent.click(screen.getByText('Core Functions'));
    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });

  it('expands core function to show categories', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Core Functions'));
    fireEvent.click(screen.getByText('Core Functions'));
    await waitFor(() => {
      expect(screen.getByText('GOVERN')).toBeInTheDocument();
    });
    // Click on GOVERN to expand it
    fireEvent.click(screen.getByText('GOVERN'));
    await waitFor(() => {
      expect(screen.getByText(/GV.1.*Governance Policies/)).toBeInTheDocument();
    });
  });

  // ---- Trustworthiness Tab ----

  it('switches to Trustworthiness tab and shows characteristics', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Trustworthiness'));
    fireEvent.click(screen.getByText('Trustworthiness'));
    await waitFor(() => {
      expect(screen.getByText('Trustworthiness Characteristics')).toBeInTheDocument();
      expect(screen.getByText('Valid and Reliable')).toBeInTheDocument();
      expect(screen.getByText('Safe')).toBeInTheDocument();
    });
  });

  it('shows Calculate Score button on Trustworthiness tab', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Trustworthiness'));
    fireEvent.click(screen.getByText('Trustworthiness'));
    await waitFor(() => {
      expect(screen.getByText('Calculate Score')).toBeInTheDocument();
    });
  });

  it('calls calculateTrustworthinessScore when Calculate Score is clicked', async () => {
    const { api } = await import('@/services/api');
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Trustworthiness'));
    fireEvent.click(screen.getByText('Trustworthiness'));
    await waitFor(() => screen.getByText('Calculate Score'));
    fireEvent.click(screen.getByText('Calculate Score'));
    await waitFor(() => {
      expect(api.aiRmf.calculateTrustworthinessScore).toHaveBeenCalledWith('sys-1');
    });
  });

  // ---- Lifecycle Tab ----

  it('switches to Lifecycle tab and shows stages', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Lifecycle'));
    fireEvent.click(screen.getByText('Lifecycle'));
    await waitFor(() => {
      expect(screen.getByText('Lifecycle Stages')).toBeInTheDocument();
      expect(screen.getByText('Plan and Design')).toBeInTheDocument();
      expect(screen.getByText('Collect and Process')).toBeInTheDocument();
    });
  });

  it('shows lifecycle stage status badges', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Lifecycle'));
    fireEvent.click(screen.getByText('Lifecycle'));
    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('shows lifecycle stage dates and notes', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Lifecycle'));
    fireEvent.click(screen.getByText('Lifecycle'));
    await waitFor(() => {
      expect(screen.getByText('Planning done')).toBeInTheDocument();
    });
  });

  it('enters edit mode for lifecycle stage', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Lifecycle'));
    fireEvent.click(screen.getByText('Lifecycle'));
    await waitFor(() => {
      expect(screen.getByText('Plan and Design')).toBeInTheDocument();
    });
    // Click first edit icon
    const editIcons = screen.getAllByTestId('icon-Edit');
    fireEvent.click(editIcons[0]);
    // Should see Save and Cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  // ---- Assessments Tab ----

  it('switches to Assessments tab and loads assessments', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Assessments'));
    fireEvent.click(screen.getByText('Assessments'));
    await waitFor(() => {
      expect(screen.getByText('New Assessment')).toBeInTheDocument();
      expect(screen.getByText('Pre Deployment')).toBeInTheDocument();
    });
  });

  it('shows assessment scores and details', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Assessments'));
    fireEvent.click(screen.getByText('Assessments'));
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('shows assessment recommendations', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Assessments'));
    fireEvent.click(screen.getByText('Assessments'));
    await waitFor(() => {
      expect(screen.getByText('Improve MAP scores')).toBeInTheDocument();
      expect(screen.getByText('Add more evidence')).toBeInTheDocument();
    });
  });

  it('shows empty state for assessments when none exist', async () => {
    const { api } = await import('@/services/api');
    (api.aiRmf.getAssessments as any).mockResolvedValueOnce([]);
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Assessments'));
    fireEvent.click(screen.getByText('Assessments'));
    await waitFor(() => {
      expect(screen.getByText('No assessments yet')).toBeInTheDocument();
    });
  });

  // ---- Risk Activities Tab ----

  it('switches to Risk Activities tab', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Risk Activities'));
    fireEvent.click(screen.getByText('Risk Activities'));
    await waitFor(() => {
      expect(screen.getByText('New Risk Activity')).toBeInTheDocument();
      expect(screen.getByText('Risk Identification')).toBeInTheDocument();
    });
  });

  it('shows risk activity details including mitigation plan', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Risk Activities'));
    fireEvent.click(screen.getByText('Risk Activities'));
    await waitFor(() => {
      expect(screen.getByText('Identified data risk')).toBeInTheDocument();
      expect(screen.getByText('Encrypt data')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('opens create risk activity modal', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Risk Activities'));
    fireEvent.click(screen.getByText('Risk Activities'));
    await waitFor(() => screen.getByText('New Risk Activity'));
    fireEvent.click(screen.getByText('New Risk Activity'));
    expect(screen.getByTestId('create-risk-activity-modal')).toBeInTheDocument();
  });

  it('shows empty state when no risk activities', async () => {
    const { api } = await import('@/services/api');
    const emptySystem = { ...mockSystem, riskActivities: [] };
    (api.aiRmf.getAISystemById as any).mockResolvedValue(emptySystem);
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Risk Activities'));
    fireEvent.click(screen.getByText('Risk Activities'));
    await waitFor(() => {
      expect(screen.getByText('No risk activities yet')).toBeInTheDocument();
    });
    // Reset mock
    (api.aiRmf.getAISystemById as any).mockResolvedValue(mockSystem);
  });

  // ---- Actors Tab ----

  it('switches to Actors tab and shows actors', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => {
      expect(screen.getByText('AI Actors')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.getByText('Compliance Officer')).toBeInTheDocument();
    });
  });

  it('shows actor details including responsibilities', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => {
      expect(screen.getByText('Model training')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });
  });

  it('shows actor involvement stages', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => {
      expect(screen.getByText('Build and Validate')).toBeInTheDocument();
    });
  });

  it('shows Add Actor button', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => {
      expect(screen.getByText('Add Actor')).toBeInTheDocument();
    });
  });

  it('opens create actor modal', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => screen.getByText('Add Actor'));
    fireEvent.click(screen.getByText('Add Actor'));
    expect(screen.getByTestId('create-actor-modal')).toBeInTheDocument();
  });

  it('shows empty state when no actors', async () => {
    const { api } = await import('@/services/api');
    const emptySystem = { ...mockSystem, actors: [] };
    (api.aiRmf.getAISystemById as any).mockResolvedValue(emptySystem);
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => screen.getByText('Actors'));
    fireEvent.click(screen.getByText('Actors'));
    await waitFor(() => {
      expect(screen.getByText('No actors defined yet')).toBeInTheDocument();
    });
    (api.aiRmf.getAISystemById as any).mockResolvedValue(mockSystem);
  });

  // ---- Status badges ----

  it('renders Deployed status badge with green styling', async () => {
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      const badge = screen.getByText('Deployed');
      expect(badge.closest('span')).toHaveClass('bg-green-100');
    });
  });

  it('renders In Development status badge correctly', async () => {
    const { api } = await import('@/services/api');
    const devSystem = { ...mockSystem, status: 'In_Development' };
    (api.aiRmf.getAISystemById as any).mockResolvedValueOnce(devSystem);
    render(<AISystemDetails systemId="sys-1" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('In Development')).toBeInTheDocument();
    });
  });
});
