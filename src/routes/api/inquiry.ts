import { createServerFileRoute } from '@tanstack/react-start'
import { Resend } from 'resend'

function getEnv(name: string) {
  return (import.meta.env as Record<string, string | undefined>)[name] ?? (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)[name] : undefined)
}

export const ServerRoute = createServerFileRoute('/api/inquiry').methods({
  POST: async ({ request }) => {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string> = {}
    try {
      if (contentType.includes('application/json')) {
        body = await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text()
        const params = new URLSearchParams(text)
        params.forEach((v, k) => (body[k] = v))
      } else if (contentType.includes('multipart/form-data') || contentType.includes('form-data')) {
        const formData = await request.formData()
        formData.forEach((v, k) => (body[k] = v.toString()))
      } else {
        const text = await request.text()
        if (text) {
          try { body = JSON.parse(text) } catch { const p = new URLSearchParams(text); p.forEach((v,k)=>(body[k]=v)) }
        }
      }
    } catch {}

    const bot = body['bot-field']
    if (bot) return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })

    const { name, phone, email, 'project-type': projectType, location, budget, message } = body

    if (!name || !phone || !projectType || !location || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const apiKey = getEnv('RESEND_API_KEY')
    if (!apiKey) {
      console.error('[inquiry] RESEND_API_KEY missing')
      return new Response(JSON.stringify({ error: 'Email service not configured. Add RESEND_API_KEY in Vercel → Settings → Environment Variables and Redeploy.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
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
    <p style="white-space:pre-wrap;margin:0">${String(message).replace(/</g,'&lt;')}</p>`

    try {
      const { error } = await resend.emails.send({
        from: 'ELBI Modular <onboarding@resend.dev>',
        to: ['ryancuevas53@gmail.com'],
        subject: `New inquiry: ${projectType} — ${name}`,
        html,
        replyTo: email || undefined,
      })
      if (error) return new Response(JSON.stringify({ error: (error as {message?:string}).message || 'Email failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      const err = e as { message?: string }
      return new Response(JSON.stringify({ error: err.message || 'Email send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  },
})
