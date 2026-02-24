'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

const NIVEAUX_URGENCE = {
  1: { classe: 'urgence-1', emoji: '🚨', texte: 'Urgences maintenant' },
  2: { classe: 'urgence-2', emoji: '⚠️', texte: 'Consulter sous 24h' },
  3: { classe: 'urgence-3', emoji: '📅', texte: 'Consulter dans la semaine' },
  4: { classe: 'urgence-4', emoji: '✅', texte: 'Non urgent' },
}

export default function Analyse() {
  const [symptomes, setSymptomes] = useState('')
  const [age, setAge] = useState('')
  const [duree, setDuree] = useState('')
  const [codePostalInput, setCodePostalInput] = useState('')
  const [villesDisponibles, setVillesDisponibles] = useState([])
  const [villeSelectionnee, setVilleSelectionnee] = useState('')
  const [chargementVilles, setChargementVilles] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [erreur, setErreur] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Recherche des villes via API gouvernement français (gratuite, sans clé)
  const rechercherVilles = useCallback(async (cp) => {
    setVilleSelectionnee('')
    setVillesDisponibles([])
    if (cp.length < 2) return
    setChargementVilles(true)
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,codePostal&format=json&geometry=centre`)
      if (res.ok) {
        const data = await res.json()
        setVillesDisponibles(data.sort((a, b) => a.nom.localeCompare(b.nom)))
      }
    } catch {
      // silencieux
    } finally {
      setChargementVilles(false)
    }
  }, [])

  const handleCodePostalChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
    setCodePostalInput(val)
    if (val.length >= 2) {
      rechercherVilles(val)
    } else {
      setVillesDisponibles([])
      setVilleSelectionnee('')
    }
  }

  const handlePhoto = (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setErreur('La photo est trop lourde (max 10 Mo).')
      return
    }
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const supprimerPhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const analyser = async () => {
    if (symptomes.trim().length < 3 && !photo) {
      setErreur('Veuillez décrire vos symptômes ou ajouter une photo.')
      return
    }
    setChargement(true)
    setErreur(null)
    setResultat(null)

    try {
      let photoBase64 = null
      if (photo) {
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(photo)
        })
      }

      const reponse = await fetch('/api/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomes,
          age,
          duree,
          ville: villeSelectionnee,
          codePostal: codePostalInput,
          photoBase64,
          photoType: photo?.type || null
        })
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

  const lieu = villeSelectionnee || codePostalInput
  const urlDoctolib = (s) => `https://www.doctolib.fr/recherche?text=${encodeURIComponent(s||'')}&location=${encodeURIComponent(lieu)}`
  const urlMaiia = (s) => `https://www.maiia.com/medecin/?speciality=${encodeURIComponent(s||'')}&near=${encodeURIComponent(lieu)}`
  const niveau = resultat ? NIVEAUX_URGENCE[resultat.niveau_urgence] || NIVEAUX_URGENCE[3] : null
  const peutAnalyser = !chargement && (symptomes.trim().length >= 3 || photo)

  const styles = {
    carte: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      border: '2px solid #d1dff0',
      boxShadow: '0 4px 20px rgba(26,92,154,0.12)',
    },
    label: {
      display: 'block',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#1e293b',
      fontSize: '0.95rem',
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      border: '2px solid #b8ccdd',
      borderRadius: '10px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1rem',
      color: '#1e293b',
      background: '#f8fbff',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '14px 18px',
      border: '2px solid #b8ccdd',
      borderRadius: '10px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1rem',
      color: '#1e293b',
      background: '#f8fbff',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 16px center',
    },
    section: {
      background: '#eef4fc',
      border: '2px solid #b8ccdd',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    },
    sectionTitre: {
      fontSize: '0.9rem',
      fontWeight: '700',
      color: '#1a5c9a',
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }
  }

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
            <p>Décrivez ce que vous ressentez et/ou ajoutez une photo — notre IA vous oriente vers le bon spécialiste</p>
          </div>

          {!resultat && (
            <div style={styles.carte}>

              {/* SYMPTÔMES */}
              <div style={styles.section}>
                <div style={styles.sectionTitre}>📝 Décrivez vos symptômes</div>
                <textarea
                  style={{...styles.input, minHeight:'130px', resize:'vertical'}}
                  placeholder="Ex : J'ai une douleur dans la poitrine depuis ce matin, avec des difficultés à respirer et une légère fièvre..."
                  value={symptomes}
                  onChange={e => setSymptomes(e.target.value)}
                />
              </div>

              {/* PHOTO */}
              <div style={styles.section}>
                <div style={styles.sectionTitre}>📸 Ajouter une photo (optionnel)</div>
                <p style={{fontSize:'0.85rem', color:'#475569', marginBottom:'14px'}}>
                  Utile pour les lésions cutanées, plaies, boutons, herpès, eczéma...
                </p>

                {!photoPreview ? (
                  <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex:1, minWidth:'140px',
                        background:'white', border:'2px solid #b8ccdd',
                        borderRadius:'10px', padding:'14px',
                        cursor:'pointer', display:'flex',
                        flexDirection:'column', alignItems:'center', gap:'8px',
                        color:'#1a5c9a', fontWeight:'600', fontSize:'0.9rem',
                        fontFamily:'DM Sans, sans-serif',
                        transition:'all 0.2s',
                      }}
                    >
                      <span style={{fontSize:'2rem'}}>🖼️</span>
                      Choisir une photo
                      <span style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'400'}}>depuis la galerie</span>
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        flex:1, minWidth:'140px',
                        background:'white', border:'2px solid #b8ccdd',
                        borderRadius:'10px', padding:'14px',
                        cursor:'pointer', display:'flex',
                        flexDirection:'column', alignItems:'center', gap:'8px',
                        color:'#0e8a6e', fontWeight:'600', fontSize:'0.9rem',
                        fontFamily:'DM Sans, sans-serif',
                        transition:'all 0.2s',
                      }}
                    >
                      <span style={{fontSize:'2rem'}}>📷</span>
                      Prendre une photo
                      <span style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'400'}}>avec l'appareil photo</span>
                    </button>
                  </div>
                ) : (
                  <div style={{position:'relative', display:'inline-block'}}>
                    <img
                      src={photoPreview}
                      alt="Photo ajoutée"
                      style={{
                        maxWidth:'100%', maxHeight:'220px',
                        borderRadius:'10px', border:'2px solid #b8ccdd',
                        display:'block',
                      }}
                    />
                    <button
                      onClick={supprimerPhoto}
                      style={{
                        position:'absolute', top:'8px', right:'8px',
                        background:'#c0392b', color:'white',
                        border:'none', borderRadius:'50%',
                        width:'30px', height:'30px',
                        cursor:'pointer', fontSize:'0.9rem',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'DM Sans, sans-serif',
                      }}
                    >✕</button>
                    <p style={{marginTop:'8px', fontSize:'0.82rem', color:'#0e8a6e', fontWeight:'600'}}>
                      ✅ Photo ajoutée — {photo?.name}
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{display:'none'}}
                  onChange={e => handlePhoto(e.target.files?.[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{display:'none'}}
                  onChange={e => handlePhoto(e.target.files?.[0])}
                />
              </div>

              {/* ÂGE + DURÉE */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px'}}>
                <div>
                  <label style={styles.label}>👤 Votre âge (optionnel)</label>
                  <select style={styles.select} value={age} onChange={e => setAge(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="enfant (moins de 12 ans)">Enfant (- de 12 ans)</option>
                    <option value="adolescent (12-17 ans)">Adolescent (12-17 ans)</option>
                    <option value="jeune adulte (18-30 ans)">Jeune adulte (18-30 ans)</option>
                    <option value="adulte (30-50 ans)">Adulte (30-50 ans)</option>
                    <option value="adulte (50-65 ans)">Adulte (50-65 ans)</option>
                    <option value="senior (65 ans et plus)">Senior (65 ans +)</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>⏱️ Depuis combien de temps ?</label>
                  <select style={styles.select} value={duree} onChange={e => setDuree(e.target.value)}>
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
              <div style={styles.section}>
                <div style={styles.sectionTitre}>📍 Votre localisation — pour trouver des médecins près de chez vous</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                  <div>
                    <label style={styles.label}>📮 Code postal</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="Ex : 57, 572, 57200..."
                      value={codePostalInput}
                      maxLength={5}
                      onChange={handleCodePostalChange}
                    />
                    {chargementVilles && (
                      <p style={{fontSize:'0.8rem', color:'#1a5c9a', marginTop:'6px'}}>
                        🔍 Recherche des villes...
                      </p>
                    )}
                    {villesDisponibles.length > 0 && !chargementVilles && (
                      <p style={{fontSize:'0.8rem', color:'#0e8a6e', marginTop:'6px', fontWeight:'600'}}>
                        ✅ {villesDisponibles.length} ville{villesDisponibles.length > 1 ? 's' : ''} trouvée{villesDisponibles.length > 1 ? 's' : ''}
                      </p>
                    )}
                    {codePostalInput.length >= 2 && villesDisponibles.length === 0 && !chargementVilles && (
                      <p style={{fontSize:'0.8rem', color:'#e67e22', marginTop:'6px'}}>
                        ⚠️ Aucune ville trouvée pour ce code
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={styles.label}>🏙️ Votre ville</label>
                    <select
                      style={{
                        ...styles.select,
                        opacity: villesDisponibles.length === 0 ? 0.5 : 1,
                      }}
                      value={villeSelectionnee}
                      onChange={e => setVilleSelectionnee(e.target.value)}
                      disabled={villesDisponibles.length === 0}
                    >
                      <option value="">
                        {villesDisponibles.length === 0
                          ? 'Entrez un code postal d\'abord'
                          : 'Sélectionnez votre ville'}
                      </option>
                      {villesDisponibles.map(v => (
                        <option key={v.nom + v.codePostal} value={v.nom}>
                          {v.nom} ({v.codePostal})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {erreur && (
                <div style={{
                  background:'#fee2e2', color:'#991b1b', border:'2px solid #fca5a5',
                  padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontSize:'0.9rem'
                }}>
                  ⚠️ {erreur}
                </div>
              )}

              <button
                onClick={analyser}
                disabled={!peutAnalyser}
                style={{
                  width:'100%',
                  background: peutAnalyser
                    ? 'linear-gradient(135deg, #1a5c9a 0%, #2e75b6 100%)'
                    : '#94a3b8',
                  color:'white', padding:'18px',
                  borderRadius:'50px', fontSize:'1.05rem',
                  fontWeight:'700', cursor: peutAnalyser ? 'pointer' : 'not-allowed',
                  border:'none', fontFamily:'DM Sans, sans-serif',
                  display:'flex', alignItems:'center',
                  justifyContent:'center', gap:'10px',
                  boxShadow: peutAnalyser ? '0 4px 20px rgba(26,92,154,0.35)' : 'none',
                  transition:'all 0.3s',
                }}
              >
                {chargement ? (
                  <><div className="spinner" style={{width:'20px',height:'20px',borderWidth:'2px'}}></div>Analyse en cours...</>
                ) : (
                  <>🔍 Analyser mes symptômes{photo ? ' + photo' : ''}</>
                )}
              </button>

              <p style={{textAlign:'center', marginTop:'14px', fontSize:'0.82rem', color:'#94a3b8'}}>
                🔒 Vos données ne sont pas sauvegardées · Analyse en ~10 secondes
              </p>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niveau && (
            <div style={{
              background:'white', borderRadius:'16px', padding:'40px',
              border:'2px solid #d1dff0', boxShadow:'0 4px 20px rgba(26,92,154,0.12)',
              borderLeft:'6px solid #1a5c9a', animation:'apparaitre 0.5s ease',
            }}>
              <div className={`resultat-urgence ${niveau.classe}`}>
                {niveau.emoji} {niveau.texte}
              </div>

              <h2 className="resultat-titre">Spécialiste recommandé : {resultat.specialiste}</h2>

              {(villeSelectionnee || codePostalInput) && (
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  background:'#e8f2ff', color:'#1a5c9a', border:'1px solid #b8ccdd',
                  padding:'5px 14px', borderRadius:'50px',
                  fontSize:'0.85rem', fontWeight:'600', marginBottom:'16px'
                }}>
                  📍 {villeSelectionnee ? `${villeSelectionnee} (${codePostalInput})` : codePostalInput}
                </div>
              )}

              {photo && (
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  background:'#e6f7f3', color:'#0e8a6e', border:'1px solid #a7d7cc',
                  padding:'5px 14px', borderRadius:'50px',
                  fontSize:'0.85rem', fontWeight:'600', marginBottom:'16px', marginLeft:'8px'
                }}>
                  📸 Photo analysée
                </div>
              )}

              <p className="resultat-contenu">{resultat.explication}</p>

              {resultat.conseils?.length > 0 && (
                <div style={{
                  background:'#f8fbff', border:'2px solid #d1dff0',
                  borderRadius:'12px', padding:'20px', marginTop:'20px'
                }}>
                  <strong style={{fontSize:'0.95rem', color:'#1e293b'}}>💡 Conseils :</strong>
                  <ul style={{marginTop:'10px', paddingLeft:'20px'}}>
                    {resultat.conseils.map((c, i) => (
                      <li key={i} style={{color:'#475569', marginBottom:'8px', fontSize:'0.95rem'}}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{
                fontSize:'1.05rem', fontWeight:'700', color:'#1e293b',
                margin:'28px 0 16px', paddingTop:'20px',
                borderTop:'2px solid #d1dff0',
                fontFamily:'Playfair Display, serif'
              }}>
                📍 Trouver un(e) {resultat.specialiste} {villeSelectionnee ? `à ${villeSelectionnee}` : lieu ? `(${lieu})` : 'près de chez vous'}
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <a href={urlDoctolib(resultat.specialiste)} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                  <div style={{
                    background:'linear-gradient(135deg,#1a5c9a,#2e75b6)',
                    color:'white', padding:'18px 24px', borderRadius:'12px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    cursor:'pointer', border:'2px solid #1a5c9a',
                  }}>
                    <div>
                      <p style={{fontWeight:'700', fontSize:'1rem', marginBottom:'4px'}}>🔍 Rechercher sur Doctolib</p>
                      <p style={{fontSize:'0.85rem', opacity:0.85}}>
                        {resultat.specialiste}{lieu ? ` à ${lieu}` : ' près de chez vous'}
                      </p>
                    </div>
                    <span style={{fontSize:'1.5rem'}}>→</span>
                  </div>
                </a>
                <a href={urlMaiia(resultat.specialiste)} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                  <div style={{
                    background:'white', border:'2px solid #0e8a6e',
                    color:'#0e8a6e', padding:'16px 24px', borderRadius:'12px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer',
                  }}>
                    <div>
                      <p style={{fontWeight:'700', fontSize:'0.95rem', marginBottom:'2px'}}>📅 Rechercher sur Maiia</p>
                      <p style={{fontSize:'0.82rem', opacity:0.8}}>Alternative à Doctolib</p>
                    </div>
                    <span style={{fontSize:'1.3rem'}}>→</span>
                  </div>
                </a>
              </div>

              <div style={{
                background:'#fff7ed', border:'2px solid #fed7aa',
                borderRadius:'12px', padding:'16px 20px',
                fontSize:'0.85rem', color:'#9a3412', marginTop:'24px', lineHeight:'1.6'
              }}>
                ⚕️ <strong>Important :</strong> Cette analyse est fournie à titre informatif uniquement et ne constitue pas un diagnostic médical. Consultez toujours un professionnel de santé qualifié. En cas d'urgence vitale, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.
              </div>

              <button
                onClick={() => { setResultat(null); setSymptomes(''); setAge(''); setDuree(''); supprimerPhoto() }}
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
