'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

const NIVEAUX_URGENCE = {
  1: { classe: 'urgence-1', emoji: '🚨', texte: 'Urgences maintenant' },
  2: { classe: 'urgence-2', emoji: '⚠️', texte: 'Consulter sous 24h' },
  3: { classe: 'urgence-3', emoji: '📅', texte: 'Consulter dans la semaine' },
  4: { classe: 'urgence-4', emoji: '✅', texte: 'Non urgent' },
}

const s = {
  carte: {
    background: 'white', borderRadius: '16px', padding: '32px',
    marginBottom: '24px', border: '2px solid #c5d8ee',
    boxShadow: '0 4px 24px rgba(26,92,154,0.10)',
  },
  section: {
    background: '#eef4fc', border: '2px solid #b8ccdd',
    borderRadius: '12px', padding: '20px', marginBottom: '20px',
  },
  titreSec: {
    fontSize: '0.9rem', fontWeight: '700', color: '#1a5c9a',
    marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  label: {
    display: 'block', fontWeight: '700', marginBottom: '8px',
    color: '#1e293b', fontSize: '0.92rem',
  },
  input: {
    width: '100%', padding: '13px 16px',
    border: '2px solid #b8ccdd', borderRadius: '10px',
    fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
    color: '#1e293b', background: '#f8fbff', outline: 'none',
  },
  select: {
    width: '100%', padding: '13px 16px',
    border: '2px solid #b8ccdd', borderRadius: '10px',
    fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
    color: '#1e293b', background: '#f8fbff', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  },
}

export default function Analyse() {
  const [symptomes, setSymptomes] = useState('')
  const [age, setAge] = useState('')
  const [duree, setDuree] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [villesDisponibles, setVillesDisponibles] = useState([])
  const [ville, setVille] = useState('')
  const [chargementVilles, setChargementVilles] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [medecins, setMedecins] = useState([])
  const [chargementMedecins, setChargementMedecins] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState(null)
  const [erreur, setErreur] = useState(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const rechercherVilles = useCallback(async (cp) => {
    setVille('')
    setVillesDisponibles([])
    if (cp.length < 2) return
    setChargementVilles(true)
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,codePostal&format=json`)
      if (res.ok) {
        const data = await res.json()
        setVillesDisponibles(data.sort((a, b) => a.nom.localeCompare(b.nom)))
      }
    } catch {}
    finally { setChargementVilles(false) }
  }, [])

  const handleCP = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
    setCodePostal(val)
    if (val.length >= 2) rechercherVilles(val)
    else { setVillesDisponibles([]); setVille('') }
  }

  const handlePhoto = (file) => {
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const supprimerPhoto = () => {
    setPhoto(null); setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const rechercherMedecins = async (specialiste, cp, v) => {
    if (!cp) return
    setChargementMedecins(true)
    setMedecins([])
    setFallbackUrl(null)
    try {
      const params = new URLSearchParams({ specialiste, codePostal: cp, ville: v || '' })
      const res = await fetch(`/api/medecins?${params}`)
      const data = await res.json()
      if (data.succes && data.medecins?.length > 0) {
        setMedecins(data.medecins)
      } else if (data.fallback) {
        setFallbackUrl(data.urlDoctolib)
      }
    } catch {}
    finally { setChargementMedecins(false) }
  }

  const analyser = async () => {
    if (symptomes.trim().length < 3 && !photo) {
      setErreur('Veuillez décrire vos symptômes ou ajouter une photo.')
      return
    }
    setChargement(true); setErreur(null); setResultat(null); setMedecins([])

    try {
      let photoBase64 = null
      if (photo) {
        photoBase64 = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = e => res(e.target.result.split(',')[1])
          reader.onerror = rej
          reader.readAsDataURL(photo)
        })
      }

      const reponse = await fetch('/api/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptomes, age, duree, ville, codePostal, photoBase64, photoType: photo?.type })
      })
      const donnees = await reponse.json()

      if (donnees.error) {
        setErreur(donnees.error)
      } else {
        setResultat(donnees.resultat)
        // Lancer la recherche de médecins en parallèle
        if (codePostal) {
          rechercherMedecins(donnees.resultat.specialiste, codePostal, ville)
        }
      }
    } catch {
      setErreur("Une erreur s'est produite. Vérifiez votre connexion.")
    } finally {
      setChargement(false)
    }
  }

  const peutAnalyser = !chargement && (symptomes.trim().length >= 3 || photo)
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
            <p>Décrivez ce que vous ressentez — notre IA vous oriente et trouve les médecins près de chez vous</p>
          </div>

          {!resultat && (
            <div style={s.carte}>

              {/* SYMPTÔMES */}
              <div style={s.section}>
                <div style={s.titreSec}>📝 Décrivez vos symptômes</div>
                <textarea
                  style={{...s.input, minHeight:'120px', resize:'vertical'}}
                  placeholder="Ex : Douleur dans la poitrine depuis ce matin, difficultés à respirer, légère fièvre..."
                  value={symptomes}
                  onChange={e => setSymptomes(e.target.value)}
                />
              </div>

              {/* PHOTO */}
              <div style={s.section}>
                <div style={s.titreSec}>📸 Ajouter une photo <span style={{fontWeight:'400',color:'#64748b'}}>(optionnel)</span></div>
                <p style={{fontSize:'0.83rem',color:'#64748b',marginBottom:'12px'}}>
                  Utile pour les lésions cutanées, plaies, boutons, herpès, eczéma...
                </p>
                {!photoPreview ? (
                  <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                    {[
                      { ref: fileRef, capture: undefined, emoji: '🖼️', label: 'Choisir une photo', sub: 'depuis la galerie', color: '#1a5c9a' },
                      { ref: cameraRef, capture: 'environment', emoji: '📷', label: 'Prendre une photo', sub: 'avec l\'appareil photo', color: '#0e8a6e' },
                    ].map((btn, i) => (
                      <button key={i} onClick={() => btn.ref.current?.click()} style={{
                        flex:1, minWidth:'130px', background:'white',
                        border:`2px solid ${btn.color}`, borderRadius:'10px',
                        padding:'14px 10px', cursor:'pointer',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                        color: btn.color, fontWeight:'600', fontSize:'0.88rem',
                        fontFamily:'DM Sans, sans-serif',
                      }}>
                        <span style={{fontSize:'1.8rem'}}>{btn.emoji}</span>
                        {btn.label}
                        <span style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'400'}}>{btn.sub}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{position:'relative', display:'inline-block'}}>
                    <img src={photoPreview} alt="Photo ajoutée" style={{
                      maxWidth:'100%', maxHeight:'200px',
                      borderRadius:'10px', border:'2px solid #b8ccdd', display:'block'
                    }}/>
                    <button onClick={supprimerPhoto} style={{
                      position:'absolute', top:'6px', right:'6px',
                      background:'#c0392b', color:'white', border:'none',
                      borderRadius:'50%', width:'28px', height:'28px',
                      cursor:'pointer', fontSize:'0.85rem', display:'flex',
                      alignItems:'center', justifyContent:'center',
                    }}>✕</button>
                    <p style={{marginTop:'6px', fontSize:'0.82rem', color:'#0e8a6e', fontWeight:'600'}}>
                      ✅ {photo?.name}
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
              </div>

              {/* ÂGE + DURÉE */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px'}}>
                <div>
                  <label style={s.label}>👤 Âge (optionnel)</label>
                  <select style={s.select} value={age} onChange={e => setAge(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="enfant (moins de 12 ans)">Enfant (- 12 ans)</option>
                    <option value="adolescent (12-17 ans)">Adolescent</option>
                    <option value="jeune adulte (18-30 ans)">18-30 ans</option>
                    <option value="adulte (30-50 ans)">30-50 ans</option>
                    <option value="adulte (50-65 ans)">50-65 ans</option>
                    <option value="senior (65 ans et plus)">Senior 65+</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>⏱️ Depuis combien de temps ?</label>
                  <select style={s.select} value={duree} onChange={e => setDuree(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="quelques heures">Quelques heures</option>
                    <option value="depuis hier">Depuis hier</option>
                    <option value="2 à 3 jours">2-3 jours</option>
                    <option value="une semaine">Une semaine</option>
                    <option value="plus d'une semaine">+ d'une semaine</option>
                    <option value="plus d'un mois">+ d'un mois</option>
                  </select>
                </div>
              </div>

              {/* LOCALISATION */}
              <div style={s.section}>
                <div style={s.titreSec}>📍 Votre localisation — pour trouver des médecins près de chez vous</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                  <div>
                    <label style={s.label}>📮 Code postal</label>
                    <input
                      type="text" style={s.input}
                      placeholder="Ex : 57, 572, 57200..."
                      value={codePostal} maxLength={5}
                      onChange={handleCP}
                    />
                    {chargementVilles && <p style={{fontSize:'0.78rem',color:'#1a5c9a',marginTop:'5px'}}>🔍 Recherche...</p>}
                    {villesDisponibles.length > 0 && !chargementVilles && (
                      <p style={{fontSize:'0.78rem',color:'#0e8a6e',marginTop:'5px',fontWeight:'600'}}>
                        ✅ {villesDisponibles.length} ville{villesDisponibles.length > 1 ? 's' : ''} trouvée{villesDisponibles.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={s.label}>🏙️ Votre ville</label>
                    <select
                      style={{...s.select, opacity: villesDisponibles.length === 0 ? 0.5 : 1}}
                      value={ville}
                      onChange={e => setVille(e.target.value)}
                      disabled={villesDisponibles.length === 0}
                    >
                      <option value="">{villesDisponibles.length === 0 ? 'Entrez un code postal' : 'Sélectionnez'}</option>
                      {villesDisponibles.map(v => (
                        <option key={v.nom} value={v.nom}>{v.nom} ({v.codePostal})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {erreur && (
                <div style={{background:'#fee2e2',color:'#991b1b',border:'2px solid #fca5a5',padding:'12px 16px',borderRadius:'10px',marginBottom:'16px',fontSize:'0.9rem'}}>
                  ⚠️ {erreur}
                </div>
              )}

              <button onClick={analyser} disabled={!peutAnalyser} style={{
                width:'100%',
                background: peutAnalyser ? 'linear-gradient(135deg,#1a5c9a,#2e75b6)' : '#94a3b8',
                color:'white', padding:'17px', borderRadius:'50px',
                fontSize:'1rem', fontWeight:'700',
                cursor: peutAnalyser ? 'pointer' : 'not-allowed',
                border:'none', fontFamily:'DM Sans, sans-serif',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                boxShadow: peutAnalyser ? '0 4px 20px rgba(26,92,154,0.3)' : 'none',
              }}>
                {chargement
                  ? <><div className="spinner" style={{width:'20px',height:'20px',borderWidth:'2px'}}></div>Analyse en cours...</>
                  : <>🔍 Analyser{photo ? ' + photo' : ''}</>
                }
              </button>
              <p style={{textAlign:'center',marginTop:'12px',fontSize:'0.8rem',color:'#94a3b8'}}>
                🔒 Données non sauvegardées · ~15 secondes
              </p>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niveau && (
            <div style={{...s.carte, borderLeft:'6px solid #1a5c9a'}}>
              <div className={`resultat-urgence ${niveau.classe}`}>{niveau.emoji} {niveau.texte}</div>

              <h2 className="resultat-titre">Spécialiste recommandé : {resultat.specialiste}</h2>

              <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px'}}>
                {(ville || codePostal) && (
                  <span style={{background:'#e8f2ff',color:'#1a5c9a',border:'1px solid #b8ccdd',padding:'4px 12px',borderRadius:'50px',fontSize:'0.82rem',fontWeight:'600'}}>
                    📍 {ville ? `${ville} (${codePostal})` : codePostal}
                  </span>
                )}
                {photo && (
                  <span style={{background:'#e6f7f3',color:'#0e8a6e',border:'1px solid #a7d7cc',padding:'4px 12px',borderRadius:'50px',fontSize:'0.82rem',fontWeight:'600'}}>
                    📸 Photo analysée
                  </span>
                )}
              </div>

              <p className="resultat-contenu">{resultat.explication}</p>

              {resultat.conseils?.length > 0 && (
                <div style={{background:'#f0f7ff',border:'2px solid #c5d8ee',borderRadius:'12px',padding:'18px',marginTop:'18px'}}>
                  <strong style={{fontSize:'0.92rem',color:'#1e293b'}}>💡 Conseils :</strong>
                  <ul style={{marginTop:'8px',paddingLeft:'18px'}}>
                    {resultat.conseils.map((c, i) => (
                      <li key={i} style={{color:'#475569',marginBottom:'6px',fontSize:'0.92rem'}}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION MÉDECINS */}
              <div style={{marginTop:'28px',paddingTop:'24px',borderTop:'2px solid #e2ecf7'}}>
                <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1.15rem',color:'#1e293b',marginBottom:'16px'}}>
                  🏥 {resultat.specialiste}s {ville ? `à ${ville}` : codePostal ? `(${codePostal})` : 'près de chez vous'}
                </h3>

                {/* Chargement médecins */}
                {chargementMedecins && (
                  <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'20px',background:'#f0f7ff',borderRadius:'12px'}}>
                    <div className="spinner"></div>
                    <span style={{color:'#1a5c9a',fontSize:'0.9rem'}}>Recherche des médecins disponibles...</span>
                  </div>
                )}

                {/* Liste médecins */}
                {!chargementMedecins && medecins.length > 0 && (
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {medecins.map((m, i) => (
                      <div key={i} style={{
                        background:'white', border:'2px solid #c5d8ee',
                        borderRadius:'12px', padding:'16px 20px',
                        display:'flex', alignItems:'center',
                        justifyContent:'space-between', gap:'12px',
                      }}>
                        <div>
                          <p style={{fontWeight:'700',color:'#1e293b',marginBottom:'4px',fontSize:'0.95rem'}}>
                            {m.nom}
                          </p>
                          <p style={{color:'#64748b',fontSize:'0.83rem'}}>
                            🏥 {m.specialite}
                          </p>
                          <p style={{color:'#64748b',fontSize:'0.83rem',marginTop:'2px'}}>
                            📍 {m.adresse}
                          </p>
                          {m.telephone && (
                            <p style={{color:'#1a5c9a',fontSize:'0.83rem',marginTop:'2px',fontWeight:'600'}}>
                              📞 {m.telephone}
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://www.doctolib.fr/recherche?text=${encodeURIComponent(resultat.specialiste)}&location=${encodeURIComponent(ville||codePostal)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{textDecoration:'none'}}
                        >
                          <div style={{
                            background:'#1a5c9a', color:'white',
                            padding:'9px 16px', borderRadius:'50px',
                            fontSize:'0.82rem', fontWeight:'700',
                            whiteSpace:'nowrap', cursor:'pointer',
                          }}>
                            Prendre RDV
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback si API indisponible */}
                {!chargementMedecins && medecins.length === 0 && !fallbackUrl && codePostal && (
                  <div style={{background:'#f0f7ff',border:'2px solid #c5d8ee',borderRadius:'12px',padding:'20px',textAlign:'center'}}>
                    <p style={{color:'#64748b',marginBottom:'14px',fontSize:'0.9rem'}}>
                      Recherche directe sur les plateformes de rendez-vous
                    </p>
                    <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
                      <a href={`https://www.doctolib.fr/recherche?text=${encodeURIComponent(resultat.specialiste)}&location=${encodeURIComponent(ville||codePostal)}`}
                        target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                        <div style={{background:'#0596DE',color:'white',padding:'12px 24px',borderRadius:'50px',fontWeight:'700',cursor:'pointer',fontSize:'0.9rem'}}>
                          📅 Doctolib
                        </div>
                      </a>
                      <a href={`https://www.keldoc.com/search?specialty=${encodeURIComponent(resultat.specialiste)}&city=${encodeURIComponent(ville||codePostal)}`}
                        target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                        <div style={{background:'#6366f1',color:'white',padding:'12px 24px',borderRadius:'50px',fontWeight:'700',cursor:'pointer',fontSize:'0.9rem'}}>
                          📅 Keldoc
                        </div>
                      </a>
                    </div>
                  </div>
                )}

                {!codePostal && (
                  <div style={{background:'#fff7ed',border:'2px solid #fed7aa',borderRadius:'12px',padding:'16px',textAlign:'center'}}>
                    <p style={{color:'#9a3412',fontSize:'0.88rem'}}>
                      💡 Renseignez votre code postal pour voir les médecins près de chez vous
                    </p>
                  </div>
                )}
              </div>

              <div style={{background:'#fff7ed',border:'2px solid #fed7aa',borderRadius:'12px',padding:'14px 18px',fontSize:'0.82rem',color:'#9a3412',marginTop:'20px',lineHeight:'1.6'}}>
                ⚕️ <strong>Important :</strong> Cette analyse est informative, elle ne remplace pas un diagnostic médical. En cas d'urgence : <strong>15 (SAMU)</strong> ou <strong>112</strong>.
              </div>

              <button
                onClick={() => { setResultat(null); setSymptomes(''); setAge(''); setDuree(''); setMedecins([]); supprimerPhoto() }}
                style={{background:'transparent',border:'2px solid #1a5c9a',color:'#1a5c9a',padding:'11px 26px',borderRadius:'50px',cursor:'pointer',marginTop:'20px',fontWeight:'600',fontFamily:'DM Sans, sans-serif',fontSize:'0.92rem'}}
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
