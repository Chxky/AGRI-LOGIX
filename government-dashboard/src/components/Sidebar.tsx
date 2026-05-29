import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ReconciliationOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  LogoutOutlined,
  BankOutlined,
  AlertOutlined,
  HeatMapOutlined,
  FundOutlined,
  AuditOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <FundOutlined />, label: 'Executive Summary' },
    { key: '/overview', icon: <DashboardOutlined />, label: 'National Overview' },
    { key: '/provinces', icon: <HeatMapOutlined />, label: 'Province Breakdown' },
    { key: '/alerts', icon: <AlertOutlined />, label: 'Alerts Centre' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
    { type: 'divider' as const },
    { key: '/reconciliation', icon: <ReconciliationOutlined />, label: 'Reconciliation' },
    { key: '/map', icon: <EnvironmentOutlined />, label: 'Distribution Map' },
    { key: '/bag-journey', icon: <SearchOutlined />, label: 'Bag Journey' },
    { key: '/quality-assurance', icon: <SafetyCertificateOutlined />, label: 'Quality Assurance' },
    { key: '/payment-reports', icon: <DollarOutlined />, label: 'Payment Reports' },
    { type: 'divider' as const },
    { key: '/chain-audit', icon: <AuditOutlined />, label: 'Blockchain Audit' },
  ];

  const handleLogout = async () => {
    sessionStorage.removeItem('demoMode');
    await signOut(auth).catch(() => {});
    navigate('/');
    window.location.reload();
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#0a1628',
      }}
    >
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 80,
        }}
      >
        <div style={{
          width: collapsed ? 36 : 44,
          height: collapsed ? 36 : 44,
          borderRadius: '50%',
          border: '2px solid #c49a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'rgba(196, 154, 42, 0.1)',
        }}>
          <BankOutlined style={{ color: '#c49a2a', fontSize: collapsed ? 18 : 22 }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.5px' }}>
              AGRI-LOGIX
            </div>
            <div style={{ color: '#c49a2a', fontSize: 10, fontWeight: 500, letterSpacing: '1px', marginTop: 2 }}>
              GOVERNMENT PORTAL
            </div>
            <div style={{ color: '#667788', fontSize: 9, marginTop: 2 }}>
              Ministry of Agriculture
            </div>
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ marginTop: 8, background: 'transparent', borderRight: 'none' }}
      />

      <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div style={{ padding: '8px 20px', color: '#667788', fontSize: 10, textAlign: 'center' }}>
            <div>Republic of Zimbabwe</div>
            <div>Secure Government System</div>
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={[{
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Sign Out',
            onClick: handleLogout,
          }]}
          style={{ background: 'transparent', borderRight: 'none' }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
