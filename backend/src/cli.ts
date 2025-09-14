import 'dotenv/config';
import inquirer from 'inquirer';

let authToken: string | null = null;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

const modes = [
    'Code-XI-Local',
    'Code-XI',
    'Code-XI-Pioneer',
    'Code-XI-Guardian',
    'Code-XI-Versatile',
];

// Helper for authenticated API calls
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!authToken) {
        throw new Error('Not authenticated. Please log in.');
    }
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error: ${errorData.message || response.statusText} (Status: ${response.status})`);
    }
    return response.json();
};

const handleRegister = async () => {
    const { email, password } = await inquirer.prompt([
        { type: 'input', name: 'email', message: 'Enter your email:', validate: (input) => input.includes('@') || 'Please enter a valid email.' },
        { type: 'password', name: 'password', message: 'Enter your password:', mask: '*', validate: (input) => input.length >= 6 || 'Password must be at least 6 characters.' },
    ]);

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || response.statusText);
        }
        console.log('Registration successful! Please log in.');
    } catch (error) {
        console.error('Registration failed:', (error as Error).message);
    }
};

const handleLogin = async () => {
    const { email, password } = await inquirer.prompt([
        { type: 'input', name: 'email', message: 'Enter your email:' },
        { type: 'password', name: 'password', message: 'Enter your password:', mask: '*' },
    ]);

    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || response.statusText);
        }
        const data = await response.json();
        authToken = data.token;
        console.log('Login successful!');
        return true;
    } catch (error) {
        console.error('Login failed:', (error as Error).message);
        return false;
    }
};

const handleLoginWithToken = async () => {
    const { token } = await inquirer.prompt([
        { type: 'password', name: 'token', message: 'Paste your JWT token:', mask: '*' },
    ]);

    if (token) {
        authToken = token;
        console.log('Token set successfully!');
        // Optionally, verify token by making a simple authenticated call
        try {
            await authenticatedFetch(`${API_BASE_URL}/users/profile`);
            console.log('Token verified. Logged in.');
            return true;
        } catch (error) {
            authToken = null; // Clear invalid token
            console.error('Token verification failed. Please check your token.', (error as Error).message);
            return false;
        }
    }
    return false;
};

const projectConversationLoop = async (projectId: number, projectName: string) => {
    console.log(`
Entering conversation mode for project: "${projectName}".\nType '/back' to return to the main menu.\n`);

    while (true) {
        const { prompt } = await inquirer.prompt([
            {
                type: 'input',
                name: 'prompt',
                message: `[${projectName}] What's next?`,
            },
        ]);

        if (prompt.toLowerCase() === '/back') {
            break;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/message`, {
                method: 'POST',
                body: JSON.stringify({ prompt }),
            });
            console.log(`Agent: ${response.message}`);
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('\nError processing message:', err.message);
            } else {
                console.error('\nAn unknown error occurred:', err);
            }
        }
    }
};

const createNewProject = async () => {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter a name for your project:',
            validate: (input) => input.trim() !== '' || 'Project name cannot be empty.',
        },
        {
            type: 'input',
            name: 'description',
            message: 'Enter a short description (optional):',
        },
        {
            type: 'list',
            name: 'mode',
            message: 'Select a mode:',
            choices: modes,
        },
        {
            type: 'input',
            name: 'initialPrompt',
            message: 'What would you like to build?',
            validate: (input) => input.trim() !== '' || 'Initial prompt cannot be empty.',
        },
        {
            type: 'input',
            name: 'codebasePath',
            message: '(Optional) Enter the absolute path to an existing project directory:',
        },
    ]);

    try {
        console.log('\nInitiating project creation...');
        const response = await authenticatedFetch(`${API_BASE_URL}/projects/create`, {
            method: 'POST',
            body: JSON.stringify(answers),
        });
        console.log(`\nManager Agent: ${response.message}`);
        await projectConversationLoop(response.projectId, answers.name);
    } catch (err: unknown) {
        if (err instanceof Error) {
                console.error('\nError during project creation:', err.message);
            } else {
                console.error('\nAn unknown error occurred:', err);
            }
    }
};

const openExistingProject = async () => {
    try {
        const projects = await authenticatedFetch(`${API_BASE_URL}/projects`);
        if (projects.length === 0) {
            console.log('No projects found.');
            return;
        }

        const { projectId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'projectId',
                message: 'Select a project to open:',
                choices: projects.map((p: any) => ({ name: `${p.name} - ${p.description || 'No description'}`, value: p.id })),
            },
        ]);

        const selectedProject = projects.find((p: any) => p.id === projectId);
        if (selectedProject) {
            await projectConversationLoop(selectedProject.id, selectedProject.name);
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('\nError fetching projects:', err.message);
        } else {
            console.error('\nAn unknown error occurred:', err);
        }
    }
};

const main = async () => {
    console.clear();
    console.log('\x1b[34m'); // Set color to blue
    console.log('   ___          _           ___  _ ');
    console.log('  / __|___ _ __| |__ _ _ _ |__ \(_)');
    console.log(' | (__/ _ \ \'_ \ / _` | \' \ / _/| |');
    console.log('  \___\___/_.__/_\__,_|_||_|_|  |_|');
    console.log('\x1b[0m'); // Reset color
    console.log('\x1b[36m   Your AI-Powered Development Partner\x1b[0m');
    console.log('\n--------------------------------------\n');

    while (!authToken) {
        const { authAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'authAction',
                message: 'Please log in or register:',
                choices: [
                    { name: 'Login', value: 'login' },
                    { name: 'Register', value: 'register' },
                    { name: 'Login with Token', value: 'loginWithToken' },
                    { name: 'Exit', value: 'exit' },
                ],
            },
        ]);

        if (authAction === 'exit') {
            console.log('Goodbye!');
            process.exit(0);
        } else if (authAction === 'login') {
            const loggedIn = await handleLogin();
            if (loggedIn) break; // Exit loop if login successful
        } else if (authAction === 'register') {
            await handleRegister();
        } else if (authAction === 'loginWithToken') {
            const loggedIn = await handleLoginWithToken();
            if (loggedIn) break; // Exit loop if token set successfully
        }
    }

    // Main project loop after authentication
    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Create a new project', value: 'new' },
                    { name: 'Open an existing project', value: 'open' },
                    { name: 'Logout', value: 'logout' },
                    { name: 'Exit', value: 'exit' },
                ],
            },
        ]);

        if (action === 'exit') {
            console.log('Goodbye!');
            process.exit(0);
        } else if (action === 'logout') {
            authToken = null;
            console.log('Logged out.');
            // Loop will restart and prompt for login/register again
        } else if (action === 'new') {
            await createNewProject();
        } else if (action === 'open') {
            await openExistingProject();
        }
    }
};

main();