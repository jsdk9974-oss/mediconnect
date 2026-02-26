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

  // Recherche par code postal OU par département (2 chiffres = tout le département)
  const rechercherVilles = useCallback(async (cp) => {
    setVille(''); setVilles([])
    if (!cp || cp.length < 2) return
    setCpLoading(true)
    try {
      let url
      if (cp.length === 2 || cp.length === 3) {
        // Recherche par département : on prend toutes les communes du département
        // Pour la Corse: 2A/2B → on utilise codeDepartement
        url = `https://geo.api.gouv.fr/communes?codeDepartement=${cp}&fields=nom,codePostal&format=json&boost=population&limit=50`
      } else {
        // Code postal complet ou presque
        url = `https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,codePostal&format=json`
      }
      const r = await fetch(url)
      if (r.ok) {
        const data = await r.json()
        setVilles(data.sort((a,b) => a.nom.localeCompare(b.nom)))
      }
    } catch {}
    setCpLoading(false)
  }, [])

  const handleCp = e => {
    const v = e.target.value.replace(/\D/g,'').slice(0,5)
    setCpInput(v)
    if (v.length >= 2) rechercherVilles(v)
    else { setVilles([]); setVille('') }
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
    setMedLoading(true)
    try {
      const r = await fetch(`/api/medecins?specialiste=${encodeURIComponent(specialiste)}&codePostal=${cp}&ville=${encodeURIComponent(v||'')}`)
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
      if (photo) photoBase64 = await new Promise((res,rej) => {
        const r = new FileReader(); r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(photo)
      })
      const resp = await fetch('/api/analyser', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({symptomes,age,duree,ville,codePostal:cpInput,photoBase64,photoType:photo?.type})
      })
      const d = await resp.json()
      if (d.error) setErreur(d.error)
      else { setResultat(d.resultat); chercherMedecins(d.resultat.specialiste, cpInput, ville) }
    } catch { setErreur("Erreur de connexion. Réessayez.") }
    setLoading(false)
  }

  const reset = () => {
    setResultat(null); setSymptomes(''); setAge(''); setDuree('')
    setMedecins([]); setLiens(null); supprimerPhoto()
  }
  const peutAnalyser = !loading && (symptomes.trim().length >= 3 || photo)
  const niv = resultat ? NIVEAUX[resultat.niveau_urgence] || NIVEAUX[3] : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #060e1a; }

        /* BANDES BG (même style accueil) */
        .bg-bands {
          position: fixed; inset: 0; z-index: 0; overflow: hidden;
        }
        .band { position: absolute; left: -20%; width: 140%; transform-origin: left center; }
        .b1 { top: -10%; height: 45vh; background: linear-gradient(90deg,#0a1f3d,#0d2a52 60%,#0a4a6e); transform: rotate(-6deg); }
        .b2 { top: 32%; height: 20vh; background: linear-gradient(90deg,#071628,#0f3460 50%,#1a5c9a); transform: rotate(-6deg); opacity:0.7; }
        .b3 { top: 52%; height: 60vh; background: #060e1a; transform: rotate(-6deg); }
        .grid-ov { position: fixed; inset: 0; z-index: 1; background-image: linear-gradient(rgba(26,92,154,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,92,154,0.04) 1px,transparent 1px); background-size: 60px 60px; pointer-events:none; }

        /* LAYOUT */
        .pg { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; }

        /* NAV */
        .topnav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5%; height: 65px;
          background: rgba(6,14,26,0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: sticky; top: 0; z-index: 100;
        }
        .logo { font-size: 1.4rem; font-weight: 800; color: white; text-decoration: none; letter-spacing: -0.02em; }
        .logo span { color: #4ade80; }
        .back-btn {
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.15); padding: 8px 18px;
          border-radius: 4px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
          font-family: 'DM Sans',sans-serif; text-decoration: none;
          transition: all 0.2s;
        }
        .back-btn:hover { background: rgba(255,255,255,0.12); }

        /* CONTENU */
        .main { flex: 1; padding: 40px 5% 60px; }
        .ctn { max-width: 660px; margin: 0 auto; }

        .hero { text-align: center; margin-bottom: 32px; }
        .hero h1 { font-family: 'DM Sans',sans-serif; font-size: clamp(1.6rem,4vw,2.2rem); font-weight: 800; color: white; margin-bottom: 8px; letter-spacing: -0.02em; }
        .hero p { color: rgba(255,255,255,0.45); font-size: 0.95rem; }

        /* CARTE FORMULAIRE */
        .form-card {
          background: rgba(255,255,255,0.96);
          border-radius: 6px;
          padding: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .sec { border-radius: 6px; padding: 18px; margin-bottom: 16px; }
        .sec-bleu { background: #eef4fd; border: 1.5px solid #bacfe8; }
        .sec-vert { background: #edf7f3; border: 1.5px solid #9ecfba; }
        .sec-titre { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .st-bleu { color: #1a4870; }
        .st-vert { color: #0a6b52; }

        .label { display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 5px; }
        .field { width: 100%; padding: 11px 13px; border: 1.5px solid #94a3b8; border-radius: 6px; font-family: 'DM Sans',sans-serif; font-size: 0.9rem; color: #1e293b; background: white; outline: none; transition: all 0.2s; }
        .field:focus { border-color: #1a5c9a; box-shadow: 0 0 0 3px rgba(26,92,154,0.1); }
        .field-sel { appearance: none; background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; cursor: pointer; }
        .field-sel:disabled { opacity: 0.38; cursor: not-allowed; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:480px){.g2{grid-template-columns:1fr;}}

        /* PHOTO */
        .photo-row { display: flex; gap: 10px; }
        .pbtn { flex: 1; background: white; border-radius: 6px; padding: 14px 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; font-family: 'DM Sans',sans-serif; font-weight: 700; font-size: 0.8rem; transition: all 0.2s; }
        .pbtn:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
        .pb-b { border: 1.5px solid #1a5c9a; color: #1a5c9a; }
        .pb-v { border: 1.5px solid #0e8a6e; color: #0e8a6e; }

        /* BOUTON ANALYSER */
        .btn-go {
          width: 100%; padding: 16px; border-radius: 4px; border: none;
          font-family: 'DM Sans',sans-serif; font-size: 1rem; font-weight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.25s; margin-top: 4px;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
        }
        .btn-on { background: linear-gradient(135deg,#1a5c9a,#0e8a6e); color: white; box-shadow: 0 6px 24px rgba(26,92,154,0.35); }
        .btn-on:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(26,92,154,0.45); }
        .btn-off { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

        .spin { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: sp 0.7s linear infinite; }
        .spin-b { width: 20px; height: 20px; border: 3px solid #c3d2e8; border-top-color: #1a5c9a; border-radius: 50%; animation: sp 0.7s linear infinite; flex-shrink: 0; }
        @keyframes sp { to{transform:rotate(360deg);} }

        .err { background: #fef2f2; border: 1.5px solid #f87171; color: #b91c1c; padding: 11px 15px; border-radius: 6px; margin-bottom: 14px; font-size: 0.86rem; }

        /* RÉSULTAT */
        .res-card {
          background: rgba(255,255,255,0.97);
          border-radius: 6px; padding: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: fadeUp 0.4s ease;
          border: 1px solid rgba(255,255,255,0.1);
          border-left: 5px solid #1a5c9a;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

        .badge-niv { display: inline-flex; align-items: center; gap: 8px; padding: 7px 18px; border-radius: 4px; font-weight: 800; font-size: 0.82rem; margin-bottom: 16px; border: 1.5px solid; }
        .res-h2 { font-family: 'DM Sans',sans-serif; font-weight: 800; font-size: 1.3rem; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
        .badge-i { display: inline-flex; align-items: center; gap: 5px; padding: 3px 11px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; margin-right: 6px; margin-bottom: 14px; }
        .bi-b { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
        .bi-v { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

        .res-txt { color: #475569; line-height: 1.85; font-size: 0.93rem; margin-bottom: 18px; }
        .conseils { background: #f8faff; border: 1.5px solid #c3d2e8; border-radius: 6px; padding: 16px; margin-bottom: 22px; }
        .conseils strong { font-size: 0.85rem; color: #1e293b; }
        .conseils ul { margin-top: 8px; padding-left: 17px; }
        .conseils li { color: #475569; margin-bottom: 6px; font-size: 0.87rem; line-height: 1.5; }

        /* SECTION MÉDECINS */
        .sep { border-top: 1.5px solid #e2e8f0; padding-top: 22px; margin-top: 4px; }
        .sec-h3 { font-weight: 800; font-size: 1.05rem; color: #1e293b; margin-bottom: 14px; letter-spacing: -0.01em; }

        .med-card { background: #f4f8fd; border: 1.5px solid #bbd0eb; border-radius: 6px; padding: 15px 16px; margin-bottom: 10px; display: flex; gap: 14px; align-items: flex-start; }
        .med-info { flex: 1; }
        .med-nom { font-weight: 800; color: #1e293b; font-size: 0.92rem; margin-bottom: 3px; }
        .med-spec { color: #1a5c9a; font-size: 0.78rem; font-weight: 700; margin-bottom: 5px; }
        .med-ligne { display: flex; align-items: center; gap: 5px; color: #64748b; font-size: 0.78rem; margin-bottom: 2px; }
        .med-tel { color: #1a5c9a; font-weight: 700; text-decoration: none; }
        .med-tel:hover { text-decoration: underline; }
        .tag-tc { display: inline-flex; align-items: center; gap: 4px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; padding: 2px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; margin-top: 4px; }

        .med-btns { display: flex; flex-direction: column; gap: 7px; min-width: 108px; }
        .mbtn { display: block; padding: 9px 12px; border-radius: 4px; font-family: 'DM Sans',sans-serif; font-size: 0.76rem; font-weight: 800; text-align: center; text-decoration: none; cursor: pointer; transition: all 0.2s; border: none; white-space: nowrap; clip-path: polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px)); }
        .mbtn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .mb-b { background: #1a5c9a; color: white; }
        .mb-v { background: #0e8a6e; color: white; }

        /* FALLBACK */
        .fallback { background: linear-gradient(135deg,#f0f6ff,#f0faf5); border: 1.5px solid #bbd0eb; border-radius: 6px; padding: 22px; text-align: center; margin-top: 4px; }
        .fallback-t { font-weight: 800; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px; }
        .fallback-s { color: #64748b; font-size: 0.82rem; margin-bottom: 16px; }
        .lien-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; max-width: 420px; margin: 0 auto; }
        @media(max-width:400px){.lien-grid{grid-template-columns:1fr;}}
        .lbtn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; border-radius: 4px; text-decoration: none; font-family: 'DM Sans',sans-serif; font-weight: 800; font-size: 0.82rem; transition: all 0.2s; clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
        .lbtn:hover { transform: translateY(-3px); filter: brightness(1.1); }
        .lbtn span { font-size: 1.4rem; }
        .lbtn small { font-weight: 400; font-size: 0.68rem; opacity: 0.85; }
        .lb-doc { background: #0596DE; color: white; }
        .lb-tc { background: linear-gradient(135deg,#1a5c9a,#0e8a6e); color: white; }
        .lb-kel { background: #6366f1; color: white; }

        .mention { background: #fffbeb; border: 1.5px solid #fcd34d; border-radius: 6px; padding: 13px 16px; font-size: 0.78rem; color: #92400e; margin-top: 18px; line-height: 1.7; }
        .btn-new { background: transparent; border: 1.5px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); padding: 10px 24px; border-radius: 4px; cursor: pointer; margin-top: 16px; font-weight: 700; font-family: 'DM Sans',sans-serif; font-size: 0.87rem; transition: all 0.2s; }
        .btn-new:hover { background: rgba(255,255,255,0.08); color: white; }

        .load-med { display: flex; align-items: center; gap: 12px; background: #eef4fd; border: 1.5px solid #bbd0eb; border-radius: 6px; padding: 16px 18px; color: #1a5c9a; font-size: 0.87rem; font-weight: 600; }
      `}</style>

      {/* FOND */}
      <div className="bg-bands">
        <div className="band b1"></div>
        <div className="band b2"></div>
        <div className="band b3"></div>
      </div>
      <div className="grid-ov"></div>

      <div className="pg">
        {/* NAV */}
        <nav className="topnav">
          <Link href="/" className="logo">Medi<span>Connect</span></Link>
          <Link href="/" className="back-btn">← Accueil</Link>
        </nav>

        <div className="main">
          <div className="ctn">
            <div className="hero">
              <h1>Analysez vos symptômes</h1>
              <p>Notre IA vous oriente et trouve les médecins disponibles près de chez vous</p>
            </div>

            {!resultat && (
              <div className="form-card">

                {/* SYMPTÔMES */}
                <div className="sec sec-bleu">
                  <div className="sec-titre st-bleu">📝 Vos symptômes</div>
                  <textarea className="field" style={{minHeight:'105px',resize:'vertical'}}
                    placeholder="Ex : douleur dans le dos depuis une semaine, difficultés à me lever le matin..."
                    value={symptomes} onChange={e => setSymptomes(e.target.value)}/>
                </div>

                {/* PHOTO */}
                <div className="sec sec-vert">
                  <div className="sec-titre st-vert">📸 Photo <span style={{fontWeight:'400',textTransform:'none',fontSize:'0.75rem',color:'#64748b'}}>(optionnel — lésions, plaies, boutons...)</span></div>
                  {!photoPreview ? (
                    <div className="photo-row">
                      <button className="pbtn pb-b" onClick={() => fileRef.current?.click()}>
                        <span style={{fontSize:'1.6rem'}}>🖼️</span>
                        Galerie photo
                        <span style={{fontSize:'0.68rem',color:'#94a3b8',fontWeight:'400'}}>Choisir un fichier</span>
                      </button>
                      <button className="pbtn pb-v" onClick={() => cameraRef.current?.click()}>
                        <span style={{fontSize:'1.6rem'}}>📷</span>
                        Appareil photo
                        <span style={{fontSize:'0.68rem',color:'#94a3b8',fontWeight:'400'}}>Prendre une photo</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{position:'relative',display:'inline-block'}}>
                      <img src={photoPreview} alt="Photo" style={{maxWidth:'100%',maxHeight:'170px',borderRadius:'6px',border:'1.5px solid #9ecfba',display:'block'}}/>
                      <button onClick={supprimerPhoto} style={{position:'absolute',top:'6px',right:'6px',background:'#dc2626',color:'white',border:'none',borderRadius:'3px',width:'26px',height:'26px',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800'}}>✕</button>
                      <p style={{marginTop:'5px',fontSize:'0.78rem',color:'#0e8a6e',fontWeight:'700'}}>✅ {photo?.name}</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                </div>

                {/* ÂGE + DURÉE */}
                <div className="g2" style={{marginBottom:'16px'}}>
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
                      <label className="label">📮 Code postal / département</label>
                      <input className="field" type="text" placeholder="Ex: 57, 75, 33, 57200..." value={cpInput} maxLength={5} onChange={handleCp}/>
                      {cpLoading && <p style={{fontSize:'0.7rem',color:'#1a5c9a',marginTop:'4px',fontWeight:'600'}}>🔍 Recherche...</p>}
                      {villes.length > 0 && !cpLoading && <p style={{fontSize:'0.7rem',color:'#0e8a6e',marginTop:'4px',fontWeight:'700'}}>✅ {villes.length} commune{villes.length>1?'s':''} trouvée{villes.length>1?'s':''}</p>}
                      {cpInput.length >= 2 && villes.length === 0 && !cpLoading && <p style={{fontSize:'0.7rem',color:'#e67e22',marginTop:'4px'}}>⚠️ Aucune commune trouvée</p>}
                    </div>
                    <div>
                      <label className="label">🏙️ Ville / commune</label>
                      <select className="field field-sel" value={ville} onChange={e => setVille(e.target.value)} disabled={villes.length === 0}>
                        <option value="">{villes.length === 0 ? '← Entrez un code postal' : 'Sélectionnez'}</option>
                        {villes.map(v => <option key={v.nom+(v.codePostal||'')} value={v.nom}>{v.nom}{v.codePostal ? ` — ${v.codePostal}` : ''}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {erreur && <div className="err">⚠️ {erreur}</div>}

                <button className={`btn-go ${peutAnalyser?'btn-on':'btn-off'}`} onClick={analyser} disabled={!peutAnalyser}>
                  {loading ? <><div className="spin"></div>Analyse en cours...</> : <>🔍 Analyser{photo?' + photo':''}</>}
                </button>
                <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.72rem',color:'#94a3b8'}}>🔒 Données non sauvegardées · ~15 secondes</p>
              </div>
            )}

            {/* RÉSULTAT */}
            {resultat && niv && (
              <div className="res-card">
                <div className="badge-niv" style={{background:niv.bg,color:niv.color,borderColor:niv.border}}>{niv.emoji} {niv.texte}</div>
                <h2 className="res-h2">Spécialiste recommandé : {resultat.specialiste}</h2>
                <div>
                  {(ville||cpInput) && <span className="badge-i bi-b">📍 {ville?`${ville} (${cpInput})`:cpInput}</span>}
                  {photo && <span className="badge-i bi-v">📸 Photo analysée</span>}
                </div>
                <p className="res-txt">{resultat.explication}</p>
                {resultat.conseils?.length > 0 && (
                  <div className="conseils">
                    <strong>💡 Conseils pratiques</strong>
                    <ul>{resultat.conseils.map((c,i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}

                <div className="sep">
                  <h3 className="sec-h3">🏥 {resultat.specialiste}s {ville?`à ${ville}`:cpInput?`(${cpInput})`:'près de chez vous'}</h3>

                  {medLoading && <div className="load-med"><div className="spin-b"></div>Recherche dans l'annuaire officiel...</div>}

                  {!medLoading && medecins.map((m,i) => (
                    <div className="med-card" key={i}>
                      <div className="med-info">
                        <div className="med-nom">{m.nom}</div>
                        <div className="med-spec">🩺 {m.specialite}</div>
                        {m.adresse && <div className="med-ligne">📍 {m.adresse}</div>}
                        {m.telephone && <div className="med-ligne">📞 <a href={`tel:${m.telephone}`} className="med-tel">{m.telephone}</a></div>}
                        {m.horaires && <div className="med-ligne">🕐 {m.horaires}</div>}
                        {m.teleconsultation && <span className="tag-tc">📹 Téléconsultation</span>}
                      </div>
                      <div className="med-btns">
                        <a href={m.urlRdv||liens?.presentiel||'#'} target="_blank" rel="noopener noreferrer" className="mbtn mb-b">📅 Prendre RDV</a>
                        <a href={m.urlTeleconsult||liens?.teleconsult||'#'} target="_blank" rel="noopener noreferrer" className="mbtn mb-v">📹 Téléconsult.</a>
                      </div>
                    </div>
                  ))}

                  <div className="fallback" style={{marginTop: medecins.length > 0 ? '14px' : '0'}}>
                    <div className="fallback-t">{medecins.length > 0 ? '🔗 Voir plus de praticiens' : `Trouver un(e) ${resultat.specialiste}`}</div>
                    <div className="fallback-s">{ville?`À ${ville} et ses environs`:'Renseignez votre localisation pour des résultats personnalisés'}</div>
                    <div className="lien-grid">
                      <a href={liens?.presentiel||'#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-doc">
                        <span>🏥</span>Doctolib<small>En cabinet</small>
                      </a>
                      <a href={liens?.teleconsult||'#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-tc">
                        <span>📹</span>Téléconsult.<small>À distance</small>
                      </a>
                      <a href={liens?.keldoc||'#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-kel">
                        <span>📅</span>Keldoc<small>Alternative</small>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mention">⚕️ <strong>Important :</strong> Cette analyse est informative uniquement — elle ne remplace pas un diagnostic médical. En cas d'urgence vitale : <strong>15 (SAMU)</strong> ou <strong>112</strong>.</div>
                <button className="btn-new" onClick={reset}>← Nouvelle analyse</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
