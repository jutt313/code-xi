import db from '../db';
import { UserProfileDetector } from './userProfilingService';

interface Question {
  category: string;
  question: string;
  followUp?: string;
  options?: string[];
  examples?: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  technicalLevelFilter?: string; // e.g., 'noCode', 'expert'
}

interface Requirement {
  id: string;
  description: string;
  priority: string;
  agents: string[];
}

interface Requirements {
  functional: Requirement[];
  nonFunctional: Requirement[];
  technical: Requirement[];
  business: Requirement[];
}

interface ProjectDiscoverySession {
  projectId: number;
  userProfile: { technicalLevel: string };
  projectType: string;
  currentQuestionId: number | null;
  answeredQuestions: Map<number, { question: Question; answer: string }>;
  requirements: Map<string, any>;
  clarificationsNeeded: any[];
}

const projectCategories = {
  'ecommerce': ['shop', 'store', 'buy', 'sell', 'product', 'cart', 'payment', 'online store', 'e-commerce'],
  'social': ['social', 'chat', 'message', 'friend', 'post', 'share', 'community', 'feed', 'network'],
  'crm': ['customer', 'lead', 'sales', 'contact', 'manage', 'pipeline', 'client', 'relationship'],
  'dashboard': ['dashboard', 'analytics', 'report', 'chart', 'data', 'metrics', 'insights', 'overview'],
  'booking': ['book', 'appointment', 'schedule', 'calendar', 'reservation', 'event', 'time slot'],
  'education': ['course', 'learn', 'student', 'teach', 'lesson', 'quiz', 'academy', 'training']
};

const ecommerceQuestions: Question[] = [
  // Business Scope
  {
    category: "business_scope",
    question: "What type of products will you be selling?",
    followUp: "Are these physical products, digital downloads, or services?",
    importance: "critical"
  },
  {
    category: "business_scope", 
    question: "Who is your target customer?",
    followUp: "What age group, location, and buying behavior?",
    importance: "critical"
  },
  {
    category: "business_scope",
    question: "How many products do you plan to have initially?",
    followUp: "Will this grow to hundreds, thousands, or more?",
    importance: "high"
  },
  
  // Payment & Shipping
  {
    category: "payment_shipping",
    question: "What payment methods do you want to accept?",
    options: ["Credit cards", "PayPal", "Stripe", "Bank transfers", "Cryptocurrency"],
    importance: "critical"
  },
  {
    category: "payment_shipping",
    question: "Do you need shipping and inventory management?",
    followUp: "Will you handle shipping yourself or use dropshipping?",
    importance: "high"
  },
  
  // User Features
  {
    category: "user_features",
    question: "What features do customers need?",
    options: ["User accounts", "Wishlist", "Reviews", "Recommendations", "Loyalty program"],
    importance: "medium"
  },
  {
    category: "technical_specifications",
    question: "What are your expected peak concurrent users and daily transaction volume?",
    importance: "high",
    technicalLevelFilter: "expert"
  },
  {
    category: "technical_specifications",
    question: "Do you have any existing product data feeds (e.g., XML, CSV) or APIs to integrate?",
    importance: "high",
    technicalLevelFilter: "technical"
  }
];

const crmQuestions: Question[] = [
  {
    category: "business_process",
    question: "What is your current process for managing customers?",
    followUp: "What tools do you use now and what's frustrating about them?",
    importance: "critical"
  },
  {
    category: "user_roles",
    question: "Who will be using this system?",
    options: ["Sales team", "Marketing", "Customer service", "Management", "External clients"],
    importance: "critical"
  },
  {
    category: "integrations",
    question: "What existing tools need to connect with this system?",
    examples: ["Email (Gmail, Outlook)", "Calendar", "Accounting software", "Marketing tools"],
    importance: "high"
  },
  {
    category: "technical_specifications",
    question: "What are the key data entities (e.g., Leads, Contacts, Deals) and their relationships?",
    importance: "high",
    technicalLevelFilter: "technical"
  },
  {
    category: "technical_specifications",
    question: "Do you require custom workflow automation or complex reporting capabilities?",
    importance: "high",
    technicalLevelFilter: "expert"
  }
];

const defaultQuestions: Question[] = [
  {
    category: "general_scope",
    question: "What is the primary goal or problem this project aims to solve?",
    importance: "critical"
  },
  {
    category: "target_users",
    question: "Who are the main users of this application?",
    importance: "critical"
  },
  {
    category: "key_features",
    question: "What are the absolute must-have features for the first version?",
    importance: "high"
  },
  {
    category: "technical_preference",
    question: "Do you have any preferred technologies or platforms?",
    importance: "medium",
    technicalLevelFilter: "technical"
  },
  {
    category: "timeline_budget",
    question: "What is your ideal timeline and budget for this project?",
    importance: "medium"
  }
];

class ProjectDiscoveryManager {
  categorizeProject(userInput: string, categories: { [key: string]: string[] }): string {
    const lowerInput = userInput.toLowerCase();
    for (const category in categories) {
      for (const keyword of categories[category]) {
        if (lowerInput.includes(keyword)) {
          return category;
        }
      }
    }
    return 'general'; // Default category
  }

  getQuestionsForProjectType(projectType: string): Question[] {
    switch (projectType) {
      case 'ecommerce':
        return [...ecommerceQuestions, ...defaultQuestions];
      case 'crm':
        return [...crmQuestions, ...defaultQuestions];
      // Add other project types here
      default:
        return defaultQuestions;
    }
  }
}

class AdaptiveQuestionSelector {
  selectNextQuestion(session: ProjectDiscoverySession): Question | null {
    let questionSet = this.getQuestionsForProjectType(session.projectType);
    
    questionSet = this.filterByUserProfile(questionSet, session.userProfile);
    questionSet = this.filterAnsweredQuestions(questionSet, session.answeredQuestions);
    
    // Prioritize by importance (critical > high > medium > low)
    questionSet.sort((a, b) => {
      const importanceOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    // Simple prioritization: just take the first available question after sorting
    return questionSet.length > 0 ? questionSet[0] : null;
  }
  
  getQuestionsForProjectType(projectType: string): Question[] {
    const manager = new ProjectDiscoveryManager();
    return manager.getQuestionsForProjectType(projectType);
  }

  filterByUserProfile(questions: Question[], userProfile: { technicalLevel: string }): Question[] {
    return questions.filter(q => {
      if (q.technicalLevelFilter) {
        // Only include if the user's technical level matches or is higher than the filter
        const levelOrder: { [key: string]: number } = { 'noCode': 1, 'business': 2, 'technical': 3, 'expert': 4 };
        const userLevel = levelOrder[userProfile.technicalLevel] || 0;
        const questionLevel = levelOrder[q.technicalLevelFilter] || 0;
        return userLevel >= questionLevel;
      }
      return true;
    });
  }
  
  filterAnsweredQuestions(questions: Question[], answered: Map<number, any>): Question[] {
    // Assuming question objects can be uniquely identified, e.g., by their question text or a unique ID
    const answeredTexts = new Set<string>();
    answered.forEach(entry => answeredTexts.add(entry.question.question));
    return questions.filter(q => !answeredTexts.has(q.question));
  }

  // This method is simplified; a real implementation would handle dependencies and more complex prioritization
  prioritizeQuestions(questions: Question[], previousAnswers: Map<number, any>): Question | null {
    if (questions.length === 0) return null;
    return questions[0]; // Already sorted by importance
  }
}

export class QuestionFlowManager {
  private projectDiscoveryManager: ProjectDiscoveryManager;
  private adaptiveQuestionSelector: AdaptiveQuestionSelector;

  constructor() {
    this.projectDiscoveryManager = new ProjectDiscoveryManager();
    this.adaptiveQuestionSelector = new AdaptiveQuestionSelector();
  }

  async conductDiscovery(projectId: number, userProfile: { technicalLevel: string }, initialIdea: string): Promise<{ sessionId: number; firstQuestion: string; projectType: string }> {
    const projectType = this.projectDiscoveryManager.categorizeProject(initialIdea, projectCategories);
    
    const session: ProjectDiscoverySession = {
      projectId,
      userProfile,
      projectType,
      currentQuestionId: null,
      answeredQuestions: new Map(),
      requirements: new Map(),
      clarificationsNeeded: []
    };

    const firstQuestionObj = this.adaptiveQuestionSelector.selectNextQuestion(session);
    if (!firstQuestionObj) {
      throw new Error("No initial questions available for this project type.");
    }

    const result = await db.query(
      'INSERT INTO project_discovery (project_id, question_category, question_text, answer_confidence) VALUES ($1, $2, $3, $4) RETURNING id',
      [projectId, firstQuestionObj.category, firstQuestionObj.question, 'unanswered']
    );
    const questionId = result.rows[0].id;
    session.currentQuestionId = questionId;

    // Save the initial session state
    await this.saveDiscoverySession(session);

    return {
      sessionId: projectId, // Using projectId as sessionId for simplicity
      firstQuestion: this.formatQuestionForUser(firstQuestionObj, userProfile),
      projectType: projectType
    };
  }
  
  async processAnswer(projectId: number, userAnswer: string): Promise<{ type: 'question' | 'complete' | 'clarification'; content: string; nextQuestionId?: number | null; requirements?: any }> {
    const session = await this.loadDiscoverySession(projectId);
    if (!session) {
      throw new Error("Discovery session not found.");
    }

    const currentQuestionId = session.currentQuestionId;
    if (currentQuestionId === null) {
      throw new Error("No current question in session.");
    }

    const currentQuestionEntry = await db.query('SELECT * FROM project_discovery WHERE id = $1', [currentQuestionId]);
    if (currentQuestionEntry.rows.length === 0) {
      throw new Error("Current question not found in DB.");
    }
    const currentQuestionObj = currentQuestionEntry.rows[0];

    // Update the answered question in DB
    await db.query(
      'UPDATE project_discovery SET user_answer = $1, answer_confidence = $2 WHERE id = $3',
      [userAnswer, 'complete', currentQuestionId]
    );
    session.answeredQuestions.set(currentQuestionId, { question: currentQuestionObj, answer: userAnswer });

    // Analyze answer quality (simplified for now)
    const answerAnalysis = { needsClarification: false }; // Placeholder
    
    if (answerAnalysis.needsClarification) {
      // This part would involve generating a clarification question
      return { type: 'clarification', content: "I need more clarification on that." };
    }
    
    const nextQuestionObj = this.adaptiveQuestionSelector.selectNextQuestion(session);
    
    if (!nextQuestionObj) {
      // Discovery complete - generate requirements
      const requirements = await this.generateRequirements(session);
      return { type: 'complete', content: "Project discovery complete. Generating project plan.", requirements };
    }
    
    const result = await db.query(
      'INSERT INTO project_discovery (project_id, question_category, question_text, answer_confidence) VALUES ($1, $2, $3, $4) RETURNING id',
      [projectId, nextQuestionObj.category, nextQuestionObj.question, 'unanswered']
    );
    const nextQuestionDbId = result.rows[0].id;
    session.currentQuestionId = nextQuestionDbId;
    await this.saveDiscoverySession(session); // Update session with new current question

    return { type: 'question', content: this.formatQuestionForUser(nextQuestionObj, session.userProfile), nextQuestionId: nextQuestionDbId };
  }

  private async saveDiscoverySession(session: ProjectDiscoverySession): Promise<void> {
    // For simplicity, we're not storing the full session object in a dedicated table yet.
    // The currentQuestionId is stored in the session object itself, which is managed in memory.
    // In a real app, this would be persisted.
    // For now, we'll just update the project's current_question_id if we add it to the projects table.
  }

  private async loadDiscoverySession(projectId: number): Promise<ProjectDiscoverySession | null> {
    // For simplicity, reconstructing session from DB entries.
    const projectResult = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) return null;
    const userId = projectResult.rows[0].user_id;

    const userResult = await db.query('SELECT technical_level FROM users WHERE id = $1', [userId]);
    const userProfile = { technicalLevel: userResult.rows[0].technical_level };

    const discoveryQuestions = await db.query('SELECT * FROM project_discovery WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
    const answeredQuestions = new Map<number, { question: Question; answer: string }>();
    let currentQuestionId: number | null = null;
    let projectType: string = 'general'; // Will be determined by the first question or initial idea

    for (const row of discoveryQuestions.rows) {
      const questionObj: Question = { category: row.question_category, question: row.question_text, importance: 'medium' }; // Simplified reconstruction
      if (row.user_answer) {
        answeredQuestions.set(row.id, { question: questionObj, answer: row.user_answer });
      } else {
        currentQuestionId = row.id; // The last unanswered question
      }
      // Attempt to re-categorize project type from initial questions
      if (row.question_category === 'general_scope' && row.user_answer) {
        projectType = this.projectDiscoveryManager.categorizeProject(row.user_answer, projectCategories);
      }
    }

    // If no questions yet, try to get project type from project's initial prompt (not available here directly)
    // For now, assume projectType is set by the first question or remains 'general'

    return {
      projectId,
      userProfile,
      projectType,
      currentQuestionId,
      answeredQuestions,
      requirements: new Map(), // Reconstruct if needed
      clarificationsNeeded: []
    };
  }

  private formatQuestionForUser(question: Question, userProfile: { technicalLevel: string }): string {
    let formattedQuestion = question.question;
    if (question.followUp && userProfile.technicalLevel !== 'expert') {
      formattedQuestion += `\n(e.g., ${question.followUp})`;
    }
    if (question.options && userProfile.technicalLevel !== 'expert') {
      formattedQuestion += `\nOptions: ${question.options.join(', ')}`;
    }
    if (question.examples && (userProfile.technicalLevel === 'technical' || userProfile.technicalLevel === 'expert')) {
      formattedQuestion += `\nExamples: ${question.examples.join(', ')}`;
    }
    return formattedQuestion;
  }

  private async generateRequirements(session: ProjectDiscoverySession): Promise<any> {
    const requirementsGenerator = new RequirementsGenerator();
    const requirements = requirementsGenerator.generateRequirements(session.answeredQuestions);

    // Save generated requirements to DB
    for (const category in requirements) {
      const categoryKey = category as keyof Requirements;
      for (const req of requirements[categoryKey]) {
        await db.query(
          'INSERT INTO project_requirements (project_id, requirement_category, requirement_text, priority) VALUES ($1, $2, $3, $4)',
          [session.projectId, category, req.description, req.priority]
        );
      }
    }
    return requirements;
  }
}

class ContextAwareQuestionGenerator {
  generateDynamicQuestion(projectType: string, previousAnswers: Map<number, { question: Question; answer: string }>, userProfile: { technicalLevel: string }): Question | null {
    // Example: User said they're building e-commerce for "handmade jewelry"
    const productTypeEntry = Array.from(previousAnswers.values()).find(entry => entry.question.category === 'business_scope' && entry.question.question.includes('products'));
    if (projectType === 'ecommerce' && productTypeEntry) {
      const productType = productTypeEntry.answer.toLowerCase();
      
      if (productType.includes('handmade') || productType.includes('jewelry')) {
        return {
          question: "Since you're selling handmade jewelry, do you need features for custom orders and personalization?",
          category: "custom_features",
          importance: "high"
        };
      }
    }
    
    // Example: User mentioned they have 50+ employees
    const teamSizeEntry = Array.from(previousAnswers.values()).find(entry => entry.question.category === 'user_roles' && entry.question.question.includes('Who will be using this system'));
    if (teamSizeEntry) {
      const teamSizeAnswer = teamSizeEntry.answer.toLowerCase();
      if (parseInt(teamSizeAnswer) > 50 || teamSizeAnswer.includes('large team')) { // Simplified parsing
        return {
          question: "With a larger team, do you need role-based permissions and approval workflows?",
          category: "enterprise_features",
          importance: "high"
        };
      }
    }
    
    return null;
  }
}

class RequirementsGenerator {
  generateRequirements(discoveryAnswers: Map<number, { question: Question; answer: string }>): Requirements {
    const requirements: Requirements = {
      functional: [],
      nonFunctional: [],
      technical: [],
      business: []
    };
    
    for (const [questionId, entry] of discoveryAnswers) {
      const question = entry.question;
      const answer = entry.answer.toLowerCase();

      if (question.category === 'user_features') {
        if (answer.includes('user accounts')) {
          requirements.functional.push({
            id: 'auth_system',
            description: 'User registration and login system',
            priority: 'critical',
            agents: ['full_stack_engineer', 'security_engineer']
          });
        }
        if (answer.includes('wishlist')) {
          requirements.functional.push({
            id: 'wishlist_feature',
            description: 'Customer wishlist functionality',
            priority: 'medium',
            agents: ['full_stack_engineer']
          });
        }
      }
      
      if (question.category === 'business_scope' && question.question.includes('products')) {
        if (answer.includes('physical')) {
          requirements.functional.push({
            id: 'physical_product_management',
            description: 'Management of physical products',
            priority: 'critical',
            agents: ['full_stack_engineer']
          });
        }
        if (answer.includes('digital')) {
          requirements.functional.push({
            id: 'digital_product_management',
            description: 'Management of digital products/downloads',
            priority: 'critical',
            agents: ['full_stack_engineer']
          });
        }
      }

      if (question.category === 'payment_shipping' && question.question.includes('payment methods')) {
        if (answer.includes('credit cards') || answer.includes('stripe')) {
          requirements.functional.push({
            id: 'credit_card_payment',
            description: 'Credit card payment processing via Stripe or similar gateway',
            priority: 'critical',
            agents: ['full_stack_engineer', 'security_engineer']
          });
        }
        if (answer.includes('paypal')) {
          requirements.functional.push({
            id: 'paypal_payment',
            description: 'PayPal payment integration',
            priority: 'high',
            agents: ['full_stack_engineer']
          });
        }
      }

      if (question.category === 'payment_shipping' && question.question.includes('shipping and inventory')) {
        if (answer.includes('yes') || answer.includes('shipping')) {
          requirements.functional.push({
            id: 'shipping_management',
            description: 'Shipping management functionality',
            priority: 'high',
            agents: ['full_stack_engineer', 'devops_engineer']
          });
          requirements.functional.push({
            id: 'inventory_management',
            description: 'Inventory management system',
            priority: 'high',
            agents: ['full_stack_engineer']
          });
        }
      }

      if (question.category === 'technical_specifications' && question.question.includes('concurrent users')) {
        if (parseInt(answer) > 1000) {
          requirements.nonFunctional.push({
            id: 'high_scalability',
            description: `Support for ${answer} concurrent users`,
            priority: 'critical',
            agents: ['solutions_architect', 'devops_engineer', 'performance_engineer']
          });
        }
      }

      if (question.category === 'technical_specifications' && question.question.includes('existing product data feeds')) {
        if (answer.includes('yes') || answer.includes('api') || answer.includes('xml') || answer.includes('csv')) {
          requirements.technical.push({
            id: 'data_feed_integration',
            description: 'Integration with existing product data feeds',
            priority: 'high',
            agents: ['full_stack_engineer', 'solutions_architect']
          });
        }
      }

      if (question.category === 'business_process' && question.question.includes('current process for managing customers')) {
        requirements.business.push({
          id: 'current_crm_process',
          description: `Understand current CRM process: ${answer}`,
          priority: 'medium',
          agents: ['solutions_architect']
        });
      }

      if (question.category === 'user_roles' && question.question.includes('Who will be using this system')) {
        requirements.functional.push({
          id: 'role_based_access',
          description: `Role-based access for users: ${answer}`,
          priority: 'critical',
          agents: ['full_stack_engineer', 'security_engineer']
        });
      }

      if (question.category === 'integrations' && question.question.includes('existing tools need to connect')) {
        if (answer.includes('email')) {
          requirements.functional.push({
            id: 'email_integration',
            description: 'Email system integration',
            priority: 'high',
            agents: ['full_stack_engineer']
          });
        }
        if (answer.includes('calendar')) {
          requirements.functional.push({
            id: 'calendar_integration',
            description: 'Calendar integration',
            priority: 'high',
            agents: ['full_stack_engineer']
          });
        }
      }

      if (question.category === 'custom_features' && answer.includes('yes')) {
        requirements.functional.push({
          id: 'custom_order_personalization',
          description: 'Custom order and personalization features',
          priority: 'high',
          agents: ['full_stack_engineer']
          });
      }

      if (question.category === 'enterprise_features' && answer.includes('yes')) {
        requirements.functional.push({
          id: 'role_based_permissions_workflows',
          description: 'Role-based permissions and approval workflows',
          priority: 'critical',
          agents: ['full_stack_engineer', 'solutions_architect', 'security_engineer']
        });
      }

    }
    
    return requirements;
  }
}

export const projectDiscoveryManager = new ProjectDiscoveryManager();
export const questionFlowManager = new QuestionFlowManager();
export const requirementsGenerator = new RequirementsGenerator();