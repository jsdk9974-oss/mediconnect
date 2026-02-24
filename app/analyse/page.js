'use client'

import { useState } from 'react'
import Link from 'next/link'

const NIVEAUX_URGENCE = {
  1: { classe: 'urgence-1', emoji: '🚨', texte: 'Urgences maintenant' },
  2: { classe: 'urgence-2', emoji: '⚠️', texte: 'Consulter sous 24h' },
  3: { classe: 'urgence-3', emoji: '📅', texte: 'Consulter dans la semaine' },
  4: { classe: 'urgence-4', emoji: '✅', texte: 'Non urgent' },
}

const MEDECINS_EXEMPLE = [
  { nom: 'Dr. Martin Sophie', adresse: 'Cabinet médical du centre, Paris 8e', dispo: 'Demain à 10h30' },
  { nom: 'Dr. Bernard Paul', adresse: '12 rue de la Santé, Paris 14e', dispo: 'Dans 2 jours' },
  { nom: 'Dr. Leroy Isabelle', adresse: 'Clinique Saint-Michel, Paris 6e', dispo: 'Dans 3 jours' },
]

export default function Analyse() {
  const [symptomes, setSymptomes] = useState('')
  const [age, setAge] = useState('')
  const [duree, setDuree] = useState('')
  const [chargement, setChargement] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [erreur, setErreur] = useState(null)

  const analyser = async () => {
    if (symptomes.trim().length < 10) {
      setErreur('Veuillez décrire vos symptômes plus en détail (au moins quelques mots).')
      return
    }
    setChargement(true)
    setErreur(null)
    setResultat(null)

    try {
      const reponse = await fetch('/api/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptomes, age, duree })
      })
      const donnees = await reponse.json()

      if (donnees.error) {
        setErreur(donnees.error)
      } else {
        setResultat(donnees.resultat)
      }
    } catch {
      setErreur("Une erreur s'est produite. Vérifiez votre connexion et réessayez.")
    } finally {
      setChargement(false)
    }
  }

  const urlDoctolib = (recherche) =>
    `https://www.doctolib.fr/recherche?speciality_id=&ref_visit_motive_ids=&text=${encodeURIComponent(recherche || '')}`

  const niveau = resultat ? NIVEAUX_URGENCE[resultat.niveau_urgence] || NIVEAUX_URGENCE[3] : null

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          Medi<span style={{color:'#0e8a6e'}}>Connect</span>
        </Link>
        <Link href="/">
          <button className="nav-btn" style={{background:'transparent',color:'#1a5c9a',border:'2px solid #1a5c9a'}}>
            ← Accueil
          </button>
        </Link>
      </nav>

      <div className="page-analyse" style={{marginTop:'70px'}}>
        <div className="analyse-conteneur">
          <div className="analyse-titre">
            <h1>Analysez vos symptômes</h1>
            <p>Décrivez ce que vous ressentez, notre IA vous oriente vers le bon spécialiste</p>
          </div>

          {/* FORMULAIRE */}
          {!resultat && (
            <div className="carte-formulaire">
              <div className="champ-groupe">
                <label className="champ-label">
                  📝 Décrivez vos symptômes *
                </label>
                <textarea
                  className="champ-texte"
                  placeholder="Ex : J'ai une douleur dans la poitrine depuis ce matin, avec des difficultés à respirer et une légère fièvre..."
                  value={symptomes}
                  onChange={e => setSymptomes(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grille-deux">
                <div className="champ-groupe">
                  <label className="champ-label">👤 Votre âge (optionnel)</label>
                  <select className="champ-select" value={age} onChange={e => setAge(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="enfant (moins de 12 ans)">Enfant (moins de 12 ans)</option>
                    <option value="adolescent (12-17 ans)">Adolescent (12-17 ans)</option>
                    <option value="jeune adulte (18-30 ans)">Jeune adulte (18-30 ans)</option>
                    <option value="adulte (30-50 ans)">Adulte (30-50 ans)</option>
                    <option value="adulte (50-65 ans)">Adulte (50-65 ans)</option>
                    <option value="senior (65 ans et plus)">Senior (65 ans et plus)</option>
                  </select>
                </div>
                <div className="champ-groupe">
                  <label className="champ-label">⏱️ Depuis combien de temps ?</label>
                  <select className="champ-select" value={duree} onChange={e => setDuree(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="quelques heures">Quelques heures</option>
                    <option value="depuis hier">Depuis hier</option>
                    <option value="2 à 3 jours">2 à 3 jours</option>
                    <option value="une semaine">Une semaine</option>
                    <option value="plus d'une semaine">Plus d'une semaine</option>
                    <option value="plus d'un mois">Plus d'un mois</option>
                  </select>
                </div>
              </div>

              {erreur && (
                <div style={{
                  background:'#fee2e2', color:'#991b1b',
                  padding:'12px 16px', borderRadius:'10px',
                  marginBottom:'20px', fontSize:'0.9rem'
                }}>
                  ⚠️ {erreur}
                </div>
              )}

              <button
                className="btn-analyser"
                onClick={analyser}
                disabled={chargement || symptomes.trim().length < 10}
              >
                {chargement ? (
                  <>
                    <div className="spinner" style={{width:'20px',height:'20px',borderWidth:'2px'}}></div>
                    Analyse en cours...
                  </>
                ) : (
                  <>🔍 Analyser mes symptômes</>
                )}
              </button>

              <p style={{textAlign:'center', marginTop:'16px', fontSize:'0.82rem', color:'#94a3b8'}}>
                🔒 Vos données ne sont pas sauvegardées
              </p>
            </div>
          )}

          {/* CHARGEMENT */}
          {chargement && (
            <div className="carte-formulaire chargement">
              <div className="spinner"></div>
              <span>L'IA analyse vos symptômes...</span>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niveau && (
            <div className="carte-resultat">
              <div className={`resultat-urgence ${niveau.classe}`}>
                {niveau.emoji} {niveau.texte}
              </div>

              <h2 className="resultat-titre">
                Spécialiste recommandé : {resultat.specialiste}
              </h2>

              <p className="resultat-contenu">{resultat.explication}</p>

              {resultat.conseils && resultat.conseils.length > 0 && (
                <div style={{marginTop:'20px'}}>
                  <strong style={{fontSize:'0.95rem', color:'#1e293b'}}>Conseils :</strong>
                  <ul style={{marginTop:'8px', paddingLeft:'20px'}}>
                    {resultat.conseils.map((conseil, i) => (
                      <li key={i} style={{color:'#475569', marginBottom:'6px', fontSize:'0.95rem'}}>{conseil}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MÉDECINS */}
              <div className="medecins-titre">
                📍 {resultat.specialiste}s près de chez vous
              </div>

              <div className="liste-medecins">
                {MEDECINS_EXEMPLE.map((m, i) => (
                  <div className="carte-medecin" key={i}>
                    <div className="medecin-info">
                      <h4>{m.nom}</h4>
                      <p>📍 {m.adresse} · 🕐 {m.dispo}</p>
                    </div>
                    <a href={urlDoctolib(resultat.recherche_doctolib)} target="_blank" rel="noopener noreferrer">
                      <div className="btn-rdv">Prendre RDV</div>
                    </a>
                  </div>
                ))}
                <a
                  href={urlDoctolib(resultat.recherche_doctolib)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textAlign:'center', display:'block',
                    color:'#1a5c9a', fontSize:'0.9rem',
                    marginTop:'8px', fontWeight:'600'
                  }}
                >
                  Voir tous les {resultat.specialiste}s sur Doctolib →
                </a>
              </div>

              <div className="mention-legale">
                ⚕️ <strong>Important :</strong> Cette analyse est fournie à titre informatif uniquement et ne constitue pas un diagnostic médical. Consultez toujours un professionnel de santé qualifié. En cas d'urgence vitale, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.
              </div>

              <button
                onClick={() => { setResultat(null); setSymptomes(''); setAge(''); setDuree('') }}
                style={{
                  background:'transparent', border:'2px solid #1a5c9a',
                  color:'#1a5c9a', padding:'12px 28px',
                  borderRadius:'50px', cursor:'pointer',
                  marginTop:'24px', fontWeight:'600',
                  fontFamily:'DM Sans, sans-serif',
                  fontSize:'0.95rem'
                }}
              >
                ← Nouvelle analyse
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
