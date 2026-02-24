'use client'

import { useState } from 'react'
import Link from 'next/link'

const NIVEAUX_URGENCE = {
  1: { classe: 'urgence-1', emoji: '🚨', texte: 'Urgences maintenant' },
  2: { classe: 'urgence-2', emoji: '⚠️', texte: 'Consulter sous 24h' },
  3: { classe: 'urgence-3', emoji: '📅', texte: 'Consulter dans la semaine' },
  4: { classe: 'urgence-4', emoji: '✅', texte: 'Non urgent' },
}

const GRANDES_VILLES = [
  { ville: "Paris", codes: ["75001","75002","75003","75004","75005","75006","75007","75008","75009","75010","75011","75012","75013","75014","75015","75016","75017","75018","75019","75020"] },
  { ville: "Marseille", codes: ["13001","13002","13003","13004","13005","13006","13007","13008","13009","13010","13011","13012","13013","13014","13015","13016"] },
  { ville: "Lyon", codes: ["69001","69002","69003","69004","69005","69006","69007","69008","69009"] },
  { ville: "Toulouse", codes: ["31000","31100","31200","31300","31400","31500"] },
  { ville: "Nice", codes: ["06000","06100","06200","06300"] },
  { ville: "Nantes", codes: ["44000","44100","44200","44300"] },
  { ville: "Montpellier", codes: ["34000","34070","34080","34090"] },
  { ville: "Strasbourg", codes: ["67000","67100","67200"] },
  { ville: "Bordeaux", codes: ["33000","33100","33200","33300","33800"] },
  { ville: "Lille", codes: ["59000","59160","59260","59800"] },
  { ville: "Rennes", codes: ["35000","35200","35700"] },
  { ville: "Reims", codes: ["51100"] },
  { ville: "Saint-Étienne", codes: ["42000","42100"] },
  { ville: "Toulon", codes: ["83000","83100","83200"] },
  { ville: "Le Havre", codes: ["76600"] },
  { ville: "Grenoble", codes: ["38000","38100"] },
  { ville: "Dijon", codes: ["21000"] },
  { ville: "Angers", codes: ["49000","49100"] },
  { ville: "Nîmes", codes: ["30000","30900"] },
  { ville: "Aix-en-Provence", codes: ["13090","13100"] },
  { ville: "Clermont-Ferrand", codes: ["63000","63100"] },
  { ville: "Brest", codes: ["29200"] },
  { ville: "Tours", codes: ["37000","37100","37200"] },
  { ville: "Amiens", codes: ["80000","80080","80090"] },
  { ville: "Limoges", codes: ["87000","87100"] },
  { ville: "Annecy", codes: ["74000","74960"] },
  { ville: "Perpignan", codes: ["66000","66100"] },
  { ville: "Besançon", codes: ["25000"] },
  { ville: "Orléans", codes: ["45000","45100"] },
  { ville: "Metz", codes: ["57000","57050"] },
  { ville: "Rouen", codes: ["76000","76100"] },
  { ville: "Mulhouse", codes: ["68100","68200"] },
  { ville: "Caen", codes: ["14000"] },
  { ville: "Nancy", codes: ["54000","54100"] },
  { ville: "Autre ville", codes: [] },
]

export default function Analyse() {
  const [symptomes, setSymptomes] = useState('')
  const [age, setAge] = useState('')
  const [duree, setDuree] = useState('')
  const [ville, setVille] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [codesDisponibles, setCodesDisponibles] = useState([])
  const [chargement, setChargement] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [erreur, setErreur] = useState(null)

  const handleVilleChange = (e) => {
    const villeChoisie = e.target.value
    setVille(villeChoisie)
    setCodePostal('')
    const found = GRANDES_VILLES.find(v => v.ville === villeChoisie)
    setCodesDisponibles(found ? found.codes : [])
  }

  const analyser = async () => {
    if (symptomes.trim().length < 10) {
      setErreur('Veuillez décrire vos symptômes plus en détail.')
      return
    }
    setChargement(true)
    setErreur(null)
    setResultat(null)
    try {
      const reponse = await fetch('/api/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptomes, age, duree, ville, codePostal })
      })
      const donnees = await reponse.json()
      if (donnees.error) setErreur(donnees.error)
      else setResultat(donnees.resultat)
    } catch {
      setErreur("Une erreur s'est produite. Vérifiez votre connexion et réessayez.")
    } finally {
      setChargement(false)
    }
  }

  const lieu = codePostal || ville || ''
  const urlDoctolib = (specialite) =>
    `https://www.doctolib.fr/recherche?text=${encodeURIComponent(specialite || '')}&location=${encodeURIComponent(lieu)}`
  const urlMaiia = (specialite) =>
    `https://www.maiia.com/medecin/?speciality=${encodeURIComponent(specialite || '')}&near=${encodeURIComponent(lieu)}`

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

          {!resultat && (
            <div className="carte-formulaire">

              <div className="champ-groupe">
                <label className="champ-label">📝 Décrivez vos symptômes *</label>
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

              {/* LOCALISATION */}
              <div style={{
                background:'#f0f7ff', border:'1px solid rgba(26,92,154,0.15)',
                borderRadius:'12px', padding:'20px', marginBottom:'24px'
              }}>
                <p style={{fontSize:'0.88rem', fontWeight:'700', color:'#1a5c9a', marginBottom:'14px'}}>
                  📍 Votre localisation — pour trouver des médecins près de chez vous
                </p>
                <div className="grille-deux">
                  <div className="champ-groupe" style={{marginBottom:0}}>
                    <label className="champ-label">🏙️ Votre ville</label>
                    <select className="champ-select" value={ville} onChange={handleVilleChange}>
                      <option value="">Sélectionnez une ville</option>
                      {GRANDES_VILLES.map(v => (
                        <option key={v.ville} value={v.ville}>{v.ville}</option>
                      ))}
                    </select>
                  </div>
                  <div className="champ-groupe" style={{marginBottom:0}}>
                    <label className="champ-label">📮 Code postal</label>
                    {codesDisponibles.length > 0 ? (
                      <select className="champ-select" value={codePostal} onChange={e => setCodePostal(e.target.value)}>
                        <option value="">Sélectionnez</option>
                        {codesDisponibles.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="champ-texte"
                        style={{minHeight:'unset', height:'50px', resize:'none', padding:'14px 18px'}}
                        placeholder="Ex : 33000"
                        value={codePostal}
                        maxLength={5}
                        onChange={e => setCodePostal(e.target.value.replace(/\D/g, ''))}
                      />
                    )}
                  </div>
                </div>
              </div>

              {erreur && (
                <div style={{background:'#fee2e2',color:'#991b1b',padding:'12px 16px',borderRadius:'10px',marginBottom:'20px',fontSize:'0.9rem'}}>
                  ⚠️ {erreur}
                </div>
              )}

              <button
                className="btn-analyser"
                onClick={analyser}
                disabled={chargement || symptomes.trim().length < 10}
              >
                {chargement ? (
                  <><div className="spinner" style={{width:'20px',height:'20px',borderWidth:'2px'}}></div>Analyse en cours...</>
                ) : (
                  <>🔍 Analyser mes symptômes</>
                )}
              </button>

              <p style={{textAlign:'center',marginTop:'16px',fontSize:'0.82rem',color:'#94a3b8'}}>
                🔒 Vos données ne sont pas sauvegardées
              </p>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niveau && (
            <div className="carte-resultat">
              <div className={`resultat-urgence ${niveau.classe}`}>
                {niveau.emoji} {niveau.texte}
              </div>

              <h2 className="resultat-titre">Spécialiste recommandé : {resultat.specialiste}</h2>

              {ville && (
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  background:'#e8f2ff', color:'#1a5c9a',
                  padding:'5px 14px', borderRadius:'50px',
                  fontSize:'0.85rem', fontWeight:'600', marginBottom:'16px'
                }}>
                  📍 {codePostal ? `${ville} (${codePostal})` : ville}
                </div>
              )}

              <p className="resultat-contenu">{resultat.explication}</p>

              {resultat.conseils?.length > 0 && (
                <div style={{marginTop:'20px'}}>
                  <strong style={{fontSize:'0.95rem',color:'#1e293b'}}>Conseils :</strong>
                  <ul style={{marginTop:'8px',paddingLeft:'20px'}}>
                    {resultat.conseils.map((c, i) => (
                      <li key={i} style={{color:'#475569',marginBottom:'6px',fontSize:'0.95rem'}}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="medecins-titre">
                📍 Trouver un(e) {resultat.specialiste} {ville ? `à ${ville}` : 'près de chez vous'}
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <a href={urlDoctolib(resultat.specialiste)} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                  <div style={{
                    background:'linear-gradient(135deg,#1a5c9a 0%,#2e75b6 100%)',
                    color:'white', padding:'18px 24px', borderRadius:'12px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'
                  }}>
                    <div>
                      <p style={{fontWeight:'700',fontSize:'1rem',marginBottom:'4px'}}>
                        🔍 Rechercher sur Doctolib
                      </p>
                      <p style={{fontSize:'0.85rem',opacity:0.85}}>
                        {lieu ? `${resultat.specialiste} à ${lieu}` : `${resultat.specialiste} près de chez vous`}
                      </p>
                    </div>
                    <span style={{fontSize:'1.5rem'}}>→</span>
                  </div>
                </a>

                <a href={urlMaiia(resultat.specialiste)} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                  <div style={{
                    background:'white', border:'2px solid #0e8a6e',
                    color:'#0e8a6e', padding:'14px 24px', borderRadius:'12px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'
                  }}>
                    <div>
                      <p style={{fontWeight:'700',fontSize:'0.95rem',marginBottom:'2px'}}>
                        📅 Rechercher sur Maiia
                      </p>
                      <p style={{fontSize:'0.82rem',opacity:0.8}}>
                        {lieu ? `${resultat.specialiste} à ${lieu}` : 'Alternative à Doctolib'}
                      </p>
                    </div>
                    <span style={{fontSize:'1.3rem'}}>→</span>
                  </div>
                </a>
              </div>

              <div className="mention-legale">
                ⚕️ <strong>Important :</strong> Cette analyse est fournie à titre informatif uniquement et ne constitue pas un diagnostic médical. Consultez toujours un professionnel de santé qualifié. En cas d'urgence vitale, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.
              </div>

              <button
                onClick={() => { setResultat(null); setSymptomes(''); setAge(''); setDuree('') }}
                style={{
                  background:'transparent', border:'2px solid #1a5c9a',
                  color:'#1a5c9a', padding:'12px 28px', borderRadius:'50px',
                  cursor:'pointer', marginTop:'24px', fontWeight:'600',
                  fontFamily:'DM Sans, sans-serif', fontSize:'0.95rem'
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
