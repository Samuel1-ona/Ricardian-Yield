import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/Home'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const PropertyPage = lazy(() => import('./pages/Property'));
const RentPage = lazy(() => import('./pages/Rent'));
const ExpensesPage = lazy(() => import('./pages/Expenses'));
const YieldPage = lazy(() => import('./pages/Yield'));
const StackingPage = lazy(() => import('./pages/Stacking'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const CapExPage = lazy(() => import('./pages/CapEx'));
const DAOPage = lazy(() => import('./pages/DAO'));

// Loading component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse text-center">
      <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
    </div>
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/property" element={<PropertyPage />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/yield" element={<YieldPage />} />
            <Route path="/stacking" element={<StackingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/capex" element={<CapExPage />} />
            <Route path="/dao" element={<DAOPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;

