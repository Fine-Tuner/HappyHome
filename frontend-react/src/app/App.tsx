import { RouterProvider } from "react-router-dom";
import AppContextProvider from "./AppContextProvider";
import { router } from "./Routes";

function App() {
  return (
    <AppContextProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <RouterProvider router={router} />
      </div>
    </AppContextProvider>
  );
}

export default App;
