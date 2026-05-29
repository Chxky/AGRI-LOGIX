import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Spin, Empty, Alert } from 'antd';
import { EnvironmentOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface SeedBag {
  bagId: string;
  variety: string;
  batch: string;
  condition: string;
  farmerPhone: string;
  redemptionDate: string | null;
  status: string;
}

const MOCK_BAGS: SeedBag[] = [
  { bagId: 'ZW-2026-0422', variety: 'SC 403', batch: 'BATCH-2026-003', condition: 'Good', farmerPhone: '+263771234567', redemptionDate: '2026-05-28T10:30:00Z', status: 'redeemed' },
  { bagId: 'ZW-2026-0423', variety: 'SC 403', batch: 'BATCH-2026-003', condition: 'Good', farmerPhone: '+263771234568', redemptionDate: '2026-05-27T14:15:00Z', status: 'redeemed' },
  { bagId: 'ZW-2026-0424', variety: 'SC 513', batch: 'BATCH-2026-004', condition: 'Fair', farmerPhone: '+263771234569', redemptionDate: null, status: 'dispatched' },
  { bagId: 'ZW-2026-0425', variety: 'SC 513', batch: 'BATCH-2026-004', condition: 'Excellent', farmerPhone: '+263771234570', redemptionDate: null, status: 'dispatched' },
  { bagId: 'ZW-2026-0426', variety: 'SC 403', batch: 'BATCH-2026-003', condition: 'Good', farmerPhone: '+263771234571', redemptionDate: '2026-05-26T09:00:00Z', status: 'redeemed' },
];

const WardOverview: React.FC = () => {
  const [bags, setBags] = useState<SeedBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [district] = useState(() => sessionStorage.getItem('officerDistrict') || 'Ward 1');

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 500));
          setBags(MOCK_BAGS);
          setLoading(false);
          return;
        }
        const fn = httpsCallable(functions, 'getWardBags');
        const result = await fn({ district });
        const data = result.data as { bags: SeedBag[] };
        setBags(data.bags || []);
      } catch (err: any) {
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 500));
          setBags(MOCK_BAGS);
          return;
        }
        setError(err.message || 'Failed to load ward data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [district]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <br /><Text type="secondary">Loading ward bag data...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <WarningOutlined style={{ fontSize: 48, color: '#C62828' }} />
          <br /><Text type="danger">{error}</Text>
        </div>
      </Card>
    );
  }

  const columns = [
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId' },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batch', key: 'batch' },
    { title: 'Condition', dataIndex: 'condition', key: 'condition' },
    { title: 'Farmer Phone', dataIndex: 'farmerPhone', key: 'farmerPhone' },
    {
      title: 'Redemption Date', dataIndex: 'redemptionDate', key: 'redemptionDate',
      render: (v: string | null) => v ? dayjs(v).format('DD MMM YYYY') : <Tag>Pending</Tag>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'redeemed' ? 'green' : s === 'flagged' ? 'red' : 'blue'}>
          {s.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined /> Ward Bag Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Seed bags dispatched to your district &mdash; redemption status and farmer assignments
        </Text>
      </div>

      {bags.length === 0 ? (
        <Card>
          <Empty description="No seed bags found for your ward" />
        </Card>
      ) : (
        <Card>
          <Table
            dataSource={bags}
            columns={columns}
            rowKey="bagId"
            pagination={{ pageSize: 15 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default WardOverview;
