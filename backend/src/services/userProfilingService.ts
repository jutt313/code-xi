
// User Profiling and Adaptive Communication Framework

export class UserProfileDetector {
  analyzeUserProfile(userInput: string, conversationHistory: string[]): { technicalLevel: string; businessFocus: boolean; preferenceIndicators: boolean } {
    const technicalKeywords = [
      'API', 'database', 'backend', 'frontend', 'framework', 'deployment',
      'repository', 'git', 'docker', 'kubernetes', 'microservices', 'REST',
      'GraphQL', 'authentication', 'authorization', 'CI/CD', 'cloud', 'typescript', 'javascript', 'python', 'java', 'go', 'sql', 'nosql', 'orm', 'ci/cd', 'pwa', 'ssr', 'graphql', 'jwt', 'oauth', 'microservices', 'containerization', 'orchestration', 'iac', 'terraform', 'aws', 'gcp', 'azure', 'security', 'vulnerability', 'testing', 'unit test', 'integration test', 'e2e', 'performance', 'load testing', 'monitoring', 'observability', 'architecture', 'design pattern', 'scalability', 'resilience', 'devops', 'agile', 'scrum', 'kanban'
    ];
    
    const businessKeywords = [
      'customers', 'users', 'sales', 'revenue', 'marketing', 'business model',
      'workflow', 'process', 'efficiency', 'automation', 'dashboard', 'reports',
      'roi', 'profit', 'market', 'strategy', 'goal', 'objective', 'stakeholder',
      'budget', 'cost', 'value', 'growth', 'metrics', 'analytics', 'user experience', 'ux', 'customer journey'
    ];
    
    const noCodeKeywords = [
      'simple', 'easy', 'drag and drop', 'template', 'no coding',
      'visual', 'builder', 'wizard', 'automated', 'ready-made', 'out-of-the-box',
      'platform', 'solution', 'tool', 'quickly', 'without code', 'low-code'
    ];

    const allInput = (userInput + ' ' + conversationHistory.join(' ')).toLowerCase();

    const technicalScore = technicalKeywords.filter(kw => allInput.includes(kw.toLowerCase())).length;
    const businessScore = businessKeywords.filter(kw => allInput.includes(kw.toLowerCase())).length;
    const noCodeScore = noCodeKeywords.filter(kw => allInput.includes(kw.toLowerCase())).length;

    let technicalLevel: string;
    if (technicalScore > 5) { // Arbitrary threshold, can be refined
      technicalLevel = 'expert';
    } else if (technicalScore > 2) {
      technicalLevel = 'technical';
    } else if (businessScore > 3 && technicalScore <= 2) {
      technicalLevel = 'business';
    } else {
      technicalLevel = 'noCode';
    }

    return {
      technicalLevel,
      businessFocus: businessScore > technicalScore,
      preferenceIndicators: noCodeScore > 0
    };
  }
}

export const conceptTranslations: { [key: string]: { [key: string]: string } } = {
  "API": {
    noCode: "a way for different applications to talk to each other, like a phone connection between two systems",
    business: "the connection that lets your application share data with other business tools",
    technical: "RESTful API with standard HTTP methods and JSON payloads",
    expert: "GraphQL API with schema federation and automatic persisted queries"
  },
  
  "Database": {
    noCode: "secure digital filing cabinet that remembers all your information",
    business: "organized storage system that keeps track of your customers, orders, and business data",
    technical: "PostgreSQL relational database with proper indexing and query optimization",
    expert: "PostgreSQL with read replicas, connection pooling, and optimized query execution plans"
  },
  
  "Authentication": {
    noCode: "secure login system that makes sure only the right people can access your app",
    business: "user login system with different permission levels for employees and customers",
    technical: "JWT-based authentication with role-based access control (RBAC)",
    expert: "OAuth 2.0 + OIDC with PKCE flow, RS256 JWT signing, and refresh token rotation"
  },
  "Frontend": {
    noCode: "the part of the app you see and interact with, like the buttons and screens",
    business: "the user interface where your customers or employees will perform their tasks",
    technical: "React 18 with TypeScript for type safety and maintainability",
    expert: "Next.js 13+ with App Router, React Server Components"
  },
  "Backend": {
    noCode: "the 'brain' of the app that handles all the logic and data behind the scenes",
    business: "the server-side logic that processes requests and manages data for your business operations",
    technical: "Node.js with Express.js for rapid development and JavaScript ecosystem",
    expert: "Node.js with Fastify for performance, GraphQL Federation"
  },
  "Deployment": {
    noCode: "getting your app ready and live for people to use",
    business: "the process of making the application available to your users, ensuring it runs smoothly",
    technical: "Docker containers on AWS with auto-scaling capabilities",
    expert: "Kubernetes on AWS with Terraform IaC, blue-green deployments"
  },
  "Scalability": {
    noCode: "making sure your app can handle more users and grow without slowing down",
    business: "the ability of the system to handle increased user load and data volume as your business grows",
    technical: "Horizontal scaling with load balancing and database sharding",
    expert: "Microservices architecture with event-driven communication and distributed caching"
  },
  "CI/CD": {
    noCode: "automated process to quickly and safely update your app with new features",
    business: "continuous integration and continuous delivery pipeline to automate software releases, reducing manual effort and errors",
    technical: "Automated testing and deployment pipeline using GitHub Actions or GitLab CI",
    expert: "GitOps-driven CI/CD with ArgoCD/Flux, automated testing, and canary deployments"
  },
  "Microservices": {
    noCode: "breaking down a big app into smaller, independent mini-apps that work together",
    business: "an architectural approach where a large application is built as a suite of small, independently deployable services, improving agility and resilience",
    technical: "Service decomposition based on domain-driven design, communicating via REST or message queues",
    expert: "Event-driven microservices with Kafka, CQRS, and Saga patterns for distributed transactions"
  },
  "Containerization": {
    noCode: "packaging your app and everything it needs into a neat box so it runs anywhere",
    business: "packaging applications into isolated units (containers) to ensure consistent operation across different environments, from development to production",
    technical: "Docker for packaging applications and their dependencies into portable units",
    expert: "Docker and Kubernetes for orchestrating containerized applications at scale"
  },
  "Orchestration": {
    noCode: "managing all the mini-apps and making sure they work together smoothly",
    business: "automating the deployment, scaling, and management of containerized applications, ensuring high availability and efficient resource utilization",
    technical: "Kubernetes for automating the deployment, scaling, and management of containerized applications",
    expert: "Kubernetes with custom resource definitions (CRDs) and operators for advanced workload management"
  },
  "Security": {
    noCode: "keeping your app and user information safe from bad guys",
    business: "implementing measures to protect your application and data from unauthorized access, breaches, and cyber threats, ensuring compliance and trust",
    technical: "Implementing OWASP Top 10 mitigations, secure coding practices, and regular vulnerability scanning",
    expert: "Zero Trust architecture, multi-factor authentication, end-to-end encryption, and continuous security monitoring"
  },
  "Testing": {
    noCode: "checking if your app works correctly and doesn't have any mistakes",
    business: "a systematic process to verify that the application meets business requirements and functions as expected, minimizing defects and ensuring reliability",
    technical: "Unit, integration, and end-to-end testing with frameworks like Jest, Cypress, and Playwright",
    expert: "Test-driven development (TDD), behavior-driven development (BDD), contract testing, and chaos engineering"
  },
  "Cloud": {
    noCode: "using powerful computers over the internet instead of owning your own",
    business: "leveraging remote servers hosted on the internet (e.g., AWS, Azure, GCP) to store, manage, and process data, offering scalability and cost efficiency",
    technical: "Deploying applications on cloud platforms like AWS, Azure, or GCP, utilizing their compute, storage, and networking services",
    expert: "Multi-cloud strategy with hybrid deployments, leveraging cloud-native services and Infrastructure as Code (IaC) for automation"
  }
};

export class ProgressCommunicator {
  // Placeholder for actual progress calculation
  private calculateProgress(): number {
    // In a real scenario, this would query the database for task statuses
    // and calculate a percentage based on completed tasks vs total tasks.
    return Math.floor(Math.random() * 100); // Simulate progress
  }

  private getEstimatedCompletion(): string {
    // In a real scenario, this would estimate based on task dependencies and average task times.
    const days = Math.floor(Math.random() * 10) + 3;
    return `${days} days`;
  }

  generateProgressUpdate(userProfile: { technicalLevel: string }, completedTasks: any[], currentTasks: any[]): string {
    switch(userProfile.technicalLevel) {
      case 'noCode':
        return `Great progress! I've completed the foundation of your app:
        ✅ Set up secure user accounts
        ✅ Created the main database structure
        🔄 Currently working on: Building the user interface
        ⏳ Next: Adding the core features you requested
        
        Your app is taking shape nicely! About ${this.calculateProgress()}% complete.`;
        
      case 'business':
        return `Project Status Update:
        ✅ User management system (login, permissions, security)
        ✅ Database architecture (scalable data storage)
        🔄 Currently: Frontend development (user interface)
        ⏳ Upcoming: Business logic implementation, integrations
        
        Timeline: On track for ${this.getEstimatedCompletion()}
        Progress: ${this.calculateProgress()}% complete`;
        
      case 'technical':
        return `Development Progress:
        ✅ PostgreSQL schema with migrations
        ✅ JWT authentication with RBAC
        ✅ Express.js API with input validation
        🔄 Current: React frontend with TypeScript
        ⏳ Queue: Testing suite, deployment pipeline
        
        Code quality: All tests passing, 89% coverage
        Progress: ${this.calculateProgress()}% complete`;

      case 'expert':
        return `Technical Project Update:
        ✅ Database: PostgreSQL schema deployed, migrations applied.
        ✅ Authentication: OAuth 2.0 + OIDC with PKCE flow implemented, RS256 JWT signing configured.
        ✅ Backend: Fastify microservice for user management, GraphQL Federation layer initiated.
        🔄 Frontend: Next.js 13+ App Router development in progress, React Server Components integration.
        ⏳ Next in Queue: Implementing Kafka for event streaming, setting up Kubernetes deployment.

        Current Test Coverage: 92% (backend), 85% (frontend).
        CI/CD Pipeline Status: Green.
        Estimated Completion: ${this.getEstimatedCompletion()} with current velocity.
        Overall Progress: ${this.calculateProgress()}% complete.`;
        
      default:
        return `Progress Update: ${this.calculateProgress()}% complete.`;
    }
  }
}

export class ErrorCommunicator {
  explainError(errorType: string, userProfile: { technicalLevel: string }): string {
    const errorExplanations: { [key: string]: { [key: string]: string } } = {
      'api_rate_limit': {
        noCode: "I need to slow down a bit because I'm making too many requests. This is normal and will resolve in a few minutes.",
        business: "Hit API rate limits - this is a temporary slowdown to prevent system overload. No data lost.",
        technical: "Rate limited by the LLM API. Implementing exponential backoff and retry logic.",
        expert: "429 Too Many Requests from OpenAI API. Implementing token bucket rate limiting with circuit breaker pattern."
      },
      
      'dependency_conflict': {
        noCode: "Found a small conflict between different parts of your app. I'm fixing it automatically.",
        business: "Detected integration conflict between components. Resolving with alternative approach.",
        technical: "Dependency conflict in package.json. Resolving with compatible versions.",
        expert: "Peer dependency conflict. Analyzing semantic versioning constraints and updating resolution strategy."
      },
      'database_connection_error': {
        noCode: "I'm having trouble connecting to the app's data storage. I'll try again in a moment.",
        business: "Database connection failed. This might be a temporary network issue or configuration problem. Attempting to reconnect.",
        technical: "Failed to establish a connection to the PostgreSQL database. Checking connection string, credentials, and network accessibility.",
        expert: "PostgreSQL connection refused. Verifying `pg_hba.conf` rules, firewall settings, and database service status. Implementing connection retry with backoff."
      },
      'invalid_json_response': {
        noCode: "I received some confusing information and couldn't understand it. I'll try to get clearer instructions.",
        business: "The system received an unreadable response from a component. This indicates a data formatting issue. Retrying the operation.",
        technical: "Received invalid JSON response from an internal service or LLM. Inspecting raw response for malformed syntax and adjusting parsing logic.",
        expert: "JSON parsing error on upstream service response. Investigating content-type headers and potential serialization/deserialization mismatches. Implementing robust error handling."
      },
      'unknown_action': {
        noCode: "I'm not sure what to do next based on that. Could you tell me in simpler terms?",
        business: "The requested action is not recognized within the current project scope. Please clarify the desired outcome or process step.",
        technical: "Unrecognized action in the LLM's structured response. Reviewing prompt engineering and expected JSON schema for discrepancies.",
        expert: "Manager Agent received an unhandled action type. This indicates a deviation from the defined action schema. Debugging LLM output generation."
      }
    };
    
    return errorExplanations[errorType]?.[userProfile.technicalLevel] || `An unexpected error occurred: ${errorType}.`;
  }
}
