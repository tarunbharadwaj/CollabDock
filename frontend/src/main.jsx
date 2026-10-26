import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { applyTheme, getSavedTheme, ThemeProvider, useTheme } from '@/context/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } } });

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-right" richColors closeButton/>;
}

applyTheme(getSavedTheme());
createRoot(document.getElementById('root')).render(<StrictMode><ThemeProvider><QueryClientProvider client={queryClient}><AuthProvider><App/><AppToaster/></AuthProvider></QueryClientProvider></ThemeProvider></StrictMode>);
