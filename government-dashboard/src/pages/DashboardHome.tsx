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
      <Title level={4}>
        <EnvironmentOutlined /> National Distribution Overview
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Total Bags" value={stats?.totalBags || 0}
              prefix={<InboxOutlined />} valueStyle={{ color: '#1565C0' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Dispatched" value={stats?.dispatched || 0}
              prefix={<SendOutlined />} valueStyle={{ color: '#F9A825' }} />
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
            <Statistic title="Redemption Rate" value={stats?.redemptionRate || 0}
              suffix="%" prefix={<CheckCircleOutlined />}
              valueStyle={{ color: (stats?.redemptionRate || 0) > 70 ? '#2E7D32' : '#F9A825' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Registered Farmers" value={stats?.totalFarmers || 0}
              prefix={<TeamOutlined />} valueStyle={{ color: '#1565C0' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic title="Flagged Bags" value={stats?.flagged || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: (stats?.flagged || 0) > 0 ? '#C62828' : '#666' }} />
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
            <Statistic title="Verified for Payment" value={`$${redeemedValue.toLocaleString()}`}
              prefix={<DollarOutlined />} valueStyle={{ color: '#1565C0' }} />
          </Card>
        </Col>
      </Row>

      <Card title="District-Level Reconciliation" style={{ marginTop: 24 }}>
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
