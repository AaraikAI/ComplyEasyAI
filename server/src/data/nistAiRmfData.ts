/**
 * Comprehensive NIST AI RMF 1.0 Data Structure
 * Based on NIST AI 100-1: Artificial Intelligence Risk Management Framework
 * 
 * This file contains the complete structure of all core functions,
 * categories, and subcategories as defined in the NIST AI RMF 1.0 document.
 */

export interface NISTCategory {
  id: string;
  name: string;
  description: string;
  subcategories: NISTSubcategory[];
}

export interface NISTSubcategory {
  id: string;
  name: string;
  description: string;
}

export interface NISTCoreFunction {
  functionName: string;
  description: string;
  categories: NISTCategory[];
}

/**
 * Complete NIST AI RMF 1.0 Structure
 */
export const NIST_AI_RMF_DATA: Record<string, NISTCoreFunction> = {
  GOVERN: {
    functionName: 'GOVERN',
    description: 'Develop organizational culture and structure to manage AI risks',
    categories: [
      {
        id: 'GOV-1',
        name: 'Governance Structures',
        description: 'Establish governance structures to manage AI risks',
        subcategories: [
          {
            id: 'GOV-1.1',
            name: 'AI Risk Management Governance',
            description: 'Establish governance structures and processes for managing AI risks across the organization'
          },
          {
            id: 'GOV-1.2',
            name: 'Roles and Responsibilities',
            description: 'Define and assign roles and responsibilities for AI risk management'
          },
          {
            id: 'GOV-1.3',
            name: 'Decision-Making Authority',
            description: 'Establish clear decision-making authority for AI risk management activities'
          },
          {
            id: 'GOV-1.4',
            name: 'Organizational Culture',
            description: 'Foster an organizational culture that supports responsible AI development and use'
          }
        ]
      },
      {
        id: 'GOV-2',
        name: 'Policies and Procedures',
        description: 'Develop and implement policies and procedures for AI risk management',
        subcategories: [
          {
            id: 'GOV-2.1',
            name: 'AI Risk Management Policy',
            description: 'Develop and maintain an AI risk management policy'
          },
          {
            id: 'GOV-2.2',
            name: 'Procedures and Guidelines',
            description: 'Establish procedures and guidelines for implementing the AI risk management policy'
          },
          {
            id: 'GOV-2.3',
            name: 'Documentation Requirements',
            description: 'Define documentation requirements for AI risk management activities'
          },
          {
            id: 'GOV-2.4',
            name: 'Policy Review and Updates',
            description: 'Establish processes for reviewing and updating AI risk management policies'
          }
        ]
      },
      {
        id: 'GOV-3',
        name: 'Risk Management Culture',
        description: 'Foster a risk management culture throughout the organization',
        subcategories: [
          {
            id: 'GOV-3.1',
            name: 'Awareness and Training',
            description: 'Provide awareness and training on AI risks and risk management practices'
          },
          {
            id: 'GOV-3.2',
            name: 'Communication',
            description: 'Establish effective communication channels for AI risk management'
          },
          {
            id: 'GOV-3.3',
            name: 'Incentives and Accountability',
            description: 'Establish incentives and accountability mechanisms for AI risk management'
          },
          {
            id: 'GOV-3.4',
            name: 'Continuous Improvement',
            description: 'Promote continuous improvement in AI risk management practices'
          }
        ]
      },
      {
        id: 'GOV-4',
        name: 'Accountability and Transparency',
        description: 'Ensure accountability and transparency in AI risk management',
        subcategories: [
          {
            id: 'GOV-4.1',
            name: 'Accountability Framework',
            description: 'Establish an accountability framework for AI risk management'
          },
          {
            id: 'GOV-4.2',
            name: 'Transparency Requirements',
            description: 'Define transparency requirements for AI systems and risk management activities'
          },
          {
            id: 'GOV-4.3',
            name: 'Stakeholder Engagement',
            description: 'Engage stakeholders in AI risk management activities'
          },
          {
            id: 'GOV-4.4',
            name: 'External Reporting',
            description: 'Establish processes for external reporting on AI risk management'
          }
        ]
      }
    ]
  },
  MAP: {
    functionName: 'MAP',
    description: 'Understand context and characterize risks',
    categories: [
      {
        id: 'MAP-1',
        name: 'Context Mapping',
        description: 'Map the context in which the AI system operates',
        subcategories: [
          {
            id: 'MAP-1.1',
            name: 'System Context',
            description: 'Document the context in which the AI system will operate'
          },
          {
            id: 'MAP-1.2',
            name: 'Use Case Analysis',
            description: 'Analyze the intended use cases for the AI system'
          },
          {
            id: 'MAP-1.3',
            name: 'Stakeholder Identification',
            description: 'Identify stakeholders who may be affected by the AI system'
          },
          {
            id: 'MAP-1.4',
            name: 'Operational Environment',
            description: 'Document the operational environment and deployment context'
          },
          {
            id: 'MAP-1.5',
            name: 'Legal and Regulatory Context',
            description: 'Identify applicable legal and regulatory requirements'
          }
        ]
      },
      {
        id: 'MAP-2',
        name: 'Risk Identification',
        description: 'Identify potential risks associated with the AI system',
        subcategories: [
          {
            id: 'MAP-2.1',
            name: 'Risk Sources',
            description: 'Identify sources of risk for the AI system'
          },
          {
            id: 'MAP-2.2',
            name: 'Risk Scenarios',
            description: 'Develop risk scenarios for the AI system'
          },
          {
            id: 'MAP-2.3',
            name: 'Threat Modeling',
            description: 'Conduct threat modeling for the AI system'
          },
          {
            id: 'MAP-2.4',
            name: 'Vulnerability Assessment',
            description: 'Assess vulnerabilities in the AI system'
          },
          {
            id: 'MAP-2.5',
            name: 'Bias and Fairness Risks',
            description: 'Identify risks related to bias and fairness'
          }
        ]
      },
      {
        id: 'MAP-3',
        name: 'Risk Characterization',
        description: 'Characterize identified risks',
        subcategories: [
          {
            id: 'MAP-3.1',
            name: 'Risk Description',
            description: 'Describe identified risks in detail'
          },
          {
            id: 'MAP-3.2',
            name: 'Risk Categorization',
            description: 'Categorize risks by type and characteristics'
          },
          {
            id: 'MAP-3.3',
            name: 'Impact Assessment',
            description: 'Assess the potential impact of identified risks'
          },
          {
            id: 'MAP-3.4',
            name: 'Likelihood Assessment',
            description: 'Assess the likelihood of risk occurrence'
          },
          {
            id: 'MAP-3.5',
            name: 'Risk Relationships',
            description: 'Identify relationships between different risks'
          }
        ]
      },
      {
        id: 'MAP-4',
        name: 'Data and Model Documentation',
        description: 'Document data and model characteristics',
        subcategories: [
          {
            id: 'MAP-4.1',
            name: 'Data Documentation',
            description: 'Document data sources, collection methods, and characteristics'
          },
          {
            id: 'MAP-4.2',
            name: 'Model Documentation',
            description: 'Document model architecture, training, and performance characteristics'
          },
          {
            id: 'MAP-4.3',
            name: 'Data Quality Assessment',
            description: 'Assess and document data quality'
          },
          {
            id: 'MAP-4.4',
            name: 'Model Limitations',
            description: 'Document model limitations and assumptions'
          }
        ]
      }
    ]
  },
  MEASURE: {
    functionName: 'MEASURE',
    description: 'Quantify, benchmark, and monitor risks',
    categories: [
      {
        id: 'MEAS-1',
        name: 'Metrics and Measurement',
        description: 'Establish metrics and measurement approaches for AI risks',
        subcategories: [
          {
            id: 'MEAS-1.1',
            name: 'Risk Metrics',
            description: 'Define metrics for measuring AI risks'
          },
          {
            id: 'MEAS-1.2',
            name: 'Performance Metrics',
            description: 'Define metrics for measuring AI system performance'
          },
          {
            id: 'MEAS-1.3',
            name: 'Trustworthiness Metrics',
            description: 'Define metrics for measuring AI system trustworthiness'
          },
          {
            id: 'MEAS-1.4',
            name: 'Measurement Methods',
            description: 'Establish methods for measuring defined metrics'
          },
          {
            id: 'MEAS-1.5',
            name: 'Measurement Tools',
            description: 'Select and implement tools for measurement'
          }
        ]
      },
      {
        id: 'MEAS-2',
        name: 'Benchmarking',
        description: 'Benchmark AI system performance and risks',
        subcategories: [
          {
            id: 'MEAS-2.1',
            name: 'Baseline Establishment',
            description: 'Establish baselines for AI system performance and risks'
          },
          {
            id: 'MEAS-2.2',
            name: 'Comparative Analysis',
            description: 'Compare AI system performance against benchmarks'
          },
          {
            id: 'MEAS-2.3',
            name: 'Industry Standards',
            description: 'Compare against industry standards and best practices'
          },
          {
            id: 'MEAS-2.4',
            name: 'Historical Comparison',
            description: 'Compare current performance against historical data'
          }
        ]
      },
      {
        id: 'MEAS-3',
        name: 'Testing and Evaluation',
        description: 'Test and evaluate AI systems',
        subcategories: [
          {
            id: 'MEAS-3.1',
            name: 'Test Planning',
            description: 'Develop test plans for AI systems'
          },
          {
            id: 'MEAS-3.2',
            name: 'Test Execution',
            description: 'Execute tests according to test plans'
          },
          {
            id: 'MEAS-3.3',
            name: 'Evaluation Methods',
            description: 'Apply evaluation methods to assess AI system performance'
          },
          {
            id: 'MEAS-3.4',
            name: 'Test Results Documentation',
            description: 'Document test results and findings'
          },
          {
            id: 'MEAS-3.5',
            name: 'Adversarial Testing',
            description: 'Conduct adversarial testing to identify vulnerabilities'
          }
        ]
      },
      {
        id: 'MEAS-4',
        name: 'Monitoring',
        description: 'Monitor AI systems continuously',
        subcategories: [
          {
            id: 'MEAS-4.1',
            name: 'Monitoring Strategy',
            description: 'Develop a monitoring strategy for AI systems'
          },
          {
            id: 'MEAS-4.2',
            name: 'Real-Time Monitoring',
            description: 'Implement real-time monitoring of AI systems'
          },
          {
            id: 'MEAS-4.3',
            name: 'Performance Monitoring',
            description: 'Monitor AI system performance metrics'
          },
          {
            id: 'MEAS-4.4',
            name: 'Risk Monitoring',
            description: 'Monitor AI system risks continuously'
          },
          {
            id: 'MEAS-4.5',
            name: 'Anomaly Detection',
            description: 'Implement anomaly detection for AI systems'
          }
        ]
      }
    ]
  },
  MANAGE: {
    functionName: 'MANAGE',
    description: 'Prioritize and respond to risks',
    categories: [
      {
        id: 'MAN-1',
        name: 'Risk Prioritization',
        description: 'Prioritize AI risks based on impact and likelihood',
        subcategories: [
          {
            id: 'MAN-1.1',
            name: 'Risk Ranking',
            description: 'Rank risks based on impact and likelihood'
          },
          {
            id: 'MAN-1.2',
            name: 'Risk Matrix',
            description: 'Use risk matrices to prioritize risks'
          },
          {
            id: 'MAN-1.3',
            name: 'Stakeholder Input',
            description: 'Incorporate stakeholder input in risk prioritization'
          },
          {
            id: 'MAN-1.4',
            name: 'Resource Allocation',
            description: 'Allocate resources based on risk prioritization'
          }
        ]
      },
      {
        id: 'MAN-2',
        name: 'Risk Response',
        description: 'Develop and implement risk response strategies',
        subcategories: [
          {
            id: 'MAN-2.1',
            name: 'Risk Response Strategies',
            description: 'Develop risk response strategies (mitigate, accept, transfer, avoid)'
          },
          {
            id: 'MAN-2.2',
            name: 'Mitigation Plans',
            description: 'Develop mitigation plans for high-priority risks'
          },
          {
            id: 'MAN-2.3',
            name: 'Risk Treatment',
            description: 'Implement risk treatment measures'
          },
          {
            id: 'MAN-2.4',
            name: 'Contingency Planning',
            description: 'Develop contingency plans for residual risks'
          },
          {
            id: 'MAN-2.5',
            name: 'Response Effectiveness',
            description: 'Evaluate the effectiveness of risk response measures'
          }
        ]
      },
      {
        id: 'MAN-3',
        name: 'Risk Communication',
        description: 'Communicate risks to stakeholders',
        subcategories: [
          {
            id: 'MAN-3.1',
            name: 'Communication Plan',
            description: 'Develop a plan for communicating risks to stakeholders'
          },
          {
            id: 'MAN-3.2',
            name: 'Risk Reporting',
            description: 'Report risks to relevant stakeholders'
          },
          {
            id: 'MAN-3.3',
            name: 'Transparency',
            description: 'Maintain transparency in risk communication'
          },
          {
            id: 'MAN-3.4',
            name: 'Stakeholder Engagement',
            description: 'Engage stakeholders in risk communication activities'
          }
        ]
      },
      {
        id: 'MAN-4',
        name: 'Risk Review and Update',
        description: 'Review and update risk management activities',
        subcategories: [
          {
            id: 'MAN-4.1',
            name: 'Regular Reviews',
            description: 'Conduct regular reviews of risk management activities'
          },
          {
            id: 'MAN-4.2',
            name: 'Risk Register Updates',
            description: 'Update risk registers based on reviews'
          },
          {
            id: 'MAN-4.3',
            name: 'Lessons Learned',
            description: 'Capture and apply lessons learned from risk management activities'
          },
          {
            id: 'MAN-4.4',
            name: 'Continuous Improvement',
            description: 'Continuously improve risk management processes'
          }
        ]
      }
    ]
  }
};

/**
 * Trustworthiness Characteristics
 */
export const TRUSTWORTHINESS_CHARACTERISTICS = [
  {
    characteristic: 'Valid_and_Reliable',
    name: 'Valid and Reliable',
    description: 'AI system produces accurate and consistent results that are valid for the intended use',
    keyAspects: [
      'Accuracy and precision',
      'Consistency and reproducibility',
      'Robustness to variations',
      'Validation against requirements'
    ]
  },
  {
    characteristic: 'Safe',
    name: 'Safe',
    description: 'AI system operates safely and minimizes harm to people, organizations, and the environment',
    keyAspects: [
      'Safety by design',
      'Hazard identification and mitigation',
      'Fail-safe mechanisms',
      'Safety testing and validation'
    ]
  },
  {
    characteristic: 'Secure_and_Resilient',
    name: 'Secure and Resilient',
    description: 'AI system is secure against attacks and resilient to failures and disruptions',
    keyAspects: [
      'Security controls',
      'Resilience to attacks',
      'Fault tolerance',
      'Recovery capabilities'
    ]
  },
  {
    characteristic: 'Accountable_and_Transparent',
    name: 'Accountable and Transparent',
    description: 'AI system is accountable and transparent in its operations and decision-making',
    keyAspects: [
      'Accountability mechanisms',
      'Transparency in operations',
      'Audit trails',
      'Responsibility assignment'
    ]
  },
  {
    characteristic: 'Explainable_and_Interpretable',
    name: 'Explainable and Interpretable',
    description: 'AI system decisions can be explained and interpreted by relevant stakeholders',
    keyAspects: [
      'Explainability methods',
      'Interpretability techniques',
      'Documentation of decisions',
      'Stakeholder understanding'
    ]
  },
  {
    characteristic: 'Privacy_Enhanced',
    name: 'Privacy-Enhanced',
    description: 'AI system protects privacy and handles data appropriately throughout its lifecycle',
    keyAspects: [
      'Privacy by design',
      'Data minimization',
      'Access controls',
      'Privacy-preserving techniques'
    ]
  },
  {
    characteristic: 'Fair_with_Bias_Managed',
    name: 'Fair with Harmful Bias Managed',
    description: 'AI system is fair and manages harmful bias that could lead to inequitable outcomes',
    keyAspects: [
      'Bias identification',
      'Fairness metrics',
      'Bias mitigation',
      'Equity considerations'
    ]
  }
];

/**
 * Lifecycle Stages
 */
export const LIFECYCLE_STAGES = [
  {
    stage: 'Plan_and_Design',
    name: 'Plan and Design',
    description: 'Planning and design phase where AI system requirements are defined and architecture is designed',
    keyActivities: [
      'Requirements definition',
      'System architecture design',
      'Risk assessment planning',
      'Stakeholder engagement'
    ]
  },
  {
    stage: 'Collect_and_Process',
    name: 'Collect and Process',
    description: 'Data collection and processing phase where training and operational data are gathered and prepared',
    keyActivities: [
      'Data collection',
      'Data preprocessing',
      'Data quality assessment',
      'Data governance'
    ]
  },
  {
    stage: 'Build_and_Validate',
    name: 'Build and Validate',
    description: 'Model building and validation phase where AI models are developed, trained, and validated',
    keyActivities: [
      'Model development',
      'Training and tuning',
      'Validation and testing',
      'Performance evaluation'
    ]
  },
  {
    stage: 'Deploy_and_Operate',
    name: 'Deploy and Operate',
    description: 'Deployment and operational phase where the AI system is deployed and operated in production',
    keyActivities: [
      'System deployment',
      'Operational monitoring',
      'Performance management',
      'User support'
    ]
  },
  {
    stage: 'Monitor_and_Maintain',
    name: 'Monitor and Maintain',
    description: 'Ongoing monitoring and maintenance phase where the AI system is continuously monitored and maintained',
    keyActivities: [
      'Continuous monitoring',
      'Performance tracking',
      'Model updates and retraining',
      'Maintenance activities'
    ]
  }
];

