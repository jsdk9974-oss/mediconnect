import Link from 'next/link'

export default function Accueil() {
  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-logo">
          Medi<span>Connect</span>
        </div>
        <Link href="/analyse">
          <button className="nav-btn">Analyser mes symptômes →</button>
        </Link>
      </nav>

      {/* BANDEAU URGENCE */}
      <div className="urgence-bandeau" style={{marginTop:'70px'}}>
        <span>🚨</span>
        <span>En cas d'urgence vitale, appelez immédiatement le <strong>15 (SAMU)</strong> ou le <strong>112</strong></span>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-contenu">
          <div className="hero-badge">
            ✨ Intelligence artificielle médicale
          </div>
          <h1>
            Vos symptômes analysés,<br />
            <em>le bon médecin trouvé</em>
          </h1>
          <p className="hero-sous-titre">
            Décrivez ce que vous ressentez, MediConnect analyse vos symptômes grâce à l'IA et vous oriente vers le spécialiste idéal près de chez vous — en quelques secondes.
          </p>
          <div className="hero-boutons">
            <Link href="/analyse">
              <button className="btn-principal">
                🔍 Analyser mes symptômes
              </button>
            </Link>
            <button className="btn-secondaire">
              En savoir plus
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-nombre">30+</span>
              <span className="stat-label">Spécialités médicales</span>
            </div>
            <div className="stat">
              <span className="stat-nombre">IA</span>
              <span className="stat-label">Analyse intelligente</span>
            </div>
            <div className="stat">
              <span className="stat-nombre">100%</span>
              <span className="stat-label">Gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* PILIERS */}
      <section className="section" style={{background:'white'}}>
        <div className="section-titre">
          <h2>Tout ce dont vous avez besoin</h2>
          <p>Une plateforme complète pour vous accompagner à chaque étape</p>
        </div>
        <div className="grille-piliers">
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#e8f2ff'}}>🔍</div>
            <h3>Analyse IA des symptômes</h3>
            <p>Décrivez vos symptômes en texte simple. Notre IA les analyse et vous donne une orientation médicale claire et compréhensible.</p>
          </div>
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#e6f7f3'}}>🏥</div>
            <h3>Orientation spécialiste</h3>
            <p>L'IA identifie le type de médecin le plus adapté à votre situation : généraliste, cardiologue, dermatologue et bien d'autres.</p>
          </div>
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#fff7ed'}}>📅</div>
            <h3>Prise de rendez-vous</h3>
            <p>Trouvez les médecins disponibles près de chez vous et prenez rendez-vous directement via Doctolib ou Maiia.</p>
          </div>
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#fdf4ff'}}>👥</div>
            <h3>Communauté patients</h3>
            <p>Échangez avec d'autres patients qui vivent les mêmes pathologies. Partagez vos expériences et trouvez du soutien. <em style={{color:'#9333ea',fontSize:'0.85rem'}}>(Bientôt)</em></p>
          </div>
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#f0fdf4'}}>🔬</div>
            <h3>Essais cliniques</h3>
            <p>Suivez les dernières avancées médicales et découvrez les essais cliniques en cours pour votre pathologie. <em style={{color:'#9333ea',fontSize:'0.85rem'}}>(Bientôt)</em></p>
          </div>
          <div className="carte-pilier">
            <div className="pilier-icone" style={{background:'#fff1f2'}}>💊</div>
            <h3>Maladies rares</h3>
            <p>Un espace dédié aux patients atteints de maladies rares ou orphelines, pour ne plus se sentir seul face à sa pathologie. <em style={{color:'#9333ea',fontSize:'0.85rem'}}>(Bientôt)</em></p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-analyse">
        <h2>Prêt à analyser vos symptômes ?</h2>
        <p>C'est gratuit, rapide, et sans inscription. Résultat en moins de 30 secondes.</p>
        <Link href="/analyse">
          <button className="btn-blanc">
            🚀 Commencer maintenant
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Medi<span>Connect</span></div>
        <p>Votre santé, simplifiée.</p>
        <p className="footer-mention">
          MediConnect est un outil d'orientation médicale. Il ne pose pas de diagnostic et ne remplace pas l'avis d'un professionnel de santé.<br />
          En cas d'urgence, composez le 15 (SAMU) ou le 112.
        </p>
      </footer>
    </>
  )
}
