import { createServerFileRoute } from '@tanstack/react-start'
import { Resend } from 'resend'

const TO_EMAIL = 'ryancuevas53@gmail.com'

function getEnv(name: string) {
  // works with both Vite import.meta.env and Nitro/Node process.env on Vercel
  return (import.meta.env as Record<string, string | undefined>)[name] ?? (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)[name] : undefined)
}

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = getEnv('TURNSTILE_SECRET_KEY')
  if (!secret || !token) return true // math captcha mode or Turnstile not configured
  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  if (ip) form.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  return data.success === true
}

async function sendEmail(data: {
  name: string
  phone: string
  email: string
  projectType: string
  location: string
  budget: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = getEnv('RESEND_API_KEY')
  if (!apiKey) {
    console.error('[inquiry] RESEND_API_KEY not configured - email not sent', data)
    // For testing without key, return success so form shows "Thank you" (logs in Vercel Functions logs)
    // Change to false in production if you want to block without key
    return { success: false, error: 'Email service not configured. Add RESEND_API_KEY in Vercel → Settings → Environment Variables and Redeploy.' }
  }

  const html = `
    <h2>New Project Inquiry — ELBI Modular</h2>
    <table style="font-family:system-ui,sans-serif;line-height:1.6;border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:8px 0;font-weight:600;width:180px">Name</td><td>${data.name}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Phone</td><td>${data.phone}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Email</td><td>${data.email || '—'}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Project type</td><td>${data.projectType}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Location</td><td>${data.location}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Budget</td><td>${data.budget || 'Not specified'}</td></tr>
    </table>
    <p style="margin-top:16px"><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;margin:0">${data.message}</p>
  `

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: 'ELBI Modular <onboarding@resend.dev>',
      to: [TO_EMAIL],
      subject: `New inquiry: ${data.projectType} — ${data.name}`,
      html,
      replyTo: data.email || undefined,
    })
    if (error) return { success: false, error: (error as { message?: string }).message || 'Resend error' }
    return { success: true }
  } catch (err: unknown) {
    const error = err as { message?: string }
    return { success: false, error: error.message || 'Email send failed' }
  }
}

export const ServerRoute = createServerFileRoute('/api/inquiry').methods({
  POST: async ({ request }) => {
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, string> = {}

    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((v, k) => { body[k] = v.toString() })
    }

    const { name, phone, email, 'project-type': projectType, location, budget, message, 'cf-turnstile-response': turnstileToken } = body

    if (!name || !phone || !projectType || !location || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')
    const captchaOk = await verifyTurnstile(turnstileToken || '', clientIp)
    if (!captchaOk) {
      return new Response(JSON.stringify({ error: 'Captcha verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const emailResult = await sendEmail({ name, phone, email: email || '', projectType, location, budget: budget || '', message })
    if (!emailResult.success) {
      return new Response(JSON.stringify({ error: emailResult.error || 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  },
})