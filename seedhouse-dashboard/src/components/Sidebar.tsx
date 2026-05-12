import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  QrcodeOutlined,
  SendOutlined,
  SearchOutlined,
  HistoryOutlined,
  LogoutOutlined,
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
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/generate-qr', icon: <QrcodeOutlined />, label: 'Generate QR Codes' },
    { key: '/dispatch', icon: <SendOutlined />, label: 'Dispatch Bags' },
    { key: '/bag-lookup', icon: <SearchOutlined />, label: 'Bag Lookup' },
    { key: '/batch-history', icon: <HistoryOutlined />, label: 'Batch History' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {collapsed ? '🌱' : 'Agri-Logix'}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ marginTop: 8 }}
      />

      <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={[{
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
          }]}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
