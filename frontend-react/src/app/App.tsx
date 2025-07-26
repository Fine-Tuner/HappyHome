import { RouterProvider } from "react-router-dom";
import AppContextProvider from "./AppContextProvider";
import { router } from "./Routes";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AppContextProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </div>
    </AppContextProvider>
  );
}

export default App;
