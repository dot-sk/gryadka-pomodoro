import { useUnit } from "effector-react";
import { TimerPage } from "../pages/TimerPage/TimerPage";
import { StatsPage } from "../pages/StatsPage/StatsPage";
import { $currentScreen, AppScreen } from "./model";
import { withProviders } from "./providers";
import "../features/mainThread";
import "../features/ding";
import "./styles/index.css";

function App() {
  const { currentScreen } = useUnit({
    currentScreen: $currentScreen,
  });

  return (
    <div className="App">
      {currentScreen === AppScreen.TIMER ? <TimerPage /> : <StatsPage />}
    </div>
  );
}

export default withProviders(App);
