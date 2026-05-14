import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/DashboardHome';
import GenerateQR from './pages/GenerateQR';
import DispatchBags from './pages/DispatchBags';
import BagLookup from './pages/BagLookup';
import BatchHistory from './pages/BatchHistory';
import './App.css';

const { Content, Footer } = Layout;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
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
            borderRadius: 8,
            marginLeft: collapsed ? 96 : 256,
            transition: 'margin-left 0.2s',
            minHeight: 'calc(100vh - 180px)'
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/generate-qr" element={<GenerateQR />} />
            <Route path="/dispatch" element={<DispatchBags />} />
            <Route path="/bag-lookup" element={<BagLookup />} />
            <Route path="/batch-history" element={<BatchHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center', marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s', background: 'transparent' }}>
          Agri-Logix ©{new Date().getFullYear()} — Secure Seed Distribution Network
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
