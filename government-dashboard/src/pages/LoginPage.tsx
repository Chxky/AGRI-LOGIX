import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('Welcome to the Government Dashboard');
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password',
      };
      message.error(errorMessages[error.code] || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #1565C0 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 420,
          maxWidth: '100%',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#1565C0', marginBottom: 8 }} />
          <Title level={3} style={{ margin: 0, color: '#0d1b2a' }}>
            Agri-Logix
          </Title>
          <Text type="secondary">Government Reconciliation Dashboard</Text>
          <Divider />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Pfumvudza Input Distribution — Ministry of Agriculture
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Enter your email' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Government email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ height: 48 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Authorised government personnel only. All access is audited.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
