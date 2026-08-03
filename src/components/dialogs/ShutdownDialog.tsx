import { useSystem } from '../../context/SystemContext';
import { IconGlyph } from '../common/IconGlyph';
export function ShutdownDialog({ close }: { close: () => void }) {
  const { restart, shutDown, play } = useSystem();
  return <div className="shutdown-dialog app-fill"><header><span>Windows</span><b>xp</b></header><p>What do you want the computer to do?</p><div className="power-choices"><button data-xp-sound onClick={() => { play('minimize'); close(); }}><span className="standby"><IconGlyph name="standby" size={43} /></span><b>Stand By</b></button><button data-xp-sound onClick={shutDown}><span className="turnoff"><IconGlyph name="power" size={43} /></span><b>Turn Off</b></button><button data-xp-sound onClick={restart}><span className="restart"><IconGlyph name="restart" size={43} /></span><b>Restart</b></button></div><footer><button onClick={close}>Cancel</button></footer></div>;
}
