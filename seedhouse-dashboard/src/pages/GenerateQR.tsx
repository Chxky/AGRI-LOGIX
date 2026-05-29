import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Button, Typography,
  message, Table, Space, Divider, Row, Col, Tag, Tooltip,
} from 'antd';
import {
  QrcodeOutlined, DownloadOutlined, PrinterOutlined, PlusOutlined,
} from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { functions, db } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';

const { Title } = Typography;

interface SeedHouse {
  houseId: string;
  name: string;
}

interface GeneratedBag {
  bagId: string;
  qrCodeData: string;
  qrCodeBase64: string;
  variety: string;
  batchNumber: string;
}

const SEED_VARIETIES = [
  'SC513', 'SC529', 'SC637', 'SC649', 'SC719',
  'SC727', 'SC403', 'SC415', 'Panther', 'Bird',
];

const GenerateQR: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [seedHouses, setSeedHouses] = useState<SeedHouse[]>([]);
  const [generatedBags, setGeneratedBags] = useState<GeneratedBag[]>([]);
  const [batchInfo, setBatchInfo] = useState<{ batchNumber: string; variety: string } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSeedHouses = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'seedHouses'));
        const houses: SeedHouse[] = [];
        snapshot.docs.forEach(doc => houses.push({ houseId: doc.id, ...doc.data() } as SeedHouse));
        setSeedHouses(houses);
      } catch {
        if (!isDemoMode()) return;
        console.warn('Using mock seed houses');
        setSeedHouses([
          { houseId: 'seed-co-hwange', name: 'Seed Co Zimbabwe (Hwange)' },
          { houseId: 'pannar-mutare', name: 'Pannar Seed (Mutare)' },
          { houseId: 'seed-co-harare', name: 'Seed Co Zimbabwe (Harare)' },
        ]);
      }
    };
    loadSeedHouses();
  }, []);

  const handleGenerate = async (values: any) => {
    setLoading(true);
    try {
      const generateQR = httpsCallable(functions, 'generateSeedBagQR');

      const result = await generateQR({
        variety: values.variety,
        batchNumber: values.batchNumber,
        certificationId: values.certificationId,
        seedHouseId: values.seedHouseId,
        quantity: values.quantity,
      });

      const data = result.data as any;
      setGeneratedBags(data.bags);
      setBatchInfo({ batchNumber: values.batchNumber, variety: values.variety });

      message.success(`Generated ${data.bags.length} QR codes for batch ${values.batchNumber}`);
    } catch (error: any) {
      if (isDemoMode()) {
        const batchData = {
          batchNumber: values.batchNumber,
          variety: values.variety,
          quantity: values.quantity,
        };
        const mockBags: GeneratedBag[] = Array.from({ length: values.quantity || 10 }, (_, i) => {
          const bagId = `${values.variety}-${Date.now().toString(36).toUpperCase()}-${String(i + 1).padStart(4, '0')}`;
          return {
            bagId,
            qrCodeData: `agrilogix://verify/${bagId}`,
            qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
            variety: values.variety,
            batchNumber: values.batchNumber,
          };
        });
        setGeneratedBags(mockBags);
        setBatchInfo(batchData);
        message.success(`Generated ${mockBags.length} QR codes for batch ${values.batchNumber}`);
        return;
      }
      message.error(error.message || 'Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent = [
      'bagId,qrCodeData,variety,batchNumber',
      ...generatedBags.map(b =>
        `${b.bagId},${b.qrCodeData},${b.variety},${b.batchNumber}`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batchInfo?.batchNumber || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', ellipsis: true },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    {
      title: 'QR Code',
      dataIndex: 'qrCodeBase64',
      key: 'qrCode',
      render: (base64: string, record: GeneratedBag) => (
        <img src={base64} alt={`QR for ${record.bagId}`} style={{ width: 80, height: 80 }} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GeneratedBag) => (
        <Tooltip title="Download QR">
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.download = `qr-${record.bagId}.png`;
              link.href = record.qrCodeBase64;
              link.click();
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>
        <QrcodeOutlined /> Generate Seed Bag QR Codes
      </Title>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="Batch Details">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{ quantity: 50 }}
            >
              <Form.Item
                name="seedHouseId"
                label="Seed House"
                rules={[{ required: true, message: 'Select seed house' }]}
              >
                <Select placeholder="Select your seed house">
                  {seedHouses.map(h => (
                    <Select.Option key={h.houseId} value={h.houseId}>
                      {h.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="variety"
                label="Seed Variety"
                rules={[{ required: true, message: 'Select variety' }]}
              >
                <Select placeholder="Select variety">
                  {SEED_VARIETIES.map(v => (
                    <Select.Option key={v} value={v}>{v}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="batchNumber"
                label="Batch Number"
                rules={[{ required: true, message: 'Enter batch number' }]}
              >
                <Input placeholder="e.g. BATCH-2026-001" />
              </Form.Item>

              <Form.Item
                name="certificationId"
                label="Certification ID (Seed Services Institute)"
                rules={[{ required: true, message: 'Enter certification ID' }]}
              >
                <Input placeholder="e.g. SSI-CERT-2026-XXXX" />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Number of Bags"
                rules={[{ required: true, message: 'Enter quantity' }]}
              >
                <InputNumber
                  min={1}
                  max={10000}
                  style={{ width: '100%' }}
                  placeholder="Number of QR codes to generate"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<PlusOutlined />}
                  block
                  size="large"
                >
                  Generate QR Codes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <span>Generated QR Codes</span>
                {batchInfo && (
                  <Tag color="green">
                    {batchInfo.variety} - {batchInfo.batchNumber}
                  </Tag>
                )}
              </Space>
            }
            extra={
              generatedBags.length > 0 && (
                <Space>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    Print
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
                    Export CSV
                  </Button>
                </Space>
              )
            }
          >
            {generatedBags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                <QrcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <br />
                Fill in the batch details and generate QR codes for your seed bags.
              </div>
            ) : (
              <>
                <div ref={printRef} className="print-area">
                  <div className="qr-grid">
                    {generatedBags.slice(0, 50).map(bag => (
                      <div key={bag.bagId} className="qr-card">
                        <img src={bag.qrCodeBase64} alt={bag.bagId} />
                        <div style={{ fontSize: 10, marginTop: 4, wordBreak: 'break-all' }}>
                          {bag.bagId}
                        </div>
                        <div style={{ fontSize: 9, color: '#666' }}>
                          {bag.variety}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {generatedBags.length > 50 && (
                  <div style={{ textAlign: 'center', marginTop: 16, color: '#999' }}>
                    Showing first 50 of {generatedBags.length} bags. Print or export CSV for full list.
                  </div>
                )}

                <Divider />

                <Table
                  dataSource={generatedBags}
                  columns={columns}
                  rowKey="bagId"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="small"
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GenerateQR;
