import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined, ExperimentOutlined, PhoneOutlined } from '@ant-design/icons';
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
      message.success('Login successful. Welcome to your portal.');
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid credentials provided',
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
        flexDirection: 'column',
        background: '#004d40',
      }}
    >
      <div style={{
        background: '#004d40',
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
          Agri-Logix SeedTracker &mdash; Farmer Portal
        </span>
        <span>Beneficiary Self-Service</span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #004d40 0%, #1a7a5c 100%)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
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
            <SafetyCertificateOutlined style={{ fontSize: 36, color: '#c49a2a' }} />
          </div>

          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '2px' }}>
            AGRI-LOGIX
          </Title>
          <div style={{ color: '#c49a2a', fontSize: 12, letterSpacing: '3px', fontWeight: 500, marginTop: 4 }}>
            FARMER PORTAL
          </div>
          <div style={{ color: '#667788', fontSize: 13, marginTop: 12 }}>
            Track Your Seed Allocation &amp; Redemption
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
              border: '1px solid #1a7a5c',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4} style={{ margin: 0, color: '#004d40' }}>
                Farmer Login
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Use your registered email and password
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
                  { required: true, message: 'Enter your registered email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Registered email address"
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
                    background: '#004d40',
                    borderColor: '#004d40',
                    fontWeight: 600,
                    letterSpacing: '1px',
                  }}
                >
                  SIGN IN
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
                  style={{ height: 44, borderColor: '#004d40', color: '#004d40' }}
                >
                  Enter Demo Mode
                </Button>
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Don't have an account? Contact your local Agritex extension officer
                or dial <strong>*123#</strong> from your mobile phone.
              </Text>
            </div>
          </Card>

          <div style={{ marginTop: 24, color: '#445566', fontSize: 11 }}>
            <div>Republic of Zimbabwe</div>
            <div style={{ marginTop: 2 }}>Blockchain-Verified Seed Distribution Platform</div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#004d40',
        padding: '8px 24px',
        borderTop: '1px solid #1a7a5c',
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
