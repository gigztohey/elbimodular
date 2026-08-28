import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Hammer,
  Layers3,
  Mail,
  MapPin,
  Menu,
  PencilRuler,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

function genChallenge() {
  const a = 2 + Math.floor(Math.random() * 8) // 2-9
  const b = 3 + Math.floor(Math.random() * 7) // 3-9
  return { a, b, answer: a + b }
}

export const Route = createFileRoute('/')({
  component: HomePage,
})

const services = [
  {
    number: '01',
    icon: PencilRuler,
    title: 'Custom kitchens',
    description:
      'Purpose-built cabinetry that makes cooking, storage, and everyday movement feel effortless.',
  },
  {
    number: '02',
    icon: Layers3,
    title: 'Wardrobes & storage',
    description:
      'Smart built-ins, closets, and storage systems designed to use every available centimeter well.',
  },
  {
    number: '03',
    icon: Hammer,
    title: 'Professional installation',
    description:
      'Careful on-site fitting, clean finishes, and dependable coordination from delivery to handover.',
  },
]

const process = [
  ['01', 'Tell us about your space', 'Share your location, measurements, inspiration, and project goals.'],
  ['02', 'Plan the right solution', 'We align on layout, finishes, functionality, scope, and budget.'],
  ['03', 'Build with precision', 'Your cabinetry is fabricated to suit the approved design and dimensions.'],
  ['04', 'Install and hand over', 'We fit, align, finish, and check every detail before completion.'],
]

const gallery = [
  { id: 1, src: '/images/project-installation.jpg', title: 'Modern kitchen', desc: 'Custom cabinetry & island', cat: 'Custom Designs', span: 'project-large' },
  { id: 2, src: '/images/project-storage.webp', title: 'Integrated storage', desc: 'Floor-to-ceiling built-ins', cat: '3D / Visuals', span: 'project-tall' },
  { id: 3, src: '/images/project-kitchen.jpg', title: 'Compact kitchen', desc: 'Space-smart modular layout', cat: 'Custom Designs', span: 'project-wide' },
  { id: 4, src: '/images/project-wardrobe.webp', title: 'Bespoke wardrobe', desc: 'Wardrobe & closet system', cat: 'Custom Designs', span: '' },
  { id: 5, src: '/images/project-installation.jpg', title: '3D Concept', desc: 'Visual render — no people', cat: '3D / Visuals', span: '' },
  { id: 6, src: '/images/project-kitchen.jpg', title: 'Entertainment unit', desc: 'Living storage wall', cat: 'Custom Designs', span: '' },
]
const filters = ['All Projects', '3D / Visuals', 'Custom Designs'] as const

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="ELBI Modular home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-type">
        <strong>ELBI</strong>
        <small>MODULAR</small>
      </span>
    </a>
  )
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [captcha, setCaptcha] = useState(() => genChallenge())
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All Projects')
  const [lightbox, setLightbox] = useState<(typeof gallery)[number] | null>(null)

  useEffect(() => {
    setCaptcha(genChallenge())
  }, [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [lightbox])

  const filtered = activeFilter === 'All Projects' ? gallery : gallery.filter(g => g.cat === activeFilter)

  function refreshCaptcha() {
    setCaptcha(genChallenge())
    setCaptchaInput('')
    setCaptchaError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // honeypot check
    const form = event.currentTarget
    const honeypot = (form.elements.namedItem('bot-field') as HTMLInputElement | null)?.value
    if (honeypot) return // silently drop bots

    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setCaptchaError(`Incorrect answer. Try again.`)
      refreshCaptcha()
      return
    }

    setFormState('submitting')
    setFormError(null)
    setCaptchaError(null)

    const dataObj: Record<string, string> = {}
    new FormData(form).forEach((v, k) => (dataObj[k] = v.toString()))

    try {
      // Direct email via FormSubmit AJAX — no server route needed, fixes Vercel 404
      // First submission requires confirming activation email sent to ryancuevas53@gmail.com
      const response = await fetch('https://formsubmit.co/ajax/ryancuevas53@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: dataObj.name,
          phone: dataObj.phone,
          email: dataObj.email || 'not provided',
          project_type: dataObj['project-type'],
          location: dataObj.location,
          budget: dataObj.budget || 'Not specified',
          message: dataObj.message,
          _subject: `New ELBI inquiry: ${dataObj['project-type']} — ${dataObj.name}`,
          _template: 'table',
          _captcha: 'false',
          _cc: 'giangowzxc@gmail.com',
        }),
      })

      const data = await response.json().catch(() => ({} as Record<string, string>))
      if (!response.ok) throw new Error((data as { message?: string }).message || (data as { error?: string }).error || `Server error ${response.status}`)

      form.reset()
      setCaptchaInput('')
      refreshCaptcha()
      setFormState('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please check your connection and try again.'
      setFormError(msg)
      setFormState('error')
      console.error(err)
    }
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <main id="top">
      <header className="site-header">
        <Brand />
        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Main navigation">
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#work" onClick={closeMenu}>Our work</a>
          <a href="#process" onClick={closeMenu}>Process</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a className="nav-cta" href="#quote" onClick={closeMenu}>
            Get a free quote <ArrowDownRight size={16} />
          </a>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-image-wrap">
          <img
            className="hero-image"
            src="/images/project-installation.jpg"
            alt="Bright modern kitchen with custom white modular cabinetry and island"
          />
          <div className="hero-shade" />
        </div>
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow"><span /> Custom cabinet making & installation</p>
          <h1 id="hero-title">Made for your space.<br /><em>Built for real life.</em></h1>
          <p className="hero-copy">
            Thoughtful modular cabinetry, carefully made and professionally installed for homes and businesses.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#quote">
              Start your project <ArrowRight size={18} />
            </a>
            <a className="text-link text-link-light" href="#work">
              Explore our work <ArrowDownRight size={18} />
            </a>
          </div>
        </div>
        <div className="hero-note">
          <span>01</span>
          <p>From first measurement<br />to final installation.</p>
        </div>
        <a className="hero-scroll" href="#intro" aria-label="Scroll to introduction">
          <ArrowDownRight size={22} />
        </a>
      </section>

      <section className="trust-strip" aria-label="Our service commitments">
        <div><Ruler size={20} /><span>Made to measure</span></div>
        <div><ShieldCheck size={20} /><span>Carefully installed</span></div>
        <div><Sparkles size={20} /><span>Clean, lasting finish</span></div>
        <div><Check size={20} /><span>Clear project guidance</span></div>
      </section>

      <section className="intro section" id="intro">
        <div className="section-tag"><span>01</span> Our approach</div>
        <div className="intro-copy">
          <p className="eyebrow dark"><span /> Beautifully practical</p>
          <h2>Good cabinetry should make your space feel <em>simpler.</em></h2>
          <p className="body-large">
            ELBI Modular turns underused rooms and difficult corners into organized, comfortable spaces. Every project starts with your needs—not a one-size-fits-all catalog.
          </p>
          <a className="text-link" href="#about">Why choose ELBI <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="services section" id="services">
        <div className="services-heading">
          <div className="section-tag light"><span>02</span> What we do</div>
          <h2>Cabinetry that works<br /><em>as beautifully as it looks.</em></h2>
        </div>
        <div className="service-list">
          {services.map(({ number, icon: Icon, title, description }) => (
            <article className="service-item" key={title}>
              <span className="service-number">{number}</span>
              <Icon className="service-icon" strokeWidth={1.35} />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <ChevronRight className="service-arrow" size={22} />
            </article>
          ))}
        </div>
      </section>

      <section className="value-prop section" id="why-us" aria-label="Why clients choose ELBI">
        <div className="value-grid">
          <div>
            <div className="section-tag"><span>02b</span> Why ELBI</div>
            <h2>Premium quality.<br /><em>On time, every time.</em></h2>
            <p>Built to convert walk-ins into booked projects — clear service, proven finish, reliable execution.</p>
          </div>
          <div className="value-cols">
            <div>
              <h3><Hammer size={16}/> Services</h3>
              <ul>
                <li><Check size={14}/> Custom kitchens & islands</li>
                <li><Check size={14}/> Wardrobes / built-in storage</li>
                <li><Check size={14}/> 3D visuals & shop drawings</li>
                <li><Check size={14}/> Professional install & handover</li>
              </ul>
            </div>
            <div>
              <h3><ShieldCheck size={16}/> Quality guarantee</h3>
              <ul>
                <li><Check size={14}/> Made to measure ±2mm precision</li>
                <li><Check size={14}/> Premium hardware & clean finish</li>
                <li><Check size={14}/> Site-checked, level & aligned</li>
                <li><Check size={14}/> 12-month workmanship warranty</li>
              </ul>
            </div>
            <div>
              <h3><Sparkles size={16}/> Turnaround</h3>
              <ul>
                <li><Check size={14}/> Quote in 24h</li>
                <li><Check size={14}/> 3D concept in 2–3 days</li>
                <li><Check size={14}/> Fabrication 12–18 days</li>
                <li><Check size={14}/> Install in 1–2 days</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="work section" id="work">
        <div className="work-header">
          <div>
            <div className="section-tag"><span>03</span> Selected work</div>
            <h2>Spaces transformed<br /><em>with intention.</em></h2>
          </div>
          <p>Explore kitchens & custom cabinetry — no people in frame, just craftsmanship. Click to view hi-res.</p>
        </div>
        <div className="filter-bar" role="tablist" aria-label="Project filters">
          {filters.map(f => (
            <button key={f} role="tab" aria-selected={activeFilter===f} className={activeFilter===f ? 'filter-btn is-active' : 'filter-btn'} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="project-grid">
          {filtered.map(item => (
            <figure key={item.id} className={`project ${item.span}`} onClick={() => setLightbox(item)} role="button" tabIndex={0} aria-label={`View ${item.title}`} onKeyDown={e=> e.key==='Enter' && setLightbox(item)}>
              <img src={item.src} alt={item.title + ' — ' + item.desc} loading="lazy" />
              <figcaption><span>{item.title}</span><small>{item.desc}</small></figcaption>
              <span className="project-hover"><span>{item.cat}</span><small>View →</small></span>
            </figure>
          ))}
        </div>
        <div className="work-cta">
          <p>Have a space in mind?</p>
          <a className="button button-dark" href="#quote">Let’s talk about it <ArrowRight size={18} /></a>
        </div>
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
            <div className="lightbox-inner" onClick={e=>e.stopPropagation()}>
              <button className="lightbox-close" onClick={()=>setLightbox(null)} aria-label="Close"><X size={20}/></button>
              <img src={lightbox.src} alt={lightbox.title} />
              <div className="lightbox-meta"><strong>{lightbox.title}</strong><span>{lightbox.desc} · {lightbox.cat}</span></div>
            </div>
          </div>
        )}
      </section>

      <section className="process section" id="process">
        <div className="process-lead">
          <div className="section-tag light"><span>04</span> How it works</div>
          <h2>A clear process.<br /><em>No guesswork.</em></h2>
          <p>We keep every stage understandable, collaborative, and focused on a finish you’ll be proud to live with.</p>
        </div>
        <div className="process-steps">
          {process.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about section" id="about">
        <div className="about-image">
          <img src="/images/project-wardrobe.webp" alt="Collection of ELBI Modular cabinetry and workshop projects" loading="lazy" />
          <span>Designed around you</span>
        </div>
        <div className="about-copy">
          <div className="section-tag"><span>05</span> About ELBI</div>
          <p className="eyebrow dark"><span /> Craftsmanship meets function</p>
          <h2>We care about the details you see—and the ones you don’t.</h2>
          <p>
            From clean cabinet lines to doors that align properly, we approach every job with practical thinking and careful workmanship. The goal is simple: cabinetry that fits the room, supports your routine, and feels finished.
          </p>
          <ul>
            <li><Check size={17} /> Solutions planned for your actual space</li>
            <li><Check size={17} /> Material and finish guidance</li>
            <li><Check size={17} /> One team from planning through installation</li>
          </ul>
          <a className="text-link" href="#quote">Request a consultation <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="quote-section section" id="quote">
        <div className="quote-intro">
          <div className="section-tag light"><span>06</span> Start a project</div>
          <p className="eyebrow"><span /> Free initial inquiry</p>
          <h2>Let’s build a space that works <em>better for you.</em></h2>
          <p>Tell us a little about your project. We’ll review the details and get back to discuss the next step.</p>
          <div className="contact-notes">
            <div><Phone size={19} /><span><small>Prefer a call?</small>Leave your number in the form</span></div>
            <div><MapPin size={19} /><span><small>Project location</small>Include your city or area</span></div>
            <div><Mail size={19} /><span><small>Response</small>We’ll reply using your preferred contact</span></div>
          </div>
        </div>

        <div className="form-card">
          {formState === 'success' ? (
            <div className="success-message" role="status">
              <span><Check size={28} /></span>
              <p className="eyebrow dark">Inquiry received</p>
              <h3>Thank you. Your project is on our radar.</h3>
              <p>We’ll review your details and contact you to discuss the next step.</p>
              <button className="text-link" type="button" onClick={() => setFormState('idle')}>Send another inquiry <ArrowRight size={17} /></button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="honeypot"><label>Do not fill this out: <input name="bot-field" /></label></p>
              <div className="form-heading">
                <span>Project inquiry</span>
                <small>Fields marked * are required</small>
              </div>
              <div className="field-grid">
                <label>Full name *<input name="name" type="text" autoComplete="name" required placeholder="Your name" /></label>
                <label>Phone number *<input name="phone" type="tel" autoComplete="tel" required placeholder="Your contact number" /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>
                <label>Project type *
                  <select name="project-type" defaultValue="" required>
                    <option value="" disabled>Select one</option>
                    <option>Kitchen cabinets</option>
                    <option>Wardrobe or closet</option>
                    <option>Entertainment unit</option>
                    <option>Office or commercial cabinets</option>
                    <option>Installation only</option>
                    <option>Other custom cabinetry</option>
                  </select>
                </label>
                <label>Project location *<input name="location" type="text" required placeholder="City / area" /></label>
                <label>Estimated budget
                  <select name="budget" defaultValue="">
                    <option value="">Not sure yet</option>
                    <option>Under ₱100,000</option>
                    <option>₱100,000–₱250,000</option>
                    <option>₱250,000–₱500,000</option>
                    <option>₱500,000+</option>
                  </select>
                </label>
              </div>
              <label>Tell us about your project *<textarea name="message" rows={4} required placeholder="What would you like built? Include approximate size, preferred style, and target timing if known." /></label>
              <div className="captcha-wrap" aria-label="Spam verification">
                <div className="captcha-box">
                  <div className="captcha-head">
                    <ShieldCheck size={14} />
                    <span>Security check</span>
                    <small>Quick verification</small>
                  </div>
                  <div className="captcha-challenge">
                    <span className="captcha-question" aria-live="polite">
                      What is <strong>{captcha.a} + {captcha.b}</strong>?
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="?"
                      aria-label={`What is ${captcha.a} plus ${captcha.b}?`}
                      className="captcha-input"
                      required
                    />
                    <button type="button" onClick={refreshCaptcha} className="captcha-refresh" aria-label="Get new challenge">
                      ↻
                    </button>
                  </div>
                  {captchaError && <p className="form-error" role="alert">{captchaError}</p>}
                </div>
              </div>
              {formState === 'error' && <p className="form-error" role="alert">{formError || 'Something went wrong. Please check your connection and try again.'}</p>}
              <button className="submit-button" type="submit" disabled={formState === 'submitting'}>
                {formState === 'submitting' ? 'Sending inquiry…' : 'Send project inquiry'}
                <ArrowRight size={18} />
              </button>
              <p className="form-footnote">By submitting, you agree to be contacted about your project inquiry.</p>
            </form>
          )}
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <Brand />
          <p>Custom cabinetry.<br />Made with purpose.</p>
          <a className="button button-light" href="#quote">Get a free quote <ArrowRight size={18} /></a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ELBI Modular. All rights reserved.</span>
          <nav aria-label="Footer navigation">
            <a href="#services">Services</a>
            <a href="#work">Our work</a>
            <a href="#process">Process</a>
            <a href="#quote">Contact</a>
          </nav>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  )
}
