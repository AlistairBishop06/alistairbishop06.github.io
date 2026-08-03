import { IconGlyph } from '../common/IconGlyph';
export function MessageBox({ title, message, type = 'info', close }: { title?: string; message?: string; type?: 'info' | 'error'; close: () => void }) {
  return <div className="message-box app-fill"><div><IconGlyph name={type} size={48} /><p><b>{title}</b>{message}</p></div><footer><button autoFocus onClick={close}>OK</button></footer></div>;
}
