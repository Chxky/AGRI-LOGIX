import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Typography, Row, Col, Statistic, Progress,
  Space, Tooltip, Collapse,
} from 'antd';
import {
  EnvironmentOutlined, CheckCircleOutlined, SendOutlined,
  TeamOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

interface DistrictSummary {
  name: string; dispatched: number; redeemed: number;
  farmers: number; gap: number;
}

interface ProvinceData {
  name: string;
  capital: string;
  districts: string[];
  dispatched: number;
  redeemed: number;
  farmers: number;
  gap: number;
}

const PROVINCES: Record<string, { capital: string; districts: string[] }> = {
  'Harare': { capital: 'Harare', districts: ['Harare'] },
  'Bulawayo': { capital: 'Bulawayo', districts: ['Bulawayo'] },
  'Manicaland': { capital: 'Mutare', districts: ['Mutare', 'Chipinge', 'Rusape'] },
  'Mashonaland Central': { capital: 'Bindura', districts: ['Bindura', 'Mt Darwin', 'Guruve'] },
  'Mashonaland East': { capital: 'Marondera', districts: ['Marondera', 'Chivhu', 'Murehwa'] },
  'Mashonaland West': { capital: 'Chinhoyi', districts: ['Chinhoyi', 'Karoi', 'Chegutu'] },
  'Masvingo': { capital: 'Masvingo', districts: ['Masvingo', 'Chiredzi', 'Zvishavane'] },
  'Midlands': { capital: 'Gweru', districts: ['Gweru', 'Kwekwe', 'Zvishavane'] },
  'Matabeleland North': { capital: 'Lupane', districts: ['Lupane', 'Hwange', 'Victoria Falls'] },
  'Matabeleland South': { capital: 'Gwanda', districts: ['Gwanda', 'Beitbridge', 'Filabusi'] },
};

const ProvinceBreakdown: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getDistrictsSummary();
        setDistricts((res.data as any).districts || []);
      } catch {
        // mock fallback in api.ts
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Aggregate district data into provinces
  const provinces: ProvinceData[] = Object.entries(PROVINCES).map(([name, info]) => {
    const provDistricts = districts.filter(d =>
      info.districts.some(dName =>
        d.name.toLowerCase().includes(dName.toLowerCase()) ||
        dName.toLowerCase().includes(d.name.toLowerCase())
      )
    );

    // Also include districts that aren't matched to any province
    const dispatched = provDistricts.reduce((sum, d) => sum + d.dispatched, 0);
    const redeemed = provDistricts.reduce((sum, d) => sum + d.redeemed, 0);
    const farmers = provDistricts.reduce((sum, d) => sum + d.farmers, 0);
    const gap = dispatched - redeemed;

    return {
      name,
      capital: info.capital,
      districts: info.districts,
      dispatched,
      redeemed,
      farmers,
      gap,
    };
  }).filter(p => p.dispatched > 0); // Only show provinces with data

  // Unmatched districts (data exists but not mapped to a province)
  const matchedDistrictNames = new Set(
    Object.values(PROVINCES).flatMap(p => p.districts)
  );
  const unmatchedDistricts = districts.filter(d =>
    !matchedDistrictNames.has(d.name)
  );

  const totalDispatched = districts.reduce((s, d) => s + d.dispatched, 0);
  const totalRedeemed = districts.reduce((s, d) => s + d.redeemed, 0);
  const totalFarmers = districts.reduce((s, d) => s + d.farmers, 0);

  const columns = [
    {
      title: 'Province',
      key: 'province',
      render: (_: any, r: ProvinceData) => (
        <div>
          <Text strong>{r.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>Capital: {r.capital}</Text>
        </div>
      ),
    },
    {
      title: 'Dispatched',
      dataIndex: 'dispatched',
      key: 'dispatched',
      sorter: (a: ProvinceData, b: ProvinceData) => a.dispatched - b.dispatched,
      render: (v: number) => <Text>{v.toLocaleString()}</Text>,
    },
    {
      title: 'Redeemed',
      dataIndex: 'redeemed',
      key: 'redeemed',
      sorter: (a: ProvinceData, b: ProvinceData) => a.redeemed - b.redeemed,
      render: (v: number) => <Text style={{ color: '#2E7D32' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: 'Redemption Rate',
      key: 'rate',
      sorter: (a: ProvinceData, b: ProvinceData) =>
        (a.redeemed / a.dispatched) - (b.redeemed / b.dispatched),
      defaultSortOrder: 'descend' as const,
      render: (_: any, r: ProvinceData) => {
        const rate = r.dispatched > 0 ? Math.round((r.redeemed / r.dispatched) * 100) : 0;
        return (
          <Space>
            <Progress
              percent={rate}
              size="small"
              style={{ width: 80 }}
              strokeColor={rate >= 80 ? '#2E7D32' : rate >= 50 ? '#c49a2a' : '#8b1a1a'}
              showInfo={false}
            />
            <Tag color={rate >= 80 ? 'green' : rate >= 50 ? 'orange' : 'red'}>
              {rate}%
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Farmers',
      dataIndex: 'farmers',
      key: 'farmers',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Gap',
      key: 'gap',
      render: (_: any, r: ProvinceData) => {
        const gapRate = r.dispatched > 0 ? (r.gap / r.dispatched) * 100 : 0;
        return (
          <Tag color={gapRate > 20 ? 'red' : gapRate > 10 ? 'orange' : 'green'}>
            {r.gap.toLocaleString()} ({Math.round(gapRate)}%)
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, r: ProvinceData) => {
        const rate = r.dispatched > 0 ? (r.redeemed / r.dispatched) * 100 : 0;
        if (rate >= 80) return <Tag color="green" icon={<ArrowUpOutlined />}>On Track</Tag>;
        if (rate >= 50) return <Tag color="orange">Progressing</Tag>;
        return <Tag color="red" icon={<ArrowDownOutlined />}>Below Target</Tag>;
      },
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined /> Province-Level Breakdown
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Distribution and redemption performance across Zimbabwe's 10 provinces
        </Text>
      </div>

      {/* National Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #1a3a5c' }}>
            <Statistic title="Total Dispatched" value={totalDispatched}
              prefix={<SendOutlined />} valueStyle={{ color: '#1a3a5c', fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #2E7D32' }}>
            <Statistic title="Total Redeemed" value={totalRedeemed}
              prefix={<CheckCircleOutlined />} valueStyle={{ color: '#2E7D32', fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #1a3a5c' }}>
            <Statistic title="Farmers Reached" value={totalFarmers}
              prefix={<TeamOutlined />} valueStyle={{ color: '#1a3a5c', fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #2E7D32' }}>
            <Statistic title="National Rate" value={totalDispatched > 0 ? Math.round((totalRedeemed / totalDispatched) * 100) : 0}
              suffix="%" prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#2E7D32', fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      {/* Province Table */}
      <Card>
        <Table
          dataSource={provinces}
          columns={columns}
          rowKey="name"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Unmatched Districts */}
      {unmatchedDistricts.length > 0 && (
        <Collapse
          style={{ marginTop: 16 }}
          items={[{
            key: 'unmatched',
            label: <Text strong>Other Districts ({unmatchedDistricts.length})</Text>,
            children: (
              <Table
                dataSource={unmatchedDistricts}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  { title: 'District', dataIndex: 'name', key: 'name' },
                  { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
                  { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed' },
                  { title: 'Farmers', dataIndex: 'farmers', key: 'farmers' },
                  {
                    title: 'Gap', key: 'gap',
                    render: (_: any, r: DistrictSummary) => (
                      <Tag color={r.gap > 0 ? 'orange' : 'green'}>
                        {r.gap > 0 ? `${r.gap} unreturned` : 'Matched'}
                      </Tag>
                    ),
                  },
                ]}
              />
            ),
          }]}
        />
      )}
    </div>
  );
};

export default ProvinceBreakdown;
