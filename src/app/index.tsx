import { TimerPage } from "../pages/TimerPage/TimerPage";
import { withProviders } from "./providers";
import "../features/mainThread";
import "../features/ding";
import "./styles/index.css";

function App() {
  return (
    <div className="App">
      <TimerPage />
    </div>
  );
}

export default withProviders(App);
