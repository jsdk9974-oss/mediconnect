// API Route — Recherche de médecins via l'Annuaire Santé (gouvernement français)
// Source : api.annuaire.sante.fr — gratuit, sans clé, toute la France

const CODES_SPECIALITES = {
  'Médecin généraliste':      { code: 'SM26', libelle: 'Médecine générale' },
  'Cardiologue':              { code: 'SM04', libelle: 'Cardiologie' },
  'Dermatologue':             { code: 'SM07', libelle: 'Dermatologie' },
  'Neurologue':               { code: 'SM18', libelle: 'Neurologie' },
  'Pneumologue':              { code: 'SM22', libelle: 'Pneumologie' },
  'Gastro-entérologue':       { code: 'SM09', libelle: 'Gastro-entérologie' },
  'Rhumatologue':             { code: 'SM27', libelle: 'Rhumatologie' },
  'Ophtalmologue':            { code: 'SM19', libelle: 'Ophtalmologie' },
  'ORL':                      { code: 'SM20', libelle: 'Oto-rhino-laryngologie' },
  'Gynécologue':              { code: 'SM10', libelle: 'Gynécologie médicale' },
  'Urologue':                 { code: 'SM30', libelle: 'Urologie' },
  'Psychiatre':               { code: 'SM23', libelle: 'Psychiatrie' },
  'Endocrinologue':           { code: 'SM08', libelle: 'Endocrinologie' },
  'Chirurgien':               { code: 'SM05', libelle: 'Chirurgie générale' },
  'Médecin urgentiste':       { code: 'SM26', libelle: 'Médecine générale' },
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const specialiste = searchParams.get('specialiste') || 'Médecin généraliste'
  const codePostal = searchParams.get('codePostal') || ''
  const ville = searchParams.get('ville') || ''

  if (!codePostal && !ville) {
    return Response.json({ error: 'Code postal requis' }, { status: 400 })
  }

  const spec = CODES_SPECIALITES[specialiste] || CODES_SPECIALITES['Médecin généraliste']

  try {
    // API Annuaire Santé — ANS (Agence du Numérique en Santé)
    const params = new URLSearchParams({
      codePostal: codePostal,
      specialiteProfessionnel: spec.libelle,
      limit: '8',
      offset: '0',
    })

    const url = `https://api.annuaire.sante.fr/api/ps?${params.toString()}`
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 } // Cache 1h
    })

    if (!res.ok) {
      throw new Error(`API Annuaire erreur: ${res.status}`)
    }

    const data = await res.json()
    
    // Formatage des résultats
    const medecins = (data.items || data || []).slice(0, 6).map(m => ({
      nom: formatNom(m),
      specialite: spec.libelle,
      adresse: formatAdresse(m),
      codePostal: m.codePostalResidence || m.codePostal || codePostal,
      ville: m.libelleCommune || m.commune || ville,
      telephone: m.telephone || null,
      rpps: m.idPP || m.rpps || null,
    }))

    return Response.json({ succes: true, medecins, total: data.total || medecins.length })

  } catch (error) {
    console.error('Erreur API Annuaire:', error.message)
    
    // Fallback : redirection vers Doctolib avec bons paramètres
    return Response.json({
      succes: false,
      fallback: true,
      urlDoctolib: `https://www.doctolib.fr/${slugSpecialite(specialiste)}/${slugVille(ville || codePostal)}`,
      message: "Service temporairement indisponible"
    })
  }
}

function formatNom(m) {
  const prenom = m.prenomExercice || m.prenom || ''
  const nom = m.nomExercice || m.nom || 'Médecin'
  return `Dr. ${prenom} ${nom}`.trim()
}

function formatAdresse(m) {
  const rue = m.libelleVoieResidence || m.adresse || ''
  const cp = m.codePostalResidence || m.codePostal || ''
  const ville = m.libelleCommune || m.commune || ''
  if (rue && cp) return `${rue}, ${cp} ${ville}`
  if (cp && ville) return `${cp} ${ville}`
  return ville || 'Adresse non disponible'
}

function slugSpecialite(s) {
  const map = {
    'Médecin généraliste': 'medecin-generaliste',
    'Cardiologue': 'cardiologue',
    'Dermatologue': 'dermatologue',
    'Neurologue': 'neurologue',
    'Pneumologue': 'pneumologue',
    'Gastro-entérologue': 'gastro-enterologue',
    'Rhumatologue': 'rhumatologue',
    'Ophtalmologue': 'ophtalmologue',
    'ORL': 'oto-rhino-laryngologiste-ent',
    'Gynécologue': 'gynecologue-obstetricien',
    'Urologue': 'urologue',
    'Psychiatre': 'psychiatre',
    'Endocrinologue': 'endocrinologue',
    'Chirurgien': 'chirurgien-general',
    'Médecin urgentiste': 'medecin-generaliste',
  }
  return map[s] || 'medecin-generaliste'
}

function slugVille(v) {
  return v.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

