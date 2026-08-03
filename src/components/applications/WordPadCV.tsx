import { useEffect, useMemo, useState } from 'react';
import cvDocument from 'virtual:cv-document';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
import { MenuBar } from '../common/MenuBar';

const formatFileSize = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function WordPadCV() {
  const [zoom, setZoom] = useState(90);
  const [loading, setLoading] = useState(Boolean(cvDocument));
  const { play } = useSystem();
  const pdfUrl = useMemo(
    () => cvDocument ? `${cvDocument.url}#toolbar=0&navpanes=0&view=FitH&zoom=${zoom}` : '',
    [zoom],
  );

  useEffect(() => {
    if (cvDocument) setLoading(true);
  }, [pdfUrl]);

  const download = () => {
    if (!cvDocument) return;
    const anchor = document.createElement('a');
    anchor.href = cvDocument.url;
    anchor.download = cvDocument.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const print = () => {
    if (!cvDocument) return;
    play('print');
    window.open(`${cvDocument.url}#toolbar=1`, '_blank', 'noopener,noreferrer');
  };

  const openPdf = () => {
    if (cvDocument) window.open(cvDocument.url, '_blank', 'noopener,noreferrer');
  };

  const fileMenu = {
    label: 'File',
    items: [
      { label: 'Open PDF in new window', disabled: !cvDocument, action: openPdf },
      { label: 'Save As...', disabled: !cvDocument, action: download },
      { label: 'Print...', disabled: !cvDocument, action: print },
    ],
  };

  return <div className="wordpad app-fill">
    <MenuBar menus={[fileMenu, { label: 'Edit' }, { label: 'View' }, { label: 'Help' }]} />
    <div className="wordpad-toolbar">
      <button onClick={download} disabled={!cvDocument} title="Save a copy"><IconGlyph name="save" size={21} /></button>
      <button data-xp-sound onClick={print} disabled={!cvDocument} title="Print PDF"><IconGlyph name="printer" size={21} /></button>
      <i />
      <button onClick={() => setZoom(value => Math.max(50, value - 10))} disabled={!cvDocument} title="Zoom out">-</button>
      <button onClick={() => setZoom(value => Math.min(160, value + 10))} disabled={!cvDocument} title="Zoom in">+</button>
      <span className="cv-document-name">{cvDocument?.fileName || 'No PDF found'}</span>
      <button onClick={download} disabled={!cvDocument} className="download-cv"><IconGlyph name="cv" size={18} /> Download CV</button>
    </div>
    <div className="ruler"><span /><span /><span /><span /><span /><span /><span /></div>
    <div className="document-workspace cv-document-workspace">
      {!cvDocument ? <div className="cv-missing">
        <IconGlyph name="error" size={48} />
        <div><h2>No CV found</h2><p>Add one PDF file to <code>public/documents</code>, then restart the site.</p></div>
      </div> : <>
        {loading && <div className="cv-loading"><div className="xp-spinner" />Opening {cvDocument.fileName}...</div>}
        <iframe
          className="cv-pdf-frame"
          key={pdfUrl}
          src={pdfUrl}
          title={`CV - ${cvDocument.fileName}`}
          onLoad={() => setLoading(false)}
        />
      </>}
    </div>
    <div className="wordpad-status">
      <span>{cvDocument ? cvDocument.fileName : 'No document'}</span>
      <span>{cvDocument ? `PDF Document - ${formatFileSize(cvDocument.size)}` : 'Add a PDF to the documents folder'}</span>
      <label>Zoom <input type="range" min="50" max="160" step="10" value={zoom} disabled={!cvDocument} onChange={event => setZoom(Number(event.target.value))} /> {zoom}%</label>
    </div>
  </div>;
}
