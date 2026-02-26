'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        .home {
          min-height: 100vh;
          background: #060e1a;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* BANDES DIAGONALES style Arc Raiders */
        .bands {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .band {
          position: absolute;
          left: -20%;
          width: 140%;
          transform-origin: left center;
        }
        .b1 { top: -5%; height: 38vh; background: linear-gradient(90deg, #0a1f3d 0%, #0d2a52 60%, #0a4a6e 100%); transform: rotate(-8deg); }
        .b2 { top: 28%; height: 22vh; background: linear-gradient(90deg, #071628 0%, #0f3460 50%, #1a5c9a 100%); transform: rotate(-8deg); opacity: 0.85; }
        .b3 { top: 50%; height: 14vh; background: linear-gradient(90deg, #051020 0%, #0e8a6e 60%, #0a6b52 100%); transform: rotate(-8deg); opacity: 0.7; }
        .b4 { top: 65%; height: 10vh; background: linear-gradient(90deg, #030a14 0%, #1a5c9a 40%, #2563eb 100%); transform: rotate(-8deg); opacity: 0.5; }
        .b5 { top: 76%; height: 40vh; background: linear-gradient(90deg, #020810 0%, #060e1a 100%); transform: rotate(-8deg); }

        /* LIGNES FINES accent */
        .accent-lines {
          position: fixed;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }
        .aline {
          position: absolute;
          left: -20%;
          width: 140%;
          height: 2px;
          transform-origin: left center;
        }
        .al1 { top: 37%; background: linear-gradient(90deg, transparent, #1a5c9a, #0e8a6e, transparent); transform: rotate(-8deg); opacity: 0.8; }
        .al2 { top: 49.5%; background: linear-gradient(90deg, transparent, #0e8a6e, #4ade80, transparent); transform: rotate(-8deg); opacity: 0.6; }
        .al3 { top: 64%; background: linear-gradient(90deg, transparent, #2563eb, #1a5c9a, transparent); transform: rotate(-8deg); opacity: 0.4; }

        /* GRILLE techy en overlay */
        .grid-overlay {
          position: fixed;
          inset: 0;
          z-index: 2;
          background-image:
            linear-gradient(rgba(26,92,154,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,92,154,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* CONTENU */
        .content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* NAV */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 5%;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .logo {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }
        .logo span { color: #4ade80; }
        .nav-tag {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 4px 10px;
          border-radius: 4px;
        }

        /* HERO */
        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 5%;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(14,138,110,0.15);
          border: 1px solid rgba(14,138,110,0.4);
          color: #4ade80;
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .hero-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 800;
          color: white;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 10px;
        }
        .hero-title .accent { color: #4ade80; }
        .hero-title .accent2 { color: #60a5fa; }

        .hero-sub {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          margin-bottom: 48px;
          max-width: 500px;
          line-height: 1.6;
        }

        /* BOUTON PRINCIPAL */
        .btn-main {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #1a5c9a 0%, #0e8a6e 100%);
          color: white;
          padding: 18px 42px;
          border-radius: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: all 0.25s;
          border: none;
          cursor: pointer;
          margin-bottom: 60px;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-main::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #2270b8 0%, #10a882 100%);
          opacity: 0;
          transition: opacity 0.25s;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-main:hover::before { opacity: 1; }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(26,92,154,0.5); }
        .btn-main span { position: relative; z-index: 1; }
        .btn-arrow { position: relative; z-index: 1; font-size: 1.2rem; }

        /* STATS */
        .stats {
          display: flex;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stat {
          text-align: center;
          position: relative;
        }
        .stat::after {
          content: '';
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 30px;
          background: rgba(255,255,255,0.1);
        }
        .stat:last-child::after { display: none; }
        .stat-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .stat-num span { color: #4ade80; }
        .stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* FEATURES BOTTOM */
        .features {
          padding: 0 5% 48px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }
        @media(max-width:600px){ .features { grid-template-columns: 1fr; } .stats { gap: 24px; } }

        .feat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 24px 20px;
          transition: background 0.2s;
        }
        .feat:first-child { border-radius: 4px 0 0 4px; }
        .feat:last-child { border-radius: 0 4px 4px 0; }
        .feat:hover { background: rgba(255,255,255,0.06); }
        .feat-icon { font-size: 1.4rem; margin-bottom: 10px; }
        .feat-title { font-size: 0.85rem; font-weight: 700; color: white; margin-bottom: 5px; }
        .feat-desc { font-size: 0.75rem; color: rgba(255,255,255,0.35); line-height: 1.5; }

        /* CORNER DECO */
        .corner-tl {
          position: fixed;
          top: 80px;
          left: 0;
          width: 3px;
          height: 80px;
          background: linear-gradient(180deg, #1a5c9a, transparent);
          z-index: 10;
        }
        .corner-br {
          position: fixed;
          bottom: 0;
          right: 40px;
          width: 80px;
          height: 3px;
          background: linear-gradient(270deg, #0e8a6e, transparent);
          z-index: 10;
        }
      `}</style>

      {/* FOND BANDES */}
      <div className="bands">
        <div className="band b1"></div>
        <div className="band b2"></div>
        <div className="band b3"></div>
        <div className="band b4"></div>
        <div className="band b5"></div>
      </div>
      <div className="accent-lines">
        <div className="aline al1"></div>
        <div className="aline al2"></div>
        <div className="aline al3"></div>
      </div>
      <div className="grid-overlay"></div>
      <div className="corner-tl"></div>
      <div className="corner-br"></div>

      <div className="content">
        {/* NAV */}
        <nav className="nav">
          <div className="logo">Medi<span>Connect</span></div>
          <div className="nav-tag">Plateforme médicale IA</div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">Disponible 24h/24 · Gratuit</div>

          <h1 className="hero-title">
            Votre santé,<br/>
            <span className="accent">guidée</span> par l'<span className="accent2">IA</span>
          </h1>

          <p className="hero-sub">
            Décrivez vos symptômes. Notre intelligence artificielle vous oriente vers le bon spécialiste et trouve les médecins disponibles près de chez vous.
          </p>

          <Link href="/analyse" className="btn-main">
            <span>Analyser mes symptômes</span>
            <span className="btn-arrow">→</span>
          </Link>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">35<span>k</span></div>
              <div className="stat-label">Communes</div>
            </div>
            <div className="stat">
              <div className="stat-num">15<span>s</span></div>
              <div className="stat-label">Analyse</div>
            </div>
            <div className="stat">
              <div className="stat-num">100<span>%</span></div>
              <div className="stat-label">Gratuit</div>
            </div>
            <div className="stat">
              <div className="stat-num">0</div>
              <div className="stat-label">Données conservées</div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="features">
          <div className="feat">
            <div className="feat-icon">🧠</div>
            <div className="feat-title">Analyse IA des symptômes</div>
            <div className="feat-desc">Propulsé par Claude d'Anthropic, le même modèle utilisé par les professionnels</div>
          </div>
          <div className="feat">
            <div className="feat-icon">📍</div>
            <div className="feat-title">Médecins près de chez vous</div>
            <div className="feat-desc">Toutes les communes de France via l'API officielle du gouvernement</div>
          </div>
          <div className="feat">
            <div className="feat-icon">📷</div>
            <div className="feat-title">Analyse photo</div>
            <div className="feat-desc">Photographiez une lésion, une plaie ou un bouton pour une analyse visuelle</div>
          </div>
        </div>
      </div>
    </>
  )
}
