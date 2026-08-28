import type { APIRoute } from '@tanstack/start/api'
import { Resend } from 'resend'

const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const TO_EMAIL = 'ryancuevas53@gmail.com'

const resend = new Resend(RESEND_API_KEY)

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!TURNSTILE_SECRET || !token) return true // math captcha mode or Turnstile not configured
  const form = new URLSearchParams()
  form.set('secret', TURNSTILE_SECRET)
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
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
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
    await resend.emails.send({
      from: 'ELBI Modular <onboarding@resend.dev>',
      to: [TO_EMAIL],
      subject: `New inquiry: ${data.projectType} — ${data.name}`,
      html,
      replyTo: data.email || undefined,
    })
    return { success: true }
  } catch (err: unknown) {
    const error = err as { message?: string }
    return { success: false, error: error.message || 'Email send failed' }
  }
}

export const APIRoute = {
  async POST({ request }) {
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
} satisfies APIRoute