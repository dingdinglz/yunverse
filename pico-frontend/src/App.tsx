import "./App.css";
import { PlayStateHud } from "./components/PlayStateHud";
import { ScoreHud } from "./components/ScoreHud";
import { usePlayState } from "./hooks/usePlayState";

function App() {
  const { state, scoreState, connection } = usePlayState();

  // 曲谱模式激活时显示 ScoreHud，否则显示自由演奏 HUD
  const showScore = scoreState?.active === true;

  return (
    <main className="scene-shell">
      {showScore ? (
        <ScoreHud score={scoreState} />
      ) : (
        <PlayStateHud state={state} connection={connection} />
      )}
    </main>
  );
}

export default App;
