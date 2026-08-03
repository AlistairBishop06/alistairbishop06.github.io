import { useEffect, useState } from 'react';

export interface MenuItem { label: string; action?: () => void; checked?: boolean; disabled?: boolean; separator?: boolean }

export function MenuBar({ menus }: { menus: Array<{ label: string; items?: MenuItem[] }> }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <nav className="menu-bar" aria-label="Application menu">
    {menus.map((menu, index) => <div className="menu-wrap" key={menu.label}>
      <button className="menu-label" onClick={() => setOpen(open === index ? null : index)}>{menu.label}</button>
      {open === index && menu.items && <div className="drop-menu" role="menu">
        {menu.items.map((item, itemIndex) => item.separator
          ? <div className="menu-separator" key={itemIndex} />
          : <button key={item.label} role="menuitem" disabled={item.disabled} onClick={() => { item.action?.(); setOpen(null); }}>
              <span>{item.checked ? '✓' : ''}</span>{item.label}
            </button>)}
      </div>}
    </div>)}
  </nav>;
}
