import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </DataProvider>
    </LanguageProvider>
  );
}
