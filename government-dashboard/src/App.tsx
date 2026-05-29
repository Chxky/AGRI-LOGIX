import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import { isDemoMode } from './utils/demoMode';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import LoginPage from './pages/LoginPage';
import ExecutiveSummary from './pages/ExecutiveSummary';
import DashboardHome from './pages/DashboardHome';
import Reconciliation from './pages/Reconciliation';
import DistributionMap from './pages/DistributionMap';
import BagJourney from './pages/BagJourney';
import QualityAssurance from './pages/QualityAssurance';
import PaymentReports from './pages/PaymentReports';
import AlertsCenter from './pages/AlertsCenter';
import ProvinceBreakdown from './pages/ProvinceBreakdown';
import ChainAudit from './pages/ChainAudit';
import Analytics from './pages/Analytics';
import './App.css';

const { Content, Footer } = Layout;

const DEMO_USER = {
  uid: 'demo-gov-user',
  email: 'official@gov.zw',
  displayName: 'Government Official',
} as User;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDemoLogin = () => {
    sessionStorage.setItem('demoMode', 'true');
    setUser(DEMO_USER);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a1628' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onDemoLogin={handleDemoLogin} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Layout>
        <HeaderBar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            borderRadius: 4,
            marginLeft: collapsed ? 96 : 256,
            transition: 'margin-left 0.2s',
            minHeight: 'calc(100vh - 180px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<ExecutiveSummary />} />
              <Route path="/overview" element={<DashboardHome />} />
              <Route path="/provinces" element={<ProvinceBreakdown />} />
              <Route path="/alerts" element={<AlertsCenter />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/map" element={<DistributionMap />} />
              <Route path="/bag-journey" element={<BagJourney />} />
              <Route path="/quality-assurance" element={<QualityAssurance />} />
              <Route path="/payment-reports" element={<PaymentReports />} />
              <Route path="/chain-audit" element={<ChainAudit />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Content>
        <Footer className="gov-footer" style={{ marginLeft: collapsed ? 96 : 256, transition: 'margin-left 0.2s' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontWeight: 600, color: '#c49a2a', marginBottom: 4 }}>
              REPUBLIC OF ZIMBABWE
            </div>
            <div>Ministry of Lands, Agriculture, Fisheries, Water and Rural Development</div>
            <div style={{ marginTop: 4, color: '#667788' }}>
              Agri-Logix SeedTracker &copy;{new Date().getFullYear()} &mdash; Blockchain-Verified Seed Distribution Platform
            </div>
            <div style={{ marginTop: 4, color: '#667788', fontSize: 11 }}>
              Pfumvudza/Intwasa Input Subsidy Programme &mdash; Government of Zimbabwe
            </div>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
