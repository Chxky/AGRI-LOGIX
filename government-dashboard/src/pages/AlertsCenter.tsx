import React, { useState } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Row, Col,
  Statistic, Badge, Alert, Tabs, Descriptions, Timeline, Empty,
} from 'antd';
import {
  BellOutlined, WarningOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SafetyCertificateOutlined,
  AlertOutlined, EyeOutlined, FileSearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  district: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  assignedTo: string;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'ALT-001', severity: 'critical', category: 'Counterfeit',
    title: 'Suspected counterfeit batch in Masvingo',
    description: '3 bags from batch BATCH-2026-005 failed authentication checks. Packaging appears to be forged. Immediate investigation required.',
    district: 'Masvingo', timestamp: '2026-05-16T14:30:00Z',
    status: 'open', assignedTo: 'QA Inspector Moyo',
  },
  {
    id: 'ALT-002', severity: 'critical', category: 'Distribution Gap',
    title: 'Masvingo district: 33% bags unreturned',
    description: '600 of 1,800 dispatched bags have not been redeemed after 45 days. Exceeds 20% threshold. Possible diversion or logistics failure.',
    district: 'Masvingo', timestamp: '2026-05-15T09:00:00Z',
    status: 'investigating', assignedTo: 'District Officer Chikowero',
  },
  {
    id: 'ALT-003', severity: 'warning', category: 'Hash Chain',
    title: 'Hash chain verification anomaly in Gweru',
    description: 'One redemption log entry has a hash mismatch. Could indicate data corruption or tampering attempt. Chain integrity check recommended.',
    district: 'Gweru', timestamp: '2026-05-14T16:45:00Z',
    status: 'investigating', assignedTo: 'System Admin',
  },
  {
    id: 'ALT-004', severity: 'warning', category: 'Low Redemption',
    title: 'Bindura redemption rate below 50%',
    description: 'Only 880 of 900 dispatched bags redeemed (97.8%) but farmer registration is low. May indicate access issues for remote wards.',
    district: 'Bindura', timestamp: '2026-05-13T11:00:00Z',
    status: 'open', assignedTo: 'Extension Officer Ncube',
  },
  {
    id: 'ALT-005', severity: 'info', category: 'Milestone',
    title: 'Harare district: 95% redemption achieved',
    description: 'Harare has reached 95% redemption rate (1,420 of 1,500 bags). Top performing district. Recommend commendation.',
    district: 'Harare', timestamp: '2026-05-12T08:00:00Z',
    status: 'resolved', assignedTo: 'N/A',
  },
  {
    id: 'ALT-006', severity: 'info', category: 'Registration',
    title: 'Mashonaland East: 5,000th farmer registered',
    description: 'Milestone reached for farmer registration in Mashonaland East province. On track for season targets.',
    district: 'Marondera', timestamp: '2026-05-11T10:00:00Z',
    status: 'resolved', assignedTo: 'N/A',
  },
];

const severityConfig = {
  critical: { color: '#8b1a1a', bg: '#fff1f0', icon: <ExclamationCircleOutlined />, label: 'CRITICAL' },
  warning: { color: '#c49a2a', bg: '#fffbe6', icon: <WarningOutlined />, label: 'WARNING' },
  info: { color: '#1a3a5c', bg: '#e6f4ff', icon: <CheckCircleOutlined />, label: 'INFO' },
};

const statusConfig = {
  open: { color: 'red', label: 'Open' },
  investigating: { color: 'orange', label: 'Investigating' },
  resolved: { color: 'green', label: 'Resolved' },
};

const AlertsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const openAlerts = MOCK_ALERTS.filter(a => a.status === 'open');
  const investigatingAlerts = MOCK_ALERTS.filter(a => a.status === 'investigating');
  const criticalAlerts = MOCK_ALERTS.filter(a => a.severity === 'critical');

  const filteredAlerts = activeTab === 'all'
    ? MOCK_ALERTS
    : activeTab === 'open'
    ? openAlerts
    : activeTab === 'critical'
    ? criticalAlerts
    : MOCK_ALERTS.filter(a => a.status === 'resolved');

  const columns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: keyof typeof severityConfig) => (
        <Tag color={severityConfig[s].color} style={{ fontWeight: 600 }}>
          {severityConfig[s].icon} {severityConfig[s].label}
        </Tag>
      ),
      filters: [
        { text: 'Critical', value: 'critical' },
        { text: 'Warning', value: 'warning' },
        { text: 'Info', value: 'info' },
      ],
      onFilter: (value: any, record: AlertItem) => record.severity === value,
    },
    {
      title: 'Alert',
      key: 'alert',
      render: (_: any, record: AlertItem) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </div>
      ),
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: keyof typeof statusConfig) => (
        <Tag color={statusConfig[s].color}>{statusConfig[s].label}</Tag>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 140,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(v).format('DD MMM, HH:mm')}
        </Text>
      ),
      sorter: (a: AlertItem, b: AlertItem) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <BellOutlined /> Alerts & Monitoring Centre
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          System alerts, anomaly detection, and programme monitoring for all districts
        </Text>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #8b1a1a' }}>
            <Statistic
              title="Open Alerts"
              value={openAlerts.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#8b1a1a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #c49a2a' }}>
            <Statistic
              title="Investigating"
              value={investigatingAlerts.length}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#c49a2a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #8b1a1a' }}>
            <Statistic
              title="Critical"
              value={criticalAlerts.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#8b1a1a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderTop: '3px solid #2E7D32' }}>
            <Statistic
              title="Resolved This Week"
              value={MOCK_ALERTS.filter(a => a.status === 'resolved').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#2E7D32' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Alert Banner */}
      {openAlerts.filter(a => a.severity === 'critical').map(alert => (
        <Alert
          key={alert.id}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 8 }}
          message={
            <Space>
              <Text strong>{alert.id}: {alert.title}</Text>
              <Tag color="red">{alert.district}</Tag>
            </Space>
          }
          description={alert.description}
        />
      ))}

      {/* Alert Table */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: <Badge count={MOCK_ALERTS.length} size="small">All Alerts</Badge> },
            { key: 'open', label: <Badge count={openAlerts.length} size="small" color="red">Open</Badge> },
            { key: 'critical', label: <Badge count={criticalAlerts.length} size="small" color="red">Critical</Badge> },
            { key: 'resolved', label: 'Resolved' },
          ]}
        />
        <Table
          dataSource={filteredAlerts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
          rowClassName={(record) =>
            record.severity === 'critical' && record.status !== 'resolved'
              ? 'ant-table-row-selected'
              : ''
          }
        />
      </Card>

      {/* Monitoring Rules */}
      <Card title="Automated Monitoring Rules" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8f9fa' }}>
              <Text strong>Counterfeit Detection</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="green">Active</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Bags failing QR authentication or with mismatched certification IDs are automatically flagged
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8f9fa' }}>
              <Text strong>Distribution Gap Monitor</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="green">Active</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Districts with &gt;20% unreturned bags after 30 days trigger a warning alert
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#f8f9fa' }}>
              <Text strong>Hash Chain Integrity</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="green">Active</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Continuous verification of SHA-256 hash chain. Any break or mismatch triggers critical alert
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AlertsCenter;
