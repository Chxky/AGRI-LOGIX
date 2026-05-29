import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, BankOutlined, SafetyCertificateOutlined, ExperimentOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const { Title, Text } = Typography;

interface LoginPageProps {
  onDemoLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('Authentication successful. Welcome.');
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid credentials provided',
      };
      message.error(errorMessages[error.code] || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a1628',
      }}
    >
      {/* Top government banner */}
      <div style={{
        background: '#0d1f35',
        padding: '8px 24px',
        borderBottom: '2px solid #c49a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#8899aa',
      }}>
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 8, color: '#c49a2a' }} />
          Government of Zimbabwe &mdash; Official System
        </span>
        <span>Secure Access Portal</span>
      </div>

      {/* Main login area */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #0a1628 0%, #12243d 100%)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          {/* Government seal */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '3px solid #c49a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            background: 'rgba(196, 154, 42, 0.08)',
          }}>
            <BankOutlined style={{ fontSize: 36, color: '#c49a2a' }} />
          </div>

          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '2px' }}>
            AGRI-LOGIX
          </Title>
          <div style={{ color: '#c49a2a', fontSize: 12, letterSpacing: '3px', fontWeight: 500, marginTop: 4 }}>
            SEEDTRACKER PLATFORM
          </div>
          <div style={{ color: '#667788', fontSize: 13, marginTop: 12 }}>
            Ministry of Lands, Agriculture, Fisheries, Water and Rural Development
          </div>
          <div style={{ color: '#8899aa', fontSize: 12, marginTop: 4 }}>
            Pfumvudza/Intwasa Input Subsidy Programme
          </div>

          <Card
            style={{
              width: 400,
              maxWidth: '100%',
              marginTop: 32,
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              border: '1px solid #1a3a5c',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4} style={{ margin: 0, color: '#0a1628' }}>
                Government Access
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Authorised personnel only
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
                  { required: true, message: 'Enter your government email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Official email address"
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
                  style={{
                    height: 44,
                    background: '#1a3a5c',
                    borderColor: '#1a3a5c',
                    fontWeight: 600,
                    letterSpacing: '1px',
                  }}
                >
                  AUTHENTICATE
                </Button>
              </Form.Item>
            </Form>

            {onDemoLogin && (
              <>
                <Divider plain style={{ margin: '16px 0' }}>or</Divider>
                <Button
                  block
                  size="large"
                  icon={<ExperimentOutlined />}
                  onClick={onDemoLogin}
                  style={{ height: 44, borderColor: '#1a3a5c', color: '#1a3a5c' }}
                >
                  Enter Demo Mode
                </Button>
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                All access is logged and audited. Unauthorised access is a criminal offence
                under the Data Protection Act [Chapter 11:22].
              </Text>
            </div>
          </Card>

          <div style={{ marginTop: 24, color: '#445566', fontSize: 11 }}>
            <div>Republic of Zimbabwe</div>
            <div style={{ marginTop: 2 }}>Blockchain-Verified Seed Distribution Platform</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: '#0d1f35',
        padding: '8px 24px',
        borderTop: '1px solid #1a3a5c',
        textAlign: 'center',
        fontSize: 11,
        color: '#445566',
      }}>
        Agri-Logix SeedTracker &copy;{new Date().getFullYear()} &mdash; Government of Zimbabwe
      </div>
    </div>
  );
};

export default LoginPage;
