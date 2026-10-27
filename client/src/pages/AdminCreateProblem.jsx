import { Link } from 'react-router-dom';
import { ArrowLeft, FilePlus } from 'lucide-react';
import ProblemForm from '../components/ProblemForm';

const AdminCreateProblem = () => (
  <div className="min-h-screen bg-ink text-foreground">
    {/* Page Header */}
    <div className="border-b border-hairline bg-surface/50">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
        <Link
          to="/admin/problems"
          className="text-muted hover:text-foreground transition-colors p-1.5 rounded hover:bg-white/5"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-signal/10 border border-signal/20 flex items-center justify-center">
            <FilePlus size={14} className="text-signal" />
          </div>
          <div>
            <h1 className="font-bold font-display">New Problem</h1>
            <p className="text-xs text-muted">Admin · Create Problem</p>
          </div>
        </div>
      </div>
    </div>

    {/* Form */}
    <div className="max-w-5xl mx-auto px-6 py-8">
      <ProblemForm mode="create" />
    </div>
  </div>
);

export default AdminCreateProblem;
