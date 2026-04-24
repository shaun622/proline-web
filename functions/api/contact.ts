// Cloudflare Pages Function — POST /api/contact
// Receives the contact form submission, validates, then sends via Resend.
// Env bindings (set in Cloudflare Pages dashboard):
//   - RESEND_API_KEY       (secret)   Resend API key
//   - CONTACT_FROM_EMAIL   (optional) Verified sender, e.g. "ProLine <website@prolinechch.co.nz>".
//                                     Defaults to Resend's onboarding sender until domain is verified.
//   - CONTACT_TO_EMAIL     (optional) Recipient. Defaults to michael@prolinealuminium.co.nz.

interface Env {
  RESEND_API_KEY: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
}

type PagesFunction<E = unknown> = (ctx: {
  request: Request;
  env: E;
  waitUntil: (p: Promise<unknown>) => void;
}) => Response | Promise<Response>;

const MAX_LEN = {
  name: 120,
  phone: 40,
  email: 160,
  service: 80,
  message: 5000,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function cleanLine(v: unknown, max: number): string {
  return String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function cleanMulti(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: 'Email service not configured' }, 500);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid submission' }, 400);
  }

  // Honeypot — bots fill every field. Silently pretend success.
  const honeypot = cleanLine(form.get('company'), 10);
  if (honeypot) return json({ ok: true });

  const name = cleanLine(form.get('name'), MAX_LEN.name);
  const phone = cleanLine(form.get('phone'), MAX_LEN.phone);
  const email = cleanLine(form.get('email'), MAX_LEN.email);
  const service = cleanLine(form.get('service'), MAX_LEN.service);
  const message = cleanMulti(form.get('message'), MAX_LEN.message);

  if (!name || !email || !service || !message) {
    return json({ ok: false, error: 'Please fill in name, email, service and message.' }, 400);
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: 'That email address looks off — can you double-check it?' }, 400);
  }

  const from = env.CONTACT_FROM_EMAIL || 'ProLine Website <onboarding@resend.dev>';
  const to = env.CONTACT_TO_EMAIL || 'michael@prolinealuminium.co.nz';

  const textBody = [
    `New enquiry from prolinechch.co.nz`,
    ``,
    `Name:    ${name}`,
    `Phone:   ${phone || '—'}`,
    `Email:   ${email}`,
    `Service: ${service}`,
    ``,
    `Message:`,
    message,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; max-width: 560px; color: #0a0b0d;">
      <h2 style="margin:0 0 4px 0; font-size:18px;">New enquiry from prolinechch.co.nz</h2>
      <p style="margin:0 0 20px 0; color:#5a5f68; font-size:13px;">Sent ${new Date().toUTCString()}</p>

      <table style="border-collapse: collapse; width: 100%;">
        <tbody>
          <tr><td style="padding:8px 0; color:#5a5f68; width:110px; vertical-align:top;">Name</td><td style="padding:8px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
          <tr><td style="padding:8px 0; color:#5a5f68; vertical-align:top;">Phone</td><td style="padding:8px 0;">${escapeHtml(phone) || '&mdash;'}</td></tr>
          <tr><td style="padding:8px 0; color:#5a5f68; vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#0a0b0d;">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0; color:#5a5f68; vertical-align:top;">Service</td><td style="padding:8px 0;">${escapeHtml(service)}</td></tr>
        </tbody>
      </table>

      <div style="margin-top:16px; padding:16px; background:#f5f6f8; border-radius:8px; white-space:pre-wrap; font-size:14px; line-height:1.5;">${escapeHtml(message)}</div>

      <p style="margin-top:24px; font-size:12px; color:#858a93;">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `New enquiry — ${service} — ${name}`,
      text: textBody,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Resend error', res.status, detail);
    return json({ ok: false, error: "Couldn't send right now. Please call 027 845 6163." }, 502);
  }

  return json({ ok: true });
};

// Catch wrong methods
export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'POST') {
    // Should not reach here — onRequestPost handles POST — but guard anyway.
    return json({ ok: false, error: 'Use POST' }, 405);
  }
  return json({ ok: false, error: 'Method not allowed' }, 405);
};
