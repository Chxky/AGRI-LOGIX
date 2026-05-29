import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Descriptions, Tag, Alert, Divider, Spin } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';

const { Title, Text } = Typography;

interface BagDetails {
  bagId: string;
  variety: string;
  batchNumber: string;
  condition: string;
  isAuthentic: boolean;
  seedHouse: string;
  farmerPhone: string | null;
  redemptionTimestamp: string | null;
  certificationId: string;
}

interface VerifyForm {
  bagId: string;
}

const VerifyRedemption: React.FC = () => {
  const [form] = Form.useForm<VerifyForm>();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bag, setBag] = useState<BagDetails | null>(null);
  const [verified, setVerified] = useState(false);

  const handleLookup = async (values: VerifyForm) => {
    setLoading(true);
    setBag(null);
    setVerified(false);
    try {
      const fn = httpsCallable(functions, 'getBagDetails');
      const result = await fn({ bagId: values.bagId.trim() });
      setBag(result.data as BagDetails);
    } catch (error: any) {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 800));
        setBag({
          bagId: values.bagId.trim(),
          variety: 'SC513',
          batchNumber: 'BATCH-2026-001',
          condition: 'in_stock',
          isAuthentic: true,
          seedHouse: 'Seed Co Zimbabwe',
          farmerPhone: '+263771234567',
          redemptionTimestamp: null,
          certificationId: 'SSI-CERT-2026-0451',
        });
        return;
      }
      const msg = error?.details?.message || error.message || 'Bag not found';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!bag) return;
    setVerifying(true);
    try {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 1000));
        setVerified(true);
        message.success(`Bag ${bag.bagId} redemption confirmed!`);
        return;
      }
      const fn = httpsCallable(functions, 'confirmRedemption');
      await fn({ bagId: bag.bagId });
      setVerified(true);
      message.success(`Bag ${bag.bagId} redemption confirmed!`);
    } catch (error: any) {
      const msg = error?.details?.message || error.message || 'Verification failed';
      message.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <ScanOutlined /> Scan & Verify Redemption
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Look up a seed bag and confirm farmer redemption at the point of collection
        </Text>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleLookup}
          autoComplete="off"
        >
          <Form.Item
            name="bagId"
            rules={[{ required: true, message: 'Enter or scan bag ID' }]}
            style={{ flex: 1 }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Scan or enter bag ID (e.g. ZW-2026-0422)"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<SearchOutlined />}
              style={{ height: 44 }}
            >
              Look Up
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <br /><Text type="secondary">Looking up bag...</Text>
        </div>
      )}

      {bag && !verified && (
        <Card title="Bag Details" style={{ marginTop: 16, maxWidth: 600 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Bag ID"><Text strong>{bag.bagId}</Text></Descriptions.Item>
            <Descriptions.Item label="Variety">{bag.variety}</Descriptions.Item>
            <Descriptions.Item label="Batch">{bag.batchNumber}</Descriptions.Item>
            <Descriptions.Item label="Condition">{bag.condition}</Descriptions.Item>
            <Descriptions.Item label="Seed House">{bag.seedHouse}</Descriptions.Item>
            <Descriptions.Item label="Certification">{bag.certificationId}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={bag.condition === 'redeemed' ? 'green' : bag.condition === 'flagged' ? 'red' : 'blue'}>
                {bag.condition.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Farmer Phone">{bag.farmerPhone || 'N/A'}</Descriptions.Item>
          </Descriptions>

          {bag.condition === 'redeemed' ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              message="Already Redeemed"
              description={`This bag was already redeemed on ${bag.redemptionTimestamp ? new Date(bag.redemptionTimestamp).toLocaleDateString() : 'a previous date'}.`}
            />
          ) : bag.condition === 'flagged' ? (
            <Alert
              type="error"
              showIcon
              style={{ marginTop: 16 }}
              message="Bag Flagged"
              description="This bag has been flagged as suspicious. Do not proceed with redemption."
            />
          ) : (
            <>
              <Divider />
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                loading={verifying}
                onClick={handleConfirmRedemption}
                style={{ width: '100%', height: 44, background: '#2E7D32', borderColor: '#2E7D32' }}
              >
                Confirm Redemption
              </Button>
            </>
          )}
        </Card>
      )}

      {verified && bag && (
        <Card
          title="Redemption Complete"
          style={{ marginTop: 16, maxWidth: 600, borderTop: '3px solid #2E7D32' }}
        >
          <Alert
            type="success"
            showIcon
            message="Redemption Verified"
            description={`Bag ${bag.bagId} has been successfully redeemed.`}
          />
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Bag ID">{bag.bagId}</Descriptions.Item>
            <Descriptions.Item label="Farmer Phone">{bag.farmerPhone || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Variety">{bag.variety}</Descriptions.Item>
          </Descriptions>
          <Button
            type="default"
            size="large"
            icon={<ScanOutlined />}
            onClick={() => { setBag(null); setVerified(false); form.resetFields(); }}
            style={{ marginTop: 16, width: '100%', height: 44 }}
          >
            Verify Another Bag
          </Button>
        </Card>
      )}
    </div>
  );
};

export default VerifyRedemption;
