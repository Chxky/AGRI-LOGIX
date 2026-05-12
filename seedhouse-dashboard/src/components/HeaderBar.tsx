import React from 'react';
import { Layout, Button, Typography, Space, Tag } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { User } from 'firebase/auth';

const { Header } = Layout;
const { Text } = Typography;

interface HeaderBarProps {
  user: User;
  collapsed: boolean;
  onToggle: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ user, collapsed, onToggle }) => {
  return (
    <Header
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        marginLeft: collapsed ? 80 : 240,
        transition: 'margin-left 0.2s',
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 16, width: 48, height: 48 }}
      />

      <Space>
        <UserOutlined />
        <Text strong>{user.email || 'Seed House Staff'}</Text>
        <Tag color="green">Seed House</Tag>
      </Space>
    </Header>
  );
};

export default HeaderBar;
