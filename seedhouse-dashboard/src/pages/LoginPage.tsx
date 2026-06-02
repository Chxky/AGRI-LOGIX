import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Select } from 'antd';
import { MailOutlined, LockOutlined, ExperimentOutlined, GlobalOutlined } from '@ant-design/icons';
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
      message.success('Login successful');
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password',
      };
      message.error(errorMessages[error.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        background: '#0a1a10',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(82, 196, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
        }
        .zim-strip {
          height: 4px;
          width: 100%;
          background: linear-gradient(90deg, #007A3D 25%, #FFD200 25% 50%, #D21034 50% 75%, #000000 75%);
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1000;
        }
      `}</style>
      <div className="zim-strip" />

      {/* Left side: Image */}
      <div style={{
        flex: 1,
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 40,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(27, 94, 32, 0.5)' }} />
        <div style={{ zIndex: 1 }}>
          <Title level={1} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            AGRI-LOGIX
          </Title>
          <div style={{ color: '#81c784', fontSize: 14, letterSpacing: '3px', fontWeight: 500, marginTop: 8, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            SEEDTRACKER PLATFORM
          </div>
        </div>
        
        <div style={{ zIndex: 1, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Supply Chain Logistics</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>National Seed Distribution Network</div>
        </div>
      </div>

      {/* Right side: Login */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}>
        {/* Top banner */}
        <div style={{
          background: '#f5f5f5',
          padding: '16px 24px 12px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#666',
        }}>
          <span>Seed House Portal</span>
          <Select 
            defaultValue="en" 
            size="small" 
            bordered={false}
            style={{ width: 100 }}
            suffixIcon={<GlobalOutlined style={{ color: '#666' }} />}
            options={[
              { value: 'en', label: 'English' },
              { value: 'sn', label: 'Shona' },
              { value: 'nd', label: 'Ndebele' },
            ]}
          />
        </div>

        {/* Main login area */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}>
          <div style={{ width: '100%', animation: 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '2px solid #1B5E20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                background: 'rgba(27, 94, 32, 0.08)',
              }}>
                <img src="/zim_bird.svg" alt="Zimbabwe Bird" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              </div>
              <Title level={3} style={{ margin: 0, color: '#1B5E20' }}>
                Agri-Logix
              </Title>
              <Text type="secondary">Seed House Portal</Text>
              <Divider />
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
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email address"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{ height: 44, background: '#1B5E20', borderColor: '#1B5E20', fontWeight: 600 }}
                >
                  SIGN IN
                </Button>
              </Form.Item>
            </Form>

            {onDemoLogin && (
              <>
                <Divider plain>or</Divider>
                <Button
                  block
                  size="large"
                  icon={<ExperimentOutlined />}
                  onClick={onDemoLogin}
                  style={{ height: 44 }}
                >
                  Enter Demo Mode
                </Button>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f6ffed', padding: '4px 12px', borderRadius: 16, border: '1px solid #b7eb8f', marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', marginRight: 8, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#389e0d', fontWeight: 600 }}>Blockchain Network: Secure | 1.2M+ Hashes</span>
              </div>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Authorised seed house personnel only.
              </Text>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          background: '#f5f5f5',
          padding: '12px 24px',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          fontSize: 11,
          color: '#666',
        }}>
          &copy;{new Date().getFullYear()} Pardon Mahara. All rights reserved. | Contact: nextly@zohomail.com
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
