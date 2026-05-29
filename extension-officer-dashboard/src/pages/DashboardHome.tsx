import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Tag, Spin, Empty } from 'antd';
import {
  SendOutlined, CheckCircleOutlined, WarningOutlined,
  InboxOutlined, TeamOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface WardStats {
  totalDispatched: number;
  redeemed: number;
  unreturned: number;
  farmerCount: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'redemption' | 'flag';
  description: string;
  timestamp: string;
  farmer?: string;
}

const MOCK_STATS: WardStats = {
  totalDispatched: 120,
  redeemed: 95,
  unreturned: 25,
  farmerCount: 84,
};

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: 'ACT-001', type: 'registration', description: 'New farmer registered: T. Ncube', timestamp: '2026-05-29T09:15:00Z', farmer: 'T. Ncube' },
  { id: 'ACT-002', type: 'redemption', description: 'Bag ZW-2026-0422 redeemed by M. Sibanda', timestamp: '2026-05-29T08:45:00Z', farmer: 'M. Sibanda' },
  { id: 'ACT-003', type: 'flag', description: 'Bag ZW-2026-0311 flagged as suspicious', timestamp: '2026-05-28T16:30:00Z' },
  { id: 'ACT-004', type: 'registration', description: 'New farmer registered: C. Dube', timestamp: '2026-05-28T14:20:00Z', farmer: 'C. Dube' },
  { id: 'ACT-005', type: 'redemption', description: 'Bag ZW-2026-0389 redeemed by S. Moyo', timestamp: '2026-05-28T11:00:00Z', farmer: 'S. Moyo' },
];

const DashboardHome: React.FC = () => {
  const [stats] = useState<WardStats>(MOCK_STATS);
  const [activity] = useState<RecentActivity[]>(MOCK_ACTIVITY);

  const activityColumns = [
    {
      title: 'Activity', key: 'activity',
      render: (_: any, record: RecentActivity) => (
        <div>
          <Text strong>{record.description}</Text>
        </div>
      ),
    },
    {
      title: 'Type', dataIndex: 'type', key: 'type', width: 120,
      render: (type: string) => {
        const colors: Record<string, string> = { registration: 'blue', redemption: 'green', flag: 'red' };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Time', dataIndex: 'timestamp', key: 'timestamp', width: 160,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(v).format('DD MMM YYYY, HH:mm')}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined /> Ward Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Real-time statistics for your assigned ward &mdash; Pfumvudza/Intwasa Programme
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Bags Dispatched to District" value={stats.totalDispatched}
              prefix={<SendOutlined />} valueStyle={{ color: '#0a3d2e' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Redeemed by Farmers" value={stats.redeemed}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#2E7D32' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Unreturned Bags" value={stats.unreturned}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats.unreturned > 20 ? '#8b1a1a' : '#c49a2a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Farmers in Ward" value={stats.farmerCount}
              prefix={<TeamOutlined />} valueStyle={{ color: '#0a3d2e' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Activity"
        style={{ marginTop: 24 }}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>Last 24 hours</Text>}
      >
        <Table
          dataSource={activity}
          columns={activityColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          locale={{ emptyText: <Empty description="No recent activity" /> }}
        />
      </Card>
    </div>
  );
};

export default DashboardHome;
