import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Share2, Globe, Activity, Zap,
  CheckCircle2, ChevronRight,
  Database, Mail, Key, ShieldAlert, Cpu
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import LetterCascade from '../components/ui/LetterCascade';

type TabType = 'phishguard' | 'secureshare' | 'cloudscan';

// ── SVG Curved Connection Line Helper ────────────────────────────────────────
function FlowConnection({
  from,
  to,
  color = '#00f5ff',
  duration = 3,
  dashed = true,
  direction = 'down',
  active = false
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
  duration?: number;
  dashed?: boolean;
  direction?: 'down' | 'up';
  active?: boolean;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;

  // Compute curved path
  let pathD = '';
  if (direction === 'down') {
    const midY = (y1 + y2) / 2;
    pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  } else {
    const midX = (x1 + x2) / 2;
    pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }

  const strokeWidth = active ? 3.5 : 2;
  const flowDuration = active ? duration * 0.45 : duration;

  return (
    <g>
      {/* Background connection path */}
      <path
        d={pathD}
        fill="none"
        stroke={active ? `${color}18` : "rgba(255, 255, 255, 0.08)"}
        strokeWidth={strokeWidth}
        className="transition-all duration-300"
      />
      {/* Active flowing data line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? "6, 8" : undefined}
        animate={dashed ? { strokeDashoffset: [0, -28] } : { opacity: [0.3, 0.9, 0.3] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: flowDuration
        }}
        style={{
          filter: active ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}80)`
        }}
        className="transition-all duration-300"
      />
    </g>
  );
}

// ── Component Nodes ──────────────────────────────────────────────────────────
function DiagramNode({
  x,
  y,
  width = 160,
  height = 55,
  title,
  subtitle,
  description,
  icon: Icon,
  color = '#00f5ff',
  className = '',
  onHover,
  isHighlighted = false
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  subtitle: string;
  description: string;
  icon?: any;
  color?: string;
  className?: string;
  onHover: (node: { title: string; subtitle: string; description: string; color: string; icon: any } | null) => void;
  isHighlighted?: boolean;
}) {
  // Offset to center the HTML div inside coordinates
  const left = x - width / 2;
  const top = y - height / 2;

  return (
    <foreignObject x={left} y={top} width={width} height={height}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        onMouseEnter={() => onHover({ title, subtitle, description, color, icon: Icon })}
        onMouseLeave={() => onHover(null)}
        className={`flex items-center gap-2.5 h-full bg-cyber-bg/95 border rounded-lg p-2.5 shadow-lg select-none cursor-pointer transition-all duration-300 ${className}`}
        style={{
          borderColor: isHighlighted ? color : `${color}30`,
          boxShadow: isHighlighted 
            ? `0 0 25px ${color}50, inset 0 0 15px ${color}20` 
            : `0 0 15px ${color}10, inset 0 0 10px ${color}05`
        }}
      >
        {Icon && (
          <motion.div
            animate={isHighlighted ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
            className="p-1.5 rounded flex-shrink-0"
            style={{
              background: `${color}12`,
              border: `1px solid ${color}25`
            }}
          >
            <Icon size={13} style={{ color }} />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono tracking-wider truncate uppercase text-cyber-muted">
            {title}
          </div>
          <div className="text-xs font-semibold text-cyber-text truncate">
            {subtitle}
          </div>
        </div>
      </motion.div>
    </foreignObject>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('phishguard');
  const [hoveredNode, setHoveredNode] = useState<{ title: string; subtitle: string; description: string; color: string; icon: any } | null>(null);

  useEffect(() => {
    setHoveredNode(null);
  }, [activeTab]);

  const isConnectionActive = (source: string, target: string) => {
    if (!hoveredNode) return false;
    return hoveredNode.title === source || hoveredNode.title === target;
  };

  const tabs = [
    { id: 'phishguard', label: 'PhishGuard Engine', icon: Shield, color: '#00f5ff' },
    { id: 'secureshare', label: 'SecureShare Vault', icon: Share2, color: '#39ff14' },
    { id: 'cloudscan', label: 'CloudScan Auditor', icon: Globe, color: '#a855f7' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        {/* Hero Landing Header */}
        <div className="text-center md:text-left space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full px-3 py-1 text-[11px] font-mono text-cyber-cyan">
            <Zap size={12} className="animate-pulse" />
            UNIFIED SECURITY OPERATIONS
          </div>
          <h1 className="font-orbitron text-4xl md:text-5xl font-extrabold tracking-tight text-cyber-text flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-start">
            <LetterCascade text="CYBER" staggerFrom="center" />
            <LetterCascade
              text="SPHERE"
              staggerFrom="center"
              className="text-cyber-cyan"
              style={{ textShadow: '0 0 25px rgba(0, 245, 255, 0.4)' }}
            />
          </h1>
          <p className="text-cyber-muted text-base leading-relaxed">
            Consolidating advanced defensive cybersecurity utilities into a single, cohesive dashboard. 
            We protect assets across email verification, secure asset sharing, and live host compliance auditing, 
            eliminating the gap between mock statistics and real, auditable security enforcement.
          </p>
        </div>

        {/* What We Solve Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GlowCard className="p-5" glowColor="cyan">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="text-cyber-cyan" size={18} />
              <h3 className="font-orbitron text-sm font-bold text-cyber-text">AI Phishing Defense</h3>
            </div>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Mitigates sophisticated social engineering and spoofed URLs by scanning domain structures in real-time, 
              utilizing machine learning models and multi-source threat databases to isolate malicious links.
            </p>
          </GlowCard>

          <GlowCard className="p-5" glowColor="green">
            <div className="flex items-center gap-2 mb-3">
              <Key className="text-cyber-green" size={18} />
              <h3 className="font-orbitron text-sm font-bold text-cyber-text">Zero-Trust Vault Exchange</h3>
            </div>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Replaces insecure file attachments. Encrypts files directly at rest with advanced cryptography 
              and creates secure download tokens, notifying recipients via encrypted SMTP linkages.
            </p>
          </GlowCard>

          <GlowCard className="p-5" glowColor="violet">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="text-cyber-violet" size={18} />
              <h3 className="font-orbitron text-sm font-bold text-cyber-text">Passive Compliance Audits</h3>
            </div>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Provides automated, non-intrusive compliance reporting. Evaluates SSL handshake expiries, redirects, 
              and audits security headers to prevent Clickjacking, MIME hijacking, and XSS exposures.
            </p>
          </GlowCard>
        </div>

        {/* Explanatory & Architecture Section */}
        <div className="glass rounded-2xl border border-cyber-border/40 bg-cyber-bg/70 backdrop-blur-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyber-border/40 pb-4 gap-4">
            <div>
              <h2 className="font-orbitron text-lg font-bold text-cyber-text">Architecture & Data Flow</h2>
              <p className="text-xs text-cyber-muted">Inspect the functional pathways of CyberSphere's core defensive pipelines.</p>
            </div>

            {/* Tab switchers */}
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? `${tab.color}15` : 'transparent',
                      borderColor: isSelected ? tab.color : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <TabIcon size={14} style={{ color: isSelected ? tab.color : 'inherit' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Descriptive side */}
            <div className="lg:col-span-4 space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'phishguard' && (
                  <motion.div
                    key="phishguard-desc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                        <Shield size={16} />
                      </div>
                      <h3 className="font-orbitron font-bold text-cyber-text">How PhishGuard Works</h3>
                    </div>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      PhishGuard parses user-supplied URLs and runs them through a multi-tiered security pipeline. 
                      First, the URL structure is parsed into 10 lexical features (e.g., domain length, subdomains, special character frequencies). 
                      A locally deployed <strong>Random Forest Classifier</strong> uses these features to score structural resemblance to known phishing domains.
                    </p>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      Simultaneously, the URL is resolved to its hosting server IP via DNS. The hosting IP is checked against 
                      the <strong>AbuseIPDB v2 API</strong> for historic reporting of malicious behavior. In parallel, a 
                      base64-encoded representation of the URL is verified against the <strong>VirusTotal v3 API</strong> to cross-reference over 80 major anti-malware databases.
                    </p>
                    <div className="flex items-center gap-2 text-cyber-cyan text-xs font-semibold pt-2">
                      <CheckCircle2 size={14} /> Full Local AI Predict & Threat Intelligence APIs
                    </div>
                  </motion.div>
                )}

                {activeTab === 'secureshare' && (
                  <motion.div
                    key="secureshare-desc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-cyber-green/10 border border-cyber-green/30 text-cyber-green">
                        <Share2 size={16} />
                      </div>
                      <h3 className="font-orbitron font-bold text-cyber-text">How SecureShare Works</h3>
                    </div>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      SecureShare enforces a zero-trust model for file sharing. When a user uploads a file, it is processed 
                      entirely in memory on the FastAPI server and encrypted using **AES-256 Symmetric Encryption** (via the Fernet cryptographic protocol). 
                      The encryption key is statically configured on the server, guaranteeing that data cannot be decrypted if intercepted.
                    </p>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      The encrypted binary is stored in an encrypted blob format inside the SQLite database. A unique, single-use, 
                      expirable access token is generated and mapped to the record. 
                      Once stored, the sender can trigger an automated email dispatch via a secure **SMTP connection**, 
                      transmitting a secure download link directly to the target recipient.
                    </p>
                    <div className="flex items-center gap-2 text-cyber-green text-xs font-semibold pt-2">
                      <CheckCircle2 size={14} /> AES-256 Bit Encryption at Rest & Secure SMTP
                    </div>
                  </motion.div>
                )}

                {activeTab === 'cloudscan' && (
                  <motion.div
                    key="cloudscan-desc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-cyber-violet/10 border border-cyber-violet/30 text-cyber-violet">
                        <Globe size={16} />
                      </div>
                      <h3 className="font-orbitron font-bold text-cyber-text">How CloudScan Works</h3>
                    </div>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      CloudScan is a non-intrusive compliance auditing engine. When a domain is requested, CloudScan 
                      initiates a direct TLS socket handshake on port 443. It extracts the raw X.509 certificate 
                      metadata from the connection, verifying expiration dates, certificate authority legitimacy, and signature types.
                    </p>
                    <p className="text-cyber-muted text-xs leading-relaxed">
                      Next, it makes a safe HTTP HEAD/GET request to evaluate public response headers. 
                      It actively audits the presence and correctness of key defensive configurations like HSTS, 
                      Content-Security-Policy (CSP) headers, CORS origins, X-Frame-Options, and inspects the `Server` signatures for software version disclosures.
                    </p>
                    <div className="flex items-center gap-2 text-cyber-violet text-xs font-semibold pt-2">
                      <CheckCircle2 size={14} /> Passive Audits conforming to OWASP Web Check
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Architecture diagram SVG display */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-center bg-black/35 rounded-xl border border-cyber-border/40 p-4 overflow-x-auto">
                <div className="relative min-w-[620px] h-[350px]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'phishguard' && (
                      <motion.svg
                        key="phishguard-svg"
                        width="600"
                        height="350"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Connections */}
                        <FlowConnection from={[300, 40]} to={[300, 140]} color="#00f5ff" duration={2} active={isConnectionActive("User Client", "Server Route")} />
                        
                        {/* Branch: Local Predict */}
                        <FlowConnection from={[300, 140]} to={[100, 240]} color="#00f5ff" duration={3} active={isConnectionActive("Server Route", "Local ML Pipeline")} />
                        <FlowConnection from={[100, 240]} to={[100, 320]} color="#00f5ff" duration={4} dashed={false} active={isConnectionActive("Local ML Pipeline", "Serialized Weight")} />

                        {/* Branch: VirusTotal API */}
                        <FlowConnection from={[300, 140]} to={[300, 240]} color="#00f5ff" duration={3} active={isConnectionActive("Server Route", "Threat Intel API")} />

                        {/* Branch: DNS -> IP -> AbuseIPDB API */}
                        <FlowConnection from={[300, 140]} to={[500, 180]} color="#00f5ff" duration={2} active={isConnectionActive("Server Route", "Domain Resolution")} />
                        <FlowConnection from={[500, 180]} to={[500, 240]} color="#00f5ff" duration={2} active={isConnectionActive("Domain Resolution", "IP Reputation")} />

                        {/* Labels on connectors */}
                        <g className="font-mono text-[9px] fill-cyber-muted text-center">
                          <rect x="260" y="80" width="80" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="90" textAnchor="middle">POST /api/url</text>

                          <rect x="145" y="175" width="70" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="180" y="185" textAnchor="middle">Local Predict</text>

                          <rect x="265" y="175" width="70" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="185" textAnchor="middle">API Request</text>

                          <rect x="390" y="150" width="85" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="432" y="160" textAnchor="middle">DNS Host Resolve</text>
                        </g>

                        {/* Nodes */}
                        <DiagramNode x={300} y={40} title="User Client" subtitle="React SPA Frontend" icon={Shield} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "User Client"} description="The primary frontend client that coordinates user interactions, receives scanned URL inputs, and dispatches analysis requests to the FastAPI backend." />
                        <DiagramNode x={300} y={140} title="Server Route" subtitle="FastAPI Router" icon={Cpu} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Server Route"} description="Receives URL targets, computes local feature extractions, resolves domain names, and spins off parallel request threads to other scanning engines." />

                        <DiagramNode x={100} y={240} title="Local ML Pipeline" subtitle="Random Forest Engine" icon={Activity} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Local ML Pipeline"} description="Runs in-memory Scikit-Learn predictions using a RandomForest classifier to calculate structural resemblance to known phishing domains." />
                        <DiagramNode x={100} y={320} title="Serialized Weight" subtitle="phishing_model.pkl" icon={Database} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Serialized Weight"} description="The binary file storing the pre-trained weights of the RandomForest classifier model, loaded on demand for low-latency scoring." />

                        <DiagramNode x={300} y={240} title="Threat Intel API" subtitle="VirusTotal v3 API" icon={Globe} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Threat Intel API"} description="Performs API threat checks using base64 encoded URL parameters, verifying security records across 80+ distinct security vendors." />

                        <DiagramNode x={500} y={180} title="Domain Resolution" subtitle="Resolved IP Node" icon={Database} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Domain Resolution"} description="Performs DNS socket resolution to determine the physical host IP address of the target domain for reputation scanning." />
                        <DiagramNode x={500} y={240} title="IP Reputation" subtitle="AbuseIPDB API v2" icon={Globe} color="#ff0055" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "IP Reputation"} description="Queries AbuseIPDB using the resolved IP to fetch report counts, reputation statistics, and historic security flags." />
                      </motion.svg>
                    )}

                    {activeTab === 'secureshare' && (
                      <motion.svg
                        key="secureshare-svg"
                        width="600"
                        height="350"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Connections */}
                        <FlowConnection from={[300, 40]} to={[300, 140]} color="#39ff14" duration={2} active={isConnectionActive("User Client", "Vault Controller")} />
                        
                        {/* Branch: AES Encryption */}
                        <FlowConnection from={[300, 140]} to={[120, 240]} color="#39ff14" duration={3} active={isConnectionActive("Vault Controller", "Fernet Protocol")} />
                        <FlowConnection from={[120, 240]} to={[120, 320]} color="#39ff14" duration={4} dashed={false} active={isConnectionActive("Fernet Protocol", "Secure Storage")} />

                        {/* Branch: DB persistence */}
                        <FlowConnection from={[300, 140]} to={[300, 240]} color="#39ff14" duration={3} active={isConnectionActive("Vault Controller", "Relational Storage")} />
                        <FlowConnection from={[300, 240]} to={[300, 320]} color="#39ff14" duration={4} dashed={false} active={isConnectionActive("Relational Storage", "Verify Token")} />

                        {/* Branch: SMTP Mail notifications */}
                        <FlowConnection from={[300, 140]} to={[480, 240]} color="#39ff14" duration={3} active={isConnectionActive("Vault Controller", "Notifications")} />

                        {/* Labels on connectors */}
                        <g className="font-mono text-[9px] fill-cyber-muted text-center">
                          <rect x="255" y="80" width="90" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="90" textAnchor="middle">POST /api/upload</text>

                          <rect x="150" y="175" width="70" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="185" y="185" textAnchor="middle">Encrypt Stream</text>

                          <rect x="260" y="175" width="80" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="185" textAnchor="middle">Database Commit</text>

                          <rect x="390" y="175" width="75" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="427" y="185" textAnchor="middle">Mail Dispatch</text>
                        </g>

                        {/* Nodes */}
                        <DiagramNode x={300} y={40} title="User Client" subtitle="React SPA Frontend" icon={Share2} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "User Client"} description="Streams files from select inputs, processes chunk parameters, and manages the interface state for upload confirmations." />
                        <DiagramNode x={300} y={140} title="Vault Controller" subtitle="FastAPI Router" icon={Cpu} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Vault Controller"} description="Coordinates symmetric cryptographic streams entirely in memory, dispatches DB writes, and schedules email alerts." />

                        <DiagramNode x={120} y={240} title="Fernet Protocol" subtitle="AES-256 Crypto" icon={Key} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Fernet Protocol"} description="Symmetric cryptographic wrapper that uses 128-bit blocks and 256-bit AES keys to encrypt files before they hit storage." />
                        <DiagramNode x={120} y={320} title="Secure Storage" subtitle="Encrypted File Blob" icon={Database} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Secure Storage"} description="The binary file storage layer where files sit in an encrypted blob format, ensuring zero visibility of files at rest." />

                        <DiagramNode x={300} y={240} title="Relational Storage" subtitle="SQLite Database" icon={Database} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Relational Storage"} description="Maintains records for upload references, mapping cryptographic hashes, creation timestamps, and target mail details." />
                        <DiagramNode x={300} y={320} title="Verify Token" subtitle="Download JWT Map" icon={Key} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Verify Token"} description="Performs strict URL signature validation and verifies the integrity of single-use download tokens before releasing binaries." />

                        <DiagramNode x={480} y={240} title="Notifications" subtitle="Gmail SMTP Client" icon={Mail} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Notifications"} description="Utilizes secure SSL/TLS sockets over SMTP port 465 to email unique download links directly to target recipient mailboxes." />
                      </motion.svg>
                    )}

                    {activeTab === 'cloudscan' && (
                      <motion.svg
                        key="cloudscan-svg"
                        width="600"
                        height="350"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Connections */}
                        <FlowConnection from={[300, 40]} to={[300, 140]} color="#a855f7" duration={2} active={isConnectionActive("User Client", "Audit Engine")} />
                        
                        {/* Branch: SSL check */}
                        <FlowConnection from={[300, 140]} to={[120, 240]} color="#a855f7" duration={3} active={isConnectionActive("Audit Engine", "Handshake Socket")} />
                        <FlowConnection from={[120, 240]} to={[120, 320]} color="#a855f7" duration={4} dashed={false} active={isConnectionActive("Handshake Socket", "X.509 Certificate")} />

                        {/* Branch: Header compliance */}
                        <FlowConnection from={[300, 140]} to={[300, 240]} color="#a855f7" duration={3} active={isConnectionActive("Audit Engine", "Header Parser")} />

                        {/* Branch: HTTP redirect */}
                        <FlowConnection from={[300, 140]} to={[480, 240]} color="#a855f7" duration={3} active={isConnectionActive("Audit Engine", "Protocol Redirect")} />
                        <FlowConnection from={[480, 240]} to={[390, 320]} color="#a855f7" duration={2} active={isConnectionActive("Protocol Redirect", "Scoring Matrix")} />
                        <FlowConnection from={[300, 240]} to={[390, 320]} color="#a855f7" duration={2} active={isConnectionActive("Header Parser", "Scoring Matrix")} />

                        {/* Labels on connectors */}
                        <g className="font-mono text-[9px] fill-cyber-muted text-center">
                          <rect x="250" y="80" width="100" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="90" textAnchor="middle">POST /api/cloudscan</text>

                          <rect x="150" y="175" width="70" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="185" y="185" textAnchor="middle">TLS Handshake</text>

                          <rect x="260" y="175" width="80" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="300" y="185" textAnchor="middle">inspect Headers</text>

                          <rect x="390" y="175" width="75" height="15" rx="3" fill="#0c111a" stroke="rgba(255,255,255,0.05)" />
                          <text x="427" y="185" textAnchor="middle">Port 80 request</text>
                        </g>

                        {/* Nodes */}
                        <DiagramNode x={300} y={40} title="User Client" subtitle="React SPA Frontend" icon={Globe} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "User Client"} description="Fires requests to scan public endpoints and renders organized summaries of SSL/TLS parameters and HTTP configurations." />
                        <DiagramNode x={300} y={140} title="Audit Engine" subtitle="FastAPI Router" icon={Cpu} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Audit Engine"} description="Asynchronously fires TCP socket handshakes, requests endpoint response headers, and evaluates security posture." />

                        <DiagramNode x={120} y={240} title="Handshake Socket" subtitle="ssl.wrap_socket" icon={Key} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Handshake Socket"} description="Initiates raw socket connections to port 443 of the target host, obtaining the server's public cryptographic signature." />
                        <DiagramNode x={120} y={320} title="X.509 Certificate" subtitle="Expiry & Issuer info" icon={Database} color="#00f5ff" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "X.509 Certificate"} description="Parses the public key certificate data (X.509 standard) to extract validity periods, issuer attributes, and hash algorithms." />

                        <DiagramNode x={300} y={240} title="Header Parser" subtitle="requests.get headers" icon={Globe} color="#39ff14" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Header Parser"} description="Audits server response headers for HSTS, Content-Security-Policy (CSP), CORS, and checks for software version disclosures." />

                        <DiagramNode x={480} y={240} title="Protocol Redirect" subtitle="HTTP redirect check" icon={Activity} color="#ff9500" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Protocol Redirect"} description="Audits port 80 traffic to verify if the server automatically redirects non-secure HTTP requests to encrypted HTTPS links." />
                        <DiagramNode x={390} y={320} title="Scoring Matrix" subtitle="Score compliance synthesis" icon={Database} color="#a855f7" onHover={setHoveredNode} isHighlighted={hoveredNode?.title === "Scoring Matrix"} description="Aggregates safety gaps, calculates compliance percentages, and derives a standardized rating from A to F based on OWASP benchmarks." />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Node Info Panel */}
              <div 
                className="min-h-[85px] border rounded-xl p-4 flex items-center gap-4 transition-all duration-300 bg-cyber-bg/60"
                style={{
                  borderColor: hoveredNode ? `${hoveredNode.color}40` : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: hoveredNode ? `0 0 20px ${hoveredNode.color}15, inset 0 0 10px ${hoveredNode.color}05` : 'none'
                }}
              >
                {hoveredNode ? (
                  <>
                    <div 
                      className="p-2.5 rounded-lg border flex-shrink-0 animate-pulse"
                      style={{
                        background: `${hoveredNode.color}12`,
                        borderColor: `${hoveredNode.color}35`,
                        color: hoveredNode.color
                      }}
                    >
                      {hoveredNode.icon && <hoveredNode.icon size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-sm text-cyber-text">{hoveredNode.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-white/5 text-cyber-muted uppercase" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                          {hoveredNode.subtitle}
                        </span>
                      </div>
                      <p className="text-xs text-cyber-muted mt-1 leading-relaxed">{hoveredNode.description}</p>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-2 text-xs text-cyber-muted/80 flex items-center justify-center gap-2 font-mono">
                    <Activity size={14} className="text-cyber-cyan animate-pulse" />
                    💡 HOVER OVER ANY NODE IN THE DIAGRAM TO AUDIT ITS INTERNAL DATA PATHWAY
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Route Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div whileHover={{ y: -4 }}>
            <GlowCard glowColor="cyan" className="p-6 cursor-pointer" onClick={() => window.location.pathname = '/phishguard'}>
              <h4 className="font-orbitron font-bold text-sm text-cyber-text mb-2 flex items-center justify-between">
                Go to PhishGuard <ChevronRight size={16} />
              </h4>
              <p className="text-xs text-cyber-muted">Launch live scans on URLs, messages, and QR codes using RandomForest AI models.</p>
            </GlowCard>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <GlowCard glowColor="green" className="p-6 cursor-pointer" onClick={() => window.location.pathname = '/secureshare'}>
              <h4 className="font-orbitron font-bold text-sm text-cyber-text mb-2 flex items-center justify-between">
                Go to SecureShare <ChevronRight size={16} />
              </h4>
              <p className="text-xs text-cyber-muted">Access encrypted local vaults to securely share files with recipients via SMTP notifications.</p>
            </GlowCard>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <GlowCard glowColor="violet" className="p-6 cursor-pointer" onClick={() => window.location.pathname = '/cloudscan'}>
              <h4 className="font-orbitron font-bold text-sm text-cyber-text mb-2 flex items-center justify-between">
                Go to CloudScan <ChevronRight size={16} />
              </h4>
              <p className="text-xs text-cyber-muted">Analyze live server response headers and verify SSL/TLS certificate health instantly.</p>
            </GlowCard>
          </motion.div>
        </div>
      </div>
  );
}
