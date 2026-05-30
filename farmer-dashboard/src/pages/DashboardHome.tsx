import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Tag, Spin } from 'antd';
import {
  InboxOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface FarmerStats {
  totalBags: number;
  redeemed: number;
  pending: number;
  flagged: number;
}

interface BagActivity {
  id: string;
  variety: string;
  status: string;
  timestamp: string | null;
  batchNumber: string;
}

const MOCK_STATS: FarmerStats = {
  totalBags: 5,
  redeemed: 3,
  pending: 2,
  flagged: 0,
};

const MOCK_BAGS: BagActivity[] = [
  { id: 'ZW-2026-0422', variety: 'SC 403', status: 'redeemed', timestamp: '2026-05-28T10:30:00Z', batchNumber: 'BATCH-2026-003' },
  { id: 'ZW-2026-0423', variety: 'SC 513', status: 'redeemed', timestamp: '2026-05-27T14:15:00Z', batchNumber: 'BATCH-2026-004' },
  { id: 'ZW-2026-0424', variety: 'SC 403', status: 'redeemed', timestamp: '2026-05-25T09:00:00Z', batchNumber: 'BATCH-2026-003' },
  { id: 'ZW-2026-0425', variety: 'SC 513', status: 'dispatched', timestamp: null, batchNumber: 'BATCH-2026-004' },
  { id: 'ZW-2026-0426', variety: 'SC 403', status: 'dispatched', timestamp: null, batchNumber: 'BATCH-2026-003' },
];

const statusBadge: Record<string, { color: string; label: string }> = {
  redeemed: { color: 'green', label: 'Redeemed' },
  dispatched: { color: 'blue', label: 'Dispatched' },
  in_stock: { color: 'orange', label: 'In Stock' },
  flagged: { color: 'red', label: 'Flagged' },
};

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [recent, setRecent] = useState<BagActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 500));
          setStats(MOCK_STATS);
          setRecent(MOCK_BAGS);
          setLoading(false);
          return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const farmerDoc = await getDocs(query(collection(db, 'farmers'), where('userId', '==', uid)));
        if (farmerDoc.empty) {
          setStats({ totalBags: 0, redeemed: 0, pending: 0, flagged: 0 });
          setRecent([]);
          setLoading(false);
          return;
        }
        const phone = farmerDoc.docs[0].data().phone;
        const bagsSnap = await getDocs(query(collection(db, 'seedBags'), where('farmerPhone', '==', phone)));
        const bags = bagsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setStats({
          totalBags: bags.length,
          redeemed: bags.filter((b: any) => b.condition === 'redeemed').length,
          pending: bags.filter((b: any) => b.condition !== 'redeemed' && b.condition !== 'flagged').length,
          flagged: bags.filter((b: any) => b.condition === 'flagged').length,
        });
        setRecent(bags.slice(0, 10).map((b: any) => ({
          id: b.id,
          variety: b.variety,
          status: b.condition,
          timestamp: b.redemptionTimestamp?.toDate?.()?.toISOString() || b.redemptionTimestamp || null,
          batchNumber: b.batchNumber,
        })));
      } catch (err) {
        console.error('Failed to load farmer data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    {
      title: 'Bag ID', dataIndex: 'id', key: 'id',
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const badge = statusBadge[s] || { color: 'default', label: s };
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Date', dataIndex: 'timestamp', key: 'timestamp',
      render: (v: string | null) => v ? dayjs(v).format('DD MMM YYYY') : <Text type="secondary">—</Text>,
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <FieldTimeOutlined /> My Seed Allocation
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Track your Pfumvudza/Intwasa input distribution status
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Total Bags Allocated" value={stats?.totalBags || 0}
              prefix={<InboxOutlined />} valueStyle={{ color: '#004d40' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Redeemed" value={stats?.redeemed || 0}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#2E7D32' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Pending Collection" value={stats?.pending || 0}
              prefix={<ClockCircleOutlined />} valueStyle={{ color: '#c49a2a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Flagged" value={stats?.flagged || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats && stats.flagged > 0 ? '#8b1a1a' : '#999' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="My Seed Bags"
        style={{ marginTop: 24 }}
        extra={
          stats ? (
            <Text style={{ fontSize: 12, color: '#004d40' }}>
              Redemption rate: {stats.totalBags > 0 ? Math.round((stats.redeemed / stats.totalBags) * 100) : 0}%
            </Text>
          ) : null
        }
      >
        <Table
          dataSource={recent}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {stats && stats.pending > 0 && (
        <Card style={{ marginTop: 16, background: '#fef9e7', borderLeft: '4px solid #c49a2a' }}>
          <Text>
            <strong>{stats.pending} bag(s)</strong> are ready for collection.
            Visit your nearest distribution point with your ID or dial <strong>*123#</strong> for assistance.
          </Text>
        </Card>
      )}
    </div>
  );
};

export default DashboardHome;
