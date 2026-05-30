import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Overview' },
    { key: '/my-bags', icon: <InboxOutlined />, label: 'My Seed Bags' },
    { key: '/profile', icon: <UserOutlined />, label: 'My Profile' },
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
        background: '#004d40',
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
          <SafetyCertificateOutlined style={{ color: '#c49a2a', fontSize: collapsed ? 18 : 22 }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.5px' }}>
              AGRI-LOGIX
            </div>
            <div style={{ color: '#c49a2a', fontSize: 10, fontWeight: 500, letterSpacing: '1px', marginTop: 2 }}>
              FARMER PORTAL
            </div>
            <div style={{ color: '#8899aa', fontSize: 9, marginTop: 2 }}>
              Pfumvudza Beneficiary
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
            <div>Beneficiary Self-Service</div>
            <div>Powered by Agri-Logix</div>
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
