import { useSystem } from '../../context/SystemContext';
export function ShutdownDialog({ close }: { close: () => void }) {
  const { restart, shutDown, play } = useSystem();
  return <div className="shutdown-dialog app-fill"><header><span>Windows</span><b>xp</b></header><p>What do you want the computer to do?</p><div className="power-choices"><button onClick={() => { play('window'); close(); }}><span className="standby">☾</span><b>Stand By</b></button><button onClick={shutDown}><span className="turnoff">⏻</span><b>Turn Off</b></button><button onClick={restart}><span className="restart">↻</span><b>Restart</b></button></div><footer><button onClick={close}>Cancel</button></footer></div>;
}
