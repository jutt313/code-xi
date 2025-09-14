# Code-XI: Comprehensive Platform Documentation

## 1. Introduction

Code-XI is an ambitious AI-powered development platform designed to revolutionize software creation. Its core mission is to replace traditional, multi-person development teams with a highly specialized team of 8 AI agents, capable of transforming high-level user requests into complete, production-ready applications.

### 1.1 The Problem Code-XI Solves

Traditional software development is characterized by high costs, long timelines, and significant coordination overhead. Code-XI aims to eliminate these bottlenecks:

*   **Traditional:** Requires hiring 5-10 specialized human developers (frontend, backend, mobile, DevOps, security, QA), leading to 3-6 months of development, $200,000-$500,000 in costs, and communication challenges.
*   **Code-XI:** Offers a single platform with 8 AI specialists, delivering complete applications in days (not months) for a fraction of the cost ($50-$300 total). It eliminates human coordination issues and includes comprehensive documentation and deployment.

### 1.2 Core Vision

Code-XI represents the evolution from AI-assisted development to AI-delivered development, transforming software creation from a months-long team effort into a conversational interaction that delivers enterprise-quality applications.

## 2. The 8 Specialized AI Agents

Code-XI's intelligence is distributed among 8 specialized AI agents, each with a distinct role and optimized AI model. All inter-agent communication is routed exclusively through the Manager Agent.

### 2.1 Manager Agent (The Orchestrator)
*   **Role:** Supreme coordinator, user interface, and project manager.
*   **AI Model:** GPT-4 (best at strategic thinking and coordination).
*   **Responsibilities:**
    *   Only agent communicating directly with users.
    *   Analyzes user requests, creates comprehensive project plans with task dependencies.
    *   Coordinates all other agents, manages project timeline, and makes final decisions.
    *   **Dynamic & Conversational:** Adapts its communication based on user's background (developer, no-code) and maintains project context. Takes over project management after initial user explanation.
    *   **Granular Approval:** Presents plans for approval (whole plan or phase-by-phase).
    *   **Proactive Recommendations:** Suggests optimal starting points (e.g., database vs. UI).

### 2.2 Full-Stack Engineer Agent
*   **Role:** Complete application development.
*   **AI Model:** Claude Opus 4 (superior coding capabilities).
*   **Capabilities:** Frontend (React, Vue, Angular), Backend (Node.js, Python, Java, Go), Database design/implementation (PostgreSQL, MongoDB), API development (REST, GraphQL), Mobile app development (React Native, Flutter).

### 2.3 Solutions Architect Agent
*   **Role:** System design and technology strategy.
*   **AI Model:** GPT-4 (excellent at architectural planning).
*   **Responsibilities:** Designs overall system architecture, selects optimal technology stacks, creates scalability/performance strategies, designs integration patterns, documents architectural decisions.

### 2.4 DevOps Engineer Agent
*   **Role:** Infrastructure and deployment automation.
*   **AI Model:** Gemini Pro (strong with cloud platforms).
*   **Capabilities:** Cloud infrastructure setup (AWS, GCP, Azure), Container orchestration (Docker, Kubernetes), CI/CD pipeline creation, Monitoring/alerting systems, Database management/scaling.

### 2.5 Security Engineer Agent
*   **Role:** Security implementation and compliance.
*   **AI Model:** Claude Opus 4 (excellent security analysis).
*   **Responsibilities:** Security vulnerability assessment, Authentication/authorization systems, Data encryption/protection, Compliance (GDPR, HIPAA, PCI-DSS), Security monitoring/incident response.

### 2.6 QA Engineer Agent
*   **Role:** Quality assurance and testing.
*   **AI Model:** Claude Sonnet 4 (systematic testing approach).
*   **Capabilities:** Automated test suite creation, Performance testing/optimization, Cross-browser/device compatibility testing, User experience validation, Bug detection/regression testing.

### 2.7 Documentation Specialist Agent
*   **Role:** Technical writing and knowledge management.
*   **AI Model:** Claude Sonnet 4 (excellent technical writing).
*   **Outputs:** User guides/tutorials, API documentation, Technical specifications, Installation/setup guides, Troubleshooting documentation.

### 2.8 Performance Engineer Agent
*   **Role:** Optimization and monitoring.
*   **AI Model:** Gemini Pro (good at performance analysis).
*   **Focus Areas:** Application performance optimization, Database query optimization, Caching strategies, Load testing/capacity planning, Real-time performance monitoring.

## 3. How Code-XI Works: Step-by-Step Process

The process is orchestrated by the Manager Agent, guiding the project from initial request to final delivery.

### 3.1 User Input & Intent Recognition
1.  **User Submits Request:** User provides project requirements via CLI (future: web interface).
2.  **Manager Agent Classifies Intent:** Before costly planning, a lightweight AI call classifies the user's input as a 'greeting', 'question', or 'project_request'.
    *   If 'greeting'/'question': Manager Agent responds conversationally.
    *   If 'project_request': Proceeds to detailed planning.

### 3.2 Project Creation & Planning
1.  **Project Naming:** User provides a project name and optional description.
2.  **Mode Selection:** User selects a mode (e.g., `Code-XI-Local`, `Code-XI-Pioneer`). This mode dictates the AI model used by *all* agents for that project.
3.  **Initial Prompt:** User provides the core project request.
4.  **Codebase Awareness (Optional):** User can provide an absolute path to an existing project directory. The Manager Agent will then offer options for scanning:
    *   Full detail/summary (read all relevant files, test, summarize).
    *   Just file names and structure.
    *   Only specific file types (e.g., `.md` files).
    *   The Manager Agent will perform the scan based on user choice and store the findings.
5.  **Manager Agent Generates Plan:** Using the user's request and any scanned codebase context, the Manager Agent creates a comprehensive project plan (50-100+ tasks) with phases, durations, assigned agents, and dependencies.

### 3.3 User Approval & Dynamic Interaction
1.  **Plan Presentation:** Manager Agent presents the detailed plan to the user.
2.  **Granular Approval:** User can approve the entire plan or phase-by-phase. Manager Agent can also recommend optimal starting points (e.g., database first, UI first).
3.  **Continuous Conversation:** After approval, the CLI enters a "Project Conversation Mode." The user can continuously interact with the Manager Agent, providing follow-up instructions, asking questions, or requesting modifications. The Manager Agent maintains full project context and memory.

### 3.4 Parallel Agent Execution
Once approved, the Manager Agent coordinates simultaneous work:
*   **Task Distribution:** Manager Agent adds tasks to dedicated BullMQ queues for each specialist agent.
*   **Agent Processing:** Specialist agents retrieve tasks, execute them using their tools (file read/write, command execution), and save decisions to memory.
*   **Inter-Agent Communication:** All communication flows through the Manager Agent, ensuring coordination and conflict resolution.

### 3.5 Integration and Quality Assurance
Manager Agent ensures all components work together:
*   Validates frontend-backend connections, database schema, mobile app sync, security implementations, and deployment scripts.

### 3.6 Final Delivery
User receives a complete package:
*   **Source Code:** Web app, backend, mobile apps, database scripts, config files.
*   **Infrastructure:** Infrastructure as code (Terraform/CloudFormation), Docker containers, CI/CD pipelines, monitoring.
*   **Documentation:** API docs, user manuals, admin guides, technical docs, troubleshooting.
*   **Testing:** Comprehensive test suites, performance/security test reports.

## 4. User Experience (UX) Flow

### 4.1 CLI Experience (Current Focus & Advanced Users)

*   **Initial Login/Register:** User logs in or registers via CLI.
*   **Main Menu:** `Create a new project`, `Open an existing project`, `Exit`.
*   **Project Creation Flow:** Prompts for name, description, mode, initial prompt, optional codebase path.
*   **Project Conversation Mode:** `[Project: Your-Project-Name] What's next?` prompt for continuous interaction.
*   **Commands:** `/back` to exit project conversation. Future CLI commands like `code-xi status [project_id]`, `code-xi download [project_id]`, `code-xi modify [project_id]`.

### 4.2 Web Interface Experience (Future)

*   **Project Creation Page:** Simple form for project details.
*   **Requirements Chat:** Conversational interface with Manager Agent, allowing mockups/wireframes upload, real-time cost/timeline estimates.
*   **Project Plan Review:** Detailed breakdown, tech stack, timeline, cost, approval.
*   **Development Dashboard:** Live progress tracking, real-time updates, communication with Manager Agent, preview links.
*   **Delivery and Download:** Complete project files, deployment instructions, documentation, option for modifications.

## 5. Pricing and Business Model

*   **Free Tier:** 3 messages/day with Manager Agent, simple project templates, community support.
*   **Pay-Per-Message:** $0.25/message to any agent (transparent pricing). Typical projects: 200-800 messages ($50-$200 total).
*   **Monthly Plans:** Starter ($49/month, 300 messages), Professional ($149/month, 1,000 messages), Enterprise ($499/month, unlimited messages + priority support).

## 6. Technical Architecture

### 6.1 Backend Infrastructure
*   **Core:** Node.js with TypeScript and Express.js.
*   **Database:** PostgreSQL for data storage (users, projects, tasks, conversations, memory, usage, subscriptions).
*   **Queueing:** Redis for task queuing and BullMQ for agent task coordination.
*   **Real-time:** WebSocket connections for future real-time updates (e.g., to web UI or advanced CLI).

### 6.2 Agent Coordination System
*   Manager Agent maintains central task queue.
*   Each specialist agent processes tasks from dedicated queues.
*   All inter-agent communication flows through Manager Agent.
*   Database stores conversation history and project state.
*   Automatic retry and error recovery mechanisms.

### 6.3 Security and Reliability
*   User data encrypted at rest and in transit.
*   API rate limiting and DDoS protection.
*   Comprehensive error handling and logging.
*   Regular backups and disaster recovery procedures.
*   99.9% uptime service level agreement.

## 7. Competitive Advantages

*   **vs. GitHub Copilot:** Code-XI delivers complete applications, not just code completion.
*   **vs. Cursor/Claude Code:** Code-XI replaces a full development team, not just single developer assistance.
*   **vs. No-Code Platforms:** Code-XI provides full source code ownership and unlimited customization.
*   **vs. Traditional Development:** Code-XI offers days of delivery, transparent costs, and zero coordination overhead, compared to months of effort and high costs.

## 8. Current Status & Future Work

### 8.1 Implemented Features (as of current development)

*   **Core Backend:** Node.js, Express.js, PostgreSQL, Redis, BullMQ setup.
*   **Database Schema:** Corrected and includes `users`, `projects`, `agent_tasks`, `conversations`, `agent_memory`, `api_usage`, `subscriptions` tables.
*   **Authentication System:** Backend API endpoints for user registration and login (`/api/users/register`, `/api/users/login`) are implemented.
*   **API Client CLI:** The CLI is refactored to be an API client, handling login/registration and sending authenticated requests to the backend.
*   **Project Management API:** Backend API endpoints for project creation (`/api/projects/create`), messaging (`/api/projects/:projectId/message`), and listing (`/api/projects`) are implemented.
*   **Agent System Foundation:** `BaseAgent` class, all 8 specialist agent files, and `modelFactory` for dynamic LLM selection.
*   **Foundational Tools:** `readFile`, `writeFile` (with directory creation), `executeCommand`, `listDirectory` are implemented and integrated via the MCP router.
*   **Agent Orchestration (Basic):** Manager Agent can create project plans, store them, and schedule tasks based on dependencies.
*   **Mode System:** User-selected mode (e.g., `Code-XI-Local`, `Code-XI-Pioneer`) is correctly passed to and used by all agents for model selection.
*   **Ollama Integration:** Support for local, open-source models via Ollama is implemented, allowing free testing.
*   **Robust JSON Parsing:** Manager Agent handles non-JSON LLM responses with retries and corrective feedback.
*   **Improved Error Handling:** Custom error classes for foundational tools.
*   **Testing Suite:** Jest framework is set up with initial tests for foundational tools.
*   **Enhanced CLI UI:** Branded startup screen.

### 8.2 Pending Features (Next Development Phases)

*   **Full Conversational Flow (CLI):**
    *   **`ManagerAgent.processProjectMessage` Logic:** Implement the core intelligence for handling follow-up messages within a project. This includes:
        *   Retrieving project context and conversation history.
        *   Dynamic intent recognition for follow-up prompts (e.g., "add feature", "fix bug", "answer question").
        *   Updating project plans, creating new tasks, or providing direct answers based on intent.
        *   Saving conversation turns to the `conversations` table.
    *   **Codebase Awareness Logic:** Implement the detailed scanning logic for `codebase_path` (file content reading, summarization) and integrate it into the agent's memory.
    *   **Project Plan Approval in CLI:** Implement the granular approval workflow (whole plan/phase-by-phase).

*   **Real-time Updates:** Implement WebSocket connections for live progress tracking in the CLI (and future web UI).

*   **Specialized Tool Implementation:** Develop more advanced MCP servers for specific agent capabilities (e.g., direct cloud API interaction for DevOps, advanced security scanning for Security Engineer).

*   **Web Interface:** Build the full web-based UI for project creation, management, and interaction.

*   **Pricing/Subscription Logic:** Implement the full pricing model, API key generation for users, and usage tracking.

*   **Advanced Agent Memory & Learning:** Implement mechanisms for agents to learn from past experiences and improve performance over time.

This document provides a comprehensive overview of the Code-XI platform, its current state, and the roadmap for its future development.
