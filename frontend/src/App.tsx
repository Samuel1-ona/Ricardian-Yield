import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import HomePage from './pages/Home';
import DashboardPage from './pages/Dashboard';
import PropertyPage from './pages/Property';
import RentPage from './pages/Rent';
import ExpensesPage from './pages/Expenses';
import YieldPage from './pages/Yield';
import StackingPage from './pages/Stacking';
import AnalyticsPage from './pages/Analytics';
import CapExPage from './pages/CapEx';
import DAOPage from './pages/DAO';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
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
      </main>
      <Footer />
    </div>
  );
}

export default App;

