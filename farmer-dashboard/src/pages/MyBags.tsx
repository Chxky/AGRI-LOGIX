import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Spin, Input, Empty } from 'antd';
import { InboxOutlined, SearchOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface SeedBag {
  id: string;
  variety: string;
  batchNumber: string;
  condition: string;
  redemptionTimestamp: string | null;
  certificationId: string;
  seedHouse: string;
}

const MOCK_BAGS: SeedBag[] = [
  { id: 'ZW-2026-0422', variety: 'SC 403', batchNumber: 'BATCH-2026-003', condition: 'redeemed', redemptionTimestamp: '2026-05-28T10:30:00Z', certificationId: 'SSI-CERT-2026-0451', seedHouse: 'Seed Co Zimbabwe' },
  { id: 'ZW-2026-0423', variety: 'SC 513', batchNumber: 'BATCH-2026-004', condition: 'redeemed', redemptionTimestamp: '2026-05-27T14:15:00Z', certificationId: 'SSI-CERT-2026-0452', seedHouse: 'Seed Co Zimbabwe' },
  { id: 'ZW-2026-0424', variety: 'SC 403', batchNumber: 'BATCH-2026-003', condition: 'redeemed', redemptionTimestamp: '2026-05-25T09:00:00Z', certificationId: 'SSI-CERT-2026-0453', seedHouse: 'Pioneer Zimbabwe' },
  { id: 'ZW-2026-0425', variety: 'SC 513', batchNumber: 'BATCH-2026-004', condition: 'dispatched', redemptionTimestamp: null, certificationId: 'SSI-CERT-2026-0454', seedHouse: 'Seed Co Zimbabwe' },
  { id: 'ZW-2026-0426', variety: 'SC 403', batchNumber: 'BATCH-2026-003', condition: 'dispatched', redemptionTimestamp: null, certificationId: 'SSI-CERT-2026-0455', seedHouse: 'Pioneer Zimbabwe' },
  { id: 'ZW-2026-0427', variety: 'PAN 53', batchNumber: 'BATCH-2026-005', condition: 'in_stock', redemptionTimestamp: null, certificationId: 'SSI-CERT-2026-0456', seedHouse: 'Pannar Zimbabwe' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  redeemed: { color: 'green', label: 'Redeemed' },
  dispatched: { color: 'blue', label: 'Dispatched' },
  in_stock: { color: 'orange', label: 'In Stock' },
  flagged: { color: 'red', label: 'Flagged' },
};

const MyBags: React.FC = () => {
  const [bags, setBags] = useState<SeedBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 500));
          setBags(MOCK_BAGS);
          setLoading(false);
          return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const farmerDoc = await getDocs(query(collection(db, 'farmers'), where('userId', '==', uid)));
        if (farmerDoc.empty) { setBags([]); setLoading(false); return; }
        const phone = farmerDoc.docs[0].data().phone;
        const bagsSnap = await getDocs(query(collection(db, 'seedBags'), where('farmerPhone', '==', phone)));
        setBags(bagsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as SeedBag)));
      } catch (err) {
        console.error('Failed to load bags', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = bags.filter(b =>
    !search || b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.variety.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Bag ID', dataIndex: 'id', key: 'id',
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{v}</Text>,
    },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: 'Seed House', dataIndex: 'seedHouse', key: 'seedHouse' },
    {
      title: 'Certification', dataIndex: 'certificationId', key: 'certificationId',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Status', dataIndex: 'condition', key: 'condition',
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Redeemed On', dataIndex: 'redemptionTimestamp', key: 'redemptionTimestamp',
      render: (v: string | null) =>
        v ? dayjs(v).format('DD MMM YYYY, HH:mm') : <Text type="secondary">—</Text>,
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <InboxOutlined /> My Seed Bags
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          All seed bags allocated to you under the Pfumvudza/Intwasa programme
        </Text>
      </div>

      <Card>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by bag ID or variety..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
          allowClear
        />
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No seed bags found" /> }}
        />
      </Card>
    </div>
  );
};

export default MyBags;
