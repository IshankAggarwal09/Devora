import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
