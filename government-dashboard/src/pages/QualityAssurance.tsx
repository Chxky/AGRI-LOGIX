import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, message, Space,
  Input, Modal, Alert, Form,
} from 'antd';
import {
  SafetyCertificateOutlined, WarningOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FlagOutlined,
} from '@ant-design/icons';
import { collection, query, orderBy, limit, getDocs, getFirestore } from 'firebase/firestore';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

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
      const db = getFirestore();
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
      message.error('Failed to load quality data');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const db = getFirestore();
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
      console.error('Failed to load audit logs:', err);
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
      <Title level={4}><SafetyCertificateOutlined /> Quality Assurance & Audit Trail</Title>

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
