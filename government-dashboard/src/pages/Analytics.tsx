import React, { useState } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Table, Tag, Radio,
  Divider, Space,
} from 'antd';
import {
  BarChartOutlined, AimOutlined, TeamOutlined,
  ExclamationCircleOutlined, RiseOutlined, BankOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

type TimePeriod = '7d' | '30d' | '90d' | 'all';

interface OverviewData {
  totalBags: number;
  totalFarmers: number;
  avgRedemptionRate: number;
  totalFlagged: number;
}

interface MonthlyTrend {
  month: string;
  redeemed: number;
  dispatched: number;
}

interface DistrictRow {
  district: string;
  dispatched: number;
  redeemed: number;
  rate: number;
  gap: number;
}

interface SeedHouseRow {
  seedHouse: string;
  dispatched: number;
  redeemed: number;
  rate: number;
  verifiedValue: number;
}

const periods: { key: TimePeriod; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'all', label: 'All Time' },
];

const overviewData: Record<TimePeriod, OverviewData> = {
  '7d': { totalBags: 2850, totalFarmers: 920, avgRedemptionRate: 68, totalFlagged: 3 },
  '30d': { totalBags: 12400, totalFarmers: 5350, avgRedemptionRate: 74, totalFlagged: 12 },
  '90d': { totalBags: 38500, totalFarmers: 16200, avgRedemptionRate: 71, totalFlagged: 41 },
  'all': { totalBags: 142000, totalFarmers: 58400, avgRedemptionRate: 76, totalFlagged: 128 },
};

const monthlyTrends: Record<TimePeriod, MonthlyTrend[]> = {
  '7d': [
    { month: 'May 23', redeemed: 320, dispatched: 480 },
    { month: 'May 24', redeemed: 410, dispatched: 560 },
    { month: 'May 25', redeemed: 290, dispatched: 440 },
    { month: 'May 26', redeemed: 510, dispatched: 620 },
    { month: 'May 27', redeemed: 380, dispatched: 500 },
    { month: 'May 28', redeemed: 450, dispatched: 590 },
    { month: 'May 29', redeemed: 490, dispatched: 610 },
  ],
  '30d': [
    { month: 'May 1', redeemed: 1420, dispatched: 2100 },
    { month: 'May 5', redeemed: 1680, dispatched: 2400 },
    { month: 'May 9', redeemed: 1350, dispatched: 1950 },
    { month: 'May 13', redeemed: 1900, dispatched: 2600 },
    { month: 'May 17', redeemed: 1750, dispatched: 2300 },
    { month: 'May 21', redeemed: 2100, dispatched: 2800 },
    { month: 'May 25', redeemed: 2200, dispatched: 3100 },
  ],
  '90d': [
    { month: 'Mar', redeemed: 8200, dispatched: 12000 },
    { month: 'Apr', redeemed: 10500, dispatched: 14500 },
    { month: 'May', redeemed: 12400, dispatched: 17800 },
  ],
  'all': [
    { month: 'Jan', redeemed: 28500, dispatched: 38500 },
    { month: 'Feb', redeemed: 31200, dispatched: 42000 },
    { month: 'Mar', redeemed: 28900, dispatched: 38000 },
    { month: 'Apr', redeemed: 34100, dispatched: 44500 },
    { month: 'May', redeemed: 19300, dispatched: 27000 },
  ],
};

const districtData: Record<TimePeriod, DistrictRow[]> = {
  '7d': [
    { district: 'Harare', dispatched: 480, redeemed: 460, rate: 96, gap: 20 },
    { district: 'Mutare', dispatched: 520, redeemed: 480, rate: 92, gap: 40 },
    { district: 'Bulawayo', dispatched: 380, redeemed: 360, rate: 95, gap: 20 },
    { district: 'Gweru', dispatched: 410, redeemed: 340, rate: 83, gap: 70 },
    { district: 'Masvingo', dispatched: 390, redeemed: 210, rate: 54, gap: 180 },
    { district: 'Bindura', dispatched: 350, redeemed: 330, rate: 94, gap: 20 },
    { district: 'Chinhoyi', dispatched: 320, redeemed: 220, rate: 69, gap: 100 },
  ],
  '30d': [
    { district: 'Harare', dispatched: 2000, redeemed: 1920, rate: 96, gap: 80 },
    { district: 'Mutare', dispatched: 2400, redeemed: 2200, rate: 92, gap: 200 },
    { district: 'Bulawayo', dispatched: 1600, redeemed: 1520, rate: 95, gap: 80 },
    { district: 'Gweru', dispatched: 1800, redeemed: 1450, rate: 81, gap: 350 },
    { district: 'Masvingo', dispatched: 2100, redeemed: 1200, rate: 57, gap: 900 },
    { district: 'Bindura', dispatched: 1400, redeemed: 1320, rate: 94, gap: 80 },
    { district: 'Chinhoyi', dispatched: 1900, redeemed: 1450, rate: 76, gap: 450 },
  ],
  '90d': [
    { district: 'Harare', dispatched: 6200, redeemed: 5900, rate: 95, gap: 300 },
    { district: 'Mutare', dispatched: 7200, redeemed: 6600, rate: 92, gap: 600 },
    { district: 'Bulawayo', dispatched: 4800, redeemed: 4500, rate: 94, gap: 300 },
    { district: 'Gweru', dispatched: 5500, redeemed: 4300, rate: 78, gap: 1200 },
    { district: 'Masvingo', dispatched: 6500, redeemed: 3500, rate: 54, gap: 3000 },
    { district: 'Bindura', dispatched: 4200, redeemed: 3900, rate: 93, gap: 300 },
    { district: 'Chinhoyi', dispatched: 5800, redeemed: 4300, rate: 74, gap: 1500 },
  ],
  'all': [
    { district: 'Harare', dispatched: 22500, redeemed: 21400, rate: 95, gap: 1100 },
    { district: 'Mutare', dispatched: 26100, redeemed: 24000, rate: 92, gap: 2100 },
    { district: 'Bulawayo', dispatched: 17500, redeemed: 16400, rate: 94, gap: 1100 },
    { district: 'Gweru', dispatched: 20100, redeemed: 15500, rate: 77, gap: 4600 },
    { district: 'Masvingo', dispatched: 23800, redeemed: 12800, rate: 54, gap: 11000 },
    { district: 'Bindura', dispatched: 15200, redeemed: 14100, rate: 93, gap: 1100 },
    { district: 'Chinhoyi', dispatched: 21200, redeemed: 15600, rate: 74, gap: 5600 },
  ],
};

const seedHouseData: Record<TimePeriod, SeedHouseRow[]> = {
  '7d': [
    { seedHouse: 'Seed Co', dispatched: 980, redeemed: 890, rate: 91, verifiedValue: 13350 },
    { seedHouse: 'Pannar', dispatched: 650, redeemed: 540, rate: 83, verifiedValue: 8100 },
    { seedHouse: 'Klein Karoo', dispatched: 420, redeemed: 340, rate: 81, verifiedValue: 5100 },
    { seedHouse: 'Windmill', dispatched: 380, redeemed: 300, rate: 79, verifiedValue: 4500 },
    { seedHouse: 'Agri-Seeds', dispatched: 220, redeemed: 190, rate: 86, verifiedValue: 2850 },
  ],
  '30d': [
    { seedHouse: 'Seed Co', dispatched: 4200, redeemed: 3850, rate: 92, verifiedValue: 57750 },
    { seedHouse: 'Pannar', dispatched: 2800, redeemed: 2300, rate: 82, verifiedValue: 34500 },
    { seedHouse: 'Klein Karoo', dispatched: 1900, redeemed: 1500, rate: 79, verifiedValue: 22500 },
    { seedHouse: 'Windmill', dispatched: 1600, redeemed: 1200, rate: 75, verifiedValue: 18000 },
    { seedHouse: 'Agri-Seeds', dispatched: 950, redeemed: 820, rate: 86, verifiedValue: 12300 },
  ],
  '90d': [
    { seedHouse: 'Seed Co', dispatched: 12800, redeemed: 11600, rate: 91, verifiedValue: 174000 },
    { seedHouse: 'Pannar', dispatched: 8600, redeemed: 6900, rate: 80, verifiedValue: 103500 },
    { seedHouse: 'Klein Karoo', dispatched: 5800, redeemed: 4500, rate: 78, verifiedValue: 67500 },
    { seedHouse: 'Windmill', dispatched: 4900, redeemed: 3600, rate: 73, verifiedValue: 54000 },
    { seedHouse: 'Agri-Seeds', dispatched: 2900, redeemed: 2500, rate: 86, verifiedValue: 37500 },
  ],
  'all': [
    { seedHouse: 'Seed Co', dispatched: 46500, redeemed: 42500, rate: 91, verifiedValue: 637500 },
    { seedHouse: 'Pannar', dispatched: 31200, redeemed: 24800, rate: 79, verifiedValue: 372000 },
    { seedHouse: 'Klein Karoo', dispatched: 21000, redeemed: 16200, rate: 77, verifiedValue: 243000 },
    { seedHouse: 'Windmill', dispatched: 17800, redeemed: 13000, rate: 73, verifiedValue: 195000 },
    { seedHouse: 'Agri-Seeds', dispatched: 10500, redeemed: 9000, rate: 86, verifiedValue: 135000 },
  ],
};

const getStatus = (rate: number): { label: string; color: string; icon: React.ReactNode } => {
  if (rate >= 90) return { label: 'Good', color: 'green', icon: <CheckCircleOutlined /> };
  if (rate >= 70) return { label: 'Warning', color: 'orange', icon: <WarningOutlined /> };
  return { label: 'Critical', color: 'red', icon: <CloseCircleOutlined /> };
};

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('30d');

  const overview = overviewData[period];
  const trends = monthlyTrends[period];
  const districts = districtData[period];
  const seedHouses = seedHouseData[period];

  const maxRedeemed = Math.max(...trends.map(t => t.redeemed));

  const insights: string[] = [
    `Masvingo has the lowest redemption rate (${districtData[period].find(d => d.district === 'Masvingo')?.rate}%) — investigate`,
    `Harare has highest farmer coverage with ${districtData[period].find(d => d.district === 'Harare')?.rate}% redemption rate`,
    `${overview.totalFlagged} bag${overview.totalFlagged === 1 ? '' : 's'} flagged in quality assurance`,
    `Seed Co leads all seed houses with ${seedHouseData[period][0].rate}% redemption rate`,
    `Chinhoyi district shows ${districtData[period].find(d => d.district === 'Chinhoyi')?.gap.toLocaleString()} unreturned bags — follow up required`,
    `${period === 'all' ? 'January' : 'Early period'} had the lowest dispatch volumes — consider seasonal analysis`,
  ];

  const districtColumns = [
    {
      title: 'District', dataIndex: 'district', key: 'district',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched', render: (v: number) => v.toLocaleString() },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed', render: (v: number) => <Text style={{ color: '#2E7D32' }}>{v.toLocaleString()}</Text> },
    {
      title: 'Rate', dataIndex: 'rate', key: 'rate',
      render: (v: number) => {
        const status = getStatus(v);
        return <Tag icon={status.icon} color={status.color}>{v}%</Tag>;
      },
    },
    {
      title: 'Status', key: 'status',
      render: (_: any, r: DistrictRow) => {
        const status = getStatus(r.rate);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    { title: 'Gap', dataIndex: 'gap', key: 'gap', render: (v: number) => <Text type="danger">{v.toLocaleString()}</Text> },
  ];

  const seedHouseColumns = [
    {
      title: 'Seed House', dataIndex: 'seedHouse', key: 'seedHouse',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched', render: (v: number) => v.toLocaleString() },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed', render: (v: number) => <Text style={{ color: '#2E7D32' }}>{v.toLocaleString()}</Text> },
    {
      title: 'Rate', dataIndex: 'rate', key: 'rate',
      render: (v: number) => <Tag color={v >= 90 ? 'green' : v >= 70 ? 'orange' : 'red'}>{v}%</Tag>,
    },
    {
      title: 'Verified Value', dataIndex: 'verifiedValue', key: 'verifiedValue',
      render: (v: number) => <Text style={{ color: '#1a3a5c' }}>US${(v / 1000).toFixed(0)}K</Text>,
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined /> Analytics Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Performance analytics and trend analysis — Pfumvudza/Intwasa Input Subsidy Programme
        </Text>
      </div>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Radio.Group
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          {periods.map(p => (
            <Radio.Button key={p.key} value={p.key}>{p.label}</Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #1a3a5c' }}>
            <Statistic
              title="Total Bags"
              value={overview.totalBags}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#1a3a5c', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>In system across all districts</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #2E7D32' }}>
            <Statistic
              title="Total Farmers"
              value={overview.totalFarmers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#2E7D32', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Registered beneficiaries</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #c49a2a' }}>
            <Statistic
              title="Avg Redemption Rate"
              value={overview.avgRedemptionRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: overview.avgRedemptionRate >= 70 ? '#2E7D32' : '#c49a2a', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Target: 70% minimum</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #8b1a1a' }}>
            <Statistic
              title="Total Flagged"
              value={overview.totalFlagged}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: overview.totalFlagged > 0 ? '#8b1a1a' : '#2E7D32', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {overview.totalFlagged === 0 ? 'No issues detected' : 'Requires investigation'}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={14}>
          <Card title={<><BarChartOutlined /> Redemption Trend</>}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 220, gap: 8, padding: '0 8px' }}>
              {trends.map((t, i) => {
                const heightPct = maxRedeemed > 0 ? (t.redeemed / maxRedeemed) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <Text style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>{t.redeemed.toLocaleString()}</Text>
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          background: 'linear-gradient(180deg, #2E7D32 0%, #1a3a5c 100%)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: 4,
                          transition: 'height 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px 4px 0 0',
                          }}
                        />
                      </div>
                    </div>
                    <Text style={{ fontSize: 10, color: '#888', marginTop: 6, whiteSpace: 'nowrap' }}>{t.month}</Text>
                  </div>
                );
              })}
            </div>
            <Divider style={{ margin: '12px 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
              <Space size={16}>
                <Space size={4}>
                  <div style={{ width: 12, height: 12, background: '#2E7D32', borderRadius: 2 }} />
                  <Text style={{ fontSize: 11 }}>Redeemed</Text>
                </Space>
                <Space size={4}>
                  <div style={{ width: 12, height: 12, background: '#1a3a5c', borderRadius: 2 }} />
                  <Text style={{ fontSize: 11 }}>Dispatched</Text>
                </Space>
              </Space>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Total: {trends.reduce((s, t) => s + t.redeemed, 0).toLocaleString()} redeemed of {trends.reduce((s, t) => s + t.dispatched, 0).toLocaleString()} dispatched
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={<><BulbOutlined /> Key Insights</>} style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {insights.map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: i % 2 === 0 ? 'rgba(26,58,92,0.03)' : 'transparent', borderRadius: 4 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: i === 0 ? '#fff1f0' : '#f6ffed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <BulbOutlined style={{ fontSize: 11, color: i === 0 ? '#8b1a1a' : '#c49a2a' }} />
                  </div>
                  <Text style={{ fontSize: 13, lineHeight: 1.5 }}>{insight}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* District Performance */}
      <Card
        title={<><BankOutlined /> District Performance</>}
        style={{ marginTop: 16 }}
      >
        <Table
          dataSource={districts}
          rowKey="district"
          pagination={false}
          size="small"
          columns={districtColumns}
        />
      </Card>

      {/* Seed House Performance */}
      <Card
        title={<><BankOutlined /> Seed House Performance</>}
        style={{ marginTop: 16 }}
      >
        <Table
          dataSource={seedHouses}
          rowKey="seedHouse"
          pagination={false}
          size="small"
          columns={seedHouseColumns}
        />
      </Card>
    </div>
  );
};

export default Analytics;
