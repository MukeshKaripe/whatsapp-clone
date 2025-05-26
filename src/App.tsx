import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-center" />
        <AppRoutes />
        {/* <ThemeShowcase /> */}
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;