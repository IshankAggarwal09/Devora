import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, MemoryStick } from 'lucide-react';

// ─── Difficulty badge config ──────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   cls: 'text-verdict-green bg-verdict-green/10 border border-verdict-green/25' },
  medium: { label: 'Medium', cls: 'text-host-amber   bg-host-amber/10   border border-host-amber/25' },
  hard:   { label: 'Hard',   cls: 'text-verdict-red  bg-verdict-red/10  border border-verdict-red/25' },
};

// ─── Custom renderers ─────────────────────────────────────────────────────────
// We override <pre> to inject the language as a data-attribute so the CSS
// `::before` pseudo-element can render a language label in the top-right corner.
const markdownComponents = {
  pre({ children, ...rest }) {
    // Pull the language class off the inner <code> element (added by rehype-highlight)
    const code = Array.isArray(children) ? children[0] : children;
    const className = code?.props?.className || '';
    const langMatch = className.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : null;

    return (
      <pre {...rest} data-language={lang ?? undefined}>
        {children}
      </pre>
    );
  },

  // Make sure links open in a new tab safely
  a({ href, children, ...rest }) {
    const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
    return (
      <a
        href={href}
        {...rest}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  },
};

// ─── rehype + remark plugin arrays (stable references) ───────────────────────
const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [
  [rehypeHighlight, { detect: true, ignoreMissing: true }],
];

// ─── Topic tag pill ───────────────────────────────────────────────────────────
const TopicTag = ({ label }) => (
  <span className="text-xs px-2.5 py-0.5 rounded-full bg-hairline text-muted border border-hairline/60 font-utility">
    {label}
  </span>
);

// ─── Test case block ──────────────────────────────────────────────────────────
const TestCaseBlock = ({ tc, index }) => (
  <div className="bg-ink border border-hairline rounded-sm overflow-hidden font-utility text-sm">
    <div className="flex items-center gap-2 px-4 py-2 bg-surface/60 border-b border-hairline">
      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
        Example {index + 1}
      </span>
    </div>
    <div className="p-4 space-y-3">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted block mb-1">Input</span>
        <pre className="text-foreground text-xs whitespace-pre-wrap break-words leading-relaxed">{tc.input}</pre>
      </div>
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted block mb-1">Output</span>
        <pre className="text-verdict-green text-xs whitespace-pre-wrap break-words leading-relaxed">{tc.expectedOutput}</pre>
      </div>
    </div>
  </div>
);

// ─── Constraints list ─────────────────────────────────────────────────────────
const ConstraintsList = ({ constraints }) => {
  if (!constraints?.length) return null;
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3 font-display">
        Constraints
      </h3>
      <ul className="space-y-1.5 pl-0">
        {constraints.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-utility">
            <span className="text-signal mt-0.5 shrink-0 text-xs">›</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ProblemDescription
 * Renders the left panel of the problem editor page.
 *
 * @param {object}  props
 * @param {object}  props.problem   — the problem document from Redux
 * @param {boolean} props.isSolved  — whether the current user has solved it
 */
const ProblemDescription = ({ problem, isSolved }) => {
  const diffConfig = DIFFICULTY_CONFIG[problem.difficulty] || DIFFICULTY_CONFIG.easy;

  // Separate sample test cases (already filtered server-side, but double-check)
  const sampleCases = useMemo(
    () => problem.testCases?.filter((tc) => tc.isSample) ?? [],
    [problem.testCases]
  );

  return (
    /* Independently scrollable — height inherited from parent flex layout */
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-7 max-w-none">

        {/* ── Back link ── */}
        <Link
          to="/problems"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Practice
        </Link>

        {/* ── Title & meta ── */}
        <header className="space-y-3">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold font-display leading-tight text-foreground flex-1">
              {problem.title}
            </h1>
            {isSolved && (
              <CheckCircle2
                size={20}
                className="text-verdict-green shrink-0 mt-1"
                title="You solved this problem"
              />
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${diffConfig.cls}`}>
              {diffConfig.label}
            </span>

            {/* Time / memory limits */}
            {problem.timeLimit && (
              <span className="flex items-center gap-1 text-xs text-muted bg-surface border border-hairline px-2.5 py-1 rounded-full">
                <Clock size={10} />
                {problem.timeLimit / 1000}s
              </span>
            )}
            {problem.memoryLimit && (
              <span className="flex items-center gap-1 text-xs text-muted bg-surface border border-hairline px-2.5 py-1 rounded-full">
                <MemoryStick size={10} />
                {problem.memoryLimit}MB
              </span>
            )}
          </div>

          {/* Topics */}
          {problem.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {problem.topics.map((t) => (
                <TopicTag key={t} label={t} />
              ))}
            </div>
          )}
        </header>

        {/* ── Description (Markdown) ── */}
        <section>
          <div className="prose-md">
            <ReactMarkdown
              remarkPlugins={REMARK_PLUGINS}
              rehypePlugins={REHYPE_PLUGINS}
              components={markdownComponents}
            >
              {problem.description}
            </ReactMarkdown>
          </div>
        </section>

        {/* ── Sample test cases ── */}
        {sampleCases.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-display">
              Examples
            </h3>
            {sampleCases.map((tc, i) => (
              <TestCaseBlock key={tc._id || i} tc={tc} index={i} />
            ))}
          </section>
        )}

        {/* ── Constraints ── */}
        <ConstraintsList constraints={problem.constraints} />

        {/* Bottom breathing room */}
        <div className="pb-4" />
      </div>
    </div>
  );
};

export default ProblemDescription;
