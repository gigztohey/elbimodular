import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(async () => {
    const formData = await readFormData(event)
    const obj: Record<string, string> = {}
    formData.forEach((v, k) => (obj[k] = v.toString()))
    return obj
  })

  const { name, phone, email, 'project-type': projectType, location, budget, message, 'bot-field': honeypot } = body || {}

  if (honeypot) return { success: true }

  if (!name || !phone || !projectType || !location || !message) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[inquiry] RESEND_API_KEY not configured')
    throw createError({ statusCode: 500, message: 'Email service not configured. Add RESEND_API_KEY in Vercel → Settings → Environment Variables and Redeploy.' })
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

  const { error } = await resend.emails.send({
    from: 'ELBI Modular <onboarding@resend.dev>',
    to: ['ryancuevas53@gmail.com'],
    subject: `New inquiry: ${projectType} — ${name}`,
    html,
    replyTo: email || undefined,
  })

  if (error) {
    console.error('[resend] error', error)
    throw createError({ statusCode: 500, message: (error as { message?: string }).message || 'Email failed to send' })
  }

  return { success: true }
})
