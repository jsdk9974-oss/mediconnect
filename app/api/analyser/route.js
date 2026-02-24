import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { symptomes, age, duree } = await request.json()

    if (!symptomes || symptomes.trim().length < 10) {
      return Response.json({ error: 'Veuillez décrire vos symptômes plus en détail.' }, { status: 400 })
    }

    const prompt = `Tu es un assistant médical bienveillant. Un patient te décrit ses symptômes.

Symptômes décrits : ${symptomes}
Âge approximatif : ${age || 'non précisé'}
Durée des symptômes : ${duree || 'non précisée'}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown ni backticks) avec exactement cette structure :
{
  "niveau_urgence": 1,
  "label_urgence": "Urgences maintenant",
  "specialiste": "Médecin urgentiste",
  "explication": "Explication claire en 3-4 phrases en français simple, sans jargon médical.",
  "conseils": ["conseil 1", "conseil 2", "conseil 3"],
  "recherche_doctolib": "dermatologue Paris"
}

Niveaux d'urgence :
1 = Urgences maintenant (menace vitale potentielle)
2 = Consulter sous 24h (situation préoccupante)
3 = Consulter dans la semaine (situation non urgente)
4 = Non urgent (surveillance possible)

Spécialiste : choisis parmi : Médecin urgentiste, Médecin généraliste, Cardiologue, Dermatologue, Neurologue, Pneumologue, Gastro-entérologue, Rhumatologue, Ophtalmologue, ORL, Gynécologue, Urologue, Psychiatre, Endocrinologue.

IMPORTANT : réponds UNIQUEMENT avec le JSON brut, aucun texte avant ou après.`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const texte = message.content[0].text.trim()
    const resultat = JSON.parse(texte)

    return Response.json({ succes: true, resultat })
  } catch (error) {
    console.error('Erreur API:', error)
    return Response.json({
      error: "Une erreur s'est produite. Veuillez réessayer."
    }, { status: 500 })
  }
}
