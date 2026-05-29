import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Tag, Spin } from 'antd';
import {
  CheckCircleOutlined, SendOutlined,
  WarningOutlined, InboxOutlined, DollarOutlined,
  TeamOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalBags: number; redeemed: number; dispatched: number;
  inStock: number; flagged: number; totalFarmers: number;
  activeDistributions: number; redemptionRate: number;
}

interface DistrictSummary {
  name: string; dispatched: number; redeemed: number;
  farmers: number; gap: number;
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, districtsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getDistrictsSummary(),
        ]);
        setStats(statsRes.data as DashboardStats);
        setDistricts((districtsRes.data as any).districts || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <br /><Text type="secondary">Loading national statistics...</Text>
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

  const totalValue = (stats?.totalBags || 0) * 15;
  const redeemedValue = (stats?.redeemed || 0) * 15;

  const districtColumns = [
    { title: 'District', dataIndex: 'name', key: 'name' },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed' },
    { title: 'Farmers', dataIndex: 'farmers', key: 'farmers' },
    {
      title: 'Gap', dataIndex: 'gap', key: 'gap',
      render: (gap: number) => (
        <Tag color={gap === 0 ? 'green' : gap < 50 ? 'orange' : 'red'}>
          {gap === 0 ? 'Matched' : `${gap} outstanding`}
        </Tag>
      ),
    },
    {
      title: 'Redemption %', key: 'rate',
      render: (_: any, r: DistrictSummary) => (
        <span>{r.dispatched > 0 ? Math.round((r.redeemed / r.dispatched) * 100) : 0}%</span>
      ),
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined /> National Distribution Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Pfumvudza/Intwasa Input Subsidy Programme &mdash; Real-time statistics across all provinces
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Total Seed Bags" value={stats?.totalBags || 0}
              prefix={<InboxOutlined />} valueStyle={{ color: '#1a3a5c' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Dispatched to Districts" value={stats?.dispatched || 0}
              prefix={<SendOutlined />} valueStyle={{ color: '#c49a2a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Redeemed by Farmers" value={stats?.redeemed || 0}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#2E7D32' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Redemption Rate" value={stats?.redemptionRate || 0}
              suffix="%" prefix={<CheckCircleOutlined />}
              valueStyle={{ color: (stats?.redemptionRate || 0) > 70 ? '#2E7D32' : '#c49a2a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Registered Farmers" value={stats?.totalFarmers || 0}
              prefix={<TeamOutlined />} valueStyle={{ color: '#1a3a5c' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Flagged Bags" value={stats?.flagged || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: (stats?.flagged || 0) > 0 ? '#8b1a1a' : '#666' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Total Value (USD)" value={totalValue.toLocaleString()}
              prefix={<DollarOutlined />} suffix="USD" valueStyle={{ color: '#2E7D32' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Verified for Payment" value={redeemedValue.toLocaleString()}
              prefix={<DollarOutlined />} suffix="USD" valueStyle={{ color: '#1a3a5c' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="District-Level Reconciliation"
        style={{ marginTop: 24 }}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>Last updated: {new Date().toLocaleString()}</Text>}
      >
        <Table
          dataSource={districts}
          columns={districtColumns}
          rowKey="name"
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardHome;
