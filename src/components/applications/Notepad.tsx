import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { GitHubRepo } from '../../types';
import { getRepositoryReadme } from '../../services/github';
import { useSystem } from '../../context/SystemContext';
import { MenuBar } from '../common/MenuBar';
import { IconGlyph } from '../common/IconGlyph';

interface NotepadFile { name: string; url: string }

export function Notepad({ repo, file }: { repo?: GitHubRepo; file?: NotepadFile }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(Boolean(repo || file));
  const [error, setError] = useState('');
  const [rendered, setRendered] = useState(false);
  const [wrap, setWrap] = useState(true);
  const { play } = useSystem();
  const print = () => { play('print'); window.setTimeout(() => window.print(), 80); };
  useEffect(() => {
    let live = true;
    setContent('');
    setError('');
    if (file) {
      setLoading(true);
      void fetch(file.url)
        .then(response => {
          if (!response.ok) throw new Error(`Could not open ${file.name}.`);
          return response.text();
        })
        .then(value => live && setContent(value))
        .catch(reason => live && setError(reason instanceof Error ? reason.message : 'Could not read this file.'))
        .finally(() => live && setLoading(false));
    } else if (repo) {
      setLoading(true);
      void getRepositoryReadme(repo)
        .then(value => live && setContent(value))
        .catch(reason => live && setError(reason instanceof Error ? reason.message : 'Could not read this file.'))
        .finally(() => live && setLoading(false));
    } else {
      setLoading(false);
      setContent('Welcome to Alistair Portfolio XP!\n\nOpen My Projects to view a repository README.');
    }
    return () => { live = false; };
  }, [repo, file]);
  const menus = [
    { label: 'File', items: [{ label: 'New' }, { label: 'Open...', disabled: true }, { label: 'Save', disabled: true }, { separator: true, label: '' }, { label: 'Page Setup...', disabled: true }, { label: 'Print...', action: print }] },
    { label: 'Edit', items: [{ label: 'Undo', disabled: true }, { separator: true, label: '' }, { label: 'Select All', action: () => window.getSelection()?.selectAllChildren(document.querySelector('.notepad-document')!) }] },
    { label: 'Format', items: [{ label: 'Word Wrap', checked: wrap, action: () => setWrap(value => !value) }] },
    { label: 'View', items: [{ label: 'Render Markdown', checked: rendered, action: () => setRendered(value => !value) }] },
    { label: 'Help', items: [{ label: 'About Notepad' }] },
  ];
  return <div className="notepad app-fill">
    <MenuBar menus={menus} />
    <div className={`notepad-document ${rendered ? 'markdown' : 'plain'} ${wrap ? 'wrap' : ''}`}>
      {loading && <div className="loading-state"><div className="xp-spinner" />Opening {file?.name || 'README'}...</div>}
      {error && <div className="error-state"><IconGlyph name="error" size={38} /><div><b>Cannot open this file</b><p>{error}</p></div></div>}
      {!loading && !error && (rendered
        ? <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{content}</ReactMarkdown>
        : <pre>{content}</pre>)}
      {repo && !loading && <button className="click-me" onClick={() => window.open(repo.html_url, '_blank', 'noopener,noreferrer')}>CLICK ME</button>}
    </div>
    <div className="notepad-status"><span>Ln 1, Col 1</span><span>100%</span><span>Windows (CRLF)</span><span>UTF-8</span></div>
  </div>;
}
