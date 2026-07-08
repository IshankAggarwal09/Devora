import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { fetchProblemBySlug, clearCurrentProblem } from '../store/problemsSlice';
import { submitSolution, runSolution, clearSubmission, fetchLatestSubmission } from '../store/submissionSlice';

const DIFFICULTY_COLORS = {
  easy: 'bg-verdict-green/20 text-verdict-green',
  medium: 'bg-host-amber/20 text-host-amber',
  hard: 'bg-verdict-red/20 text-verdict-red',
};

const STARTER_CODE = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n',
};

const ProblemDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentProblem, isLoading, error } = useSelector((state) => state.problems);
  const { currentSubmission, isSubmitting, error: submitError, runResult, isRunning, runError, lastSavedSubmission } = useSelector((state) => state.submission);
  const { user } = useSelector((state) => state.auth);

  const initialLang = localStorage.getItem('devora_default_language') || 'cpp';
  const [language, setLanguage] = useState(initialLang);
  const [code, setCode] = useState(STARTER_CODE[initialLang]);
  const [userCode, setUserCode] = useState({ cpp: STARTER_CODE.cpp, java: STARTER_CODE.java });

  useEffect(() => {
    dispatch(fetchProblemBySlug(slug));
    return () => {
      dispatch(clearCurrentProblem());
      dispatch(clearSubmission());
    };
  }, [dispatch, slug]);

  // Fetch latest submission once problem is loaded
  useEffect(() => {
    if (currentProblem?._id && user) {
      dispatch(fetchLatestSubmission(currentProblem._id));
    }
  }, [dispatch, currentProblem?._id, user]);

  // Populate editor with last saved submission if it exists
  useEffect(() => {
    if (lastSavedSubmission) {
      setLanguage(lastSavedSubmission.language);
      setCode(lastSavedSubmission.code);
      setUserCode((prev) => ({ ...prev, [lastSavedSubmission.language]: lastSavedSubmission.code }));
    }
  }, [lastSavedSubmission]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    // Save current code to the old language
    setUserCode((prev) => ({ ...prev, [language]: code }));
    setLanguage(newLang);
    setCode(userCode[newLang] || '');
    localStorage.setItem('devora_default_language', newLang);
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleSubmit = () => {
    if (!currentProblem) return;
    dispatch(submitSolution({
      problemId: currentProblem._id,
      language,
      code,
    }));
  };

  const handleRun = () => {
    if (!currentProblem) return;
    dispatch(runSolution({
      problemId: currentProblem._id,
      language,
      code,
    }));
  };

  const isSolved = currentProblem && user?.solvedProblems?.includes(currentProblem._id);

  if (isLoading || !currentProblem) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink p-8">
        <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm max-w-lg mx-auto mt-20">
          <p className="text-verdict-red">{error}</p>
          <Link to="/problems" className="text-signal hover:underline mt-4 inline-block text-sm">
            &larr; Back to problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-foreground flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Left Pane: Description */}
      <div className="w-full lg:w-[45%] h-full overflow-y-auto border-r border-hairline p-6 space-y-8">
        <div>
          <Link to="/problems" className="inline-flex items-center text-muted hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Practice
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display">{currentProblem.title}</h1>
            {isSolved && <CheckCircle2 className="w-6 h-6 text-verdict-green" />}
          </div>
          <div className="flex gap-2 mt-4">
            <span className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider ${DIFFICULTY_COLORS[currentProblem.difficulty]}`}>
              {currentProblem.difficulty}
            </span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-foreground/90 prose-headings:font-display prose-headings:text-foreground max-w-none">
          <ReactMarkdown>{currentProblem.description}</ReactMarkdown>
        </div>

        {currentProblem.testCases && currentProblem.testCases.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-display border-b border-hairline pb-2">Sample Test Cases</h3>
            {currentProblem.testCases.map((tc, index) => (
              <div key={tc._id || index} className="bg-surface border border-hairline rounded-sm overflow-hidden font-utility text-sm">
                <div className="bg-hairline/30 px-4 py-2 border-b border-hairline font-bold text-muted">
                  Test Case {index + 1}
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-muted mb-1 text-xs uppercase tracking-wider">Input:</div>
                    <pre className="text-foreground whitespace-pre-wrap break-words">{tc.input}</pre>
                  </div>
                  <div>
                    <div className="text-muted mb-1 text-xs uppercase tracking-wider">Expected Output:</div>
                    <pre className="text-foreground whitespace-pre-wrap break-words">{tc.expectedOutput}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-bold font-display border-b border-hairline pb-2">Constraints</h3>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80 font-utility text-sm">
            {currentProblem.constraints?.map((constraint, i) => (
              <li key={i}>{constraint}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Pane: Editor & Output */}
      <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="h-12 bg-surface border-b border-hairline flex items-center justify-between px-4 shrink-0">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-ink text-sm border border-hairline rounded-sm py-1 px-3 focus:outline-none focus:border-signal font-utility"
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="bg-ink text-muted border border-hairline px-6 py-1.5 rounded-sm font-semibold text-sm hover:text-foreground hover:border-signal disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="bg-signal text-ink px-6 py-1.5 rounded-sm font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-grow relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"IBM Plex Mono", monospace',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Verdict Panel */}
        <div className="h-64 bg-surface border-t border-hairline shrink-0 overflow-y-auto p-4 flex flex-col font-utility text-sm">
          <h3 className="text-muted uppercase tracking-wider text-xs mb-3 font-body font-bold">Execution Result</h3>
          
          {submitError && !isRunning && (
            <div className="text-verdict-red p-3 bg-verdict-red/10 border border-verdict-red/20 rounded-sm">
              {submitError}
            </div>
          )}

          {runError && !isSubmitting && (
            <div className="text-verdict-red p-3 bg-verdict-red/10 border border-verdict-red/20 rounded-sm">
              {runError}
            </div>
          )}

          {!submitError && !runError && !currentSubmission && !runResult && (
            <div className="text-muted/50 flex-grow flex items-center justify-center italic">
              Run your code to see results here.
            </div>
          )}

          {/* Render Run Results */}
          {runResult && !currentSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">
                  Run Results
                </span>
                {runResult.executionTime !== undefined && (
                  <span className="text-muted">
                    Total Time: {runResult.executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {runResult.results.map((res, idx) => (
                  <div key={idx} className={`p-4 rounded-sm border ${res.passed ? 'bg-verdict-green/10 border-verdict-green/30' : 'bg-verdict-red/10 border-verdict-red/30'}`}>
                    <div className={`font-bold mb-2 ${res.passed ? 'text-verdict-green' : 'text-verdict-red'}`}>
                      Sample {idx + 1}: {res.status} {res.executionTime ? `(${res.executionTime.toFixed(2)}ms)` : ''}
                    </div>
                    <div className="space-y-3 mt-3 text-xs">
                      <div>
                        <div className="text-muted mb-1 uppercase tracking-wider">Input:</div>
                        <pre className="text-foreground whitespace-pre-wrap">{res.input}</pre>
                      </div>
                      <div>
                        <div className="text-muted mb-1 uppercase tracking-wider">Expected Output:</div>
                        <pre className="text-foreground whitespace-pre-wrap">{res.expectedOutput}</pre>
                      </div>
                      <div>
                        <div className="text-muted mb-1 uppercase tracking-wider">Your Output:</div>
                        <pre className={res.passed ? "text-verdict-green whitespace-pre-wrap" : "text-verdict-red whitespace-pre-wrap"}>{res.actualOutput || 'No output'}</pre>
                      </div>
                      {res.stderr && (
                        <div>
                          <div className="text-muted mb-1 uppercase tracking-wider">Error (stderr):</div>
                          <pre className="text-verdict-red whitespace-pre-wrap">{res.stderr}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Submit Results */}
          {currentSubmission && !runResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${
                  currentSubmission.verdict === 'Accepted' ? 'text-verdict-green' : 
                  currentSubmission.verdict === 'System Error' ? 'text-muted' : 
                  'text-verdict-red'
                }`}>
                  {currentSubmission.verdict}
                </span>
                {currentSubmission.executionTime && (
                  <span className="text-muted">
                    Time: {currentSubmission.executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>

              {currentSubmission.verdict === 'Accepted' && (
                <div className="text-verdict-green/80">
                  Passed all {currentSubmission.totalTestCases} test cases!
                </div>
              )}

              {(currentSubmission.verdict === 'Wrong Answer' || currentSubmission.verdict === 'Time Limit Exceeded') && (
                <div className="text-verdict-red/80">
                  Failed on test case {currentSubmission.failedTestCaseIndex + 1} of {currentSubmission.totalTestCases}.
                </div>
              )}

              {(currentSubmission.verdict === 'Compile Error' || currentSubmission.verdict === 'Runtime Error') && currentSubmission.stderr && (
                <div className="bg-ink p-3 rounded-sm border border-hairline overflow-x-auto">
                  <pre className="text-verdict-red text-xs whitespace-pre-wrap">
                    {currentSubmission.stderr}
                  </pre>
                </div>
              )}

              {currentSubmission.verdict === 'System Error' && (
                <div className="text-muted">
                  Something went wrong on our end — try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
