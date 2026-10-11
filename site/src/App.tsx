import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Check,
  CheckCheck, ChevronDown, CircleHelp, Clipboard, Code2,
  Command, Database, ExternalLink, Fingerprint, Github,
  Heart, Layers, LockKeyhole, Menu, MonitorCheck,
  Radio, Search, Server, ShieldCheck, SlidersHorizontal,
  Terminal, Workflow, X, Zap,
} from 'lucide-react';
import catalog from './data/commands.generated.json';

type BotCommand = { name: string; group: string; description: string };
type Feature = { icon: ReactNode; name: string; description: string; number: string; tone?: string };

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1558808248562225213';
const rawGithub = String(import.meta.env.VITE_GITHUB_URL || '').replace(/\/$/, '');
const githubUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(rawGithub) ? rawGithub : '';
const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=84992&integration_type=0&scope=bot%20applications.commands`;
const docsUrl = githubUrl ? `${githubUrl}/blob/main/docs/COMMANDS.md` : '#commands';
const verificationUrl = githubUrl ? `${githubUrl}/blob/main/docs/VERIFICATION.md` : '#trust';

const stats = [
  { value: '325', label: 'COUNTED ACTIONS', note: 'aliases excluded' },
  { value: '342', label: 'REGISTERED ACTIONS', note: 'including aliases' },
  { value: '36', label: 'COMMAND GROUPS', note: 'modular by design' },
  { value: '371', label: 'PASSING TESTS', note: 'automated suite' },
];

const features: Feature[] = [
  { icon: <ShieldCheck size={23} />, name: 'Moderation with teeth.', description: 'Bans, kicks, timeouts, warnings, cleanup and cases, protected by permission and role-hierarchy checks.', number: '01' },
  { icon: <Workflow size={23} />, name: 'Automation that sticks.', description: 'Persistent reminders, polls, giveaways and scheduled community workflows backed by SQLite.', number: '02' },
  { icon: <Layers size={23} />, name: 'A server that feels alive.', description: 'XP, economy, leaderboards, tickets, suggestions, tags and reaction roles for real communities.', number: '03' },
  { icon: <SlidersHorizontal size={23} />, name: 'Your setup. Your call.', description: 'Guided onboarding, configurable modules, diagnostics and a dedicated bot role with safe defaults.', number: '04' },
  { icon: <Database size={23} />, name: 'Data stays where you put it.', description: 'Guild-isolated SQLite storage. No Redis, PostgreSQL or mandatory external database.', number: '05' },
  { icon: <Code2 size={23} />, name: 'Open source. No asterisk.', description: 'TypeScript, discord.js and the AGPL-3.0-only license. Inspect it, self-host it, improve it.', number: '06' },
];

const groupTitles: Record<string, string> = {
  setup: 'Setup', diagnose: 'Diagnostics', utility: 'Utilities', config: 'Configuration',
  moderation: 'Moderation', mod: 'Moderation', reminders: 'Reminders',
  audio: 'Audio', welcome: 'Welcome', giveaways: 'Giveaways',
  economy: 'Economy', xp: 'Levels & XP', events: 'Events',
  tickets: 'Tickets', polls: 'Polls', suggestions: 'Suggestions',
  starboard: 'Starboard', tags: 'Tags', fun: 'Fun', games: 'Games',
};
function niceGroup(group: string): string {
  return groupTitles[group] || group.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 2.5 43 13.5v21L24 45.5 5 34.5v-21L24 2.5Z" stroke="currentColor" strokeWidth="2.6" />
        <path d="M12.5 34 24 11l11.5 23M17.5 25.5h13" stroke="currentColor" strokeWidth="3.6" strokeLinecap="square" />
      </svg>
    </div>
  );
}

function Btn({ children, href, variant = 'primary', external = false, className = '', onClick }: {
  children: ReactNode; href?: string; variant?: 'primary' | 'outline' | 'ghost';
  external?: boolean; className?: string; onClick?: () => void;
}) {
  const cn = `btn btn-${variant} ${className}`;
  return href ? (
    <a className={cn} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  ) : (
    <button className={cn} type="button" onClick={onClick}>{children}</button>
  );
}

function SectionHeading({ kicker, title, description, action }: {
  kicker: string; title: ReactNode; description?: string; action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="eyebrow"><span className="eyebrow-line" /> {kicker}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }
  return (
    <button type="button" onClick={copy} className={`copy-button ${className}`} aria-label={`${label}: ${text}`} title={copied ? 'Copied!' : label}>
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <header className="site-header">
      <div className="container nav-content">
        <a href="#top" className="brand-link" aria-label="ARCHNEMESIS, back to top" onClick={() => setOpen(false)}>
          <BrandMark />
          <span className="brand-word">ARCH<span>NEMESIS</span><span className="brand-bot">/ BOT</span></span>
        </a>
        <nav className={`navigation ${open ? 'navigation-open' : ''}`} aria-label="Primary navigation">
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#commands" onClick={() => setOpen(false)}>Commands</a>
          <a href="#trust" onClick={() => setOpen(false)}>Philosophy</a>
          <a href="#deploy" onClick={() => setOpen(false)}>Get started</a>
          {githubUrl && <a href={githubUrl} rel="noopener noreferrer" target="_blank" onClick={() => setOpen(false)}>GitHub <ArrowUpRight size={14} /></a>}
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="nav-mobile-invite" onClick={() => setOpen(false)}>Add to Discord <ArrowUpRight size={15} /></a>
        </nav>
        <div className="nav-right">
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="nav-invite">Add to Discord <ArrowUpRight size={15} /></a>
          <button className="nav-toggle" type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-noise" />
      <div className="hero-grid" />
      <div className="hero-beam hero-beam-1" /><div className="hero-beam hero-beam-2" />
      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="hero-eyebrow"><span className="pulse-dot" /> OPERATIONAL BY DESIGN <span className="slash-sep">//</span> OPEN SOURCE</div>
          <h1>YOUR SERVER.<br />YOUR RULES.<br /><span>YOUR NEMESIS.</span></h1>
          <p>One uncompromising Discord bot for the communities that refuse to settle. Powerful moderation, smarter automation, and <em>complete control.</em></p>
          <div className="hero-actions">
            <Btn href={inviteUrl} external>Deploy to Discord <ArrowUpRight size={18}/></Btn>
            <Btn href="#commands" variant="outline">Explore commands <ArrowRight size={17}/></Btn>
          </div>
          <div className="hero-meta">
            <span><CheckCheck size={16}/> 100% open source</span>
            <span><Database size={15}/> SQLite powered</span>
            <span><LockKeyhole size={15}/> Self-hostable</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="ARCHNEMESIS cyberpunk avatar and interface preview">
          <div className="hero-visual-halo" />
          <div className="hero-card">
            <div className="visual-topline"><span><span className="square-dot" /> ARCHNEMESIS // SYSTEM PROFILE</span><span>01 / 01</span></div>
            <div className="visual-main">
              <div className="portrait-ring">
                <img src="/nemesis-avatar.webp" alt="Red-eyed hooded ARCHNEMESIS BOT avatar" className="portrait" />
                <div className="portrait-bottom-label">ARCHNEMESIS</div>
              </div>
              <div className="visual-watermark" aria-hidden="true">A</div>
              <div className="visual-side-label">YOUR NEMESIS // EST. 2026</div>
            </div>
            <div className="visual-divider" />
            <div className="visual-footer"><span><Radio size={13}/> BOT PROFILE</span><strong>v0.1.0 <span className="muted">/</span> PUBLIC BETA</strong></div>
          </div>
          <div className="float-console">
            <div className="console-bar"><span className="terminal-dots"><i/><i/><i/></span><span>gateway.log</span><Terminal size={13}/></div>
            <div className="console-line"><span className="line-label">INFO</span> gateway.ready <span className="line-ok">[OK]</span></div>
            <div className="console-line"><span className="line-label">INFO</span> sqlite.connected <span className="line-ok">[OK]</span></div>
            <div className="console-line"><span className="line-label">INFO</span> commands.loaded <span className="line-value">342</span></div>
            <div className="console-disclaimer">Interface preview · not live telemetry</div>
          </div>
          <span className="crosshair crosshair-tl">+</span><span className="crosshair crosshair-br">+</span>
        </div>
      </div>
      <div className="hero-bottom container"><span className="hero-bottom-left">POWERFUL BY DEFAULT. MODULAR BY DESIGN.</span><a href="#features">SCROLL TO DISCOVER <ArrowDown size={14}/></a></div>
    </section>
  );
}

function Stats() {
  return <section className="stats-section" aria-label="Project statistics"><div className="container stats-grid">
    {stats.map((item, index) => <div className="stat" key={item.label}>
      <div className="stat-index">0{index + 1} /</div><strong>{item.value}<span className="stat-plus">{index === 0 ? '+' : ''}</span></strong>
      <span className="stat-name">{item.label}</span><span className="stat-note">{item.note}</span>
    </div>)}
  </div></section>;
}

function Features() {
  return <section className="section features-section" id="features"><div className="container">
    <SectionHeading kicker="01 / ARSENAL" title={<>EVERY TOOL.<br/><span className="muted-heading">ZERO COMPROMISE.</span></>}
      description="From everyday moderation to long-running community workflows, every feature has a job. No filler commands just to inflate a number." />
    <div className="features-grid">
      {features.map(feature => <article className="feature-card" key={feature.number}>
        <span className="feature-number">{feature.number} / SYSTEM</span>
        <span className="feature-icon">{feature.icon}</span>
        <h3>{feature.name}</h3><p>{feature.description}</p>
        <div className="feature-bottom"><span>ARCHNEMESIS CORE</span><ArrowUpRight size={17}/></div>
      </article>)}
    </div>
  </div></section>;
}

function Commands() {
  const entries: BotCommand[] = catalog.commands;
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [visible, setVisible] = useState(9);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if ((event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        document.getElementById('commands')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        searchRef.current?.focus({ preventScroll: true });
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) searchRef.current?.blur();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.group, (counts.get(entry.group) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const filtered = useMemo(() => entries.filter(item => {
    const matchGroup = group === 'all' || item.group === group;
    const matchSearch = `${item.name} ${item.description} ${niceGroup(item.group)}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchGroup && matchSearch;
  }), [entries, group, query]);
  function switchGroup(v: string) { setGroup(v); setVisible(9); }
  return <section className="section commands-section" id="commands"><div className="container">
    <SectionHeading kicker="02 / COMMAND CENTER" title={<>FIND YOUR<br/><span className="muted-heading">NEXT MOVE.</span></>}
      description="Search the documented command catalog. Filter by group, copy command paths, and get things done."
      action={<a className="text-link" href={docsUrl} target={githubUrl ? '_blank' : undefined} rel={githubUrl ? 'noopener noreferrer' : undefined}>Full command reference <ArrowUpRight size={16}/></a>} />
    <div className="command-panel">
      <div className="command-panel-top">
        <div className="command-panel-title"><span className="panel-green-dot"/> COMMAND DATABASE <span className="panel-slash">/</span> <span className="panel-muted">SEARCH INTERFACE</span></div>
        <div className="command-panel-count"><span>{entries.length}</span> indexed paths</div>
      </div>
      {catalog.source === 'preview' && <div className="catalog-notice"><CircleHelp size={16}/>
        Showing a small documented-command preview. Run <code>npm run sync:commands</code> from <code>site/</code> to index the bot's command reference.
      </div>}
      <div className="command-tools">
        <label className="command-search"><Search size={19}/><input ref={searchRef} value={query} onChange={event => {setQuery(event.target.value); setVisible(9);}}
          type="search" placeholder="Search commands, groups, actions..." aria-label="Search commands" /><span className="keycap">/</span></label>
        <label className="command-select-wrap"><SlidersHorizontal size={17}/><select value={group} onChange={event => switchGroup(event.target.value)} aria-label="Filter by command group">
          <option value="all">All groups</option>{groups.map(([g, count]) => <option key={g} value={g}>{niceGroup(g)} ({count})</option>)}
        </select><ChevronDown size={15}/></label>
      </div>
      <div className="command-chips" role="group" aria-label="Quick command-group filters">
        <button type="button" className={group === 'all' ? 'chip active' : 'chip'} onClick={() => switchGroup('all')}>All <span>{entries.length}</span></button>
        {groups.slice(0, 7).map(([g, count]) => <button type="button" className={group === g ? 'chip active' : 'chip'} onClick={() => switchGroup(g)} key={g}>{niceGroup(g)} <span>{count}</span></button>)}
      </div>
      {filtered.length ? <div className="command-list">
        {filtered.slice(0, visible).map((cmd) => <div className="command-row" key={cmd.name}>
          <div className="command-glyph"><Command size={17}/></div>
          <div className="command-detail"><code>{cmd.name}</code><p>{cmd.description}</p></div>
          <div className="command-right"><span className="group-tag">{niceGroup(cmd.group)}</span><CopyButton text={cmd.name} label="Copy" /></div>
        </div>)}
      </div> : <div className="no-results"><Search size={24}/><strong>No matching commands.</strong><span>Try a different search or category.</span><button type="button" onClick={() => {setQuery('');switchGroup('all');}}>Clear filters <ArrowRight size={15}/></button></div>}
      <div className="command-panel-bottom"><span>{filtered.length ? `Showing ${Math.min(visible, filtered.length)} of ${filtered.length} documented paths` : '0 matches'} <span className="separator-dot">·</span> {catalog.source === 'preview' ? 'Preview data' : 'Synced from docs/COMMANDS.md'}</span>
        {visible < filtered.length && <button type="button" onClick={() => setVisible(v => v + 12)}>Load more <ArrowDown size={15}/></button>}
      </div>
    </div>
    <div className="catalog-footnote"><Fingerprint size={16}/> 325 counted actions and 342 registrations are documented project totals; indexed paths above depend on the available reference. Automated tests do not replace real Discord verification.</div>
  </div></section>;
}

function Philosophy() {
  return <section className="section philosophy-section" id="trust"><div className="container">
    <div className="philosophy-layout">
      <div className="philosophy-copy">
        <div className="eyebrow"><span className="eyebrow-line"/> 03 / BUILT DIFFERENT</div>
        <h2>YOUR BOT.<br/>YOUR DATA.<br/><span className="red-heading">YOUR FREEDOM.</span></h2>
        <p>ARCHNEMESIS isn't a black box. It's a tool you can run, inspect, configure and contribute to. No forced cloud backend. No mystery dependencies. No paywall between you and your server.</p>
        <div className="philosophy-actions"><Btn href={githubUrl || '#deploy'} variant="outline" external={!!githubUrl}><Github size={17}/> {githubUrl ? 'Read the source' : 'View the setup'} <ArrowUpRight size={16}/></Btn></div>
      </div>
      <div className="principles">
        <div className="principle"><div className="principle-icon"><Server size={24}/></div><div><span>01 / CONTROL</span><h3>Actually self-hosted.</h3><p>One process, a local SQLite database and a Linux host. Run it your way.</p></div><ArrowUpRight size={18}/></div>
        <div className="principle"><div className="principle-icon"><ShieldCheck size={24}/></div><div><span>02 / RESPONSIBILITY</span><h3>Guardrails built in.</h3><p>Runtime permission checks, role hierarchy, server-scoped data and configurable modules.</p></div><ArrowUpRight size={18}/></div>
        <div className="principle"><div className="principle-icon"><Heart size={24}/></div><div><span>03 / FREEDOM</span><h3>AGPL-3.0-only.</h3><p>Software freedom isn't a marketing tier. The source is the point.</p></div><ArrowUpRight size={18}/></div>
      </div>
    </div>
    <div className="truth-strip"><div><MonitorCheck size={19}/><span>TESTED CODE</span><strong>371 automated tests passed</strong></div><a href={verificationUrl} target={githubUrl ? '_blank' : undefined} rel={githubUrl ? 'noopener noreferrer' : undefined}>See verification details <ArrowUpRight size={16}/></a></div>
  </div></section>;
}

function Deploy() {
  const source = githubUrl ? `git clone ${githubUrl}.git\ncd archnemesis-bot\nnpm ci\nnpm run setup\nnpm run build\nnpm start` : `# Clone the ARCHNEMESIS BOT repository\n# Set VITE_GITHUB_URL in site/.env.local to show the URL here\ncd archnemesis-bot\nnpm ci\nnpm run setup\nnpm run build\nnpm start`;
  return <section className="section deploy-section" id="deploy"><div className="container">
    <SectionHeading kicker="04 / TAKE CONTROL" title={<>READY TO<br/><span className="muted-heading">MAKE IT YOURS?</span></>}
      description="Invite the hosted bot to a server you manage, or clone the AGPL source and run your own instance." />
    <div className="deploy-grid">
      <div className="deploy-invite">
        <div className="deploy-icon"><Zap size={26}/></div><span className="deploy-number">OPTION 01 // GET STARTED FAST</span><h3>Invite ARCHNEMESIS.</h3>
        <p>Install to your Discord server. Start with the setup wizard, then enable only the modules you need.</p>
        <div className="deploy-button-row"><Btn href={inviteUrl} external>Add to Discord <ArrowUpRight size={18}/></Btn></div>
        <span className="deploy-note"><LockKeyhole size={15}/> Baseline permissions only. Some modules need more.</span>
      </div>
      <div className="deploy-selfhost">
        <div className="deploy-code-header"><div><Terminal size={18}/><span>SELF-HOST / TERMINAL</span></div><CopyButton text={source} label="Copy commands" /></div>
        <pre className="terminal-code"><code>{source.split('\n').map((line,i) => <span className={line.startsWith('#') ? 'code-comment' : ''} key={i}><span className="code-prompt">{line.startsWith('#') ? ' ' : '$'}</span> {line}{'\n'}</span>)}</code></pre>
        <div className="deploy-code-foot"><span><span className="panel-green-dot"/> Node.js 22.13+ required</span><a href={githubUrl ? `${githubUrl}#run-locally` : '#faq'} target={githubUrl ? '_blank' : undefined} rel={githubUrl ? 'noopener noreferrer' : undefined}>Setup docs <ArrowUpRight size={14}/></a></div>
      </div>
    </div>
  </div></section>;
}

const faqs = [
  { q: 'Is ARCHNEMESIS BOT free?', a: 'Yes. The project is open-source software licensed AGPL-3.0-only. You can inspect, modify and self-host it under the terms of that license.' },
  { q: 'Do I need PostgreSQL, Redis or Docker?', a: 'No. The default deployment uses Node.js and local SQLite persistence. Docker is optional, and a regular Linux host with systemd is sufficient.' },
  { q: 'Why do the command counts differ?', a: 'The project reports 342 registered slash actions across 36 groups; 325 counted actions exclude declared aliases and informational-only entries. The command browser indexes documentation and may show fewer paths until synchronized.' },
  { q: 'Is every Discord operation tested live?', a: 'No. The automated suite verifies handlers and workflows with mocks; live permissions, real-world Discord API behavior and optional voice transport require separate testing. See docs/VERIFICATION.md in the repository.' },
  { q: 'What data does the bot save?', a: 'Guild-scoped settings and enabled features such as warnings, economy records, reminders and community content may be stored in a local SQLite database controlled by the operator. Server owners have a supported command for deleting their guild data. Review your operator’s privacy policy for their retention practices.' },
];

function FAQ() {
  return <section className="section faq-section" id="faq"><div className="container faq-grid">
    <div><div className="eyebrow"><span className="eyebrow-line"/> 05 / FAQ</div><h2>QUESTIONS?<br/><span className="muted-heading">WE GOT YOU.</span></h2><p>Everything you should know before unleashing your new favorite bot.</p><div className="faq-decoration"><CircleHelp size={110} strokeWidth={0.65}/></div></div>
    <div className="faq-questions">{faqs.map((item,i) => <details className="faq-item" key={item.q}><summary><span className="faq-index">0{i+1}</span><strong>{item.q}</strong><span className="faq-expand"><ChevronDown size={20}/></span></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}

function Footer() {
  return <footer className="footer"><div className="container">
    <div className="footer-cta"><div><div className="eyebrow">NO MORE ORDINARY BOTS.</div><h2>MEET YOUR <span>NEMESIS.</span></h2></div><Btn href={inviteUrl} external>Deploy ARCHNEMESIS <ArrowUpRight size={18}/></Btn></div>
    <div className="footer-bottom"><a href="#top" className="footer-brand"><BrandMark small/> <span>ARCHNEMESIS <b>BOT</b></span></a><div className="footer-links"><a href="#features">Features</a><a href="#commands">Commands</a>{githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub <ExternalLink size={13}/></a>}<a href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a></div><div className="footer-copyright">© {new Date().getFullYear()} ARCHNEMESIS · Not affiliated with Discord.</div></div>
  </div></footer>;
}

function FloatingJump() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <a href="#top" className={`back-top ${visible ? 'back-top-visible' : ''}`} aria-label="Back to top" tabIndex={visible ? 0 : -1}><ArrowDownRight size={18}/></a>;
}

export default function App() {
  return <>
    <div className="site-shell">
      <div className="announcement"><span className="announcement-diamond">◆</span> MEET THE NEXT GENERATION OF SERVER CONTROL <span className="announcement-right">OPEN SOURCE <span>//</span> AGPL-3.0</span></div>
      <Navbar />
      <main><Hero/><Stats/><Features/><Commands/><Philosophy/><Deploy/><FAQ/></main>
      <Footer/><FloatingJump/>
    </div>
  </>;
}
