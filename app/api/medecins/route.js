// Génère de vrais liens Doctolib fonctionnels par ville et spécialité

const SLUGS_SPECIALITE = {
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
}

function slugVille(v) {
  return (v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s''\-]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const specialiste = searchParams.get('specialiste') || 'Médecin généraliste'
  const codePostal = searchParams.get('codePostal') || ''
  const ville = searchParams.get('ville') || ''

  const slug = SLUGS_SPECIALITE[specialiste] || 'medecin-generaliste'
  const villeSlug = slugVille(ville)

  // URLs Doctolib qui fonctionnent vraiment
  const urlPresentiel = villeSlug
    ? `https://www.doctolib.fr/${slug}/${villeSlug}`
    : `https://www.doctolib.fr/${slug}`

  const urlTeleconsult = `https://www.doctolib.fr/${slug}?teleconsultation=true`

  const urlKeldoc = villeSlug
    ? `https://www.keldoc.com/${slug}/${villeSlug}`
    : `https://www.keldoc.com/recherche?speciality=${encodeURIComponent(specialiste)}`

  const urlMaiia = `https://www.maiia.com/medecin/?near=${encodeURIComponent(ville || codePostal)}&speciality=${encodeURIComponent(specialiste)}`

  // Essai API annuaire santé
  try {
    const url = `https://api.annuaire.sante.fr/api/ps?` + new URLSearchParams({
      codePostal,
      professionLibelle: 'Médecin',
      savoirFaireLibelle: specialiste.includes('généraliste') || specialiste.includes('urgentiste') ? 'Médecine générale' : specialiste,
      limit: '8',
    })

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const data = await res.json()
      const items = data?.items || data?.results || []

      if (Array.isArray(items) && items.length > 0) {
        const medecins = items.slice(0, 6).map(m => {
          const ex = m.exercicesProfessionnels?.[0] || {}
          const adr = ex.adresseCorrespondance || m.adresseCorrespondance || {}
          return {
            nom: `Dr. ${(m.prenomExercice || m.prenom || '').trim()} ${(m.nomExercice || m.nom || '').trim()}`.trim(),
            specialite: specialiste,
            adresse: [adr.numeroVoie, adr.libelleVoie, adr.codePostal, adr.libelleCommune].filter(Boolean).join(' ') || ville,
            telephone: m.telephone || ex.telephone || null,
            teleconsultation: !!m.teleconsultation,
            horaires: ex.horaires?.slice(0,3).map(h => {
              const j = {1:'Lun',2:'Mar',3:'Mer',4:'Jeu',5:'Ven',6:'Sam',7:'Dim'}[h.jour]||''
              return h.heureDebut ? `${j} ${h.heureDebut.slice(0,5)}-${h.heureFin?.slice(0,5)||''}` : j
            }).join(' · ') || null,
            urlRdv: urlPresentiel,
            urlTeleconsult,
          }
        })
        return Response.json({ succes: true, medecins, liens: { presentiel: urlPresentiel, teleconsult: urlTeleconsult, keldoc: urlKeldoc } })
      }
    }
  } catch (e) {
    // API indisponible — fallback liens directs
  }

  return Response.json({
    succes: false,
    medecins: [],
    liens: {
      presentiel: urlPresentiel,
      teleconsult: urlTeleconsult,
      keldoc: urlKeldoc,
      maiia: urlMaiia,
    }
  })
}
