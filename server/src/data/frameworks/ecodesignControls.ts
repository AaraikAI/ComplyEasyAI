import { FrameworkControlTemplate } from './soc2Controls';

/**
 * Ecodesign for Sustainable Products Regulation (ESPR) - Regulation (EU) 2024/1781
 * Environmental requirements for sustainable products
 */
export const ECODESIGN_CONTROLS: FrameworkControlTemplate[] = [
  // ===== Chapter I: Product Requirements =====
  {
    controlId: 'ESPR-1.1',
    name: 'Product Durability Requirements',
    description: 'Products must be designed for durability, including resistance to wear and damage, repairability, and availability of spare parts for minimum period.',
    category: 'Product Requirements',
    implementationGuidance: 'Design products for extended lifespan. Test durability against specified criteria. Ensure spare part availability commitment. Document expected product lifespan.',
    evidenceRequirements: [
      'Product durability design documentation',
      'Durability testing results',
      'Spare part availability commitment',
      'Expected lifespan documentation'
    ],
    testProcedures: [
      'Review durability design criteria',
      'Verify durability testing adequacy',
      'Test spare part availability',
      'Assess lifespan documentation accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-1.2',
    name: 'Repairability and Maintenance',
    description: 'Products must be designed for easy repair and maintenance, including access to repair information, diagnostic tools, and spare parts at fair prices.',
    category: 'Product Requirements',
    implementationGuidance: 'Design products with repair accessibility. Publish repair manuals and instructions. Provide access to diagnostic tools. Price spare parts fairly.',
    evidenceRequirements: [
      'Repair-friendly design documentation',
      'Repair manual availability records',
      'Diagnostic tool access documentation',
      'Spare part pricing records'
    ],
    testProcedures: [
      'Assess repair accessibility in product design',
      'Verify repair manual availability',
      'Test diagnostic tool functionality',
      'Review spare part pricing fairness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-1.3',
    name: 'Recyclability and Material Recovery',
    description: 'Products must be designed for recyclability and material recovery at end of life, including easy disassembly and marking of materials.',
    category: 'Product Requirements',
    implementationGuidance: 'Design for disassembly and material separation. Mark materials for identification. Minimize use of substances hindering recycling. Document recyclability percentage.',
    evidenceRequirements: [
      'Design for disassembly documentation',
      'Material marking specifications',
      'Hazardous substance minimization records',
      'Recyclability assessment documentation'
    ],
    testProcedures: [
      'Test disassembly procedures',
      'Verify material marking compliance',
      'Review hazardous substance content',
      'Assess recyclability calculations'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-1.4',
    name: 'Resource Efficiency',
    description: 'Products must minimize resource consumption during manufacturing and use, including energy efficiency, water usage, and raw material requirements.',
    category: 'Product Requirements',
    implementationGuidance: 'Optimize manufacturing resource usage. Design for energy efficiency in use phase. Minimize water consumption. Reduce raw material requirements.',
    evidenceRequirements: [
      'Manufacturing resource usage data',
      'Energy efficiency specifications',
      'Water usage minimization records',
      'Raw material optimization documentation'
    ],
    testProcedures: [
      'Review manufacturing resource data',
      'Test energy efficiency compliance',
      'Verify water usage metrics',
      'Assess raw material optimization'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-1.5',
    name: 'Recycled Content Requirements',
    description: 'Products must incorporate minimum levels of recycled content where specified, with traceability of recycled material sources.',
    category: 'Product Requirements',
    implementationGuidance: 'Source recycled materials meeting specifications. Implement recycled content verification. Track recycled material through supply chain. Document recycled content percentage.',
    evidenceRequirements: [
      'Recycled material sourcing records',
      'Content verification documentation',
      'Supply chain traceability records',
      'Recycled content calculation documentation'
    ],
    testProcedures: [
      'Verify recycled material sourcing',
      'Test content verification accuracy',
      'Review traceability system effectiveness',
      'Assess content calculation methodology'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-1.6',
    name: 'Carbon Footprint Declaration',
    description: 'Products must declare carbon footprint calculated according to specified methodology, covering relevant lifecycle stages.',
    category: 'Product Requirements',
    implementationGuidance: 'Calculate product carbon footprint per approved methodology. Cover manufacturing, use, and end-of-life stages. Verify calculation accuracy. Declare footprint in required format.',
    evidenceRequirements: [
      'Carbon footprint calculation documentation',
      'Methodology compliance verification',
      'Lifecycle stage coverage documentation',
      'Carbon footprint declaration records'
    ],
    testProcedures: [
      'Review calculation methodology compliance',
      'Verify lifecycle stage coverage',
      'Test calculation accuracy',
      'Assess declaration format compliance'
    ],
    status: 'Not Started'
  },

  // ===== Chapter II: Digital Product Passport =====
  {
    controlId: 'ESPR-2.1',
    name: 'Digital Product Passport Implementation',
    description: 'Products must have a Digital Product Passport containing product information accessible via data carrier (QR code, RFID, etc.) linked to unique product identifier.',
    category: 'Digital Product Passport',
    implementationGuidance: 'Implement unique product identification system. Generate Digital Product Passports. Apply data carriers to products. Register passports in EU registry.',
    evidenceRequirements: [
      'Product identification system documentation',
      'Digital Product Passport generation records',
      'Data carrier application records',
      'Registry registration confirmation'
    ],
    testProcedures: [
      'Test product identification system',
      'Verify passport generation accuracy',
      'Test data carrier functionality',
      'Confirm registry registration'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-2.2',
    name: 'Product Passport Information Content',
    description: 'Digital Product Passport must contain required information including product identification, compliance documentation, sustainability information, and repair/recycling instructions.',
    category: 'Digital Product Passport',
    implementationGuidance: 'Compile required passport information. Structure data per regulatory requirements. Ensure information accessibility. Update passport when information changes.',
    evidenceRequirements: [
      'Passport content specifications',
      'Information compilation procedures',
      'Data structure documentation',
      'Update process documentation'
    ],
    testProcedures: [
      'Review passport content completeness',
      'Verify information accuracy',
      'Test data accessibility',
      'Assess update process effectiveness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-2.3',
    name: 'Product Passport Accessibility',
    description: 'Digital Product Passport must be accessible to relevant actors including consumers, repair providers, recyclers, and market surveillance authorities with appropriate access rights.',
    category: 'Digital Product Passport',
    implementationGuidance: 'Implement tiered access control system. Define access rights by actor type. Ensure public information accessibility. Protect confidential business information.',
    evidenceRequirements: [
      'Access control system documentation',
      'Access rights matrix',
      'Public accessibility verification',
      'Confidentiality protection measures'
    ],
    testProcedures: [
      'Test access control functionality',
      'Verify access rights implementation',
      'Assess public information accessibility',
      'Review confidentiality protection adequacy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-2.4',
    name: 'Product Passport Data Security',
    description: 'Digital Product Passport systems must ensure data authenticity, integrity, and security against unauthorized modification.',
    category: 'Digital Product Passport',
    implementationGuidance: 'Implement data authentication mechanisms. Ensure data integrity protection. Apply security measures against unauthorized access. Conduct security testing.',
    evidenceRequirements: [
      'Authentication mechanism documentation',
      'Integrity protection measures',
      'Security control documentation',
      'Security testing records'
    ],
    testProcedures: [
      'Test authentication mechanisms',
      'Verify integrity protection effectiveness',
      'Assess security control implementation',
      'Review security testing results'
    ],
    status: 'Not Started'
  },

  // ===== Chapter III: Conformity Assessment =====
  {
    controlId: 'ESPR-3.1',
    name: 'Product Conformity Assessment',
    description: 'Manufacturers must conduct conformity assessment demonstrating products meet applicable ecodesign requirements before placing on market.',
    category: 'Conformity Assessment',
    implementationGuidance: 'Identify applicable ecodesign requirements. Conduct conformity assessment per specified procedures. Compile technical documentation. Prepare EU declaration of conformity.',
    evidenceRequirements: [
      'Requirements applicability analysis',
      'Conformity assessment records',
      'Technical documentation package',
      'EU declaration of conformity'
    ],
    testProcedures: [
      'Verify requirements identification completeness',
      'Review conformity assessment adequacy',
      'Assess technical documentation completeness',
      'Verify declaration accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-3.2',
    name: 'Technical Documentation',
    description: 'Manufacturers must prepare technical documentation demonstrating conformity with ecodesign requirements, retained for 10 years after product placed on market.',
    category: 'Conformity Assessment',
    implementationGuidance: 'Create comprehensive technical file. Include design calculations and test reports. Implement 10-year retention. Enable documentation availability for authorities.',
    evidenceRequirements: [
      'Technical documentation package',
      'Design calculation records',
      'Test report documentation',
      'Retention system documentation'
    ],
    testProcedures: [
      'Review documentation completeness',
      'Verify design calculation accuracy',
      'Assess test report adequacy',
      'Test retention system compliance'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-3.3',
    name: 'CE Marking for Ecodesign',
    description: 'Products meeting ecodesign requirements must bear CE marking indicating conformity. Marking must be visible, legible, and indelible.',
    category: 'Conformity Assessment',
    implementationGuidance: 'Apply CE marking per regulatory specifications. Ensure marking visibility and durability. Accompany with notified body number where applicable. Maintain marking records.',
    evidenceRequirements: [
      'CE marking application procedures',
      'Marking specification compliance records',
      'Notified body number records (where applicable)',
      'Marking verification documentation'
    ],
    testProcedures: [
      'Verify marking application compliance',
      'Test marking visibility and durability',
      'Confirm notified body involvement where required',
      'Review marking record accuracy'
    ],
    status: 'Not Started'
  },

  // ===== Chapter IV: Manufacturer Obligations =====
  {
    controlId: 'ESPR-4.1',
    name: 'Product Information Provision',
    description: 'Manufacturers must provide clear information to consumers about product environmental performance, including energy efficiency, durability, and repairability.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Develop product environmental information. Include required labeling and documentation. Ensure information clarity for consumers. Maintain information consistency across channels.',
    evidenceRequirements: [
      'Product environmental information documentation',
      'Labeling and documentation records',
      'Consumer information accessibility assessment',
      'Information consistency verification'
    ],
    testProcedures: [
      'Review information completeness',
      'Verify labeling compliance',
      'Assess information clarity',
      'Test information consistency'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-4.2',
    name: 'Spare Part Availability',
    description: 'Manufacturers must ensure availability of spare parts for specified period after last unit placed on market, at reasonable prices.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Plan spare part inventory for required period. Establish spare part distribution system. Set reasonable spare part pricing. Track spare part availability.',
    evidenceRequirements: [
      'Spare part inventory planning',
      'Distribution system documentation',
      'Pricing policy documentation',
      'Availability tracking records'
    ],
    testProcedures: [
      'Review inventory planning adequacy',
      'Test distribution system effectiveness',
      'Assess pricing reasonableness',
      'Verify availability tracking accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-4.3',
    name: 'Repair Information Access',
    description: 'Manufacturers must provide access to repair and maintenance information to professional repairers and consumers, including repair manuals and diagnostic tools.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Compile repair and maintenance information. Create accessible documentation portal. Provide diagnostic tool access. Update information when products change.',
    evidenceRequirements: [
      'Repair information compilation',
      'Documentation portal records',
      'Diagnostic tool access documentation',
      'Information update records'
    ],
    testProcedures: [
      'Review repair information completeness',
      'Test portal accessibility',
      'Verify diagnostic tool functionality',
      'Assess update process timeliness'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-4.4',
    name: 'Software Update Provision',
    description: 'For products with digital elements, manufacturers must provide software updates maintaining product functionality and security for specified support period.',
    category: 'Manufacturer Obligations',
    implementationGuidance: 'Define software support period. Develop update provision process. Ensure updates maintain functionality. Track update deployment status.',
    evidenceRequirements: [
      'Software support period documentation',
      'Update development and release records',
      'Functionality maintenance verification',
      'Update deployment tracking'
    ],
    testProcedures: [
      'Verify support period commitment',
      'Test update provision process',
      'Assess functionality maintenance',
      'Review deployment tracking accuracy'
    ],
    status: 'Not Started'
  },

  // ===== Chapter V: Destruction Prevention =====
  {
    controlId: 'ESPR-5.1',
    name: 'Unsold Product Destruction Prohibition',
    description: 'Destruction of unsold consumer products (textiles, footwear) is prohibited unless products are unfit for use. Alternative disposal methods must be used.',
    category: 'Destruction Prevention',
    implementationGuidance: 'Implement unsold inventory management. Establish donation and redistribution channels. Document any destruction with justification. Report annually on unsold product disposition.',
    evidenceRequirements: [
      'Inventory management procedures',
      'Donation and redistribution records',
      'Destruction justification documentation',
      'Annual reporting records'
    ],
    testProcedures: [
      'Review inventory management effectiveness',
      'Verify alternative disposal usage',
      'Assess destruction justification validity',
      'Test reporting accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-5.2',
    name: 'Unsold Product Disclosure',
    description: 'Economic operators must disclose information about unsold products discarded, including quantities and reasons for destruction where permitted.',
    category: 'Destruction Prevention',
    implementationGuidance: 'Track unsold product quantities. Document disposition decisions. Compile annual disclosure information. Publish disclosure as required.',
    evidenceRequirements: [
      'Unsold product tracking records',
      'Disposition decision documentation',
      'Annual disclosure compilation',
      'Publication records'
    ],
    testProcedures: [
      'Verify tracking accuracy',
      'Review disposition documentation',
      'Test disclosure completeness',
      'Confirm publication compliance'
    ],
    status: 'Not Started'
  },

  // ===== Chapter VI: Market Surveillance =====
  {
    controlId: 'ESPR-6.1',
    name: 'Cooperation with Market Surveillance',
    description: 'Economic operators must cooperate with market surveillance authorities, provide requested documentation, and take corrective action when non-compliance identified.',
    category: 'Market Surveillance',
    implementationGuidance: 'Establish authority communication procedures. Prepare documentation for requests. Implement corrective action process. Track authority interactions.',
    evidenceRequirements: [
      'Communication procedures documentation',
      'Documentation request response records',
      'Corrective action procedures',
      'Authority interaction records'
    ],
    testProcedures: [
      'Test communication process effectiveness',
      'Review documentation response timeliness',
      'Assess corrective action adequacy',
      'Verify interaction record accuracy'
    ],
    status: 'Not Started'
  },
  {
    controlId: 'ESPR-6.2',
    name: 'Non-Compliance Remediation',
    description: 'When products do not conform to ecodesign requirements, economic operators must take corrective measures including withdrawal or recall.',
    category: 'Market Surveillance',
    implementationGuidance: 'Establish non-compliance detection process. Define remediation procedures. Implement withdrawal and recall capabilities. Document remediation actions.',
    evidenceRequirements: [
      'Non-compliance detection procedures',
      'Remediation action procedures',
      'Withdrawal and recall capability documentation',
      'Remediation action records'
    ],
    testProcedures: [
      'Test detection process effectiveness',
      'Review remediation procedures adequacy',
      'Verify withdrawal/recall capability',
      'Assess action record completeness'
    ],
    status: 'Not Started'
  }
];
