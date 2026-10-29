'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { inquirySchema, type InquiryInput } from '@te/validation';
import { cn } from '@te/ui';
import { api, ApiFailure } from '@/lib/api';
import { SITE } from '@/lib/site';
import { SectionHead } from '../ui';

const TYPES = [
  { k: 'consultation', l: 'Solar consultation' },
  { k: 'quotation', l: 'Product quotation' },
  { k: 'technical-meeting', l: 'Technical meeting' },
  { k: 'site-assessment', l: 'Project assessment' },
  { k: 'sales', l: 'Sales team' },
] as const;

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-[13px] font-semibold text-[#c2410c] dark:text-[#fdba74]">{msg}</p> : null;
}

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const [calcId, setCalcId] = useState<string | undefined>();
  const { register, handleSubmit, setValue, watch, reset, formState } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { type: 'consultation', name: '', company: '', email: '', phone: '', location: '', powerRequirement: '', message: '', website: '', consent: undefined as unknown as true },
  });
  const { errors, isSubmitting } = formState;
  const type = watch('type');

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Partial<InquiryInput> & { calculationId?: string };
      if (d.type) setValue('type', d.type);
      if (d.powerRequirement) setValue('powerRequirement', d.powerRequirement);
      if (d.location) setValue('location', d.location);
      setCalcId(d.calculationId);
    };
    window.addEventListener('te:prefill', on);
    return () => window.removeEventListener('te:prefill', on);
  }, [setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setServerMsg('');
    try {
      await api('/inquiries', { method: 'POST', body: JSON.stringify({ ...data, calculationId: calcId }) });
      setStatus('sent');
      reset();
    } catch (e) {
      setStatus('error');
      setServerMsg(
        e instanceof ApiFailure
          ? e.message
          : 'We could not reach our server. Please email or WhatsApp us directly using the details on the left.',
      );
    }
  });

  const wa = SITE.whatsapp && /^\d{10,15}$/.test(SITE.whatsapp) ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hello TechExpert Energy, I would like to discuss a solar project.')}` : null;

  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-nature-soft to-transparent dark:from-forest-deep/40" />
      <div className="shell relative grid gap-12 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <SectionHead
            eyebrow="Start your project"
            title="Talk to an engineer, not a call centre."
            lede="Tell us about the site and what you want to achieve. A solar engineer replies within one business day with next steps."
          />
          <ul className="-mt-4 grid gap-4">
            <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 text-nature" /><span><span className="muted block text-[13px]">Email</span><span className="select-all font-semibold">{SITE.contact.email}</span></span></li>
            <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 text-nature" /><span><span className="muted block text-[13px]">Phone</span><span className="select-all font-semibold">{SITE.contact.phone}</span></span></li>
            <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-nature" /><span><span className="muted block text-[13px]">Head office</span><span className="font-semibold">{SITE.contact.address}</span></span></li>
          </ul>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-[#073b1d] transition hover:-translate-y-0.5">
              <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
            </a>
          ) : (
            <p className="muted mt-8 flex items-center gap-2 text-sm"><MessageCircle className="h-4 w-4" /> WhatsApp chat appears once NEXT_PUBLIC_WHATSAPP_NUMBER is set.</p>
          )}
        </div>

        <form onSubmit={onSubmit} noValidate className="card grid gap-5 p-6 md:p-8" aria-label="Project inquiry form">
          <fieldset>
            <legend className="label">What do you need?</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <label key={t.k} className={cn('cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition', type === t.k ? 'border-forest bg-forest text-white dark:border-nature dark:bg-nature' : 'border-[var(--line)] hover:border-nature')}>
                  <input type="radio" value={t.k} {...register('type')} className="sr-only" />
                  {t.l}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-name" className="label">Full name *</label>
              <input id="f-name" autoComplete="name" className="field" {...register('name')} aria-invalid={!!errors.name} />
              <Err msg={errors.name?.message} />
            </div>
            <div>
              <label htmlFor="f-company" className="label">Company</label>
              <input id="f-company" autoComplete="organization" className="field" {...register('company')} />
            </div>
            <div>
              <label htmlFor="f-email" className="label">Email *</label>
              <input id="f-email" type="email" autoComplete="email" className="field" {...register('email')} aria-invalid={!!errors.email} />
              <Err msg={errors.email?.message} />
            </div>
            <div>
              <label htmlFor="f-phone" className="label">Phone *</label>
              <input id="f-phone" type="tel" autoComplete="tel" placeholder="+880 1…" className="field" {...register('phone')} aria-invalid={!!errors.phone} />
              <Err msg={errors.phone?.message} />
            </div>
            <div>
              <label htmlFor="f-location" className="label">Project location *</label>
              <input id="f-location" placeholder="e.g. Gazipur, Dhaka" className="field" {...register('location')} aria-invalid={!!errors.location} />
              <Err msg={errors.location?.message} />
            </div>
            <div>
              <label htmlFor="f-power" className="label">Estimated power requirement</label>
              <input id="f-power" placeholder="e.g. 250 kWp or 30,000 kWh/month" className="field" {...register('powerRequirement')} />
            </div>
          </div>
          <div>
            <label htmlFor="f-msg" className="label">Inquiry details</label>
            <textarea id="f-msg" rows={4} className="field" {...register('message')} placeholder="Roof type, operating hours, generator use, timeline…" />
          </div>
          {/* honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="f-website">Website</label>
            <input id="f-website" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>
          <label htmlFor="f-consent" className="flex items-start gap-3 text-[14px]">
            <input id="f-consent" type="checkbox" className="mt-1 h-4 w-4 accent-nature" {...register('consent')} />
            <span>I agree to be contacted by TechExpert Energy about this inquiry.</span>
          </label>
          <Err msg={errors.consent?.message} />
          {calcId && <p className="rounded-xl bg-nature-soft px-4 py-2 text-sm font-semibold text-forest dark:bg-white/5 dark:text-[#7fe0b2]">Your calculator estimate is attached to this request.</p>}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isSubmitting} className="inline-flex h-13 h-12 items-center rounded-full bg-forest px-7 font-bold text-white transition hover:bg-nature disabled:opacity-60">
              {isSubmitting ? 'Sending…' : 'Send inquiry'}
            </button>
            <p className="muted text-[13px]">Protected by rate limiting and server-side validation.</p>
          </div>
          {status === 'sent' && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-nature-soft px-4 py-3 font-semibold text-forest dark:bg-white/5 dark:text-[#7fe0b2]">
              <CheckCircle2 className="h-5 w-5" /> Inquiry received. An engineer will contact you within one business day.
            </p>
          )}
          {status === 'error' && <p role="alert" className="rounded-xl bg-sun-soft px-4 py-3 text-sm font-semibold text-[#8a4b00]">{serverMsg}</p>}
        </form>
      </div>
    </section>
  );
}
