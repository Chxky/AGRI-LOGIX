import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert, Descriptions, Tag } from 'antd';
import { FlagOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FlagForm {
  bagId: string;
  reason: string;
}

interface FlagResult {
  bagId: string;
  status: string;
  message: string;
}

const FlagBag: React.FC = () => {
  const [form] = Form.useForm<FlagForm>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlagResult | null>(null);

  const handleSubmit = async (values: FlagForm) => {
    setLoading(true);
    setResult(null);
    try {
      const fn = httpsCallable(functions, 'flagCounterfeitBag');
      const res = await fn({ bagId: values.bagId.trim(), reason: values.reason });
      const data = res.data as FlagResult;
      setResult(data);
      message.success(`Bag ${values.bagId} has been flagged`);
      form.resetFields();
    } catch (error: any) {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 1000));
        setResult({
          bagId: values.bagId.trim(),
          status: 'flagged',
          message: `Bag ${values.bagId.trim()} has been flagged successfully for review. Ministry will be notified.`,
        });
        message.success(`Bag ${values.bagId} has been flagged`);
        form.resetFields();
        return;
      }
      const msg = error?.details?.message || error.message || 'Failed to flag bag';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <FlagOutlined /> Flag Suspicious Bag
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Report a seed bag for suspected counterfeiting, tampering, or quality concerns
        </Text>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="bagId"
            label="Bag ID"
            rules={[
              { required: true, message: 'Bag ID is required' },
              { min: 5, message: 'Enter a valid bag ID' },
            ]}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Enter bag ID to flag (e.g. ZW-2026-0422)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Flagging"
            rules={[
              { required: true, message: 'Please provide a reason' },
              { min: 10, message: 'Reason must be at least 10 characters' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the issue — e.g. suspected counterfeit, torn packaging, missing hologram, unusual weight, etc."
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
              icon={<FlagOutlined />}
              danger
              style={{ height: 44, fontWeight: 600 }}
            >
              Flag Bag
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card
          title="Flag Submitted"
          style={{ marginTop: 16, maxWidth: 600, borderTop: '3px solid #8b1a1a' }}
        >
          <Alert
            type="success"
            showIcon
            message="Bag Flagged Successfully"
            description={result.message}
            style={{ marginBottom: 16 }}
          />
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Bag ID">
              <Text strong>{result.bagId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="red">{result.status.toUpperCase()}</Tag>
            </Descriptions.Item>
          </Descriptions>
          <Button
            type="default"
            size="large"
            icon={<FlagOutlined />}
            onClick={() => setResult(null)}
            style={{ marginTop: 16, width: '100%', height: 44 }}
          >
            Flag Another Bag
          </Button>
        </Card>
      )}
    </div>
  );
};

export default FlagBag;
