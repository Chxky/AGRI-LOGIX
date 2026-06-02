import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Select } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined, ExperimentOutlined, PhoneOutlined, GlobalOutlined } from '@ant-design/icons';
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
        flexDirection: 'row',
        background: '#004d40',
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 77, 64, 0.4)' }} />
        <div style={{ zIndex: 1 }}>
          <Title level={1} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            AGRI-LOGIX
          </Title>
          <div style={{ color: '#c49a2a', fontSize: 14, letterSpacing: '3px', fontWeight: 500, marginTop: 8, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            FARMER PORTAL
          </div>
        </div>
        
        <div style={{ zIndex: 1, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Beneficiary Self-Service</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Track Your Seed Allocation &amp; Redemption</div>
        </div>
      </div>

      {/* Right side: Login */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #004d40 0%, #1a7a5c 100%)',
      }}>
        {/* Top banner */}
        <div style={{
          background: '#00332a',
          padding: '16px 24px 12px',
          borderBottom: '2px solid #c49a2a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#8899aa',
        }}>
          <span>Farmer Portal</span>
          <Select 
            defaultValue="en" 
            size="small" 
            bordered={false}
            style={{ width: 100 }}
            dropdownStyle={{ background: '#00332a' }}
            suffixIcon={<GlobalOutlined style={{ color: '#8899aa' }} />}
            options={[
              { value: 'en', label: <span style={{ color: '#fff' }}>English</span> },
              { value: 'sn', label: <span style={{ color: '#fff' }}>Shona</span> },
              { value: 'nd', label: <span style={{ color: '#fff' }}>Ndebele</span> },
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
          <div style={{ width: '100%' }}>
            {/* Seal */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '2px solid #c49a2a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              background: 'rgba(196, 154, 42, 0.08)',
            }}>
              <img src="/zim_bird.svg" alt="Zimbabwe Bird" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>

            <Card
              style={{
                width: '100%',
                borderRadius: 8,
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                border: '1px solid #1a7a5c',
                background: '#fff',
                animation: 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                opacity: 0,
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

                <Form.Item style={{ marginTop: 8 }}>
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

              <div style={{ textAlign: 'center', background: '#e6f4ff', padding: '12px', borderRadius: 8, border: '1px solid #91caff' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 4, color: '#0958d9', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', marginRight: 8, animation: 'pulse 2s infinite' }} />
                  <PhoneOutlined style={{ marginRight: 4 }} /> Offline USSD Access Active
                </div>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Don't have an account or internet? <br/> Dial <strong>*123#</strong> from any mobile phone.
                </Text>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          background: '#004d40',
          padding: '12px 24px',
          borderTop: '1px solid #1a7a5c',
          textAlign: 'center',
          fontSize: 11,
          color: '#445566',
        }}>
          &copy;{new Date().getFullYear()} Pardon Mahara. All rights reserved. | Contact: nextly@zohomail.com
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
