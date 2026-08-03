import type { IconName } from '../../types';
import { IconGlyph } from '../common/IconGlyph';

export function DesktopIcon({ id, name, icon, selected, onSelect, onOpen }: {
  id: string; name: string; icon: IconName; selected: boolean;
  onSelect: (id: string) => void; onOpen: () => void;
}) {
  return <button
    className={`desktop-icon ${selected ? 'selected' : ''}`}
    onClick={event => { event.stopPropagation(); onSelect(id); }}
    onDoubleClick={event => { event.stopPropagation(); onOpen(); }}
    onKeyDown={event => { if (event.key === 'Enter') onOpen(); }}
    aria-label={`${name}, desktop icon`}
  >
    <IconGlyph name={icon} size={42} />
    <span>{name}</span>
  </button>;
}
