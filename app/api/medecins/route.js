// API médecins — génère des liens Doctolib directs + essaie l'annuaire ANS

const SLUGS = {
  'Médecin généraliste':  'medecin-generaliste',
  'Médecin urgentiste':   'medecin-generaliste',
  'Cardiologue':          'cardiologue',
  'Dermatologue':         'dermatologue',
  'Neurologue':           'neurologue',
  'Pneumologue':          'pneumologue',
  'Gastro-entérologue':  'gastro-enterologue',
  'Rhumatologue':         'rhumatologue',
  'Ophtalmologue':        'ophtalmologiste',
  'ORL':                  'oto-rhino-laryngologiste-ent',
  'Gynécologue':          'gynecologue-obstetricien',
  'Urologue':             'urologue',
  'Psychiatre':           'psychiatre',
  'Endocrinologue':       'endocrinologue',
  'Chirurgien':           'chirurgien-general',
  'Allergologue':         'allergologue',
  'Pédiatre':             'pediatre',
}

// Correspondance symptômes → spécialiste
const SYMPTOMES_SPECIALISTE = {
  'eczema':         'Dermatologue',
  'eczéma':         'Dermatologue',
  'psoriasis':      'Dermatologue',
  'peau':           'Dermatologue',
  'bouton':         'Dermatologue',
  'lésion':        'Dermatologue',
  'cardiaque':      'Cardiologue',
  'coeur':          'Cardiologue',
  'cœur':          'Cardiologue',
  'palpitation':    'Cardiologue',
  'pulmonaire':     'Pneumologue',
  'poumon':         'Pneumologue',
  'essoufflement':  'Pneumologue',
  'asthme':         'Pneumologue',
  'dos':            'Rhumatologue',
  'articulation':   'Rhumatologue',
  'oeil':           'Ophtalmologue',
  'yeux':           'Ophtalmologue',
  'vision':         'Ophtalmologue',
  'oreille':        'ORL',
  'gorge':          'ORL',
  'sinusite':       'ORL',
  'ventre':         'Gastro-entérologue',
  'digestion':      'Gastro-entérologue',
  'anxiété':       'Psychiatre',
  'depression':     'Psychiatre',
  'dépression':    'Psychiatre',
}

function slugVille(v) {
  return (v || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s'\-]+/g, '-').replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const specialiste = searchParams.get('specialiste') || 'Médecin généraliste'
  const codePostal  = searchParams.get('codePostal') || ''
  const ville       = searchParams.get('ville') || ''

  const slug      = SLUGS[specialiste] || 'medecin-generaliste'
  const villeSlug = slugVille(ville)

  const presentiel  = villeSlug
    ? `https://www.doctolib.fr/${slug}/${villeSlug}`
    : `https://www.doctolib.fr/${slug}`
  const teleconsult = `https://www.doctolib.fr/${slug}?teleconsultation=true`
  const keldoc      = villeSlug
    ? `https://www.keldoc.com/${slug}/${villeSlug}`
    : `https://www.keldoc.com/recherche?speciality=${encodeURIComponent(specialiste)}`

  const liens = { presentiel, teleconsult, keldoc }

  // Essai annuaire ANS
  try {
    const cp = codePostal.length === 5 ? codePostal : ''
    if (!cp) return Response.json({ succes: false, medecins: [], liens })

    const params = new URLSearchParams({
      codePostal: cp,
      limit: '8',
    })
    const res = await fetch(`https://api.annuaire.sante.fr/api/ps?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return Response.json({ succes: false, medecins: [], liens })

    const data = await res.json()
    const items = data?.items || data?.results || []
    if (!Array.isArray(items) || items.length === 0)
      return Response.json({ succes: false, medecins: [], liens })

    const medecins = items.slice(0, 6).map(m => {
      const ex  = m.exercicesProfessionnels?.[0] || {}
      const adr = ex.adresseCorrespondance || m.adresseCorrespondance || {}
      return {
        nom:             `Dr. ${(m.prenomExercice || m.prenom || '').trim()} ${(m.nomExercice || m.nom || '').trim()}`.trim(),
        specialite:      specialiste,
        adresse:         [adr.numeroVoie, adr.libelleVoie, adr.codePostal, adr.libelleCommune].filter(Boolean).join(' ') || ville,
        telephone:       m.telephone || ex.telephone || null,
        teleconsultation: !!m.teleconsultation,
        horaires:        ex.horaires?.slice(0,3).map(h => {
          const j = {1:'Lun',2:'Mar',3:'Mer',4:'Jeu',5:'Ven',6:'Sam',7:'Dim'}[h.jour] || ''
          return h.heureDebut ? `${j} ${h.heureDebut.slice(0,5)}-${(h.heureFin||'').slice(0,5)}` : j
        }).join(' · ') || null,
        urlRdv:          presentiel,
        urlTeleconsult:  teleconsult,
      }
    })
    return Response.json({ succes: true, medecins, liens })
  } catch {
    return Response.json({ succes: false, medecins: [], liens })
  }
}
