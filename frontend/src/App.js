import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Separate state for register and login forms
  const [registerData, setRegisterData] = useState({ email: '', password: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:3001/api';

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, registerData);
      setMessage(response.data.message || 'Registration successful! Please log in.');
      setRegisterData({ email: '', password: '' }); // Clear form
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, loginData);
      setToken(response.data.token);
      setMessage('Login successful! Your token is displayed below.');
      setLoginData({ email: '', password: '' }); // Clear form
    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="App">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🚀 Code-XI</h1>
          <p>AI-Powered Development Platform</p>
        </div>

        <div className="auth-forms">
          {/* Register Form */}
          <div className="auth-form-container">
            <h2>Create Account</h2>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>or</span>
          </div>

          {/* Login Form */}
          <div className="auth-form-container">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`message ${token ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Token Display */}
        {token && (
          <div className="token-container">
            <h3>🎉 Authentication Successful!</h3>
            <p>Your JWT token is ready. Copy it to use with the Code-XI CLI:</p>
            <div className="token-display">
              <textarea
                readOnly
                value={token}
                rows={4}
                className="token-textarea"
              />
              <button 
                className="btn btn-copy"
                onClick={() => navigator.clipboard.writeText(token)}
              >
                📋 Copy Token
              </button>
            </div>
            <div className="next-steps">
              <h4>Next Steps:</h4>
              <ol>
                <li>Copy the token above</li>
                <li>Open your terminal</li>
                <li>Navigate to the backend directory</li>
                <li>Run: <code>npm run cli</code></li>
                <li>Use your token when prompted</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
