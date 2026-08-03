import { type FormEvent, useState } from 'react';
import { profile } from '../../data/profile';
import { socialLinks } from '../../data/socialLinks';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

export function ContactApp() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const { notify, play } = useSystem();
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.message.trim()) {
      play('error'); notify('Contact Me', 'Please enter your name, a valid email address and a message.', 'error'); return;
    }
    if (!endpoint) { notify('Contact form setup', 'The form is ready. Add VITE_CONTACT_ENDPOINT to connect Formspree, Web3Forms or another provider.'); return; }
    setSending(true);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error();
      setForm({ name: '', email: '', subject: '', message: '' }); notify('Message sent', 'Thanks! Your message was sent successfully.');
    } catch { notify('Send failed', 'The message could not be sent. Please use one of the direct contact links.', 'error'); }
    finally { setSending(false); }
  };
  return <div className="contact-app app-fill">
    <aside><div className="contact-envelope"><IconGlyph name="contact" size={68} /></div><h2>Contact Alistair</h2><p>Questions, opportunities and interesting ideas are always welcome.</p>
      <button onClick={() => void navigator.clipboard.writeText(profile.email)}>📋 Copy email address</button>
      {socialLinks.map(link => <a href={link.url} target="_blank" rel="noreferrer" key={link.label}>{link.label} <span>↗</span></a>)}
    </aside>
    <form onSubmit={submit}><fieldset><legend>Send a message</legend>
      <label>Name:<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label>Email:<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      <label>Subject:<input value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} /></label>
      <label>Message:<textarea value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} /></label>
      <div className="dialog-buttons"><button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button><button type="reset" onClick={() => setForm({ name: '', email: '', subject: '', message: '' })}>Clear</button></div>
    </fieldset><small>Form provider: {endpoint ? 'Connected' : 'Not configured — see README.md'}</small></form>
  </div>;
}
