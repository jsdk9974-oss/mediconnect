'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

const NIVEAUX = {
  1: { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', emoji:'🚨', texte:'Urgences maintenant' },
  2: { bg:'#ffedd5', color:'#9a3412', border:'#fdba74', emoji:'⚠️', texte:'Consulter sous 24h' },
  3: { bg:'#fef9c3', color:'#854d0e', border:'#fde047', emoji:'📅', texte:'Consulter cette semaine' },
  4: { bg:'#dcfce7', color:'#166534', border:'#86efac', emoji:'✅', texte:'Non urgent' },
}

export default function Analyse() {
  const [symptomes, setSymptomes] = useState('')
  const [age, setAge] = useState('')
  const [duree, setDuree] = useState('')
  const [cpInput, setCpInput] = useState('')
  const [villes, setVilles] = useState([])
  const [ville, setVille] = useState('')
  const [cpLoading, setCpLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [medecins, setMedecins] = useState([])
  const [liensRdv, setLiensRdv] = useState(null)
  const [medecinLoading, setMedecinLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const rechercherVilles = useCallback(async (cp) => {
    setVille(''); setVilles([])
    if (cp.length < 2) return
    setCpLoading(true)
    try {
      const r = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,codePostal&format=json`)
      if (r.ok) setVilles((await r.json()).sort((a,b) => a.nom.localeCompare(b.nom)))
    } catch {}
    setCpLoading(false)
  }, [])

  const handleCp = e => {
    const v = e.target.value.replace(/\D/g,'').slice(0,5)
    setCpInput(v); rechercherVilles(v)
  }

  const handlePhoto = file => {
    if (!file) return
    setPhoto(file)
    const r = new FileReader()
    r.onload = e => setPhotoPreview(e.target.result)
    r.readAsDataURL(file)
  }

  const supprimerPhoto = () => {
    setPhoto(null); setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const chercherMedecins = async (specialiste, cp) => {
    if (!cp) return
    setMedecinLoading(true)
    try {
      const r = await fetch(`/api/medecins?specialiste=${encodeURIComponent(specialiste)}&codePostal=${cp}`)
      const d = await r.json()
      if (d.succes && d.medecins?.length > 0) setMedecins(d.medecins)
      else setLiensRdv(d.liens || null)
    } catch {}
    setMedecinLoading(false)
  }

  const analyser = async () => {
    if (symptomes.trim().length < 3 && !photo) { setErreur('Décrivez vos symptômes ou ajoutez une photo.'); return }
    setLoading(true); setErreur(null); setResultat(null); setMedecins([]); setLiensRdv(null)
    try {
      let photoBase64 = null
      if (photo) {
        photoBase64 = await new Promise((res,rej) => {
          const r = new FileReader()
          r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(photo)
        })
      }
      const resp = await fetch('/api/analyser', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ symptomes, age, duree, ville, codePostal:cpInput, photoBase64, photoType:photo?.type })
      })
      const d = await resp.json()
      if (d.error) setErreur(d.error)
      else { setResultat(d.resultat); chercherMedecins(d.resultat.specialiste, cpInput) }
    } catch { setErreur("Erreur de connexion. Réessayez.") }
    setLoading(false)
  }

  const reset = () => { setResultat(null); setSymptomes(''); setAge(''); setDuree(''); setMedecins([]); setLiensRdv(null); supprimerPhoto() }
  const peutAnalyser = !loading && (symptomes.trim().length >= 3 || photo)
  const niv = resultat ? NIVEAUX[resultat.niveau_urgence] || NIVEAUX[3] : null

  const css = `
    .page { padding: 90px 5% 60px; min-height:100vh; background:#eef2f7; font-family:'DM Sans',sans-serif; }
    .conteneur { max-width:740px; margin:0 auto; }
    .titre { text-align:center; margin-bottom:28px; }
    .titre h1 { font-family:'Playfair Display',serif; font-size:clamp(1.7rem,4vw,2.3rem); color:#1e293b; margin-bottom:8px; }
    .titre p { color:#64748b; font-size:0.97rem; }
    .carte { background:white; border-radius:18px; border:2.5px solid #bfcfe0; box-shadow:0 6px 28px rgba(15,40,80,0.11); padding:28px; margin-bottom:20px; }
    .bloc { background:#e9f0f9; border:2px solid #b0c4d8; border-radius:14px; padding:18px; margin-bottom:16px; }
    .bloc-vert { background:#e6f5ef; border:2px solid #9acdb9; border-radius:14px; padding:18px; margin-bottom:16px; }
    .bloc-titre { font-size:0.8rem; font-weight:800; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:12px; }
    .label { display:block; font-weight:700; font-size:0.83rem; color:#334155; margin-bottom:5px; }
    .input { width:100%; padding:12px 14px; border:2px solid #8faec7; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:0.93rem; color:#1e293b; background:white; outline:none; transition:border-color 0.2s; }
    .input:focus { border-color:#1a5c9a; }
    .select { width:100%; padding:12px 14px; border:2px solid #8faec7; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:0.93rem; color:#1e293b; background:white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance:none; cursor:pointer; outline:none; }
    .select:focus { border-color:#1a5c9a; }
    .select:disabled { opacity:0.4; cursor:not-allowed; }
    .grille2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    @media(max-width:560px){.grille2{grid-template-columns:1fr;}}
    .champ { display:flex; flex-direction:column; }
    .photo-btns { display:flex; gap:12px; flex-wrap:wrap; }
    .photo-btn { flex:1; min-width:130px; background:white; border-radius:12px; padding:14px 10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; font-weight:700; font-size:0.83rem; font-family:'DM Sans',sans-serif; transition:transform 0.15s; }
    .photo-btn:hover { transform:translateY(-2px); }
    .photo-btn-bleu { border:2px solid #1a5c9a; color:#1a5c9a; }
    .photo-btn-vert { border:2px solid #0e8a6e; color:#0e8a6e; }
    .btn-analyser { width:100%; padding:17px; border-radius:50px; border:none; font-family:'DM Sans',sans-serif; font-size:1rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.25s; }
    .btn-ok { background:linear-gradient(135deg,#1a5c9a,#1e7bc4); color:white; box-shadow:0 5px 24px rgba(26,92,154,0.35); }
    .btn-ok:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(26,92,154,0.42); }
    .btn-off { background:#cbd5e1; color:#94a3b8; cursor:not-allowed; }
    .spinner { width:22px; height:22px; border:3px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }
    .spinner-bleu { width:22px; height:22px; border:3px solid #c3d2e8; border-top-color:#1a5c9a; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
    @keyframes spin { to{transform:rotate(360deg);} }
    .erreur { background:#fee2e2; border:2px solid #fca5a5; color:#991b1b; padding:12px 16px; border-radius:10px; margin-bottom:16px; font-size:0.88rem; }
    .carte-res { background:white; border-radius:18px; border:2.5px solid #bfcfe0; border-left:6px solid #1a5c9a; box-shadow:0 6px 28px rgba(15,40,80,0.11); padding:28px; animation:app 0.4s ease; }
    @keyframes app { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
    .badge-niv { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; border-radius:50px; font-weight:800; font-size:0.85rem; margin-bottom:16px; border:2px solid; }
    .badge-lieu { display:inline-flex; align-items:center; gap:5px; background:#e8f0fa; color:#1a5c9a; border:1.5px solid #93b4d8; padding:4px 12px; border-radius:50px; font-size:0.78rem; font-weight:700; margin-bottom:12px; margin-right:6px; }
    .bloc-conseils { background:#f0f6ff; border:2px solid #b8ccdd; border-radius:12px; padding:16px; margin-top:16px; }
    .sep { margin-top:24px; padding-top:22px; border-top:2px solid #e2e8f0; }
    .sec-titre { font-family:'Playfair Display',serif; font-size:1.1rem; color:#1e293b; margin-bottom:14px; }
    .carte-med { background:#f4f8fd; border:2px solid #b8ccdd; border-radius:14px; padding:15px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
    .med-nom { font-weight:800; color:#1e293b; font-size:0.93rem; margin-bottom:3px; }
    .med-spec { color:#1a5c9a; font-size:0.8rem; font-weight:700; margin-bottom:4px; }
    .med-info { color:#64748b; font-size:0.79rem; margin-bottom:2px; display:flex; align-items:center; gap:4px; }
    .btns-rdv { display:flex; flex-direction:column; gap:7px; min-width:108px; }
    .btn-rdv { padding:8px 12px; border-radius:50px; font-size:0.76rem; font-weight:700; text-align:center; cursor:pointer; text-decoration:none; display:block; white-space:nowrap; font-family:'DM Sans',sans-serif; transition:all 0.2s; border:none; }
    .rdv-bleu { background:#1a5c9a; color:white; }
    .rdv-vert { background:#0e8a6e; color:white; }
    .rdv-bleu:hover { background:#1568b0; }
    .rdv-vert:hover { background:#0a7560; }
    .fallback { background:#f1f5fb; border:2px solid #b8ccdd; border-radius:14px; padding:20px; text-align:center; }
    .btns-plat { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px; }
    .btn-plat { padding:11px 20px; border-radius:50px; font-weight:700; font-size:0.85rem; text-decoration:none; display:inline-block; transition:transform 0.2s; }
    .btn-plat:hover { transform:translateY(-2px); }
    .mention { background:#fff7ed; border:2px solid #fed7aa; border-radius:12px; padding:14px 16px; font-size:0.8rem; color:#9a3412; margin-top:18px; line-height:1.6; }
    .btn-nouv { background:transparent; border:2px solid #1a5c9a; color:#1a5c9a; padding:11px 26px; border-radius:50px; cursor:pointer; margin-top:16px; font-weight:700; font-family:'DM Sans',sans-serif; font-size:0.88rem; transition:all 0.2s; }
    .btn-nouv:hover { background:#e8f0fa; }
    .tag-tel { display:inline-flex; align-items:center; gap:4px; background:#e0f2fe; color:#0369a1; border:1.5px solid #7dd3fc; padding:2px 9px; border-radius:50px; font-size:0.7rem; font-weight:700; margin-top:4px; }
    .loading-med { display:flex; align-items:center; gap:12px; background:#eef2f7; border:2px solid #b8ccdd; border-radius:12px; padding:16px 18px; color:#1a5c9a; font-size:0.88rem; font-weight:600; }
  `

  return (
    <>
      <style>{css}</style>
      <nav className="nav">
        <Link href="/" className="nav-logo">Medi<span style={{color:'#0e8a6e'}}>Connect</span></Link>
        <Link href="/"><button className="nav-btn" style={{background:'transparent',color:'#1a5c9a',border:'2px solid #1a5c9a'}}>← Accueil</button></Link>
      </nav>

      <div className="page">
        <div className="conteneur">
          <div className="titre">
            <h1>Analysez vos symptômes</h1>
            <p>Notre IA vous oriente et trouve les médecins disponibles près de chez vous</p>
          </div>

          {!resultat && (
            <div className="carte">

              {/* SYMPTÔMES */}
              <div className="bloc">
                <div className="bloc-titre" style={{color:'#1a4a7a'}}>📝 Vos symptômes</div>
                <textarea className="input" style={{minHeight:'110px',resize:'vertical'}}
                  placeholder="Décrivez ce que vous ressentez... Ex : douleur poitrine, fièvre, difficultés à respirer..."
                  value={symptomes} onChange={e => setSymptomes(e.target.value)}/>
              </div>

              {/* PHOTO */}
              <div className="bloc-vert">
                <div className="bloc-titre" style={{color:'#0a6b52'}}>📸 Photo <span style={{fontWeight:'400',textTransform:'none',fontSize:'0.78rem',color:'#64748b'}}>(optionnel — utile pour lésions, plaies, boutons...)</span></div>
                {!photoPreview ? (
                  <div className="photo-btns">
                    <button className="photo-btn photo-btn-bleu" onClick={() => fileRef.current?.click()}>
                      <span style={{fontSize:'1.6rem'}}>🖼️</span>Depuis la galerie
                      <span style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:'400'}}>Choisir un fichier</span>
                    </button>
                    <button className="photo-btn photo-btn-vert" onClick={() => cameraRef.current?.click()}>
                      <span style={{fontSize:'1.6rem'}}>📷</span>Prendre une photo
                      <span style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:'400'}}>Appareil photo</span>
                    </button>
                  </div>
                ) : (
                  <div style={{position:'relative',display:'inline-block'}}>
                    <img src={photoPreview} alt="Photo" style={{maxWidth:'100%',maxHeight:'170px',borderRadius:'10px',border:'2px solid #9acdb9',display:'block'}}/>
                    <button onClick={supprimerPhoto} style={{position:'absolute',top:'6px',right:'6px',background:'#dc2626',color:'white',border:'none',borderRadius:'50%',width:'26px',height:'26px',cursor:'pointer',fontSize:'0.78rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    <p style={{marginTop:'5px',fontSize:'0.78rem',color:'#0e8a6e',fontWeight:'700'}}>✅ {photo?.name}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
              </div>

              {/* ÂGE + DURÉE */}
              <div className="grille2" style={{marginBottom:'16px'}}>
                <div className="champ">
                  <label className="label">👤 Âge</label>
                  <select className="select" value={age} onChange={e => setAge(e.target.value)}>
                    <option value="">Non précisé</option>
                    <option value="enfant (moins de 12 ans)">Enfant (- 12 ans)</option>
                    <option value="adolescent (12-17 ans)">Adolescent</option>
                    <option value="jeune adulte (18-30 ans)">18-30 ans</option>
                    <option value="adulte (30-50 ans)">30-50 ans</option>
                    <option value="adulte (50-65 ans)">50-65 ans</option>
                    <option value="senior (65 ans et plus)">Senior 65+</option>
                  </select>
                </div>
                <div className="champ">
                  <label className="label">⏱️ Depuis combien de temps ?</label>
                  <select className="select" value={duree} onChange={e => setDuree(e.target.value)}>
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
              <div className="bloc">
                <div className="bloc-titre" style={{color:'#1a4a7a'}}>📍 Votre localisation</div>
                <div className="grille2">
                  <div className="champ">
                    <label className="label">📮 Code postal</label>
                    <input className="input" type="text" placeholder="Ex: 57, 572, 57200..." value={cpInput} maxLength={5} onChange={handleCp}/>
                    {cpLoading && <span style={{fontSize:'0.72rem',color:'#1a5c9a',marginTop:'4px'}}>🔍 Recherche en cours...</span>}
                    {villes.length > 0 && !cpLoading && <span style={{fontSize:'0.72rem',color:'#0e8a6e',marginTop:'4px',fontWeight:'700'}}>✅ {villes.length} commune{villes.length>1?'s':''} trouvée{villes.length>1?'s':''}</span>}
                    {cpInput.length >= 2 && villes.length === 0 && !cpLoading && <span style={{fontSize:'0.72rem',color:'#e67e22',marginTop:'4px'}}>⚠️ Aucune commune pour ce code</span>}
                  </div>
                  <div className="champ">
                    <label className="label">🏙️ Ville / commune</label>
                    <select className="select" value={ville} onChange={e => setVille(e.target.value)} disabled={villes.length === 0}>
                      <option value="">{villes.length === 0 ? '← Entrez un code postal' : 'Sélectionnez'}</option>
                      {villes.map(v => <option key={v.nom+v.codePostal} value={v.nom}>{v.nom} — {v.codePostal}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {erreur && <div className="erreur">⚠️ {erreur}</div>}

              <button className={`btn-analyser ${peutAnalyser ? 'btn-ok' : 'btn-off'}`} onClick={analyser} disabled={!peutAnalyser}>
                {loading ? <><div className="spinner"></div>Analyse en cours...</> : <>🔍 Analyser{photo?' + photo':''}</>}
              </button>
              <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.75rem',color:'#94a3b8'}}>🔒 Données non sauvegardées · ~15 secondes</p>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niv && (
            <div className="carte-res">
              <div className="badge-niv" style={{background:niv.bg,color:niv.color,borderColor:niv.border}}>{niv.emoji} {niv.texte}</div>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'1.3rem',color:'#1e293b',marginBottom:'14px'}}>Spécialiste recommandé : {resultat.specialiste}</h2>
              <div style={{marginBottom:'14px'}}>
                {(ville||cpInput) && <span className="badge-lieu">📍 {ville?`${ville} (${cpInput})`:cpInput}</span>}
                {photo && <span className="badge-lieu" style={{background:'#e6f7f3',color:'#0e8a6e',borderColor:'#6fcfb2'}}>📸 Photo analysée</span>}
              </div>
              <p style={{color:'#475569',lineHeight:'1.8',fontSize:'0.95rem'}}>{resultat.explication}</p>
              {resultat.conseils?.length > 0 && (
                <div className="bloc-conseils">
                  <strong style={{fontSize:'0.88rem',color:'#1e293b'}}>💡 Conseils :</strong>
                  <ul style={{marginTop:'8px',paddingLeft:'18px'}}>
                    {resultat.conseils.map((c,i) => <li key={i} style={{color:'#475569',marginBottom:'6px',fontSize:'0.88rem'}}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* MÉDECINS */}
              <div className="sep">
                <h3 className="sec-titre">🏥 {resultat.specialiste}s {ville?`à ${ville}`:cpInput?`(${cpInput})`:'près de chez vous'}</h3>

                {medecinLoading && (
                  <div className="loading-med">
                    <div className="spinner-bleu"></div>
                    Recherche dans l'annuaire officiel des médecins...
                  </div>
                )}

                {!medecinLoading && medecins.map((m,i) => (
                  <div className="carte-med" key={i}>
                    <div style={{flex:1}}>
                      <div className="med-nom">{m.nom}</div>
                      <div className="med-spec">🩺 {m.specialite}</div>
                      {m.adresse && <div className="med-info">📍 {m.adresse}</div>}
                      {m.telephone && <div className="med-info">📞 <a href={`tel:${m.telephone}`} style={{color:'#1a5c9a',fontWeight:'700',textDecoration:'none'}}>{m.telephone}</a></div>}
                      {m.horairesTexte && <div className="med-info">🕐 {m.horairesTexte}</div>}
                      {m.teleconsultation && <span className="tag-tel">📹 Téléconsultation</span>}
                    </div>
                    <div className="btns-rdv">
                      <a href={`https://www.doctolib.fr/recherche?text=${encodeURIComponent(resultat.specialiste)}&location=${encodeURIComponent(ville||cpInput)}`} target="_blank" rel="noopener noreferrer" className="btn-rdv rdv-bleu">📅 RDV</a>
                      <a href={`https://www.doctolib.fr/teleconsultation?text=${encodeURIComponent(resultat.specialiste)}`} target="_blank" rel="noopener noreferrer" className="btn-rdv rdv-vert">📹 Téléconsult.</a>
                    </div>
                  </div>
                ))}

                {!medecinLoading && medecins.length === 0 && (
                  <div className="fallback">
                    <p style={{color:'#475569',fontSize:'0.88rem',fontWeight:'600'}}>Trouvez un(e) {resultat.specialiste} {ville?`à ${ville}`:''} sur :</p>
                    <div className="btns-plat">
                      <a href={liensRdv?.doctolib||`https://www.doctolib.fr/recherche?text=${encodeURIComponent(resultat.specialiste)}&location=${encodeURIComponent(ville||cpInput)}`} target="_blank" rel="noopener noreferrer" className="btn-plat" style={{background:'#0596DE',color:'white'}}>📅 Doctolib</a>
                      <a href={`https://www.doctolib.fr/teleconsultation?text=${encodeURIComponent(resultat.specialiste)}`} target="_blank" rel="noopener noreferrer" className="btn-plat" style={{background:'#0e8a6e',color:'white'}}>📹 Téléconsultation</a>
                      <a href={liensRdv?.keldoc||`https://www.keldoc.com/search?speciality=${encodeURIComponent(resultat.specialiste)}&location=${encodeURIComponent(ville||cpInput)}`} target="_blank" rel="noopener noreferrer" className="btn-plat" style={{background:'#6366f1',color:'white'}}>📅 Keldoc</a>
                    </div>
                  </div>
                )}

                {!cpInput && <div style={{background:'#fff7ed',border:'2px solid #fed7aa',borderRadius:'12px',padding:'14px',textAlign:'center',fontSize:'0.85rem',color:'#9a3412'}}>💡 Renseignez votre code postal pour voir les médecins près de chez vous</div>}
              </div>

              <div className="mention">⚕️ <strong>Important :</strong> Cette analyse est informative, elle ne remplace pas un diagnostic médical. En cas d'urgence : <strong>15 (SAMU)</strong> ou <strong>112</strong>.</div>
              <button className="btn-nouv" onClick={reset}>← Nouvelle analyse</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
