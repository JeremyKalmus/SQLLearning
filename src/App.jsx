import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Assessment from './pages/Assessment';
import AssessmentTake from './pages/AssessmentTake';
import AssessmentResults from './pages/AssessmentResults';
import Learn from './pages/Learn';
import TutorialView from './pages/Learn/TutorialView';

function AppContent() {
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const location = useLocation();

  // Hide CheatSheet on assessment pages
  const isAssessmentPage = location.pathname.startsWith('/assessment/take');

  return (
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
          <Route
            path="/assessment"
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/take/:userAssessmentId"
            element={
              <ProtectedRoute>
                <AssessmentTake />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/results/:userAssessmentId"
            element={
              <ProtectedRoute>
                <AssessmentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:slug"
            element={
              <ProtectedRoute>
                <TutorialView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isAssessmentPage && (
        <CheatSheetSlider
          isOpen={isCheatSheetOpen}
          onClose={() => setIsCheatSheetOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
