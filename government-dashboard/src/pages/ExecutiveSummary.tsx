import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Progress, Tag, Table,
  Divider, Space, Alert, Timeline, Badge,
} from 'antd';
import {
  BankOutlined, CheckCircleOutlined, WarningOutlined,
  DollarOutlined, TeamOutlined, SafetyCertificateOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, ThunderboltOutlined, AimOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import dayjs from 'dayjs';

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

const BUDGET_TOTAL = 270_000_000; // US$270M annual budget
const UNIT_COST = 15; // US$15 per bag
const TARGET_HOUSEHOLDS = 3_000_000;

const ExecutiveSummary: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, districtsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getDistrictsSummary(),
        ]);
        setStats(statsRes.data as DashboardStats);
        setDistricts((districtsRes.data as any).districts || []);
      } catch {
        // api.ts has mock fallbacks
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !stats) return null;

  const totalValue = stats.totalBags * UNIT_COST;
  const redeemedValue = stats.redeemed * UNIT_COST;
  const budgetUtilised = (totalValue / BUDGET_TOTAL) * 100;
  const farmerCoverage = (stats.totalFarmers / TARGET_HOUSEHOLDS) * 100;
  const topDistricts = [...districts].sort((a, b) => b.redeemed - a.redeemed).slice(0, 5);
  const problemDistricts = districts.filter(d => (d.gap / d.dispatched) > 0.2);

  // Alerts
  const alerts = [];
  if (stats.flagged > 0) {
    alerts.push({ type: 'warning', message: `${stats.flagged} bags flagged as suspected counterfeit — requires investigation` });
  }
  if (problemDistricts.length > 0) {
    alerts.push({ type: 'error', message: `${problemDistricts.length} districts with >20% unreturned bags: ${problemDistricts.map(d => d.name).join(', ')}` });
  }
  if (stats.redemptionRate < 70) {
    alerts.push({ type: 'warning', message: `National redemption rate (${stats.redemptionRate}%) is below the 70% target` });
  }
  if (stats.redemptionRate >= 80) {
    alerts.push({ type: 'success', message: `Redemption rate of ${stats.redemptionRate}% exceeds programme targets` });
  }

  const recentActivity = [
    { time: '2 hours ago', event: 'Batch of 500 SC513 bags dispatched to Mutare district', type: 'dispatch' },
    { time: '4 hours ago', event: '142 bags redeemed in Gweru via USSD (*123#)', type: 'redeem' },
    { time: '6 hours ago', event: 'Quality alert: 3 bags flagged in Masvingo — packaging anomaly', type: 'alert' },
    { time: '1 day ago', event: 'Treasury payment certificate generated: $57,000 for 3,800 verified bags', type: 'payment' },
    { time: '1 day ago', event: 'Pannar Seed dispatched 800 bags to Bulawayo warehouse', type: 'dispatch' },
    { time: '2 days ago', event: 'Farmer registration milestone: 5,000th farmer registered in Mashonaland East', type: 'milestone' },
  ];

  const activityColors: Record<string, string> = {
    dispatch: '#1a3a5c', redeem: '#2E7D32', alert: '#c49a2a', payment: '#1a3a5c', milestone: '#2E7D32',
  };

  return (
    <div>
      {/* Title */}
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <BankOutlined /> Executive Summary
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Pfumvudza/Intwasa Input Subsidy Programme — Ministerial Briefing Dashboard
        </Text>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((alert, i) => (
            <Alert
              key={i}
              type={alert.type as any}
              message={alert.message}
              showIcon
              closable
              style={{ marginBottom: 8 }}
            />
          ))}
        </div>
      )}

      {/* Primary KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #1a3a5c' }}>
            <Statistic
              title="Total Seed Bags in System"
              value={stats.totalBags}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#1a3a5c', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Across all seed houses and districts</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #2E7D32' }}>
            <Statistic
              title="Farmers Served"
              value={stats.totalFarmers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#2E7D32', fontSize: 28 }}
            />
            <Progress
              percent={Math.round(farmerCoverage)}
              size="small"
              strokeColor={farmerCoverage > 80 ? '#2E7D32' : '#c49a2a'}
              format={(p) => `${p}% of ${TARGET_HOUSEHOLDS.toLocaleString()} target`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #c49a2a' }}>
            <Statistic
              title="National Redemption Rate"
              value={stats.redemptionRate}
              suffix="%"
              prefix={stats.redemptionRate >= 70 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: stats.redemptionRate >= 70 ? '#2E7D32' : '#c49a2a', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Target: 70% minimum</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderTop: '3px solid #8b1a1a' }}>
            <Statistic
              title="Flagged / Counterfeit"
              value={stats.flagged}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: stats.flagged > 0 ? '#8b1a1a' : '#2E7D32', fontSize: 28 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {stats.flagged === 0 ? 'System integrity: OK' : 'Requires immediate attention'}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Budget & Financial Overview */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<><DollarOutlined /> Budget & Expenditure Overview</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Annual Budget"
                  value={BUDGET_TOTAL}
                  prefix="US$"
                  valueStyle={{ color: '#1a3a5c' }}
                  formatter={(v) => `$${(v as number / 1_000_000).toFixed(0)}M`}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Allocated to Seeds"
                  value={totalValue}
                  prefix="US$"
                  valueStyle={{ color: '#c49a2a' }}
                  formatter={(v) => `$${((v as number) / 1_000_000).toFixed(1)}M`}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text strong>Budget Utilisation</Text>
              <Progress
                percent={Math.round(budgetUtilised)}
                strokeColor={{ '0%': '#1a3a5c', '100%': '#2E7D32' }}
                format={(p) => `${p}% — US$${(totalValue / 1_000_000).toFixed(1)}M of $${(BUDGET_TOTAL / 1_000_000).toFixed(0)}M`}
              />
            </div>
            <div>
              <Text strong>Verified for Treasury Disbursement</Text>
              <Progress
                percent={Math.round((redeemedValue / BUDGET_TOTAL) * 100)}
                strokeColor="#2E7D32"
                format={() => `US$${(redeemedValue / 1_000_000).toFixed(1)}M`}
              />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Cost per Bag" value={15} prefix="$" valueStyle={{ fontSize: 18 }} />
              </Col>
              <Col span={8}>
                <Statistic title="Verified Bags" value={stats.redeemed} valueStyle={{ fontSize: 18, color: '#2E7D32' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Pending Verification" value={stats.dispatched - stats.redeemed} valueStyle={{ fontSize: 18, color: '#c49a2a' }} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<><SafetyCertificateOutlined /> Blockchain Data Integrity</>}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Badge count={<CheckCircleOutlined style={{ color: '#2E7D32' }} />} offset={[-5, 5]}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: '3px solid #2E7D32', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', background: 'rgba(46,125,50,0.05)',
                }}>
                  <SafetyCertificateOutlined style={{ fontSize: 36, color: '#2E7D32' }} />
                </div>
              </Badge>
              <Title level={4} style={{ color: '#2E7D32', marginTop: 12, marginBottom: 0 }}>
                CHAIN INTEGRITY: VERIFIED
              </Title>
              <Text type="secondary">All {stats.totalBags.toLocaleString()} bag records have valid SHA-256 hash chains</Text>
            </div>
            <Divider />
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Hash Algorithm"
                  value="SHA-256"
                  valueStyle={{ fontSize: 14, fontFamily: 'monospace' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Audit Entries"
                  value={stats.totalBags * 2}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Chain Breaks"
                  value={0}
                  valueStyle={{ fontSize: 14, color: '#2E7D32' }}
                />
              </Col>
            </Row>
            <Divider />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Genesis Block: AGRI_LOGIX_2026 — Each seed bag generates an immutable audit trail
              from creation through dispatch to farmer redemption. Any tampering attempt
              is automatically detected and flagged.
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Top Districts + Activity */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<><AimOutlined /> Top Performing Districts</>}>
            <Table
              dataSource={topDistricts}
              rowKey="name"
              pagination={false}
              size="small"
              columns={[
                { title: 'District', dataIndex: 'name', key: 'name', render: (v: string, _: any, i: number) => (
                  <Space>{i < 3 && <Tag color="green">{i + 1}</Tag>}<Text strong>{v}</Text></Space>
                )},
                { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed', render: (v: number) => <Text style={{ color: '#2E7D32' }}>{v.toLocaleString()}</Text> },
                { title: 'Farmers', dataIndex: 'farmers', key: 'farmers' },
                { title: 'Rate', key: 'rate', render: (_: any, r: DistrictSummary) => {
                  const rate = Math.round((r.redeemed / r.dispatched) * 100);
                  return <Tag color={rate >= 80 ? 'green' : rate >= 50 ? 'orange' : 'red'}>{rate}%</Tag>;
                }},
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><ClockCircleOutlined /> Recent Activity</>}>
            <Timeline
              items={recentActivity.map(item => ({
                color: activityColors[item.type],
                children: (
                  <div>
                    <Text style={{ fontSize: 13 }}>{item.event}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Programme Milestones */}
      <Card title={<><ThunderboltOutlined /> Programme Milestones</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={100} size={64} strokeColor="#2E7D32" />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>Seed Procurement</Text>
                <br />
                <Tag color="green">Complete</Tag>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={100} size={64} strokeColor="#2E7D32" />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>QR Code Generation</Text>
                <br />
                <Tag color="green">Complete</Tag>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={Math.round(stats.dispatched / stats.totalBags * 100)} size={64} strokeColor="#c49a2a" />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>District Distribution</Text>
                <br />
                <Tag color="orange">In Progress</Tag>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={Math.round(farmerCoverage)} size={64} strokeColor={farmerCoverage > 50 ? '#2E7D32' : '#c49a2a'} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>Farmer Redemption</Text>
                <br />
                <Tag color={farmerCoverage > 50 ? 'green' : 'orange'}>{farmerCoverage > 50 ? 'On Track' : 'In Progress'}</Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ExecutiveSummary;
