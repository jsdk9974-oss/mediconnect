import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { symptomes, age, duree, ville, codePostal, photoBase64, photoType } = await request.json()

    if (!symptomes?.trim() && !photoBase64) {
      return Response.json({ error: 'Veuillez décrire vos symptômes ou ajouter une photo.' }, { status: 400 })
    }

    const localisation = ville ? `${ville} (${codePostal})` : codePostal ? `code postal ${codePostal}` : 'non précisée'

    const textePrompt = `Tu es un assistant médical bienveillant. Analyse la situation suivante.

Symptômes décrits : ${symptomes || 'Non décrits — voir photo'}
Âge : ${age || 'non précisé'}
Durée : ${duree || 'non précisée'}
Localisation : ${localisation}
${photoBase64 ? 'Une photo a été fournie — analyse-la attentivement.' : ''}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown ni backticks) :
{
  "niveau_urgence": 1,
  "label_urgence": "Urgences maintenant",
  "specialiste": "Médecin urgentiste",
  "explication": "Explication claire en 3-4 phrases en français simple, sans jargon médical.",
  "conseils": ["conseil 1", "conseil 2", "conseil 3"],
  "recherche_doctolib": "dermatologue"
}

Niveaux d'urgence :
1 = Urgences maintenant (menace vitale)
2 = Consulter sous 24h
3 = Consulter dans la semaine
4 = Non urgent

Spécialiste parmi : Médecin urgentiste, Médecin généraliste, Cardiologue, Dermatologue, Neurologue, Pneumologue, Gastro-entérologue, Rhumatologue, Ophtalmologue, ORL, Gynécologue, Urologue, Psychiatre, Endocrinologue, Chirurgien.

Réponds UNIQUEMENT avec le JSON brut.`

    // Construction du message avec ou sans image
    let messageContent
    if (photoBase64) {
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: photoType || 'image/jpeg',
            data: photoBase64,
          }
        },
        { type: 'text', text: textePrompt }
      ]
    } else {
      messageContent = textePrompt
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }]
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
