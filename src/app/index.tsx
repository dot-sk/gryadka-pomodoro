import { TimerPage } from "../pages/TimerPage/TimerPage";
import { withProviders } from "./providers";
import "./styles/index.css";

function App() {
  return (
    <div className="App">
      <TimerPage />
    </div>
  );
}

export default withProviders(App);
