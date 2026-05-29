import React, { useState, useEffect } from 'react';
import {
  Card, Form, Select, Button, Typography, message, Table,
  Input, Tag, Row, Col, Statistic, Descriptions,
} from 'antd';
import { SendOutlined, SearchOutlined, ScanOutlined } from '@ant-design/icons';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';

const { Title } = Typography;

interface Bag {
  bagId: string;
  variety: string;
  batchNumber: string;
  condition: string;
}

interface DistrictOption {
  name: string;
  province: string;
}

const DISTRICTS: DistrictOption[] = [
  { name: 'Mutare', province: 'Manicaland' },
  { name: 'Chipinge', province: 'Manicaland' },
  { name: 'Bindura', province: 'Mashonaland Central' },
  { name: 'Marondera', province: 'Mashonaland East' },
  { name: 'Chinhoyi', province: 'Mashonaland West' },
  { name: 'Masvingo', province: 'Masvingo' },
  { name: 'Gweru', province: 'Midlands' },
  { name: 'Bulawayo', province: 'Bulawayo' },
  { name: 'Harare', province: 'Harare' },
  { name: 'Lupane', province: 'Matabeleland North' },
  { name: 'Gwanda', province: 'Matabeleland South' },
];

const DispatchBags: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inStockBags, setInStockBags] = useState<Bag[]>([]);
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  useEffect(() => {
    loadInStockBags();
  }, []);

  const loadInStockBags = async () => {
    try {
      const q = query(collection(db, 'seedBags'), where('condition', '==', 'in_stock'));
      const snapshot = await getDocs(q);
      const bags: Bag[] = [];
      snapshot.docs.forEach(doc => {
        bags.push({ bagId: doc.id, ...doc.data() } as Bag);
      });
      setInStockBags(bags);
    } catch {
      if (!isDemoMode()) return;
      console.warn('Using mock in-stock bags');
      setInStockBags([
        { bagId: 'SC513-2026-0101', variety: 'SC513', batchNumber: 'BATCH-2026-001', condition: 'in_stock' },
        { bagId: 'SC513-2026-0102', variety: 'SC513', batchNumber: 'BATCH-2026-001', condition: 'in_stock' },
        { bagId: 'SC637-2026-0201', variety: 'SC637', batchNumber: 'BATCH-2026-002', condition: 'in_stock' },
        { bagId: 'SC637-2026-0202', variety: 'SC637', batchNumber: 'BATCH-2026-002', condition: 'in_stock' },
        { bagId: 'SC719-2026-0301', variety: 'SC719', batchNumber: 'BATCH-2026-003', condition: 'in_stock' },
      ]);
    }
  };

  const filteredBags = inStockBags.filter(bag =>
    bag.bagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bag.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bag.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScanInput = (value: string) => {
    setScannedCode(value);
    if (value && !selectedBagIds.includes(value)) {
      const exists = inStockBags.find(b => b.bagId === value);
      if (exists) {
        setSelectedBagIds(prev => [...prev, value]);
        message.success(`Bag ${value} added to dispatch list`);
      } else {
        message.warning(`Bag ${value} not found or not in stock`);
      }
    }
    setScannedCode('');
  };

  const handleDispatch = async (values: any) => {
    if (selectedBagIds.length === 0) {
      message.error('Select at least one bag to dispatch');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'distributions'), {
        bagIds: selectedBagIds,
        destinationDistrict: values.district,
        dispatchedBy: auth.currentUser?.uid || 'unknown',
        dispatchedDate: Timestamp.now(),
        status: 'in_transit',
      });

      message.success(
        `Dispatched ${selectedBagIds.length} bags to ${values.district}`
      );

      setSelectedBagIds([]);
      form.resetFields();
      loadInStockBags();
    } catch (error: any) {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 800));
        message.success(`Dispatched ${selectedBagIds.length} bags to ${values.district}`);
        setSelectedBagIds([]);
        form.resetFields();
        return;
      }
      message.error(error.message || 'Dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Bag ID',
      dataIndex: 'bagId',
      key: 'bagId',
      ellipsis: true,
    },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: 'Status', dataIndex: 'condition', key: 'condition',
      render: (status: string) => <Tag color="blue">{status}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Bag) => (
        <Button
          type={selectedBagIds.includes(record.bagId) ? 'primary' : 'default'}
          size="small"
          onClick={() => {
            setSelectedBagIds(prev =>
              prev.includes(record.bagId)
                ? prev.filter(id => id !== record.bagId)
                : [...prev, record.bagId]
            );
          }}
        >
          {selectedBagIds.includes(record.bagId) ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  const selectedBagsData = selectedBagIds.map(id =>
    inStockBags.find(b => b.bagId === id)
  ).filter(Boolean) as Bag[];

  return (
    <div>
      <Title level={4}>
        <SendOutlined /> Dispatch Seed Bags
      </Title>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Dispatch Details">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleDispatch}
            >
              <Form.Item
                name="district"
                label="Destination District"
                rules={[{ required: true, message: 'Select district' }]}
              >
                <Select
                  showSearch
                  placeholder="Select district"
                  optionFilterProp="label"
                >
                  {DISTRICTS.map(d => (
                    <Select.Option
                      key={d.name}
                      value={d.name}
                      label={`${d.name}, ${d.province}`}
                    >
                      {d.name}, {d.province}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Statistic
                  title="Selected Bags"
                  value={selectedBagIds.length}
                  suffix="bags"
                  valueStyle={{ color: '#1B5E20' }}
                />
              </Card>

              {selectedBagsData.length > 0 && (
                <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Varieties">
                      {Array.from(new Set(selectedBagsData.map(b => b.variety))).join(', ')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Batches">
                      {Array.from(new Set(selectedBagsData.map(b => b.batchNumber))).join(', ')}
                  </Descriptions.Item>
                </Descriptions>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  block
                  size="large"
                  disabled={selectedBagIds.length === 0}
                >
                  Dispatch {selectedBagIds.length > 0 ? `(${selectedBagIds.length} bags)` : ''}
                </Button>
              </Form.Item>
            </Form>

            {scanMode && (
              <Card title="Scan QR Code" size="small" style={{ marginTop: 16 }}>
                <Input
                  placeholder="Scan or type bag QR code"
                  value={scannedCode}
                  onChange={e => handleScanInput(e.target.value)}
                  prefix={<ScanOutlined />}
                  size="large"
                  autoFocus
                />
              </Card>
            )}

            <Button
              type="dashed"
              block
              onClick={() => setScanMode(!scanMode)}
              style={{ marginTop: 8 }}
            >
              <ScanOutlined /> {scanMode ? 'Hide Scanner' : 'Scan QR Code'}
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Available Bags (In Stock)"
            extra={
              <Input
                placeholder="Search bags..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            }
          >
            <Table
              dataSource={filteredBags}
              columns={columns}
              rowKey="bagId"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
              rowSelection={{
                selectedRowKeys: selectedBagIds,
                onChange: (keys) => setSelectedBagIds(keys as string[]),
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DispatchBags;
