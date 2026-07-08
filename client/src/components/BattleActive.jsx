import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import BattleLeaderboard from './BattleLeaderboard';

const DIFFICULTY_COLORS = {
  easy: 'bg-verdict-green/20 text-verdict-green',
  medium: 'bg-host-amber/20 text-host-amber',
  hard: 'bg-verdict-red/20 text-verdict-red',
};

const STARTER_CODE = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n',
};

const BattleActive = ({ socket }) => {
  const { currentBattle, serverTimeOffset, leaderboard } = useSelector((state) => state.battle);
  const { user } = useSelector((state) => state.auth);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [language, setLanguage] = useState(localStorage.getItem('devora_default_language') || 'cpp');
  
  // Track code for each question and language
  // format: { [questionId]: { cpp: '...', java: '...' } }
  const [userCode, setUserCode] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track verdicts per question { [questionId]: { verdict, ... } }
  const [verdicts, setVerdicts] = useState({});
  const [remainingTimeStr, setRemainingTimeStr] = useState('');

  const questions = currentBattle?.questions || [];
  const activeQuestion = questions[activeQuestionIndex];

  // Initialize code state for questions
  useEffect(() => {
    if (questions.length > 0 && Object.keys(userCode).length === 0) {
      const initialCode = {};
      questions.forEach((q) => {
        initialCode[q._id] = { cpp: STARTER_CODE.cpp, java: STARTER_CODE.java };
      });
      setUserCode(initialCode);
    }
  }, [questions]);

  // Timer logic
  useEffect(() => {
    if (!currentBattle?.startedAt || !currentBattle?.duration) return;

    const interval = setInterval(() => {
      const endTime = new Date(currentBattle.startedAt).getTime() + currentBattle.duration * 60000;
      const now = Date.now() + (serverTimeOffset || 0);
      const remainingMs = endTime - now;

      if (remainingMs <= 0) {
        setRemainingTimeStr('00:00 — finalizing...');
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setRemainingTimeStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBattle, serverTimeOffset]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem('devora_default_language', e.target.value);
  };

  const handleEditorChange = (value) => {
    if (!activeQuestion) return;
    setUserCode((prev) => ({
      ...prev,
      [activeQuestion._id]: {
        ...prev[activeQuestion._id],
        [language]: value || ''
      }
    }));
  };

  const handleSubmit = () => {
    if (!activeQuestion || !socket) return;
    setIsSubmitting(true);

    const code = userCode[activeQuestion._id]?.[language] || '';

    // Emit and use callback acknowledgement
    socket.emit('battle:submission', {
      roomCode: currentBattle?.roomCode,
      problemId: activeQuestion._id,
      language,
      code
    }, (response) => {
      setIsSubmitting(false);
      if (response && response.error) {
        setVerdicts((prev) => ({
          ...prev,
          [activeQuestion._id]: { verdict: 'System Error', error: response.error }
        }));
      } else if (response) {
        setVerdicts((prev) => ({
          ...prev,
          [activeQuestion._id]: response
        }));
      }
    });
  };

  const handleFinishEarly = () => {
    if (window.confirm('Are you sure you want to finish early? You will not be able to submit any more solutions.')) {
      if (socket) {
        socket.emit('battle:finish_early', currentBattle?.roomCode);
      }
    }
  };

  if (!activeQuestion) return null;

  const currentCode = userCode[activeQuestion._id]?.[language] || '';
  const currentVerdict = verdicts[activeQuestion._id];
  
  // Find current user's participant record to see solved problems
  const me = leaderboard?.find(p => p.user?._id === user?._id) || 
             currentBattle?.participants?.find(p => p.user?._id === user?._id);
  const mySolved = me?.solvedProblems || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header with Timer and Leaderboard */}
      <div className="flex flex-col shrink-0">
        <div className="bg-surface border-b border-hairline p-4 flex items-center justify-between">
          <div className="font-display font-bold text-lg">
            Active Battle
          </div>
          <div className="flex items-center gap-4">
            {!me?.hasFinished && (
              <button 
                onClick={handleFinishEarly}
                className="text-sm bg-verdict-red/20 text-verdict-red px-4 py-1 rounded-sm font-semibold hover:bg-verdict-red/30 transition-colors border border-verdict-red/30"
              >
                Finish Early
              </button>
            )}
            <div className="font-utility text-xl text-signal font-bold bg-ink px-4 py-1 rounded-sm border border-hairline">
              {remainingTimeStr || 'Syncing...'}
            </div>
          </div>
        </div>
        <BattleLeaderboard participants={leaderboard?.length > 0 ? leaderboard : currentBattle?.participants} />
      </div>

      {/* Main split view */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Pane: Question Nav + Description */}
        <div className="w-full lg:w-[45%] h-full flex flex-col border-r border-hairline bg-ink">
          
          {/* Question Navigator */}
          <div className="flex overflow-x-auto bg-surface border-b border-hairline shrink-0">
            {questions.map((q, idx) => {
              const isSolved = mySolved.includes(q._id);
              return (
                <button
                  key={q._id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
                    activeQuestionIndex === idx
                      ? 'border-signal text-foreground'
                      : 'border-transparent text-muted hover:text-foreground hover:bg-ink'
                  }`}
                >
                  Q{idx + 1}
                  {isSolved && <CheckCircle2 className="w-4 h-4 text-verdict-green ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Description */}
          <div className="p-6 overflow-y-auto space-y-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-display">{activeQuestion.title}</h2>
                {mySolved.includes(activeQuestion._id) && <CheckCircle2 className="w-6 h-6 text-verdict-green" />}
              </div>
              <div className="flex gap-2 mt-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider ${DIFFICULTY_COLORS[activeQuestion.difficulty]}`}>
                  {activeQuestion.difficulty}
                </span>
              </div>
            </div>

            <div className="prose prose-invert prose-p:text-foreground/90 prose-headings:font-display prose-headings:text-foreground max-w-none">
              <ReactMarkdown>{activeQuestion.description}</ReactMarkdown>
            </div>

            {activeQuestion.testCases && activeQuestion.testCases.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold font-display border-b border-hairline pb-2">Sample Test Cases</h3>
                {activeQuestion.testCases.map((tc, index) => (
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
            
            {activeQuestion.constraints && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-display border-b border-hairline pb-2">Constraints</h3>
                <ul className="list-disc pl-5 space-y-1 text-foreground/80 font-utility text-sm">
                  {activeQuestion.constraints.map((constraint, i) => (
                    <li key={i}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Editor */}
        <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#1e1e1e] relative">
          {me?.hasFinished && (
            <div className="absolute inset-0 z-50 bg-[#1e1e1e]/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
              <CheckCircle2 className="w-16 h-16 text-verdict-green mb-4" />
              <h2 className="text-2xl font-bold font-display text-white mb-2">You finished early!</h2>
              <p className="text-muted">Waiting for other players to finish or the timer to expire...</p>
            </div>
          )}
          <div className="h-12 bg-surface border-b border-hairline flex items-center justify-between px-4 shrink-0">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-ink text-sm border border-hairline rounded-sm py-1 px-3 focus:outline-none focus:border-signal font-utility"
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-signal text-ink px-6 py-1.5 rounded-sm font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Code'
              )}
            </button>
          </div>

          <div className="flex-grow relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={currentCode}
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
          <div className={`bg-surface border-t border-hairline shrink-0 overflow-y-auto flex flex-col font-utility text-sm transition-all duration-300 ${
            (currentVerdict || isSubmitting) ? 'h-48 p-4' : 'h-12 p-0'
          }`}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => {
               // Allow manually expanding/collapsing if we want, but for now we just show title
            }}>
              <h3 className="text-muted uppercase tracking-wider text-xs font-body font-bold">Execution Result</h3>
            </div>
            
            {(currentVerdict || isSubmitting) && (
              <div className="flex-grow px-4 pb-4 space-y-4">
                {isSubmitting && !currentVerdict && (
                  <div className="text-muted/50 flex items-center justify-center italic h-full">
                    Evaluating solution against test cases...
                  </div>
                )}

                {currentVerdict && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        currentVerdict.verdict === 'Accepted' ? 'text-verdict-green' : 
                        currentVerdict.verdict === 'System Error' ? 'text-muted' : 
                        'text-verdict-red'
                      }`}>
                        {currentVerdict.verdict}
                      </span>
                      {currentVerdict.executionTime !== undefined && (
                        <span className="text-muted">
                          Time: {currentVerdict.executionTime.toFixed(2)}ms
                        </span>
                      )}
                    </div>

                    {currentVerdict.verdict === 'Accepted' && (
                      <div className="text-verdict-green/80">
                        Passed all {currentVerdict.totalTestCases} test cases!
                      </div>
                    )}

                    {(currentVerdict.verdict === 'Wrong Answer' || currentVerdict.verdict === 'Time Limit Exceeded') && (
                      <div className="text-verdict-red/80">
                        Failed on test case {(currentVerdict.failedTestCaseIndex || 0) + 1} of {currentVerdict.totalTestCases}.
                      </div>
                    )}

                    {(currentVerdict.verdict === 'Compile Error' || currentVerdict.verdict === 'Runtime Error') && currentVerdict.stderr && (
                      <div className="bg-ink p-3 rounded-sm border border-hairline overflow-x-auto">
                        <pre className="text-verdict-red text-xs whitespace-pre-wrap">
                          {currentVerdict.stderr}
                        </pre>
                      </div>
                    )}

                    {currentVerdict.verdict === 'System Error' && (
                      <div className="text-muted">
                        {currentVerdict.error || 'Something went wrong on our end — try again.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleActive;
