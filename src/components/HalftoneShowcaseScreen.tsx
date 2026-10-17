import React, { useState } from 'react';
import HalftoneWordmarkFooter, { 
  HalftonePreset, 
  FooterColumn, 
  HalftonePalette 
} from '@/components/ui/halftone-wordmark-footer';
import Demo from '@/components/ui/demo';
import { 
  Sparkles, 
  Layers, 
  Sliders, 
  Code2, 
  Check, 
  Copy, 
  Palette, 
  ArrowUpRight, 
  Zap, 
  Cpu, 
  Eye, 
  ExternalLink,
  BookOpen,
  Layout,
  MousePointer2
} from 'lucide-react';

interface HalftoneShowcaseScreenProps {
  onSwitchToStudyApp: () => void;
}

export const HalftoneShowcaseScreen: React.FC<HalftoneShowcaseScreenProps> = ({ onSwitchToStudyApp }) => {
  const [preset, setPreset] = useState<HalftonePreset>('night');
  const [wordmark, setWordmark] = useState<string>('halden');
  const [customWordmark, setCustomWordmark] = useState<string>('');
  const [dotGap, setDotGap] = useState<number>(6);
  const [radius, setRadius] = useState<number>(80);
  const [crop, setCrop] = useState<number>(0.2);
  const [grain, setGrain] = useState<number>(0.5);
  const [interactive, setInteractive] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'playground' | 'rawDemo'>('playground');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeWordmark = customWordmark.trim() ? customWordmark.toLowerCase() : wordmark;

  const presetsInfo: Record<HalftonePreset, { label: string; bg: string; ink: string; warm: string; desc: string }> = {
    night: {
      label: 'Night',
      bg: '#000000',
      ink: '#e9e4da',
      warm: '#e9762b',
      desc: 'Deep obsidian backdrop with warm paper ink and vibrant solar orange displacement.'
    },
    paper: {
      label: 'Paper',
      bg: '#efebe3',
      ink: '#17150f',
      warm: '#c2361c',
      desc: 'Tactile editorial newsprint with carbon black ink and fiery vermilion warmth.'
    },
    ember: {
      label: 'Ember',
      bg: '#160a06',
      ink: '#f2c48c',
      warm: '#ff5a1f',
      desc: 'Dark mahogany earth tone with apricot text that glows blazing reddish-orange.'
    },
    cobalt: {
      label: 'Cobalt',
      bg: '#0d1b4d',
      ink: '#dfe7ff',
      warm: '#ffcd3c',
      desc: 'Nordic twilight cobalt blue with frosty pale type warming into electric yellow.'
    }
  };

  const editorialCards = [
    {
      title: 'Halden Studio Architecture',
      location: 'Oslo / Lisbon',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      tag: 'Spatial Minimalist Studio',
      description: 'Physical spaces designed with calm monolithic geometry, echoing the typographic weight of cropped Swiss grotesque wordmarks.'
    },
    {
      title: 'Area-True Halftone Screening',
      location: 'Print Laboratory',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      tag: 'Canvas 2D Rasterizer',
      description: 'Each dot diameter is scaled mathematically by how much of the glyph covers the 3×3 sampling cell, preserving crisp letter contours at any zoom.'
    },
    {
      title: 'Kinetic Spring Dynamics',
      location: 'Interactive Physics',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      tag: 'Shockwave & Springs',
      description: 'Displaced dots part on tension springs (vx, vy vectors) and heat up dynamically in RGB space before returning softly to equilibrium.'
    }
  ];

  const handleCopyCode = () => {
    const code = `import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer"

export default function Footer() {
  return (
    <HalftoneWordmarkFooter
      wordmark="${activeWordmark}"
      preset="${preset}"
      dotGap={${dotGap}}
      radius={${radius}}
      crop={${crop}}
      grain={${grain}}
      interactive={${interactive}}
    />
  )
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Banner Navigation */}
      <div className="w-full sticky top-0 z-30 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-amber-600 to-red-600 flex items-center justify-center font-mono font-black text-sm text-black shadow-lg shadow-orange-500/20">
              HW
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white flex items-center gap-2 text-sm sm:text-base">
                Halftone Wordmark Footer
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  shadcn/ui primitive
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToStudyApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition shadow-sm"
              title="Switch to StudyPulse PWA"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Switch to StudyPulse PWA</span>
            </button>
            <a
              href="#playground"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              <span>Playground</span>
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive 2D Canvas · Zero External Assets</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            A site footer printed as a kinetic field of <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 bg-clip-text text-transparent">halftone dots</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Enormous wordmark cropped by the bottom edge. Move across it and the dots part around your pointer on springs, warming in color as they are pushed away. Click anywhere to trigger an expanding shockwave ripple.
          </p>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono text-slate-300">
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" /> Pure React + Canvas 2D
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" /> Spring Physics & Shockwave
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-emerald-400" /> Procedural Print Grain
            </span>
          </div>
        </div>

        {/* Live Interactive Playground (Hero Centerpiece) */}
        <div id="playground" className="mt-12 space-y-4">
          {/* Playground Toolbar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#11131a] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => setViewMode('playground')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'playground'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Playground</span>
              </button>
              <button
                onClick={() => setViewMode('rawDemo')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'rawDemo'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Raw Demo.tsx</span>
              </button>
            </div>

            {/* Preset Color Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">Palette:</span>
              {(['night', 'paper', 'ember', 'cobalt'] as HalftonePreset[]).map((p) => {
                const info = presetsInfo[p];
                const isActive = preset === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isActive
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-black/40 text-slate-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-black/20" 
                      style={{ backgroundColor: info.warm }} 
                    />
                    <span className="capitalize">{info.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Wordmark Switcher */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto">
                {['halden', 'studypulse', 'kinetic', 'oslo'].map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWordmark(w);
                      setCustomWordmark('');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono transition ${
                      activeWordmark === w
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="Custom word..."
                  maxLength={12}
                  value={customWordmark}
                  onChange={(e) => setCustomWordmark(e.target.value.slice(0, 12))}
                  className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 w-28 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition border border-white/10 shrink-0"
                title="Copy React JSX configuration"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy JSX'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Parameters Drawer (When in Playground Mode) */}
          {viewMode === 'playground' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0c0e14] border border-white/5 text-xs text-slate-300 font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Dot Gap:</span>
                  <span className="text-orange-400">{dotGap}px</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={dotGap}
                  onChange={(e) => setDotGap(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Push Radius:</span>
                  <span className="text-orange-400">{radius}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Bottom Crop:</span>
                  <span className="text-orange-400">{(crop * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={crop}
                  onChange={(e) => setCrop(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Print Grain:</span>
                  <span className="text-orange-400">{(grain * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={grain}
                  onChange={(e) => setGrain(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Interactive Canvas Frame */}
          <div className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black relative">
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-black/70 backdrop-blur-md text-slate-300 border border-white/10">
                <MousePointer2 className="w-3 h-3 text-orange-400 animate-bounce" />
                Hover to push dots · Click to shockwave
              </span>
            </div>

            {viewMode === 'playground' ? (
              <HalftoneWordmarkFooter
                wordmark={activeWordmark}
                preset={preset}
                dotGap={dotGap}
                radius={radius}
                crop={crop}
                grain={grain}
                interactive={interactive}
                height="560px"
              />
            ) : (
              <Demo />
            )}
          </div>
        </div>
      </section>

      {/* Editorial Unsplash Studio Showcase Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-orange-400">
            Aesthetics & Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Scandinavian Minimalist Editorial Design
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Inspired by Swiss International Typographic Style and tactile print engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {editorialCards.map((card, idx) => (
            <div 
              key={idx}
              className="group rounded-3xl bg-[#11131a] border border-white/10 overflow-hidden hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                  {card.tag}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-mono text-slate-500">{card.location}</span>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors mt-0.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Component API & shadcn Structure Guide */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Setup & Path Rationale */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-orange-400">
                Integration Architecture
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                shadcn/ui Project Structure
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-[#11131a] border border-white/10 space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-400" />
                Why <code className="text-orange-300 font-mono">/components/ui/</code> is essential:
              </h4>
              <p className="leading-relaxed text-slate-400">
                In shadcn/ui convention, atomic and reusable primitives reside exclusively under <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">@/components/ui</code>. This isolates domain features (like Dashboard and Study Room screens) from primitive UI widgets, enabling clean upgrades and automated imports via <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">components.json</code>.
              </p>
              <div className="pt-2 border-t border-white/5 space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>UI Primitives:</span>
                  <span className="text-white">src/components/ui/halftone-wordmark-footer.tsx</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Demo Component:</span>
                  <span className="text-white">src/components/ui/demo.tsx</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tailwind Utilities:</span>
                  <span className="text-white">src/lib/utils.ts (cn helper)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-950/20 via-black to-black border border-orange-500/20 space-y-2">
              <h4 className="text-xs font-bold text-orange-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Dual Workspace Experience
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Both the full Halftone Showcase Website and your original StudyPulse Study Tracker PWA are completely preserved and instantly switchable via the header button!
              </p>
            </div>
          </div>

          {/* Right: Props Table */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-orange-400">
                API Reference
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                HalftoneWordmarkFooterProps
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#11131a] text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-mono text-slate-400">
                    <th className="p-3">Prop</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                  <tr>
                    <td className="p-3 font-bold text-orange-300">wordmark</td>
                    <td className="p-3 text-slate-400">string</td>
                    <td className="p-3 text-slate-500">"halden"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">preset</td>
                    <td className="p-3 text-slate-400">'night' | 'paper' | 'ember' | 'cobalt'</td>
                    <td className="p-3 text-slate-500">"night"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">dotGap</td>
                    <td className="p-3 text-slate-400">number (CSS px)</td>
                    <td className="p-3 text-slate-500">6</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">radius</td>
                    <td className="p-3 text-slate-400">number (push reach)</td>
                    <td className="p-3 text-slate-500">80</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">crop</td>
                    <td className="p-3 text-slate-400">number (0 to 0.6)</td>
                    <td className="p-3 text-slate-500">0.2</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">grain</td>
                    <td className="p-3 text-slate-400">number (0 to 1)</td>
                    <td className="p-3 text-slate-500">0.5</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-orange-300">height</td>
                    <td className="p-3 text-slate-400">string (length)</td>
                    <td className="p-3 text-slate-500">"560px"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Bleed Site Footer Anchor */}
      <div className="w-full pt-16">
        <HalftoneWordmarkFooter
          wordmark={activeWordmark}
          preset={preset}
          label="Halden Studio · Halftone Wordmark"
          meta="©2026 · Interactive Canvas 2D Engine"
          columns={[
            {
              title: 'Showcase',
              links: [
                { label: 'Interactive Canvas', href: '#playground' },
                { label: 'Raw Demo.tsx', href: '#playground' },
                { label: 'Switch to StudyPulse PWA', href: '#studyApp' },
              ]
            },
            {
              title: 'Presets',
              links: [
                { label: 'Night (Obsidian & Ember)' },
                { label: 'Paper (Editorial Newsprint)' },
                { label: 'Cobalt (Nordic Twilight)' },
                { label: 'Ember (Blazing Mahogany)' },
              ]
            },
            {
              title: 'Source',
              links: [
                { label: 'shadcn/ui Compatible' },
                { label: 'React 19 + TypeScript' },
                { label: 'MIT License' },
              ]
            }
          ]}
          dotGap={dotGap}
          radius={radius}
          crop={crop}
          grain={grain}
          height="540px"
        />
      </div>
    </div>
  );
};

export default HalftoneShowcaseScreen;
