import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { AuthGuard, OnboardingGuard } from '@/components/RouteGuards';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPages';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CollaborationsPage } from '@/pages/CollaborationsPage';
import { NewCollaborationPage } from '@/pages/NewCollaborationPage';
import { CollaborationDetailPage } from '@/pages/CollaborationDetailPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { PaidDealsPage } from '@/pages/PaidDealsPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { NewInvoicePage } from '@/pages/NewInvoicePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<AuthPage mode="login"/>}/>
        <Route path="/register" element={<AuthPage mode="register"/>}/>
        <Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/>
        <Route element={<AuthGuard/>}>
          <Route element={<OnboardingGuard/>}>
            <Route path="/onboarding" element={<OnboardingPage/>}/>
            <Route path="/app" element={<AppShell/>}>
              <Route index element={<DashboardPage/>}/>
              <Route path="collaborations" element={<CollaborationsPage/>}/>
              <Route path="collaborations/new" element={<NewCollaborationPage/>}/>
              <Route path="collaborations/:id" element={<CollaborationDetailPage/>}/>
              <Route path="payments" element={<PaymentsPage/>}/>
              <Route path="paid-deals" element={<PaidDealsPage/>}/>
              <Route path="invoices" element={<InvoicesPage/>}/>
              <Route path="invoices/new" element={<NewInvoicePage/>}/>
              <Route path="settings" element={<SettingsPage/>}/>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}
