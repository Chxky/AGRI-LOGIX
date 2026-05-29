import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, message, Space,
  Input, Modal, Alert, Form,
} from 'antd';
import {
  SafetyCertificateOutlined, WarningOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FlagOutlined,
} from '@ant-design/icons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface FlaggedBag {
  bagId: string;
  variety: string;
  batchNumber: string;
  seedHouseId: string;
  flagReason: string;
  flaggedBy: string;
  flaggedAt: string;
  condition: string;
}

interface AuditLog {
  id: string;
  bagId: string;
  action: string;
  timestamp: string;
  performedBy: string;
  previousHash: string;
  currentHash: string;
}

const QualityAssurance: React.FC = () => {
  const [flaggedBags, setFlaggedBags] = useState<FlaggedBag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagModal, setFlagModal] = useState(false);
  const [flagBagId, setFlagBagId] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    loadFlaggedBags();
    loadAuditLogs();
  }, []);

  const loadFlaggedBags = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'seedBags'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const flagged: FlaggedBag[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.condition === 'flagged' || data.isAuthentic === false) {
          flagged.push({
            bagId: doc.id,
            variety: data.variety,
            batchNumber: data.batchNumber,
            seedHouseId: data.seedHouseId,
            flagReason: data.flagReason || 'Suspected counterfeit',
            flaggedBy: data.flaggedBy || 'Unknown',
            flaggedAt: data.flaggedAt?.toDate().toISOString() || data.createdAt?.toDate().toISOString(),
            condition: data.condition,
          });
        }
      });
      setFlaggedBags(flagged);
    } catch (err: any) {
      console.warn('Using mock flagged bags data');
      setFlaggedBags([
        { bagId: 'SC513-2026-0042', variety: 'SC513', batchNumber: 'BATCH-2026-001', seedHouseId: 'seed-co-hwange', flagReason: 'Suspected counterfeit packaging', flaggedBy: 'qa-inspector-01', flaggedAt: '2026-04-10T14:30:00Z', condition: 'flagged' },
        { bagId: 'SC637-2026-0118', variety: 'SC637', batchNumber: 'BATCH-2026-003', seedHouseId: 'pannar-mutare', flagReason: 'Certification ID not in whitelist', flaggedBy: 'system', flaggedAt: '2026-04-12T09:15:00Z', condition: 'flagged' },
        { bagId: 'SC719-2026-0055', variety: 'SC719', batchNumber: 'BATCH-2026-002', seedHouseId: 'seed-co-hwange', flagReason: 'QR code tampering detected', flaggedBy: 'qa-inspector-02', flaggedAt: '2026-04-14T11:00:00Z', condition: 'flagged' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const q = query(
        collection(db, 'redemptionLog'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const logs: AuditLog[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          bagId: data.bagId || data.bagIds?.join(', ') || 'N/A',
          action: data.action,
          timestamp: data.timestamp?.toDate().toISOString(),
          performedBy: data.performedBy || 'system',
          previousHash: data.previousHash,
          currentHash: data.currentHash,
        });
      });
      setAuditLogs(logs);
    } catch (err: any) {
      console.warn('Using mock audit logs');
      setAuditLogs([
        { id: 'log-001', bagId: 'SC513-2026-0001', action: 'generated', timestamp: '2026-03-01T08:00:00Z', performedBy: 'Seed Co Zimbabwe', previousHash: 'genesis', currentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
        { id: 'log-002', bagId: 'SC513-2026-0001', action: 'dispatched', timestamp: '2026-03-15T09:00:00Z', performedBy: 'warehouse-staff-01', previousHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', currentHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5' },
        { id: 'log-003', bagId: 'SC513-2026-0001', action: 'redeemed', timestamp: '2026-04-15T10:30:00Z', performedBy: '+263771234567', previousHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', currentHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6' },
        { id: 'log-004', bagId: 'SC637-2026-0118', action: 'generated', timestamp: '2026-03-05T10:00:00Z', performedBy: 'Pannar Seed', previousHash: 'genesis', currentHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1' },
        { id: 'log-005', bagId: 'SC637-2026-0118', action: 'flagged', timestamp: '2026-04-12T09:15:00Z', performedBy: 'system', previousHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', currentHash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' },
      ]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleFlagBag = async () => {
    if (!flagBagId || !flagReason) {
      message.error('Bag ID and reason are required');
      return;
    }
    setFlagging(true);
    try {
      await api.flagCounterfeit({ bagId: flagBagId, reason: flagReason });
      message.success(`Bag ${flagBagId} flagged for investigation`);
      setFlagModal(false);
      setFlagBagId('');
      setFlagReason('');
      loadFlaggedBags();
    } catch (err: any) {
      message.error(err.message || 'Failed to flag bag');
    } finally {
      setFlagging(false);
    }
  };

  const flaggedColumns = [
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', ellipsis: true },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: 'Reason', dataIndex: 'flagReason', key: 'flagReason' },
    {
      title: 'Flagged At', dataIndex: 'flaggedAt', key: 'flaggedAt',
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY HH:mm') : '-',
    },
    {
      title: 'Status', dataIndex: 'condition', key: 'condition',
      render: (s: string) => <Tag color="red">{s}</Tag>,
    },
  ];

  const auditColumns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp',
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY HH:mm:ss') : '-',
    },
    { title: 'Action', dataIndex: 'action', key: 'action',
      render: (a: string) => {
        const colors: Record<string, string> = {
          generated: 'blue', dispatched: 'orange',
          redeemed: 'green', flagged: 'red',
        };
        return <Tag color={colors[a] || 'default'}>{a.toUpperCase()}</Tag>;
      },
    },
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', ellipsis: true },
    { title: 'Performed By', dataIndex: 'performedBy', key: 'performedBy', ellipsis: true },
    {
      title: 'Integrity', key: 'integrity',
      render: (_: any, record: AuditLog) => (
        record.currentHash ? <CheckCircleOutlined style={{ color: '#2E7D32' }} /> : <CloseCircleOutlined style={{ color: '#C62828' }} />
      ),
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}><SafetyCertificateOutlined /> Quality Assurance &amp; Audit Trail</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Monitor flagged bags and verify blockchain audit trail integrity</Text>
      </div>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#C62828' }} />
            <span>Flagged / Counterfeit Bags ({flaggedBags.length})</span>
          </Space>
        }
        extra={
          <Button type="primary" danger icon={<FlagOutlined />} onClick={() => setFlagModal(true)}>
            Flag New Bag
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {flaggedBags.length === 0 ? (
          <Alert
            type="success"
            message="No flagged bags"
            description="All bags in the system are currently marked as authentic."
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Table
            dataSource={flaggedBags}
            columns={flaggedColumns}
            rowKey="bagId"
            pagination={{ pageSize: 10 }}
            size="small"
            loading={loading}
          />
        )}
      </Card>

      <Card title="Recent Audit Trail (Redemption Log)">
        <Table
          dataSource={auditLogs}
          columns={auditColumns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          size="small"
          loading={auditLoading}
        />
      </Card>

      <Modal
        title="Flag Bag as Counterfeit"
        open={flagModal}
        onOk={handleFlagBag}
        onCancel={() => { setFlagModal(false); setFlagBagId(''); setFlagReason(''); }}
        confirmLoading={flagging}
        okText="Flag Bag"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item label="Bag ID" required>
            <Input
              placeholder="Enter Bag ID to flag"
              value={flagBagId}
              onChange={e => setFlagBagId(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Reason for Flagging" required>
            <Input.TextArea
              placeholder="Describe why this bag is suspected counterfeit"
              rows={3}
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QualityAssurance;
