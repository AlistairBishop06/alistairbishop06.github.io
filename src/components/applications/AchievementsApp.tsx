import { useMemo, useState } from 'react';
import { achievements, type AchievementCategory } from '../../data/achievements';
import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';

type Filter = 'All' | AchievementCategory;

export function AchievementsApp() {
  const [filter, setFilter] = useState<Filter>('All');
  const { achievementProgress, open } = useSystem();
  const unlocked = achievements.filter(item => achievementProgress[item.id]).length;
  const percent = Math.round(unlocked / achievements.length * 100);
  const visible = useMemo(() => achievements.filter(item => filter === 'All' || item.category === filter), [filter]);

  return <div className="achievements-app app-fill">
    <header className="achievement-summary">
      <div className="achievement-medal"><IconGlyph name="favorites" size={48} /></div>
      <div><h1>Portfolio Achievements</h1><p>A guided tour of Alistair’s work, plus Portfolio XP’s hidden secrets.</p>
        <div className="achievement-progress" aria-label={`${percent}% complete`}><i style={{ width: `${percent}%` }} /></div>
        <strong>{unlocked} of {achievements.length} unlocked · {percent}% complete</strong>
      </div>
    </header>
    <div className="achievement-filters" role="tablist">
      {(['All', 'Portfolio Tour', 'Hidden Secrets'] as const).map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    <div className="achievement-list">
      {visible.map(item => {
        const unlockedAt = achievementProgress[item.id];
        const action = 'action' in item ? item.action : undefined;
        return <article key={item.id} className={unlockedAt ? 'unlocked' : 'locked'}>
          <div className="achievement-icon"><IconGlyph name={unlockedAt ? item.icon : 'favorites'} size={35} /><span>{unlockedAt ? '✓' : '?'}</span></div>
          <div className="achievement-copy"><div><h2>{item.title}</h2><small>{item.category}</small></div>
            <p>{unlockedAt ? item.description : item.hint}</p>
            {unlockedAt && <time dateTime={unlockedAt}>Unlocked {new Date(unlockedAt).toLocaleDateString()}</time>}
          </div>
          {action && <button onClick={() => open(action.kind)}>{unlockedAt ? 'Open again' : action.label}</button>}
        </article>;
      })}
    </div>
    <footer><IconGlyph name="info" size={18} /> Progress is saved only in this browser. Secret descriptions are revealed when unlocked.</footer>
  </div>;
}
