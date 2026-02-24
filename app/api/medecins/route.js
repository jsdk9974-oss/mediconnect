// API médecins — Annuaire Santé (ANS - gouvernement français)
// API publique, sans clé, toute la France

const SPECIALITES_MAP = {
  'Médecin généraliste':   'Médecine générale',
  'Médecin urgentiste':    'Médecine générale',
  'Cardiologue':           'Cardiologie et maladies vasculaires',
  'Dermatologue':          'Dermatologie et vénéréologie',
  'Neurologue':            'Neurologie',
  'Pneumologue':           'Pneumologie',
  'Gastro-entérologue':   'Gastro-entérologie et hépatologie',
  'Rhumatologue':          'Rhumatologie',
  'Ophtalmologue':         'Ophtalmologie',
  'ORL':                   'Oto-rhino-laryngologie',
  'Gynécologue':           'Gynécologie médicale',
  'Urologue':              'Urologie',
  'Psychiatre':            'Psychiatrie',
  'Endocrinologue':        'Endocrinologie-diabétologie-nutrition',
  'Chirurgien':            'Chirurgie générale',
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const specialiste = searchParams.get('specialiste') || 'Médecin généraliste'
  const codePostal = searchParams.get('codePostal') || ''

  if (!codePostal) {
    return Response.json({ error: 'Code postal requis' }, { status: 400 })
  }

  const specialiteLibelle = SPECIALITES_MAP[specialiste] || 'Médecine générale'

  try {
    // API Annuaire Santé ANS — endpoint officiel
    const url = `https://api.annuaire.sante.fr/api/ps?` + new URLSearchParams({
      codePostal: codePostal,
      professionLibelle: 'Médecin',
      savoirFaireLibelle: specialiteLibelle,
      limit: '10',
      page: '1',
    })

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const items = data?.items || data?.results || data || []

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ succes: false, medecins: [], message: 'Aucun médecin trouvé' })
    }

    const medecins = items.slice(0, 8).map(m => {
      const exercice = m.exercicesProfessionnels?.[0] || {}
      const adresse = exercice.adresseCorrespondance || m.adresseCorrespondance || {}
      const horaires = exercice.horaires || []

      return {
        nom: `Dr. ${m.prenomExercice || m.prenom || ''} ${m.nomExercice || m.nom || ''}`.trim(),
        specialite: specialiteLibelle,
        adresse: [
          adresse.numeroVoie,
          adresse.libelleVoie,
          adresse.codePostal,
          adresse.libelleCommune
        ].filter(Boolean).join(' ') || `${codePostal}`,
        telephone: m.telephone || exercice.telephone || null,
        teleconsultation: m.teleconsultation || false,
        horairesTexte: formatHoraires(horaires),
        rpps: m.idPP || null,
      }
    })

    return Response.json({ succes: true, medecins })

  } catch (err) {
    console.error('API Annuaire erreur:', err.message)

    // Fallback: générer des liens Doctolib/Keldoc bien formés
    return Response.json({
      succes: false,
      fallback: true,
      medecins: [],
      liens: {
        doctolib: buildDoctolib(specialiste, codePostal),
        keldoc: buildKeldoc(specialiste, codePostal),
        maiia: buildMaiia(specialiste, codePostal),
      }
    })
  }
}

function formatHoraires(horaires) {
  if (!horaires || horaires.length === 0) return null
  const jours = { '1': 'Lun', '2': 'Mar', '3': 'Mer', '4': 'Jeu', '5': 'Ven', '6': 'Sam', '7': 'Dim' }
  return horaires.slice(0, 3).map(h => {
    const jour = jours[h.jour] || h.jour
    const debut = h.heureDebut?.slice(0, 5) || ''
    const fin = h.heureFin?.slice(0, 5) || ''
    return debut && fin ? `${jour} ${debut}-${fin}` : jour
  }).join(' · ')
}

function buildDoctolib(specialiste, cp) {
  const slugs = {
    'Médecin généraliste': 'medecin-generaliste',
    'Cardiologue': 'cardiologue',
    'Dermatologue': 'dermatologue',
    'Neurologue': 'neurologue',
    'Pneumologue': 'pneumologue',
    'Gastro-entérologue': 'gastro-enterologue',
    'Rhumatologue': 'rhumatologue',
    'Ophtalmologue': 'ophtalmologiste',
    'ORL': 'oto-rhino-laryngologiste-ent',
    'Gynécologue': 'gynecologue-obstetricien',
    'Urologue': 'urologue',
    'Psychiatre': 'psychiatre',
    'Endocrinologue': 'endocrinologue',
    'Chirurgien': 'chirurgien-general',
    'Médecin urgentiste': 'medecin-generaliste',
  }
  const slug = slugs[specialiste] || 'medecin-generaliste'
  return `https://www.doctolib.fr/${slug}?location=${cp}`
}

function buildKeldoc(specialiste, cp) {
  return `https://www.keldoc.com/search?speciality=${encodeURIComponent(specialiste)}&location=${cp}`
}

function buildMaiia(specialiste, cp) {
  return `https://www.maiia.com/medecin/?near=${cp}&speciality=${encodeURIComponent(specialiste)}`
}
