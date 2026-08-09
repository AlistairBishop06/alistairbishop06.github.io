import type { IconName } from '../../types';
import { IconGlyph } from '../common/IconGlyph';

export function DesktopIcon({ id, name, icon, selected, onSelect, onOpen, dropTarget }: {
  id: string; name: string; icon: IconName; selected: boolean;
  onSelect: (id: string) => void; onOpen: () => void; dropTarget?: boolean;
}) {
  return <button
    className={`desktop-icon ${selected ? 'selected' : ''}`}
    onClick={event => { event.stopPropagation(); onSelect(id); }}
    onDoubleClick={event => { event.stopPropagation(); onOpen(); }}
    onKeyDown={event => { if (event.key === 'Enter') onOpen(); }}
    data-recycle-bin-drop={dropTarget ? 'icon' : undefined}
    aria-label={`${name}, desktop icon`}
  >
    <IconGlyph name={icon} size={42} />
    <span>{name}</span>
  </button>;
}
