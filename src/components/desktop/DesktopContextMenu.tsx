import { IconGlyph } from '../common/IconGlyph';

export function DesktopContextMenu({ x, y, onRefresh, onProperties, onClose }: {
  x: number; y: number; onRefresh: () => void; onProperties: () => void; onClose: () => void;
}) {
  return <div className="desktop-context drop-menu" style={{ left: Math.min(x, innerWidth - 190), top: Math.min(y, innerHeight - 190) }} onPointerDown={event => event.stopPropagation()}>
    <button onClick={onClose}><IconGlyph name="properties" size={18} />Arrange Icons <em>›</em></button>
    <button onClick={onRefresh}><span />Refresh</button>
    <div className="menu-separator" />
    <button onClick={onClose}><IconGlyph name="new-folder" size={18} />New <em>›</em></button>
    <div className="menu-separator" />
    <button onClick={onProperties}><IconGlyph name="properties" size={18} />Properties</button>
  </div>;
}
