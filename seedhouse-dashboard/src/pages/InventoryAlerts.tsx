import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Radio, Space, Empty } from 'antd';
import { AlertOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#C62828', label: 'High' },
  medium: { color: '#F9A825', label: 'Medium' },
  low: { color: '#1565C0', label: 'Low' },
};

const alertTypeLabel: Record<string, string> = {
  stale_stock: 'Stale Stock',
  low_redemption: 'Low Redemption',
  certification_expiring: 'Certification',
  pending_distributions: 'Pending Distribution',
};

const InventoryAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const getAlerts = httpsCallable(functions, 'getInventoryAlerts');
        const result = await getAlerts();
        setAlerts((result.data as any).alerts || []);
      } catch (error) {
        if (!isDemoMode()) throw error;
        console.warn('Using mock alert data');
        setAlerts([
          { type: 'stale_stock', severity: 'medium', title: 'Stale Stock Detected', message: '45 bag(s) have been in stock for over 90 days without movement.', timestamp: new Date().toISOString() },
          { type: 'low_redemption', severity: 'high', title: 'Low Redemption in Gweru', message: 'Gweru has only 25% redemption rate (150/600 bags).', timestamp: new Date().toISOString() },
          { type: 'certification_expiring', severity: 'high', title: 'Certification Expiring Soon', message: 'Certification CERT-2024-0831 (Maize) expires on 15 June 2026.', timestamp: new Date().toISOString() },
          { type: 'pending_distributions', severity: 'low', title: 'Pending Distributions', message: '2 distribution(s) are still in progress.', timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const highCount = alerts.filter(a => a.severity === 'high').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Inventory Alerts
        <Tag style={{ marginLeft: 12 }} color="blue">{dayjs().format('DD MMM YYYY')}</Tag>
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Alerts"
              value={alerts.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#1B5E20' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="High Severity"
              value={highCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: highCount > 0 ? '#C62828' : '#666' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Text strong>Filter by severity:</Text>
          <Radio.Group value={filter} onChange={e => setFilter(e.target.value)}>
            <Radio.Button value="all">All ({alerts.length})</Radio.Button>
            <Radio.Button value="high">High ({alerts.filter(a => a.severity === 'high').length})</Radio.Button>
            <Radio.Button value="medium">Medium ({alerts.filter(a => a.severity === 'medium').length})</Radio.Button>
            <Radio.Button value="low">Low ({alerts.filter(a => a.severity === 'low').length})</Radio.Button>
          </Radio.Group>
        </Space>

        {filteredAlerts.length === 0 ? (
          <Empty description="No alerts found" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAlerts.map((alert, index) => {
              const config = severityConfig[alert.severity];
              return (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <Card
                    style={{ borderLeft: `4px solid ${config.color}` }}
                    hoverable
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'orange' : 'blue'}>
                          {config.label}
                        </Tag>
                        <Tag>{alertTypeLabel[alert.type] || alert.type}</Tag>
                      </Space>
                      <Text strong style={{ fontSize: 16 }}>{alert.title}</Text>
                      <Text type="secondary">{alert.message}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(alert.timestamp).format('DD MMM YYYY HH:mm')}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default InventoryAlerts;
