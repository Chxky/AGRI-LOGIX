import React, { useState } from 'react';
import {
  Card, Input, Button, Typography, Descriptions, Tag,
  Timeline, message, Space, Spin, Alert, Divider,
} from 'antd';
import { SearchOutlined, ScanOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const { Title, Text } = Typography;

interface BagDetails {
  bagId: string;
  qrCodeData: string;
  variety: string;
  batchNumber: string;
  certificationId: string;
  seedHouse: string;
  condition: string;
  isAuthentic: boolean;
  dispatchedTo: string | null;
  farmerPhone: string | null;
  redemptionTimestamp: string | null;
  redemptionLocation: { latitude: number; longitude: number } | null;
  createdAt: string;
  journey: Array<{
    action: string;
    timestamp: string;
    location: { latitude: number; longitude: number } | null;
    performedBy: string;
    hashReference: string;
  }>;
}

const conditionColors: Record<string, string> = {
  in_stock: 'blue',
  dispatched: 'orange',
  redeemed: 'green',
  flagged: 'red',
};

const conditionLabels: Record<string, string> = {
  in_stock: 'In Stock',
  dispatched: 'Dispatched',
  redeemed: 'Redeemed',
  flagged: 'Flagged',
};

const BagLookup: React.FC = () => {
  const [bagId, setBagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bagDetails, setBagDetails] = useState<BagDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!bagId.trim()) {
      message.error('Enter a bag ID to search');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const getDetails = httpsCallable(functions, 'getBagDetails');
      const result = await getDetails({ bagId: bagId.trim() });
      setBagDetails(result.data as BagDetails);
    } catch (error: any) {
      setError(error.message || 'Bag not found');
      setBagDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <div>
      <Title level={4}>
        <SearchOutlined /> Seed Bag Lookup
      </Title>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="Enter Bag ID (e.g., BAG-BATCH-2026-0001-1)"
            value={bagId}
            onChange={e => setBagId(e.target.value)}
            onKeyDown={handleKeyPress}
            prefix={<ScanOutlined />}
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleLookup}
            loading={loading}
          >
            Search
          </Button>
        </Space.Compact>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <br />
          <Text type="secondary">Looking up bag...</Text>
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message="Bag Not Found"
          description={error}
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {bagDetails && (
        <div style={{ marginTop: 16 }}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: bagDetails.isAuthentic ? '#2E7D32' : '#C62828' }} />
                <span>Bag: {bagDetails.bagId}</span>
                <Tag color={conditionColors[bagDetails.condition]}>
                  {conditionLabels[bagDetails.condition] || bagDetails.condition}
                </Tag>
                {bagDetails.isAuthentic
                  ? <Tag color="green">Authentic</Tag>
                  : <Tag color="red">Flagged</Tag>
                }
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Variety">{bagDetails.variety}</Descriptions.Item>
              <Descriptions.Item label="Batch Number">{bagDetails.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="Certification ID">{bagDetails.certificationId}</Descriptions.Item>
              <Descriptions.Item label="Seed House">{bagDetails.seedHouse}</Descriptions.Item>
              <Descriptions.Item label="Dispatched To">{bagDetails.dispatchedTo || 'Not yet dispatched'}</Descriptions.Item>
              <Descriptions.Item label="Farmer Phone">{bagDetails.farmerPhone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Redeemed At">
                {bagDetails.redemptionTimestamp
                  ? new Date(bagDetails.redemptionTimestamp).toLocaleString()
                  : 'N/A'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {bagDetails.redemptionLocation
                  ? `${bagDetails.redemptionLocation.latitude.toFixed(4)}, ${bagDetails.redemptionLocation.longitude.toFixed(4)}`
                  : 'N/A'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Created">{new Date(bagDetails.createdAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Chain of Custody (Audit Trail)" style={{ marginTop: 16 }}>
            <Timeline>
              {bagDetails.journey.map((entry, idx) => (
                <Timeline.Item
                  key={idx}
                  color={
                    entry.action === 'redeemed' ? 'green' :
                    entry.action === 'flagged' ? 'red' :
                    entry.action === 'dispatched' ? 'orange' : 'blue'
                  }
                >
                  <div>
                    <Text strong>{entry.action.toUpperCase()}</Text>
                    <br />
                    <Text type="secondary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                    <br />
                    <Text type="secondary">
                      By: {entry.performedBy}
                    </Text>
                    {entry.location && (
                      <>
                        <br />
                        <Text type="secondary">
                          Location: {entry.location.latitude.toFixed(4)}, {entry.location.longitude.toFixed(4)}
                        </Text>
                      </>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                      Hash: {entry.hashReference?.slice(0, 20)}...
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BagLookup;
