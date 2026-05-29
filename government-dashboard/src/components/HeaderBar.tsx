import React from 'react';
import { Layout, Button, Typography, Space, Tag } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { User } from 'firebase/auth';
import dayjs from 'dayjs';

const { Header } = Layout;
const { Text } = Typography;

interface HeaderBarProps {
  user: User;
  collapsed: boolean;
  onToggle: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ user, collapsed, onToggle }) => {
  return (
    <>
      {/* Government banner */}
      <div className="gov-banner" style={{ marginLeft: collapsed ? 96 : 256, transition: 'margin-left 0.2s' }}>
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Republic of Zimbabwe &mdash; Government of Zimbabwe Official System
        </span>
        <span>
          {dayjs().format('dddd, DD MMMM YYYY')}
        </span>
      </div>
      {/* Main header */}
      <Header
        className="gov-header"
        style={{
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          marginLeft: collapsed ? 96 : 256,
          transition: 'margin-left 0.2s',
          height: 48,
          lineHeight: '48px',
        }}
      >
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 16, width: 48, height: 48, color: '#fff' }}
        />

        <Space size={12}>
          <Tag color="#c49a2a" style={{ borderColor: '#c49a2a' }}>
            {dayjs().format('DD MMM YYYY')}
          </Tag>
          <UserOutlined style={{ color: '#8899aa' }} />
          <Text style={{ color: '#ccc', fontSize: 13 }}>{user.email || 'Government Official'}</Text>
          <Tag color="#1a3a5c" style={{ borderColor: '#2a5a8c', color: '#c49a2a', fontWeight: 600 }}>
            AUTHORISED
          </Tag>
        </Space>
      </Header>
    </>
  );
};

export default HeaderBar;
