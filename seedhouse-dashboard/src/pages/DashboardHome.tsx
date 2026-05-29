import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  SendOutlined,
  WarningOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DashboardStats {
  totalBags: number;
  redeemed: number;
  dispatched: number;
  inStock: number;
  flagged: number;
  totalFarmers: number;
  activeDistributions: number;
  redemptionRate: number;
}

interface DistrictSummary {
  name: string;
  dispatched: number;
  redeemed: number;
  farmers: number;
  gap: number;
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const getStats = httpsCallable(functions, 'getDashboardStats');
        const getDistricts = httpsCallable(functions, 'getDistrictsSummary');

        const [statsResult, districtsResult] = await Promise.all([
          getStats(),
          getDistricts(),
        ]);

        if (!statsResult.data) throw new Error('No data');
        setStats(statsResult.data as DashboardStats);
        setDistricts((districtsResult.data as any).districts);
      } catch (error) {
        if (!isDemoMode()) throw error;
        console.warn('Using mock data for Seedhouse Dashboard');
        setStats({
          totalBags: 8500,
          redeemed: 5200,
          dispatched: 7800,
          inStock: 700,
          flagged: 3,
          totalFarmers: 3200,
          activeDistributions: 2,
          redemptionRate: 61
        });
        setDistricts([
          { name: 'Harare', dispatched: 1000, redeemed: 950, farmers: 450, gap: 50 },
          { name: 'Gweru', dispatched: 800, redeemed: 600, farmers: 280, gap: 200 },
          { name: 'Mutare', dispatched: 1200, redeemed: 1100, farmers: 520, gap: 100 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const districtColumns = [
    { title: 'District', dataIndex: 'name', key: 'name' },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed' },
    { title: 'Farmers', dataIndex: 'farmers', key: 'farmers' },
    {
      title: 'Gap',
      dataIndex: 'gap',
      key: 'gap',
      render: (gap: number) => (
        <Tag color={gap > 0 ? 'orange' : 'green'}>
          {gap > 0 ? `${gap} unreturned` : 'Matched'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Seed House Dashboard
        <Tag style={{ marginLeft: 12 }} color="green">
          {dayjs().format('DD MMM YYYY')}
        </Tag>
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Bags"
              value={stats?.totalBags || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1B5E20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="In Stock"
              value={stats?.inStock || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1565C0' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Dispatched"
              value={stats?.dispatched || 0}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#F9A825' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Redeemed"
              value={stats?.redeemed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#2E7D32' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Redemption Rate"
              value={stats?.redemptionRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: stats && stats.redemptionRate > 80 ? '#2E7D32' : '#F9A825' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Flagged"
              value={stats?.flagged || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats && stats.flagged > 0 ? '#C62828' : '#666' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Registered Farmers"
              value={stats?.totalFarmers || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1B5E20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Active Distributions"
              value={stats?.activeDistributions || 0}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#1565C0' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="District Reconciliation" style={{ marginTop: 24 }}>
        <Table
          dataSource={districts}
          columns={districtColumns}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardHome;
