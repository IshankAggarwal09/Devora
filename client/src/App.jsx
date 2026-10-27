import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import CreateBattle from './pages/CreateBattle';
import JoinBattle from './pages/JoinBattle';
import BattleLobby from './pages/BattleLobby';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminProblems from './pages/AdminDashboard';
import AdminCreateProblem from './pages/AdminCreateProblem';
import AdminEditProblem from './pages/AdminEditProblem';
import KanbanBoard from './pages/KanbanBoard';
import Navbar from './components/Navbar';

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Rehydrate session on mount
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-ink text-foreground flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Dashboard />} />
              <Route path="/problems" element={<Problems />} />
              <Route path="/problems/:slug" element={<ProblemDetail />} />
              <Route path="/battles/create" element={<CreateBattle />} />
              <Route path="/battles/join" element={<JoinBattle />} />
              <Route path="/battles/:roomCode" element={<BattleLobby />} />
              <Route path="/projects/:projectId/board" element={<KanbanBoard />} />
              {/* Default protected redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/problems" element={<AdminProblems />} />
              <Route path="/admin/problems/new" element={<AdminCreateProblem />} />
              <Route path="/admin/problems/:id/edit" element={<AdminEditProblem />} />
              {/* Legacy /admin redirect */}
              <Route path="/admin" element={<Navigate to="/admin/problems" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
