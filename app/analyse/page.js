'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

const NIVEAUX = {
  1: { bg:'#fef2f2', color:'#b91c1c', border:'#f87171', emoji:'🚨', texte:'Urgences maintenant' },
  2: { bg:'#fff7ed', color:'#c2410c', border:'#fb923c', emoji:'⚠️', texte:'Consulter sous 24h' },
  3: { bg:'#fefce8', color:'#92400e', border:'#fbbf24', emoji:'📅', texte:'Consulter cette semaine' },
  4: { bg:'#f0fdf4', color:'#15803d', border:'#4ade80', emoji:'✅', texte:'Non urgent' },
}

const DEPARTEMENTS = [
  {code:'01',nom:'Ain'},{code:'02',nom:'Aisne'},{code:'03',nom:'Allier'},
  {code:'04',nom:'Alpes-de-Haute-Provence'},{code:'05',nom:'Hautes-Alpes'},
  {code:'06',nom:'Alpes-Maritimes'},{code:'07',nom:'Ardèche'},{code:'08',nom:'Ardennes'},
  {code:'09',nom:'Ariège'},{code:'10',nom:'Aube'},{code:'11',nom:'Aude'},
  {code:'12',nom:'Aveyron'},{code:'13',nom:'Bouches-du-Rhône'},{code:'14',nom:'Calvados'},
  {code:'15',nom:'Cantal'},{code:'16',nom:'Charente'},{code:'17',nom:'Charente-Maritime'},
  {code:'18',nom:'Cher'},{code:'19',nom:'Corrèze'},{code:'2A',nom:'Corse-du-Sud'},
  {code:'2B',nom:'Haute-Corse'},{code:'21',nom:"Côte-d'Or"},{code:'22',nom:"Côtes-d'Armor"},
  {code:'23',nom:'Creuse'},{code:'24',nom:'Dordogne'},{code:'25',nom:'Doubs'},
  {code:'26',nom:'Drôme'},{code:'27',nom:'Eure'},{code:'28',nom:'Eure-et-Loir'},
  {code:'29',nom:'Finistère'},{code:'30',nom:'Gard'},{code:'31',nom:'Haute-Garonne'},
  {code:'32',nom:'Gers'},{code:'33',nom:'Gironde'},{code:'34',nom:'Hérault'},
  {code:'35',nom:'Ille-et-Vilaine'},{code:'36',nom:'Indre'},{code:'37',nom:'Indre-et-Loire'},
  {code:'38',nom:'Isère'},{code:'39',nom:'Jura'},{code:'40',nom:'Landes'},
  {code:'41',nom:'Loir-et-Cher'},{code:'42',nom:'Loire'},{code:'43',nom:'Haute-Loire'},
  {code:'44',nom:'Loire-Atlantique'},{code:'45',nom:'Loiret'},{code:'46',nom:'Lot'},
  {code:'47',nom:'Lot-et-Garonne'},{code:'48',nom:'Lozère'},{code:'49',nom:'Maine-et-Loire'},
  {code:'50',nom:'Manche'},{code:'51',nom:'Marne'},{code:'52',nom:'Haute-Marne'},
  {code:'53',nom:'Mayenne'},{code:'54',nom:'Meurthe-et-Moselle'},{code:'55',nom:'Meuse'},
  {code:'56',nom:'Morbihan'},{code:'57',nom:'Moselle'},{code:'58',nom:'Nièvre'},
  {code:'59',nom:'Nord'},{code:'60',nom:'Oise'},{code:'61',nom:'Orne'},
  {code:'62',nom:'Pas-de-Calais'},{code:'63',nom:'Puy-de-Dôme'},
  {code:'64',nom:'Pyrénées-Atlantiques'},{code:'65',nom:'Hautes-Pyrénées'},
  {code:'66',nom:'Pyrénées-Orientales'},{code:'67',nom:'Bas-Rhin'},{code:'68',nom:'Haut-Rhin'},
  {code:'69',nom:'Rhône'},{code:'70',nom:'Haute-Saône'},{code:'71',nom:'Saône-et-Loire'},
  {code:'72',nom:'Sarthe'},{code:'73',nom:'Savoie'},{code:'74',nom:'Haute-Savoie'},
  {code:'75',nom:'Paris'},{code:'76',nom:'Seine-Maritime'},{code:'77',nom:'Seine-et-Marne'},
  {code:'78',nom:'Yvelines'},{code:'79',nom:'Deux-Sèvres'},{code:'80',nom:'Somme'},
  {code:'81',nom:'Tarn'},{code:'82',nom:'Tarn-et-Garonne'},{code:'83',nom:'Var'},
  {code:'84',nom:'Vaucluse'},{code:'85',nom:'Vendée'},{code:'86',nom:'Vienne'},
  {code:'87',nom:'Haute-Vienne'},{code:'88',nom:'Vosges'},{code:'89',nom:'Yonne'},
  {code:'90',nom:'Territoire de Belfort'},{code:'91',nom:'Essonne'},
  {code:'92',nom:'Hauts-de-Seine'},{code:'93',nom:'Seine-Saint-Denis'},
  {code:'94',nom:'Val-de-Marne'},{code:'95',nom:"Val-d'Oise"},
  {code:'971',nom:'Guadeloupe'},{code:'972',nom:'Martinique'},
  {code:'973',nom:'Guyane'},{code:'974',nom:'La Réunion'},{code:'976',nom:'Mayotte'},
]

// Slugs Doctolib par spécialiste
const DOCTOLIB_SLUGS = {
  'Médecin généraliste':   'medecin-generaliste',
  'Médecin urgentiste':    'medecin-generaliste',
  'Cardiologue':           'cardiologue',
  'Dermatologue':          'dermatologue',
  'Neurologue':            'neurologue',
  'Pneumologue':           'pneumologue',
  'Gastro-entérologue':   'gastro-enterologue',
  'Rhumatologue':          'rhumatologue',
  'Ophtalmologue':         'ophtalmologiste',
  'ORL':                   'oto-rhino-laryngologiste-ent',
  'Gynécologue':           'gynecologue-obstetricien',
  'Urologue':              'urologue',
  'Psychiatre':            'psychiatre',
  'Endocrinologue':        'endocrinologue',
  'Chirurgien':            'chirurgien-general',
  'Allergologue':          'allergologue',
  'Pédiatre':              'pediatre',
}

function slugVille(v) {
  return (v||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[\s''\-]+/g,'-').replace(/[^a-z0-9-]/g,'')
    .replace(/-+/g,'-').replace(/^-|-$/g,'')
}

export default function Analyse() {
  const [symptomes, setSymptomes]   = useState('')
  const [age, setAge]               = useState('')
  const [duree, setDuree]           = useState('')
  const [dept, setDept]             = useState('')
  const [cpInput, setCpInput]       = useState('')
  const [communes, setCommunes]     = useState([])
  const [ville, setVille]           = useState('')
  const [villesLoading, setVillesLoading] = useState(false)
  const [depts, setDepts]           = useState([])   // liste dépts chargée depuis l'API
  const [photo, setPhoto]           = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [resultat, setResultat]     = useState(null)
  const [medecins, setMedecins]     = useState([])
  const [liens, setLiens]           = useState(null)
  const [medLoading, setMedLoading] = useState(false)
  const [erreur, setErreur]         = useState(null)
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)

  // ─── CHARGEMENT DÉPARTEMENTS DEPUIS L'API ────────────────────────────────────
  const chargerDepts = useCallback(async () => {
    try {
      const r = await fetch('https://geo.api.gouv.fr/departements?fields=code,nom')
      if (r.ok) {
        const data = await r.json()
        setDepts(data.sort((a, b) => a.code.localeCompare(b.code)))
      }
    } catch {}
  }, [])

  useEffect(() => { chargerDepts() }, [chargerDepts])

    // ─── CHARGEMENT COMMUNES PAR DÉPARTEMENT ────────────────────────────────────
  // Inspiré du HTML de référence : utilise l'API directement, sans liste statique
  const chargerCommunesDept = useCallback(async (codeDept) => {
    setVille(''); setCommunes([])
    if (!codeDept) return
    setVillesLoading(true)
    try {
      const r = await fetch(
        `https://geo.api.gouv.fr/communes?codeDepartement=${codeDept}&fields=nom,code&format=json&boost=population&limit=500`
      )
      if (r.ok) {
        const data = await r.json()
        setCommunes(data.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
      }
    } catch (e) { console.error('Geo dept:', e) }
    setVillesLoading(false)
  }, [])

  // ─── CHARGEMENT COMMUNES PAR CODE POSTAL (5 chiffres exact) ─────────────────
  // Même logique que le HTML de référence : codePostal= → renvoie communes + département
  const chargerCommunesCP = useCallback(async (cp) => {
    setVille(''); setCommunes([])
    if (cp.length !== 5) return
    setVillesLoading(true)
    try {
      const r = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,code,departement&format=json`
      )
      if (r.ok) {
        const data = await r.json()
        setCommunes(data.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
        // Met à jour le département automatiquement
        if (data[0]?.departement?.code) setDept(data[0].departement.code)
        // Sélection auto si une seule commune
        if (data.length === 1) setVille(data[0].nom)
      }
    } catch (e) { console.error('Geo CP:', e) }
    setVillesLoading(false)
  }, [])

  const communesFiltrees = communes   // l'API filtre directement, pas besoin de filtre client

  // ─── HANDLERS ───────────────────────────────────────────────────────────────
  const handleDept = e => {
    const val = e.target.value
    setDept(val); setCpInput(''); setVille('')
    if (val) chargerCommunesDept(val)
    else setCommunes([])
  }

  const handleCpInput = e => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5)
    setCpInput(val); setVille('')
    if (val.length === 5) {
      chargerCommunesCP(val)          // recherche exacte → communes + département auto
    } else if (val.length === 0 && dept) {
      chargerCommunesDept(dept)       // revenir à toutes les communes du département
    } else {
      setCommunes([])
    }
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

  // ─── LIENS RDV ──────────────────────────────────────────────────────────────
  const buildLiens = (specialiste, villeNom) => {
    const slug = DOCTOLIB_SLUGS[specialiste] || 'medecin-generaliste'
    const villeSlug = slugVille(villeNom)
    const cpFinal = cpInput || dept
    return {
      presentiel: villeSlug
        ? `https://www.doctolib.fr/${slug}/${villeSlug}`
        : `https://www.doctolib.fr/${slug}`,
      teleconsult: `https://www.doctolib.fr/${slug}?teleconsultation=true`,
      keldoc: villeSlug
        ? `https://www.keldoc.com/${slug}/${villeSlug}`
        : `https://www.keldoc.com/recherche?speciality=${encodeURIComponent(specialiste)}`,
    }
  }

  // ─── RECHERCHE MÉDECINS ──────────────────────────────────────────────────────
  const chercherMedecins = async (specialiste, villeNom, cpFinal) => {
    setMedLoading(true)
    const liensBuilt = buildLiens(specialiste, villeNom)
    try {
      const r = await fetch(`/api/medecins?specialiste=${encodeURIComponent(specialiste)}&codePostal=${cpFinal}&ville=${encodeURIComponent(villeNom||'')}`)
      const d = await r.json()
      if (d.succes && d.medecins?.length > 0) {
        setMedecins(d.medecins)
        setLiens(d.liens || liensBuilt)
      } else {
        setMedecins([])
        setLiens(liensBuilt)
      }
    } catch {
      setMedecins([])
      setLiens(liensBuilt)
    }
    setMedLoading(false)
  }

  // ─── ANALYSER ───────────────────────────────────────────────────────────────
  const analyser = async () => {
    if (symptomes.trim().length < 3 && !photo) {
      setErreur('Décrivez vos symptômes ou ajoutez une photo.'); return
    }
    setLoading(true); setErreur(null); setResultat(null); setMedecins([]); setLiens(null)
    try {
      let photoBase64 = null
      if (photo) photoBase64 = await new Promise((res,rej) => {
        const r = new FileReader()
        r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(photo)
      })
      const cpFinal = cpInput || dept
      const resp = await fetch('/api/analyser', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({symptomes, age, duree, ville, codePostal:cpFinal, photoBase64, photoType:photo?.type})
      })
      const d = await resp.json()
      if (d.error) setErreur(d.error)
      else {
        setResultat(d.resultat)
        chercherMedecins(d.resultat.specialiste, ville, cpFinal)
      }
    } catch { setErreur('Erreur de connexion. Réessayez.') }
    setLoading(false)
  }

  const reset = () => {
    setResultat(null); setSymptomes(''); setAge(''); setDuree('')
    setDept(''); setCpInput(''); setCommunes([]); setVille('')
    setMedecins([]); setLiens(null); supprimerPhoto()
  }

  const peutAnalyser = !loading && (symptomes.trim().length >= 3 || photo)
  const niv = resultat ? NIVEAUX[resultat.niveau_urgence] || NIVEAUX[3] : null
  const nomDept = DEPARTEMENTS.find(d => d.code === dept)?.nom || ''

  // ─── RENDU ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pg-wrap { min-height: 100vh; background: #060e1a; position: relative; overflow-x: hidden; }

        /* Fond bandes diagonales */
        .bands { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: #060e1a; }
        .bands::before {
          content: ''; position: absolute; top: -20%; left: -20%; width: 140%; height: 80%;
          background: linear-gradient(180deg,#0a1f3d 0%,#0d2a52 30%,#1a5c9a 55%,#0a3d2e 75%,#060e1a 100%);
          transform: skewY(-6deg); transform-origin: top left;
        }
        .bands::after {
          content: ''; position: absolute; top: 45%; left: -20%; width: 140%; height: 3px;
          background: linear-gradient(90deg,transparent,#0e8a6e 30%,#4ade80 50%,#0e8a6e 70%,transparent);
          transform: skewY(-6deg); opacity: 0.6;
        }
        .grid-ov { position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image: linear-gradient(rgba(26,92,154,0.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(26,92,154,0.05) 1px,transparent 1px);
          background-size: 60px 60px; }

        .pg-content { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; }

        /* Nav */
        .topnav { display:flex; align-items:center; justify-content:space-between; padding:0 5%; height:64px;
          background:rgba(6,14,26,0.88); backdrop-filter:blur(12px);
          border-bottom:2px solid rgba(26,92,154,0.4); position:sticky; top:0; z-index:100; }
        .logo { font-size:1.35rem; font-weight:800; color:white; text-decoration:none; letter-spacing:-0.02em; font-family:'DM Sans',sans-serif; }
        .logo span { color:#4ade80; }
        .back-btn { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.85); border:2px solid rgba(255,255,255,0.2);
          padding:8px 18px; border-radius:4px; cursor:pointer; font-size:0.82rem; font-weight:700;
          font-family:'DM Sans',sans-serif; text-decoration:none; transition:all 0.2s; }
        .back-btn:hover { background:rgba(255,255,255,0.14); }

        /* Layout */
        .main { flex:1; padding:32px 5% 60px; }
        .ctn { max-width:640px; margin:0 auto; }
        .ptitle { text-align:center; margin-bottom:24px; }
        .ptitle h1 { font-size:clamp(1.5rem,3.5vw,2rem); font-weight:800; color:white; margin-bottom:6px; letter-spacing:-0.02em; font-family:'DM Sans',sans-serif; }
        .ptitle p { color:rgba(255,255,255,0.45); font-size:0.9rem; }

        /* Cartes */
        .form-card { background:#fff; border-radius:6px; padding:22px; box-shadow:0 20px 60px rgba(0,0,0,0.5); border:2px solid #b8cfe0; }
        .sec { border-radius:6px; padding:14px; margin-bottom:12px; }
        .sec-bleu { background:#e8f1fb; border:2.5px solid #7aafd4; }
        .sec-vert { background:#e6f4ef; border:2.5px solid #6dc0a0; }
        .sec-titre { font-size:0.69rem; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; }
        .st-b { color:#1a3d6e; } .st-v { color:#0a5c42; }

        .label { display:block; font-size:0.77rem; font-weight:700; color:#1e293b; margin-bottom:4px; }
        .field { width:100%; padding:11px 13px; border:2px solid #7a96ae; border-radius:5px;
          font-family:'DM Sans',sans-serif; font-size:0.9rem; color:#1e293b; background:#fff; outline:none; transition:all 0.2s; }
        .field:focus { border-color:#1a5c9a; box-shadow:0 0 0 3px rgba(26,92,154,0.15); }
        .field-sel { appearance:none;
          background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a5c9a' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center;
          cursor:pointer; padding-right:36px; }
        .field-sel:disabled { opacity:0.38; cursor:not-allowed; background-color:#f1f5f9; }
        .field:disabled { opacity:0.38; cursor:not-allowed; background-color:#f1f5f9; }
        .g2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
        @media(max-width:520px) { .g2,.g3 { grid-template-columns:1fr; } }

        .status { font-size:0.7rem; font-weight:700; margin-top:4px; }
        .s-ok { color:#15803d; } .s-load { color:#1a5c9a; } .s-err { color:#dc2626; } .s-info { color:#64748b; }

        /* Photo */
        .photo-row { display:flex; gap:10px; }
        .pbtn { flex:1; background:white; border-radius:6px; padding:12px 8px; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; gap:4px;
          font-family:'DM Sans',sans-serif; font-weight:700; font-size:0.77rem; transition:all 0.2s; }
        .pbtn:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
        .pb-b { border:2.5px solid #1a5c9a; color:#1a5c9a; }
        .pb-v { border:2.5px solid #0e8a6e; color:#0e8a6e; }

        /* Bouton analyser */
        .btn-go { width:100%; padding:16px; border-radius:4px; border:none; font-family:'DM Sans',sans-serif;
          font-size:0.97rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center;
          gap:10px; transition:all 0.25s; margin-top:6px;
          clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px)); }
        .btn-on { background:linear-gradient(135deg,#1a5c9a,#0e8a6e); color:white; box-shadow:0 6px 22px rgba(26,92,154,0.4); }
        .btn-on:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(26,92,154,0.5); }
        .btn-off { background:#cbd5e1; color:#94a3b8; cursor:not-allowed; }

        .spin { width:20px; height:20px; border:3px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:sp 0.7s linear infinite; }
        .spin-b { width:20px; height:20px; border:3px solid #c3d2e8; border-top-color:#1a5c9a; border-radius:50%; animation:sp 0.7s linear infinite; flex-shrink:0; }
        @keyframes sp { to{transform:rotate(360deg);} }

        .err { background:#fef2f2; border:2.5px solid #f87171; color:#b91c1c; padding:11px 14px; border-radius:6px; margin-bottom:12px; font-size:0.86rem; font-weight:600; }

        /* Résultat */
        .res-card { background:#fff; border-radius:6px; padding:22px; box-shadow:0 20px 60px rgba(0,0,0,0.5);
          border:2px solid #b8cfe0; border-left:6px solid #1a5c9a; animation:fadeUp 0.4s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

        .badge-niv { display:inline-flex; align-items:center; gap:8px; padding:7px 18px; border-radius:4px; font-weight:800; font-size:0.82rem; margin-bottom:14px; border:2px solid; }
        .res-h2 { font-weight:800; font-size:1.2rem; color:#1e293b; margin-bottom:10px; letter-spacing:-0.01em; font-family:'DM Sans',sans-serif; }
        .badge-i { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:4px; font-size:0.73rem; font-weight:700; margin-right:6px; margin-bottom:10px; }
        .bi-b { background:#dbeafe; color:#1d4ed8; border:1.5px solid #93c5fd; }
        .bi-v { background:#dcfce7; color:#15803d; border:1.5px solid #86efac; }
        .res-txt { color:#475569; line-height:1.8; font-size:0.91rem; margin-bottom:16px; }
        .conseils { background:#f0f6ff; border:2.5px solid #93b8d8; border-radius:6px; padding:14px; margin-bottom:18px; }
        .conseils strong { font-size:0.82rem; color:#1e293b; font-weight:800; }
        .conseils ul { margin-top:7px; padding-left:16px; }
        .conseils li { color:#475569; margin-bottom:5px; font-size:0.85rem; line-height:1.5; }

        /* Section médecins */
        .sep { border-top:2.5px solid #c8d8e8; padding-top:18px; margin-top:4px; }
        .sec-h3 { font-weight:800; font-size:0.98rem; color:#1e293b; margin-bottom:12px; font-family:'DM Sans',sans-serif; }

        /* Médecin card */
        .med-card { background:#f0f6ff; border:2.5px solid #93b8d8; border-radius:6px; padding:13px 15px; margin-bottom:9px; display:flex; gap:12px; align-items:flex-start; }
        .med-info { flex:1; }
        .med-nom { font-weight:800; color:#1e293b; font-size:0.89rem; margin-bottom:3px; }
        .med-spec { color:#1a5c9a; font-size:0.75rem; font-weight:700; margin-bottom:4px; }
        .med-ligne { display:flex; align-items:center; gap:5px; color:#64748b; font-size:0.75rem; margin-bottom:2px; }
        .med-tel { color:#1a5c9a; font-weight:700; text-decoration:none; }
        .med-tel:hover { text-decoration:underline; }
        .tag-tc { display:inline-flex; align-items:center; gap:3px; background:#dbeafe; color:#1d4ed8; border:1.5px solid #93c5fd; padding:2px 7px; border-radius:3px; font-size:0.66rem; font-weight:700; margin-top:4px; }

        .med-btns { display:flex; flex-direction:column; gap:6px; min-width:105px; }
        .mbtn { display:block; padding:8px 10px; border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.73rem; font-weight:800; text-align:center; text-decoration:none; cursor:pointer; transition:all 0.2s; border:none; white-space:nowrap; clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px)); }
        .mbtn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .mb-b { background:#1a5c9a; color:white; }
        .mb-v { background:#0e8a6e; color:white; }

        /* Liens plateformes */
        .plat-box { background:linear-gradient(135deg,#e8f1fb,#e6f4ef); border:2.5px solid #93b8d8; border-radius:6px; padding:18px; text-align:center; margin-top:8px; }
        .plat-t { font-weight:800; color:#1e293b; font-size:0.9rem; margin-bottom:4px; }
        .plat-s { color:#64748b; font-size:0.78rem; margin-bottom:14px; }
        .lien-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; max-width:380px; margin:0 auto; }
        @media(max-width:380px) { .lien-grid { grid-template-columns:1fr 1fr; } }
        .lbtn { display:flex; flex-direction:column; align-items:center; gap:3px; padding:12px 8px; border-radius:4px; text-decoration:none; font-family:'DM Sans',sans-serif; font-weight:800; font-size:0.78rem; transition:all 0.22s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
        .lbtn:hover { transform:translateY(-3px); filter:brightness(1.1); }
        .lbtn span { font-size:1.25rem; }
        .lbtn small { font-weight:400; font-size:0.64rem; opacity:0.85; }
        .lb-doc { background:#0596DE; color:white; }
        .lb-tc  { background:linear-gradient(135deg,#1a5c9a,#0e8a6e); color:white; }
        .lb-kel { background:#6366f1; color:white; }

        .mention { background:#fffbeb; border:2px solid #fcd34d; border-radius:6px; padding:12px 14px; font-size:0.76rem; color:#92400e; margin-top:15px; line-height:1.7; }
        .btn-new { background:transparent; border:2px solid rgba(255,255,255,0.25); color:rgba(255,255,255,0.7); padding:10px 22px; border-radius:4px; cursor:pointer; margin-top:13px; font-weight:700; font-family:'DM Sans',sans-serif; font-size:0.85rem; transition:all 0.2s; }
        .btn-new:hover { background:rgba(255,255,255,0.08); color:white; }
        .load-med { display:flex; align-items:center; gap:11px; background:#e8f1fb; border:2px solid #93b8d8; border-radius:6px; padding:14px 16px; color:#1a5c9a; font-size:0.85rem; font-weight:700; }
      `}</style>

      <div className="pg-wrap">
        <div className="bands"></div>
        <div className="grid-ov"></div>
        <div className="pg-content">

          {/* NAV */}
          <nav className="topnav">
            <Link href="/" className="logo">Medi<span>Connect</span></Link>
            <Link href="/" className="back-btn">← Accueil</Link>
          </nav>

          <div className="main">
            <div className="ctn">
              <div className="ptitle">
                <h1>Analysez vos symptômes</h1>
                <p>Notre IA vous oriente et trouve les médecins disponibles près de chez vous</p>
              </div>

              {!resultat && (
                <div className="form-card">

                  {/* SYMPTÔMES */}
                  <div className="sec sec-bleu">
                    <div className="sec-titre st-b">📝 Vos symptômes</div>
                    <textarea className="field" style={{minHeight:'105px',resize:'vertical'}}
                      placeholder="Ex : douleurs dans le dos depuis une semaine, eczéma sur le bras, problèmes cardiaques..."
                      value={symptomes} onChange={e => setSymptomes(e.target.value)}/>
                  </div>

                  {/* PHOTO */}
                  <div className="sec sec-vert">
                    <div className="sec-titre st-v">
                      📸 Photo&nbsp;
                      <span style={{fontWeight:'400',textTransform:'none',fontSize:'0.75rem',color:'#64748b'}}>
                        (optionnel — lésions, plaies, eczéma, boutons...)
                      </span>
                    </div>
                    {!photoPreview ? (
                      <div className="photo-row">
                        <button className="pbtn pb-b" onClick={() => fileRef.current?.click()}>
                          <span style={{fontSize:'1.5rem'}}>🖼️</span>Galerie photo
                          <span style={{fontSize:'0.65rem',color:'#94a3b8',fontWeight:'400'}}>Choisir un fichier</span>
                        </button>
                        <button className="pbtn pb-v" onClick={() => cameraRef.current?.click()}>
                          <span style={{fontSize:'1.5rem'}}>📷</span>Appareil photo
                          <span style={{fontSize:'0.65rem',color:'#94a3b8',fontWeight:'400'}}>Prendre une photo</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{position:'relative',display:'inline-block'}}>
                        <img src={photoPreview} alt="Photo" style={{maxWidth:'100%',maxHeight:'160px',borderRadius:'6px',border:'2.5px solid #6dc0a0',display:'block'}}/>
                        <button onClick={supprimerPhoto} style={{position:'absolute',top:'6px',right:'6px',background:'#dc2626',color:'white',border:'none',borderRadius:'3px',width:'26px',height:'26px',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800'}}>✕</button>
                        <p style={{marginTop:'5px',fontSize:'0.77rem',color:'#0e8a6e',fontWeight:'700'}}>✅ {photo?.name}</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => handlePhoto(e.target.files?.[0])}/>
                  </div>

                  {/* ÂGE + DURÉE */}
                  <div className="g2" style={{marginBottom:'12px'}}>
                    <div>
                      <label className="label">👤 Âge</label>
                      <select className="field field-sel" value={age} onChange={e => setAge(e.target.value)}>
                        <option value=""></option>
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
                        <option value=""></option>
                        <option value="quelques heures">Quelques heures</option>
                        <option value="depuis hier">Depuis hier</option>
                        <option value="2 à 3 jours">2-3 jours</option>
                        <option value="une semaine">Une semaine</option>
                        <option value="plus d'une semaine">+ d'une semaine</option>
                        <option value="plus d'un mois">+ d'un mois</option>
                      </select>
                    </div>
                  </div>

                  {/* LOCALISATION — 3 colonnes */}
                  <div className="sec sec-bleu" style={{marginBottom:'18px'}}>
                    <div className="sec-titre st-b">📍 Votre localisation</div>
                    <div className="g3">

                      {/* 1 — DÉPARTEMENT chargé depuis l'API */}
                      <div>
                        <label className="label">🗺️ Département</label>
                        <select className="field field-sel" value={dept} onChange={handleDept}>
                          <option value="">Sélectionnez</option>
                          {depts.map(d => (
                            <option key={d.code} value={d.code}>{d.code} — {d.nom}</option>
                          ))}
                        </select>
                        {villesLoading && !cpInput && <p className="status s-load">🔍 Chargement...</p>}
                        {!villesLoading && communes.length > 0 && !cpInput && (
                          <p className="status s-ok">✅ {communes.length} communes</p>
                        )}
                      </div>

                      {/* 2 — CODE POSTAL : 5 chiffres exact → recherche directe */}
                      <div>
                        <label className="label">
                          📮 Code postal
                          <span style={{fontWeight:'400',color:'#94a3b8',fontSize:'0.68rem'}}> (optionnel)</span>
                        </label>
                        <input
                          className="field"
                          type="text"
                          value={cpInput}
                          maxLength={5}
                          onChange={handleCpInput}
                          placeholder="Ex: 57200"
                        />
                        {villesLoading && cpInput.length === 5 && (
                          <p className="status s-load">🔍 Recherche...</p>
                        )}
                        {!villesLoading && cpInput.length === 5 && communes.length > 0 && (
                          <p className="status s-ok">✅ {communes.length} commune{communes.length > 1 ? 's' : ''}</p>
                        )}
                        {!villesLoading && cpInput.length === 5 && communes.length === 0 && (
                          <p className="status s-err">⚠️ Code postal inconnu</p>
                        )}
                      </div>

                      {/* 3 — VILLE */}
                      <div>
                        <label className="label">🏙️ Ville / commune</label>
                        <select
                          className="field field-sel"
                          value={ville}
                          onChange={e => setVille(e.target.value)}
                          disabled={villesLoading || communes.length === 0}
                        >
                          <option value="">
                            {villesLoading ? 'Chargement...' : communes.length === 0 ? 'Sélectionnez un département' : `Sélectionnez (${communes.length})`}
                          </option>
                          {communes.map(c => (
                            <option key={c.code || c.nom} value={c.nom}>{c.nom}</option>
                          ))}
                        </select>
                      </div>


                    </div>
                  </div>

                  {erreur && <div className="err">⚠️ {erreur}</div>}

                  <button className={`btn-go ${peutAnalyser ? 'btn-on' : 'btn-off'}`} onClick={analyser} disabled={!peutAnalyser}>
                    {loading
                      ? <><div className="spin"></div>Analyse en cours...</>
                      : <>🔍 Analyser{photo ? ' + photo' : ''}</>}
                  </button>
                  <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.7rem',color:'#94a3b8'}}>
                    🔒 Données non sauvegardées · ~15 secondes
                  </p>
                </div>
              )}

              {/* ─── RÉSULTAT ─── */}
              {resultat && niv && (
                <div className="res-card">
                  <div className="badge-niv" style={{background:niv.bg,color:niv.color,borderColor:niv.border}}>
                    {niv.emoji} {niv.texte}
                  </div>

                  <h2 className="res-h2">Spécialiste recommandé : {resultat.specialiste}</h2>

                  <div>
                    {(ville || nomDept) && (
                      <span className="badge-i bi-b">
                        📍 {ville ? `${ville}${cpInput ? ` (${cpInput})` : ''}` : nomDept}
                      </span>
                    )}
                    {photo && <span className="badge-i bi-v">📸 Photo analysée</span>}
                  </div>

                  <p className="res-txt">{resultat.explication}</p>

                  {resultat.conseils?.length > 0 && (
                    <div className="conseils">
                      <strong>💡 Conseils pratiques</strong>
                      <ul>{resultat.conseils.map((c,i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  )}

                  {/* ─── MÉDECINS ─── */}
                  <div className="sep">
                    <h3 className="sec-h3">
                      🏥 {resultat.specialiste}s {ville ? `à ${ville}` : nomDept ? `en ${nomDept}` : 'près de chez vous'}
                    </h3>

                    {medLoading && (
                      <div className="load-med">
                        <div className="spin-b"></div>
                        Recherche dans l'annuaire officiel de santé...
                      </div>
                    )}

                    {!medLoading && medecins.map((m, i) => (
                      <div className="med-card" key={i}>
                        <div className="med-info">
                          <div className="med-nom">{m.nom}</div>
                          <div className="med-spec">🩺 {m.specialite}</div>
                          {m.adresse && <div className="med-ligne">📍 {m.adresse}</div>}
                          {m.telephone && (
                            <div className="med-ligne">
                              📞 <a href={`tel:${m.telephone}`} className="med-tel">{m.telephone}</a>
                            </div>
                          )}
                          {m.horaires && <div className="med-ligne">🕐 {m.horaires}</div>}
                          {m.teleconsultation && <span className="tag-tc">📹 Téléconsultation disponible</span>}
                        </div>
                        <div className="med-btns">
                          <a href={m.urlRdv || liens?.presentiel || '#'} target="_blank" rel="noopener noreferrer" className="mbtn mb-b">📅 Prendre RDV</a>
                          <a href={m.urlTeleconsult || liens?.teleconsult || '#'} target="_blank" rel="noopener noreferrer" className="mbtn mb-v">📹 Téléconsult.</a>
                        </div>
                      </div>
                    ))}

                    {/* LIENS PLATEFORMES — toujours affichés */}
                    <div className="plat-box">
                      <div className="plat-t">
                        {medecins.length > 0 ? '🔗 Voir plus de praticiens' : `Trouver un(e) ${resultat.specialiste}`}
                      </div>
                      <div className="plat-s">
                        {ville ? `À ${ville} et ses environs` : nomDept ? `En ${nomDept}` : 'Sélectionnez votre localisation pour des résultats personnalisés'}
                      </div>
                      <div className="lien-grid">
                        <a href={liens?.presentiel || '#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-doc">
                          <span>🏥</span>Doctolib<small>En cabinet</small>
                        </a>
                        <a href={liens?.teleconsult || '#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-tc">
                          <span>📹</span>Téléconsult.<small>À distance</small>
                        </a>
                        <a href={liens?.keldoc || '#'} target="_blank" rel="noopener noreferrer" className="lbtn lb-kel">
                          <span>📅</span>Keldoc<small>Alternative</small>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mention">
                    ⚕️ <strong>Important :</strong> Cette analyse est informative uniquement — elle ne remplace pas un diagnostic médical. En cas d'urgence vitale : <strong>15 (SAMU)</strong> ou <strong>112</strong>.
                  </div>
                  <button className="btn-new" onClick={reset}>← Nouvelle analyse</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
