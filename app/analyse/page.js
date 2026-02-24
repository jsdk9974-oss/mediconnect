'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

const NIVEAUX = {
  1: { bg:'#fef2f2', color:'#b91c1c', border:'#f87171', emoji:'🚨', texte:'Urgences maintenant' },
  2: { bg:'#fff7ed', color:'#c2410c', border:'#fb923c', emoji:'⚠️', texte:'Consulter sous 24h' },
  3: { bg:'#fefce8', color:'#92400e', border:'#fbbf24', emoji:'📅', texte:'Consulter cette semaine' },
  4: { bg:'#f0fdf4', color:'#15803d', border:'#4ade80', emoji:'✅', texte:'Non urgent' },
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
  const [liens, setLiens] = useState(null)
  const [medLoading, setMedLoading] = useState(false)
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

  const chercherMedecins = async (specialiste, cp, v) => {
    if (!cp && !v) return
    setMedLoading(true)
    try {
      const r = await fetch(`/api/medecins?specialiste=${encodeURIComponent(specialiste)}&codePostal=${cp}&ville=${encodeURIComponent(v)}`)
      const d = await r.json()
      setMedecins(d.medecins || [])
      setLiens(d.liens || null)
    } catch {}
    setMedLoading(false)
  }

  const analyser = async () => {
    if (symptomes.trim().length < 3 && !photo) { setErreur('Décrivez vos symptômes ou ajoutez une photo.'); return }
    setLoading(true); setErreur(null); setResultat(null); setMedecins([]); setLiens(null)
    try {
      let photoBase64 = null
      if (photo) photoBase64 = await new Promise((res,rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(photo) })
      const resp = await fetch('/api/analyser', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({symptomes,age,duree,ville,codePostal:cpInput,photoBase64,photoType:photo?.type}) })
      const d = await resp.json()
      if (d.error) setErreur(d.error)
      else { setResultat(d.resultat); chercherMedecins(d.resultat.specialiste, cpInput, ville) }
    } catch { setErreur("Erreur de connexion. Réessayez.") }
    setLoading(false)
  }

  const reset = () => { setResultat(null); setSymptomes(''); setAge(''); setDuree(''); setMedecins([]); setLiens(null); supprimerPhoto() }
  const peutAnalyser = !loading && (symptomes.trim().length >= 3 || photo)
  const niv = resultat ? NIVEAUX[resultat.niveau_urgence] || NIVEAUX[3] : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pg { min-height:100vh; background: linear-gradient(160deg, #0f2942 0%, #1a4870 40%, #1a5c9a 100%); padding: 80px 16px 60px; font-family: 'DM Sans', sans-serif; }
        .ctn { max-width: 680px; margin: 0 auto; }
        .hero { text-align: center; margin-bottom: 32px; }
        .hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem,5vw,2.6rem); color: white; margin-bottom: 10px; line-height: 1.2; }
        .hero p { color: rgba(255,255,255,0.7); font-size: 1rem; }
        
        /* CARTE FORMULAIRE */
        .form-card { background: rgba(255,255,255,0.97); border-radius: 24px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        
        /* SECTIONS */
        .sec { border-radius: 14px; padding: 20px; margin-bottom: 18px; }
        .sec-bleu { background: #f0f6ff; border: 2px solid #bbd0eb; }
        .sec-vert { background: #f0faf5; border: 2px solid #9dd0b8; }
        .sec-titre { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
        .st-bleu { color: #1a4870; }
        .st-vert { color: #0a6b52; }
        
        /* CHAMPS */
        .label { display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 5px; }
        .field { width: 100%; padding: 12px 14px; border: 2px solid #94a3b8; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.93rem; color: #1e293b; background: white; outline: none; transition: all 0.2s; }
        .field:focus { border-color: #1a5c9a; box-shadow: 0 0 0 3px rgba(26,92,154,0.12); }
        .field-sel { appearance: none; background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; cursor: pointer; }
        .field-sel:disabled { opacity: 0.4; cursor: not-allowed; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:500px){.g2{grid-template-columns:1fr;}}
        
        /* PHOTO */
        .photo-row { display: flex; gap: 12px; }
        .photo-btn { flex: 1; background: white; border-radius: 12px; padding: 16px 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.82rem; transition: all 0.2s; }
        .photo-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.1); }
        .pb-bleu { border: 2px solid #1a5c9a; color: #1a5c9a; }
        .pb-vert { border: 2px solid #0e8a6e; color: #0e8a6e; }
        
        /* BOUTON ANALYSER */
        .btn-go { width: 100%; padding: 18px; border-radius: 50px; border: none; font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s; margin-top: 4px; }
        .btn-go-on { background: linear-gradient(135deg, #1a5c9a 0%, #0e8a6e 100%); color: white; box-shadow: 0 6px 28px rgba(26,92,154,0.45); }
        .btn-go-on:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(26,92,154,0.5); }
        .btn-go-off { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
        
        .spin { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: sp 0.7s linear infinite; }
        .spin-b { width: 22px; height: 22px; border: 3px solid #c3d2e8; border-top-color: #1a5c9a; border-radius: 50%; animation: sp 0.7s linear infinite; flex-shrink: 0; }
        @keyframes sp { to{transform:rotate(360deg);} }
        
        .err { background: #fef2f2; border: 2px solid #f87171; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-bottom: 14px; font-size: 0.88rem; }

        /* CARTE RÉSULTAT */
        .res-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: fadeUp 0.4s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        
        .badge-niv { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 0.85rem; margin-bottom: 18px; border: 2px solid; }
        .res-titre { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #1e293b; margin-bottom: 12px; line-height: 1.3; }
        .badge-info { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 50px; font-size: 0.78rem; font-weight: 700; margin-right: 6px; margin-bottom: 14px; }
        .bi-bleu { background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; }
        .bi-vert { background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; }
        .res-texte { color: #475569; line-height: 1.85; font-size: 0.97rem; margin-bottom: 20px; }
        
        .conseils-bloc { background: #f8faff; border: 2px solid #c3d2e8; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
        .conseils-titre { font-weight: 800; font-size: 0.88rem; color: #1e293b; margin-bottom: 10px; }
        .conseils-liste { padding-left: 18px; }
        .conseils-liste li { color: #475569; margin-bottom: 7px; font-size: 0.9rem; line-height: 1.5; }
        
        /* MÉDECINS */
        .sep { border-top: 2px solid #e2e8f0; padding-top: 24px; margin-top: 8px; }
        .sec-h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #1e293b; margin-bottom: 16px; }
        
        .med-card { background: #f8faff; border: 2px solid #bbd0eb; border-radius: 16px; padding: 18px 20px; margin-bottom: 12px; display: flex; gap: 16px; align-items: flex-start; }
        .med-info { flex: 1; }
        .med-nom { font-weight: 800; color: #1e293b; font-size: 0.97rem; margin-bottom: 4px; }
        .med-spec { color: #1a5c9a; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; }
        .med-ligne { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.8rem; margin-bottom: 3px; }
        .med-tel { color: #1a5c9a; font-weight: 700; text-decoration: none; }
        .med-tel:hover { text-decoration: underline; }
        .tag-tel { display: inline-flex; align-items: center; gap: 4px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; padding: 2px 8px; border-radius: 50px; font-size: 0.7rem; font-weight: 700; margin-top: 5px; }
        
        .med-btns { display: flex; flex-direction: column; gap: 8px; min-width: 115px; }
        .mbtn { display: block; padding: 10px 14px; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 800; text-align: center; text-decoration: none; cursor: pointer; transition: all 0.2s; border: none; white-space: nowrap; }
        .mbtn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .mb-bleu { background: #1a5c9a; color: white; box-shadow: 0 3px 10px rgba(26,92,154,0.3); }
        .mb-vert { background: #0e8a6e; color: white; box-shadow: 0 3px 10px rgba(14,138,110,0.3); }

        /* FALLBACK LIENS */
        .fallback-box { background: linear-gradient(135deg, #f0f6ff, #f0faf5); border: 2px solid #bbd0eb; border-radius: 16px; padding: 24px; text-align: center; }
        .fallback-titre { font-weight: 700; color: #1e293b; font-size: 1rem; margin-bottom: 6px; }
        .fallback-sub { color: #64748b; font-size: 0.85rem; margin-bottom: 18px; }
        .lien-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 400px; margin: 0 auto; }
        @media(max-width:400px){.lien-grid{grid-template-columns:1fr;}}
        .lien-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 10px; border-radius: 14px; text-decoration: none; font-family: 'DM Sans', sans-serif; font-weight: 800; font-size: 0.85rem; transition: all 0.25s; }
        .lien-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .lien-btn span { font-size: 1.5rem; }
        .lb-doctolib { background: #0596DE; color: white; }
        .lb-teleconsult { background: linear-gradient(135deg,#1a5c9a,#0e8a6e); color: white; }
        .lb-keldoc { background: #6366f1; color: white; }
        .lb-maiia { background: #0891b2; color: white; }
        
        .mention { background: #fff7ed; border: 2px solid #fcd34d; border-radius: 14px; padding: 14px 18px; font-size: 0.8rem; color: #92400e; margin-top: 20px; line-height: 1.7; }
        .btn-new { background: transparent; border: 2px solid #1a5c9a; color: #1a5c9a; padding: 11px 28px; border-radius: 50px; cursor: pointer; margin-top: 18px; font-weight: 700; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; transition: all 0.2s; }
        .btn-new:hover { background: #f0f6ff; }
        .load-box { display: flex; align-items: center; gap: 12px; background: #f0f6ff; border: 2px solid #bbd0eb; border-radius: 14px; padding: 18px 20px; color: #1a5c9a; font-size: 0.9rem; font-weight: 600; }
      `}</style>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(15,41,66,0.95)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.1)',padding:'0 5%',height:'65px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/" style={{fontFamily:'Playfair Display,serif',fontSize:'1.4rem',fontWeight:'700',color:'white',textDecoration:'none'}}>
          Medi<span style={{color:'#4ade80'}}>Connect</span>
        </Link>
        <Link href="/" style={{textDecoration:'none'}}>
          <button style={{background:'rgba(255,255,255,0.12)',color:'white',border:'1.5px solid rgba(255,255,255,0.25)',padding:'8px 20px',borderRadius:'50px',cursor:'pointer',fontSize:'0.85rem',fontWeight:'600',fontFamily:'DM Sans,sans-serif'}}>
            ← Accueil
          </button>
        </Link>
      </nav>

      <div className="pg">
        <div className="ctn">

          {/* HERO */}
          <div className="hero">
            <h1>Analysez vos symptômes</h1>
            <p>Notre IA vous oriente et trouve les médecins disponibles près de chez vous</p>
          </div>

          {/* FORMULAIRE */}
          {!resultat && (
            <div className="form-card">

              {/* SYMPTÔMES */}
              <div className="sec sec-bleu">
                <div className="sec-titre st-bleu">📝 Décrivez vos symptômes</div>
                <textarea className="field" style={{minHeight:'110px',resize:'vertical'}}
                  placeholder="Ex : douleur dans le dos depuis une semaine, difficultés à me lever le matin..."
                  value={symptomes} onChange={e => setSymptomes(e.target.value)}/>
              </div>

              {/* PHOTO */}
              <div className="sec sec-vert">
                <div className="sec-titre st-vert">
                  📸 Photo <span style={{fontWeight:'400',textTransform:'none',fontSize:'0.78rem',color:'#64748b'}}>(optionnel — lésions, plaies, boutons...)</span>
                </div>
                {!photoPreview ? (
                  <div className="photo-row">
                    <button className="photo-btn pb-bleu" onClick={() => fileRef.current?.click()}>
                      <span style={{fontSize:'1.8rem'}}>🖼️</span>
                      Galerie photo
                      <span style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:'400'}}>Choisir un fichier</span>
                    </button>
                    <button className="photo-btn pb-vert" onClick={() => cameraRef.current?.click()}>
                      <span style={{fontSize:'1.8rem'}}>📷</span>
                      Appareil photo
                      <span style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:'400'}}>Prendre une photo</span>
                    </button>
                  </div>
                ) : (
                  <div style={{position:'relative',display:'inline-block'}}>
                    <img src={photoPreview} alt="Photo" style={{maxWidth:'100%',maxHeight:'180px',borderRadius:'12px',border:'2px solid #9dd0b8',display:'block'}}/>
                    <button onClick={supprimerPhoto} style={{position:'absolute',top:'8px',right:'8px',background:'#dc2626',color:'white',border:'none',borderRadius:'50%',width:'28px',height:'28px',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700'}}>✕</button>
                    <p style={{marginTop:'6px',fontSize:'0.8rem',color:'#0e8a6e',fontWeight:'700'}}>✅ {photo?.name}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
              </div>

              {/* ÂGE + DURÉE */}
              <div className="g2" style={{marginBottom:'18px'}}>
                <div>
                  <label className="label">👤 Âge</label>
                  <select className="field field-sel" value={age} onChange={e => setAge(e.target.value)}>
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
                  <label className="label">⏱️ Depuis combien de temps ?</label>
                  <select className="field field-sel" value={duree} onChange={e => setDuree(e.target.value)}>
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
              <div className="sec sec-bleu" style={{marginBottom:'20px'}}>
                <div className="sec-titre st-bleu">📍 Votre localisation</div>
                <div className="g2">
                  <div>
                    <label className="label">📮 Code postal</label>
                    <input className="field" type="text" placeholder="57, 572, 57200..." value={cpInput} maxLength={5} onChange={handleCp}/>
                    {cpLoading && <p style={{fontSize:'0.72rem',color:'#1a5c9a',marginTop:'4px',fontWeight:'600'}}>🔍 Recherche...</p>}
                    {villes.length > 0 && !cpLoading && <p style={{fontSize:'0.72rem',color:'#0e8a6e',marginTop:'4px',fontWeight:'700'}}>✅ {villes.length} commune{villes.length>1?'s':''}</p>}
                    {cpInput.length >= 2 && villes.length === 0 && !cpLoading && <p style={{fontSize:'0.72rem',color:'#e67e22',marginTop:'4px'}}>⚠️ Aucune commune trouvée</p>}
                  </div>
                  <div>
                    <label className="label">🏙️ Ville / commune</label>
                    <select className="field field-sel" value={ville} onChange={e => setVille(e.target.value)} disabled={villes.length === 0}>
                      <option value="">{villes.length === 0 ? '← Code postal d\'abord' : 'Sélectionnez'}</option>
                      {villes.map(v => <option key={v.nom+v.codePostal} value={v.nom}>{v.nom} — {v.codePostal}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {erreur && <div className="err">⚠️ {erreur}</div>}

              <button className={`btn-go ${peutAnalyser?'btn-go-on':'btn-go-off'}`} onClick={analyser} disabled={!peutAnalyser}>
                {loading ? <><div className="spin"></div>Analyse en cours...</> : <>🔍 Analyser mes symptômes{photo?' + photo':''}</>}
              </button>
              <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.74rem',color:'#94a3b8'}}>🔒 Données non sauvegardées · Résultat en ~15 secondes</p>
            </div>
          )}

          {/* RÉSULTAT */}
          {resultat && niv && (
            <div className="res-card">
              <div className="badge-niv" style={{background:niv.bg,color:niv.color,borderColor:niv.border}}>
                {niv.emoji} {niv.texte}
              </div>

              <h2 className="res-titre">Spécialiste recommandé :<br/>{resultat.specialiste}</h2>

              <div>
                {(ville||cpInput) && <span className="badge-info bi-bleu">📍 {ville?`${ville} (${cpInput})`:cpInput}</span>}
                {photo && <span className="badge-info bi-vert">📸 Photo analysée</span>}
              </div>

              <p className="res-texte">{resultat.explication}</p>

              {resultat.conseils?.length > 0 && (
                <div className="conseils-bloc">
                  <div className="conseils-titre">💡 Conseils pratiques</div>
                  <ul className="conseils-liste">
                    {resultat.conseils.map((c,i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* MÉDECINS */}
              <div className="sep">
                <h3 className="sec-h3">
                  🏥 {resultat.specialiste}s {ville?`à ${ville}`:cpInput?`(${cpInput})`:'près de chez vous'}
                </h3>

                {medLoading && (
                  <div className="load-box">
                    <div className="spin-b"></div>
                    Recherche dans l'annuaire officiel de santé...
                  </div>
                )}

                {!medLoading && medecins.map((m,i) => (
                  <div className="med-card" key={i}>
                    <div className="med-info">
                      <div className="med-nom">{m.nom}</div>
                      <div className="med-spec">🩺 {m.specialite}</div>
                      {m.adresse && <div className="med-ligne">📍 {m.adresse}</div>}
                      {m.telephone && <div className="med-ligne">📞 <a href={`tel:${m.telephone}`} className="med-tel">{m.telephone}</a></div>}
                      {m.horaires && <div className="med-ligne">🕐 {m.horaires}</div>}
                      {m.teleconsultation && <span className="tag-tel">📹 Téléconsultation</span>}
                    </div>
                    <div className="med-btns">
                      <a href={m.urlRdv || liens?.presentiel} target="_blank" rel="noopener noreferrer" className="mbtn mb-bleu">📅 Prendre RDV</a>
                      <a href={m.urlTeleconsult || liens?.teleconsult} target="_blank" rel="noopener noreferrer" className="mbtn mb-vert">📹 Téléconsult.</a>
                    </div>
                  </div>
                ))}

                {/* FALLBACK avec vrais liens */}
                {!medLoading && (
                  <div className="fallback-box" style={{marginTop: medecins.length > 0 ? '16px' : '0'}}>
                    <div className="fallback-titre">
                      {medecins.length > 0 ? '🔗 Voir plus de praticiens' : `Trouver un(e) ${resultat.specialiste}`}
                    </div>
                    <div className="fallback-sub">
                      {ville ? `À ${ville} et ses environs` : 'Sélectionnez votre ville pour des résultats personnalisés'}
                    </div>
                    <div className="lien-grid">
                      <a href={liens?.presentiel || '#'} target="_blank" rel="noopener noreferrer" className="lien-btn lb-doctolib">
                        <span>🏥</span>Doctolib<br/><small style={{fontWeight:'400',fontSize:'0.72rem',opacity:0.85}}>RDV en cabinet</small>
                      </a>
                      <a href={liens?.teleconsult || '#'} target="_blank" rel="noopener noreferrer" className="lien-btn lb-teleconsult">
                        <span>📹</span>Téléconsultation<br/><small style={{fontWeight:'400',fontSize:'0.72rem',opacity:0.85}}>Sans se déplacer</small>
                      </a>
                      <a href={liens?.keldoc || '#'} target="_blank" rel="noopener noreferrer" className="lien-btn lb-keldoc">
                        <span>📅</span>Keldoc<br/><small style={{fontWeight:'400',fontSize:'0.72rem',opacity:0.85}}>Alternative Doctolib</small>
                      </a>
                      <a href={liens?.maiia || '#'} target="_blank" rel="noopener noreferrer" className="lien-btn lb-maiia">
                        <span>📋</span>Maiia<br/><small style={{fontWeight:'400',fontSize:'0.72rem',opacity:0.85}}>RDV médecin</small>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mention">
                ⚕️ <strong>Important :</strong> Cette analyse est fournie à titre informatif uniquement — elle ne remplace pas un diagnostic médical. En cas d'urgence vitale : <strong>15 (SAMU)</strong> ou <strong>112</strong>.
              </div>

              <button className="btn-new" onClick={reset}>← Nouvelle analyse</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
