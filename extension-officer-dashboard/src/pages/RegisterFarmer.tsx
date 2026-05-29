import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Typography, message, Alert, Descriptions, Divider, Row, Col } from 'antd';
import { UserAddOutlined, PhoneOutlined, UserOutlined, LockOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';

const { Title, Text } = Typography;

interface RegisteredFarmer {
  id: string;
  phone: string;
  fullName: string;
  ward: string;
}

const WARDS = [
  'Ward 1 - Chikomba', 'Ward 2 - Makonde', 'Ward 3 - Goromonzi',
  'Ward 4 - Murehwa', 'Ward 5 - Mutoko', 'Ward 6 - Uzumba',
  'Ward 7 - Hwedza', 'Ward 8 - Marondera', 'Ward 9 - Seke',
  'Ward 10 - Mhondoro',
];

const RegisterFarmer: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<RegisteredFarmer | null>(null);

  const handleSubmit = async (values: { phone: string; fullName: string; ward: string; pin: string }) => {
    setLoading(true);
    setRegistered(null);
    try {
      const registerFn = httpsCallable(functions, 'registerFarmer');
      const result = await registerFn(values);
      const data = result.data as RegisteredFarmer;
      setRegistered(data);
      message.success(`Farmer ${values.fullName} registered successfully!`);
      form.resetFields();
    } catch (error: any) {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 1200));
        const mockId = `FARM-${Date.now().toString(36).toUpperCase()}`;
        setRegistered({ id: mockId, phone: values.phone, fullName: values.fullName, ward: values.ward });
        message.success(`Farmer ${values.fullName} registered successfully!`);
        form.resetFields();
        return;
      }
      const msg = error?.details?.message || error.message || 'Registration failed';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <UserAddOutlined /> Register New Farmer
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Add a new farmer to the programme for your assigned ward
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Farmer Registration Form">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              requiredMark={false}
            >
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Phone number is required' },
                  { pattern: /^(\+263|0)[0-9]{9}$/, message: 'Enter a valid Zimbabwe phone number (+263... or 0...)' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="+263 77 123 4567"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[
                  { required: true, message: 'Full name is required' },
                  { min: 3, message: 'Name must be at least 3 characters' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Farmer's full name"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="ward"
                label="Ward"
                rules={[{ required: true, message: 'Select a ward' }]}
              >
                <Select
                  prefix={<EnvironmentOutlined />}
                  placeholder="Select ward"
                  size="large"
                  options={WARDS.map(w => ({ label: w, value: w }))}
                />
              </Form.Item>

              <Form.Item
                name="pin"
                label="4-Digit PIN"
                rules={[
                  { required: true, message: 'PIN is required' },
                  { pattern: /^\d{4}$/, message: 'PIN must be exactly 4 digits' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
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
                  icon={<UserAddOutlined />}
                  style={{ height: 44, fontWeight: 600 }}
                >
                  Register Farmer
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          {registered && (
            <Card title="Registration Successful" style={{ borderTop: '3px solid #2E7D32' }}>
              <Alert
                type="success"
                showIcon
                message="Farmer Registered"
                description="The farmer has been successfully added to the programme."
                style={{ marginBottom: 16 }}
              />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Farmer ID">{registered.id}</Descriptions.Item>
                <Descriptions.Item label="Full Name">{registered.fullName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{registered.phone}</Descriptions.Item>
                <Descriptions.Item label="Ward">{registered.ward}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {!registered && (
            <Card title="Instructions">
              <Text type="secondary">
                Fill in the registration form to add a new farmer to the Pfumvudza/Intwasa
                Input Subsidy Programme. Ensure the farmer's details are verified against
                their national ID before registering.
              </Text>
              <Divider />
              <ul style={{ paddingLeft: 20, color: '#667788', fontSize: 13 }}>
                <li>Verify the farmer's identity using their national ID document</li>
                <li>Confirm the farmer's ward assignment</li>
                <li>Provide a secure 4-digit PIN that the farmer will use for redemptions</li>
                <li>The PIN will be used to verify future seed bag redemptions</li>
              </ul>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default RegisterFarmer;
