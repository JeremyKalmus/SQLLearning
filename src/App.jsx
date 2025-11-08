import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import CheatSheetSlider from './components/CheatSheetSlider';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Flashcards from './pages/Flashcards';
import Problems from './pages/Problems';

function App() {
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header onToggleCheatSheet={() => setIsCheatSheetOpen(!isCheatSheetOpen)} />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flashcards"
                element={
                  <ProtectedRoute>
                    <Flashcards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/problems"
                element={
                  <ProtectedRoute>
                    <Problems />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <CheatSheetSlider
            isOpen={isCheatSheetOpen}
            onClose={() => setIsCheatSheetOpen(false)}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
