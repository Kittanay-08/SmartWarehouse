import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './Dashboard';
import Login from './Login';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('asrs_user');
  
  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  // Self-heal token if user profile exists
  if (!token && user) {
    try {
      const parsed = JSON.parse(user);
      localStorage.setItem('token', `asrs_session_${parsed.username || 'user'}_${Date.now()}`);
    } catch {
      localStorage.setItem('token', `asrs_session_${Date.now()}`);
    }
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Dashboard autoOpenProfile={true} />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;