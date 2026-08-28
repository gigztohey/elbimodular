import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // parse body - Vercel bodyParser handles json/urlencoded
  let body = req.body
  // if body is string (urlencoded raw), parse
  if (typeof body === 'string') {
    const params = new URLSearchParams(body)
    body = Object.fromEntries(params)
  }
  if (!body || typeof body !== 'object') body = {}

  const { name, phone, email, 'project-type': projectType, location, budget, message, 'bot-field': honeypot } = body

  if (honeypot) {
    return res.status(200).json({ success: true })
  }

  if (!name || !phone || !projectType || !location || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[inquiry] RESEND_API_KEY not configured')
    return res.status(500).json({ error: 'Email service not configured. Add RESEND_API_KEY in Vercel → Settings → Environment Variables and Redeploy.' })
  }

  const resend = new Resend(apiKey)

  const html = `
    <h2>New Project Inquiry — ELBI Modular</h2>
    <table style="font-family:system-ui,sans-serif;line-height:1.6;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:8px 0;font-weight:600;width:180px">Name</td><td>${String(name).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Phone</td><td>${String(phone).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Email</td><td>${(email || '—').toString().replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Project type</td><td>${String(projectType).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Location</td><td>${String(location).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Budget</td><td>${(budget || 'Not specified').toString().replace(/</g,'&lt;')}</td></tr>
    </table>
    <p style="margin-top:16px"><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;margin:0">${String(message).replace(/</g,'&lt;')}</p>
  `

  try {
    const { error } = await resend.emails.send({
      from: 'ELBI Modular <onboarding@resend.dev>',
      to: ['ryancuevas53@gmail.com'],
      subject: `New inquiry: ${projectType} — ${name}`,
      html,
      replyTo: email || undefined,
    })
    if (error) {
      console.error('[resend] error', error)
      return res.status(500).json({ error: error.message || 'Email failed to send' })
    }
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Email send failed' })
  }
}
