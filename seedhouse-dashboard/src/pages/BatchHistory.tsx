import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Typography, Space, Button, message,
} from 'antd';
import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import { collection, getDocs, query, where, orderBy, limit, getFirestore, Timestamp } from 'firebase/firestore';

const { Title, Text } = Typography;

interface BatchRecord {
  distributionId: string;
  destinationDistrict: string;
  status: string;
  bagCount: number;
  dispatchedDate: string;
  dispatchedBy: string;
}

const BatchHistory: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const snapshot = await getDocs(
        query(
          collection(db, 'distributions'),
          orderBy('dispatchedDate', 'desc'),
          limit(100)
        )
      );
      const records: BatchRecord[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        records.push({
          distributionId: doc.id,
          destinationDistrict: data.destinationDistrict,
          status: data.status,
          bagCount: data.bagIds?.length || 0,
          dispatchedDate: data.dispatchedDate?.toDate().toISOString() || '',
          dispatchedBy: data.dispatchedBy,
        });
      });
      setBatches(records);
    } catch (error: any) {
      message.error('Failed to load batch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const columns = [
    {
      title: 'Distribution ID',
      dataIndex: 'distributionId',
      key: 'distributionId',
      ellipsis: true,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    { title: 'District', dataIndex: 'destinationDistrict', key: 'destinationDistrict' },
    { title: 'Bags', dataIndex: 'bagCount', key: 'bagCount' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          in_transit: 'orange',
          delivered: 'green',
          partially_redeemed: 'blue',
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Dispatched Date',
      dataIndex: 'dispatchedDate',
      key: 'dispatchedDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  return (
    <div>
      <Title level={4}>
        <HistoryOutlined /> Dispatch History
      </Title>

      <Card
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadBatches}>
            Refresh
          </Button>
        }
      >
        <Table
          dataSource={batches}
          columns={columns}
          rowKey="distributionId"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
};

export default BatchHistory;
