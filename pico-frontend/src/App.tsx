import "./App.css";
import { PlayStateHud } from "./components/PlayStateHud";
import { usePlayState } from "./hooks/usePlayState";

function App() {
  const { state, connection } = usePlayState();

  return (
    <main className="scene-shell">
      <PlayStateHud state={state} connection={connection} />
    </main>
  );
}

export default App;
