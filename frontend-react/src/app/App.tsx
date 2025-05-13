import { RouterProvider } from "react-router-dom";
import AppContextProvider from "./Provider";
import ThemeToggle from "../features/theme/components/ThemeToggle";
import { router } from "./Routes";

function App() {
  return (
    <AppContextProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <RouterProvider router={router} />
      </div>
    </AppContextProvider>
  );
}

export default App;
