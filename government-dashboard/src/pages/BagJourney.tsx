import React, { useState } from 'react';
import {
  Card, Input, Button, Typography, Descriptions, Tag,
  Timeline, message, Spin, Alert, Space,
} from 'antd';
import {
  SearchOutlined, ScanOutlined, SafetyCertificateOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

interface JourneyEntry {
  action: string;
  timestamp: string;
  location: { latitude: number; longitude: number } | null;
  performedBy: string;
  hashReference: string;
}

interface BagJourneyData {
  bag: {
    id: string;
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
  };
  chainOfCustody: JourneyEntry[];
}

const conditionColors: Record<string, string> = {
  in_stock: 'blue', dispatched: 'orange',
  redeemed: 'green', flagged: 'red',
};

const conditionLabels: Record<string, string> = {
  in_stock: 'In Stock', dispatched: 'Dispatched',
  redeemed: 'Redeemed', flagged: 'Flagged',
};

const actionColors: Record<string, string> = {
  generated: 'blue', dispatched: 'orange',
  redeemed: 'green', flagged: 'red',
};

const BagJourney: React.FC = () => {
  const [bagId, setBagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [journeyData, setJourneyData] = useState<BagJourneyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!bagId.trim()) {
      message.error('Enter a bag ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.getBagJourney(bagId.trim());
      setJourneyData(result.data as BagJourneyData);
    } catch (err: any) {
      setError(err.message || 'Bag not found');
      setJourneyData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}><NodeIndexOutlined /> Bag Journey &amp; Chain of Custody</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Trace any seed bag's complete chain of custody with immutable hash verification</Text>
      </div>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="Enter Bag ID (e.g., BAG-BATCH-2026-0001-1)"
            value={bagId}
            onChange={e => setBagId(e.target.value)}
            onPressEnter={handleLookup}
            prefix={<ScanOutlined />}
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleLookup}
            loading={loading}
          >
            Trace
          </Button>
        </Space.Compact>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <br /><Text type="secondary">Tracing bag journey...</Text>
        </div>
      )}

      {error && (
        <Alert type="error" message="Trace Failed" description={error} showIcon style={{ marginTop: 16 }} />
      )}

      {journeyData && (
        <div style={{ marginTop: 16 }}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: journeyData.bag.isAuthentic ? '#2E7D32' : '#C62828' }} />
                <span>Bag: {journeyData.bag.id}</span>
                <Tag color={conditionColors[journeyData.bag.condition]}>
                  {conditionLabels[journeyData.bag.condition]}
                </Tag>
                {journeyData.bag.isAuthentic
                  ? <Tag color="green">Authentic</Tag>
                  : <Tag color="red">Flagged</Tag>}
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Variety">{journeyData.bag.variety}</Descriptions.Item>
              <Descriptions.Item label="Batch">{journeyData.bag.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="Certification">{journeyData.bag.certificationId}</Descriptions.Item>
              <Descriptions.Item label="Seed House">{journeyData.bag.seedHouse}</Descriptions.Item>
              <Descriptions.Item label="Dispatched To">{journeyData.bag.dispatchedTo || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Farmer">{journeyData.bag.farmerPhone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Redeemed At">
                {journeyData.bag.redemptionTimestamp
                  ? new Date(journeyData.bag.redemptionTimestamp).toLocaleString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {journeyData.bag.redemptionLocation
                  ? `${journeyData.bag.redemptionLocation.latitude.toFixed(4)}, ${journeyData.bag.redemptionLocation.longitude.toFixed(4)}`
                  : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Immutable Chain of Custody" style={{ marginTop: 16 }}>
            <Timeline className="bag-journey-timeline">
              {journeyData.chainOfCustody.map((entry, idx) => (
                <Timeline.Item
                  key={idx}
                  color={actionColors[entry.action] || 'blue'}
                >
                  <div>
                    <Text strong style={{ textTransform: 'uppercase' }}>{entry.action}</Text>
                    <br />
                    <Text type="secondary">{new Date(entry.timestamp).toLocaleString()}</Text>
                    {entry.location && (
                      <>
                        <br />
                        <Text type="secondary">
                          Location: {entry.location.latitude.toFixed(4)}, {entry.location.longitude.toFixed(4)}
                        </Text>
                      </>
                    )}
                    <br />
                    <Text type="secondary">By: {entry.performedBy}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 10, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      Hash: {entry.hashReference}
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

export default BagJourney;
