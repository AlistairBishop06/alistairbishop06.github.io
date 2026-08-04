import { useState } from 'react';
import { IconGlyph } from '../common/IconGlyph';
import { MenuBar } from '../common/MenuBar';
import { useSystem } from '../../context/SystemContext';

const initial = ['unfinished-project-final-final-v2.zip', 'definitely-not-a-bug.txt', 'old-portfolio.html', 'sleep-schedule.exe', 'unused-css.css'];
export function RecycleBin() {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const { notify, play, unlockAchievement } = useSystem();
  const empty = () => { if (!items.length) return; setItems([]); setSelected([]); unlockAchievement('recycle_empty'); play('empty'); notify('Recycle Bin', 'The Recycle Bin is now empty. Your sleep schedule was not recoverable.', 'info', false); };
  const restore = () => { setItems(current => current.filter(item => !selected.includes(item))); setSelected([]); play('maximize'); notify('Restore complete', 'Selected files were restored to a highly organised imaginary folder.', 'info', false); };
  const removeSelected = () => { setItems(current => current.filter(item => !selected.includes(item))); setSelected([]); play('empty'); notify('Delete Files', 'The selected items were permanently deleted. Probably.', 'info', false); };
  return <div className="recycle-app app-fill"><MenuBar menus={[{ label: 'File', items: [{ label: 'Restore', disabled: !selected.length, action: restore }, { label: 'Delete permanently', disabled: !selected.length, action: removeSelected }, { label: 'Empty Recycle Bin', disabled: !items.length, action: empty }] }, { label: 'Edit' }, { label: 'View' }, { label: 'Help' }]} />
    <div className="explorer-toolbar"><button onClick={restore} disabled={!selected.length}><IconGlyph name="restore" size={23} /><span>Restore</span></button><button onClick={removeSelected} disabled={!selected.length}><IconGlyph name="delete" size={23} /><span>Delete</span></button><button onClick={empty} disabled={!items.length}><IconGlyph name="recycle" size={23} /> <span>Empty Recycle Bin</span></button></div>
    <div className="recycle-body"><aside><h3>Recycle Bin Tasks</h3><button onClick={empty}>Empty the Recycle Bin</button><button onClick={restore}>Restore the selected items</button></aside><div className="recycle-list"><div className="details-header"><span>Name</span><span>Original Location</span><span>Date Deleted</span></div>
      {items.map(item => <button key={item} className={selected.includes(item) ? 'selected' : ''} onClick={() => setSelected(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])}><IconGlyph name={item.endsWith('.exe') ? 'app' : 'document'} size={23} /><span>{item}</span><span>C:\\Users\\Alistair\\Desktop</span><span>Yesterday</span></button>)}
      {!items.length && <div className="empty-bin"><IconGlyph name="recycle-empty" size={64} /><p>The Recycle Bin is empty.</p></div>}
    </div></div><div className="status-bar"><span>{items.length} object(s)</span><span>{selected.length} selected</span></div>
  </div>;
}
