import ThemeToggle from "../components/ThemeToggle";
import AppRoutes from "./Routes";
import Provider from "./Provider";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <AppRoutes />
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
