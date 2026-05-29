import React, { useState } from 'react';
import { Card, Typography, Button, Spin, Statistic, Table, Tag, Alert, Row, Col, Tooltip, Collapse, Space, Divider, Steps, Modal, Descriptions, Input } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined,
  ReloadOutlined, LinkOutlined, ExperimentOutlined,
  WarningOutlined, NodeIndexOutlined, AuditOutlined,
  LockOutlined, InfoCircleOutlined, FileTextOutlined,
  DownloadOutlined, VerifiedOutlined, CrownOutlined,
  HistoryOutlined, KeyOutlined, SearchOutlined,
  BookOutlined, FlagOutlined, EnvironmentOutlined,
  CloudServerOutlined, UserOutlined,
} from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface AuditBlock {
  id: string;
  bagId: string;
  action: string;
  timestamp: string;
  performedBy: string;
  destinationDistrict: string | null;
  previousHash: string;
  currentHash: string;
}

interface AuditResult {
  verified: boolean;
  totalBlocks: number;
  checkedBlocks: number;
  firstBlock: { id: string; action: string; currentHash: string } | null;
  lastBlock: { id: string; action: string; currentHash: string } | null;
  hasMore: boolean;
  genesisHash: string;
  lastEvaluated?: string;
  failedBlocks?: Array<{ id: string; bagId: string; action: string; expectedHash: string; actualHash: string }>;
  blocks: AuditBlock[];
}

const actionColors: Record<string, string> = {
  generated: 'blue',
  dispatched: 'orange',
  redeemed: 'green',
  flagged: 'red',
};

const MOCK_BLOCKS: AuditBlock[] = Array.from({ length: 50 }, (_, i) => ({
  id: `log-${1000 + i}`,
  bagId: `SC513-2026-${String(5000 + i).padStart(4, '0')}`,
  action: ['generated', 'dispatched', 'redeemed', 'flagged'][Math.floor(Math.random() * 4)] as AuditBlock['action'],
  timestamp: dayjs().subtract(50 - i, 'day').toISOString(),
  performedBy: ['Seed Co', 'Pannar', 'Gov-Ministry', '+263771234567', 'warehouse-01'][Math.floor(Math.random() * 5)],
  destinationDistrict: ['Harare', 'Mutare', 'Masvingo', 'Gweru', 'Bulawayo', 'Chinhoyi'][Math.floor(Math.random() * 6)],
  previousHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  currentHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
}));

const MOCK_RESULT: AuditResult = {
  verified: true,
  totalBlocks: 2483,
  checkedBlocks: 50,
  firstBlock: { id: 'log-1000', action: 'generated', currentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6' },
  lastBlock: { id: 'log-1049', action: 'redeemed', currentHash: 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1' },
  hasMore: true,
  genesisHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  lastEvaluated: 'log-1049',
  blocks: MOCK_BLOCKS,
};

const ChainAudit: React.FC = () => {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningMore, setRunningMore] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [bagSearch, setBagSearch] = useState('');

  const runVerification = async (startAfter?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 2000));
        const data = MOCK_RESULT;
        if (result && startAfter) {
          const moreBlocks: AuditBlock[] = Array.from({ length: 50 }, (_, i) => ({
            id: `log-${2000 + i}`,
            bagId: `SC513-2026-${String(6000 + i).padStart(4, '0')}`,
            action: ['generated', 'dispatched', 'redeemed'][Math.floor(Math.random() * 3)] as AuditBlock['action'],
            timestamp: dayjs().subtract(100 - i, 'day').toISOString(),
            performedBy: ['Seed Co', 'Gov-Ministry', '+263771234567'][Math.floor(Math.random() * 3)],
            destinationDistrict: ['Harare', 'Mutare', 'Masvingo'][Math.floor(Math.random() * 3)],
            previousHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            currentHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          }));
          setResult({
            ...data,
            blocks: [...result.blocks, ...moreBlocks],
            checkedBlocks: result.checkedBlocks + moreBlocks.length,
          });
        } else {
          setResult(data);
        }
        return;
      }
      const fn = httpsCallable(functions, 'verifyAuditChain');
      const res = await fn({ startAfter, limit: 200 });
      const data = res.data as AuditResult;
      if (result && startAfter) {
        setResult({ ...data, blocks: [...result.blocks, ...data.blocks], checkedBlocks: result.checkedBlocks + data.checkedBlocks });
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
      if (isDemoMode()) {
        await new Promise(r => setTimeout(r, 1500));
        setResult(MOCK_RESULT);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (result && result.lastEvaluated) {
      setRunningMore(true);
      runVerification(result.lastEvaluated).finally(() => setRunningMore(false));
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const blockColumns = [
    { title: '#', key: 'index', width: 50, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 110, render: (action: string) => <Tag color={actionColors[action] || 'default'}>{action.toUpperCase()}</Tag> },
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', width: 180, render: (bagId: string) => bagId ? <Text code style={{ fontSize: 11 }}>{bagId}</Text> : '\u2014' },
    { title: 'District', dataIndex: 'destinationDistrict', key: 'destinationDistrict', width: 110 },
    { title: 'Performed By', dataIndex: 'performedBy', key: 'performedBy', width: 150, ellipsis: true },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 160, render: (ts: string) => ts ? dayjs(ts).format('DD MMM YYYY HH:mm') : '\u2014' },
    { title: 'Hash', dataIndex: 'currentHash', key: 'currentHash', width: 90, render: (hash: string) => <Tooltip title={hash}><Text code style={{ fontSize: 10 }}>{hash.slice(0, 10)}...</Text></Tooltip> },
  ];

  return (
    <div>
      {}
      <Card style={{ marginBottom: 20, borderTop: '4px solid #c49a2a', borderRadius: 6, background: 'linear-gradient(135deg, #0a1628 0%, #0d1b2a 100%)' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '3px solid #c49a2a', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'rgba(196,154,42,0.1)', flexShrink: 0,
              }}>
                <SafetyCertificateOutlined style={{ color: '#c49a2a', fontSize: 28 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                  <CrownOutlined style={{ color: '#c49a2a', marginRight: 8 }} />
                  REPUBLIC OF ZIMBABWE
                </Title>
                <Text style={{ color: '#c49a2a', fontSize: 12, fontWeight: 500, letterSpacing: 2 }}>
                  MINISTRY OF AGRICULTURE — BLOCKCHAIN AUDIT TRAIL
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ color: '#8899aa', fontSize: 13 }}>
                    Pfumvudza/Intwasa Input Subsidy Programme — Cryptographic Integrity Verification
                  </Text>
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <Space>
              <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} style={{ borderColor: '#c49a2a', color: '#c49a2a' }}>
                About
              </Button>
              <Button icon={<ReloadOutlined />} onClick={reset} disabled={!result && !error} style={{ borderColor: '#555', color: '#ccc' }}>
                Reset
              </Button>
              <Button
                type="primary"
                icon={<AuditOutlined />}
                onClick={() => runVerification()}
                loading={loading}
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #c49a2a, #a67c1e)', borderColor: '#c49a2a',
                  fontWeight: 700, fontSize: 15, height: 44, padding: '0 32px',
                  boxShadow: '0 4px 14px rgba(196,154,42,0.35)',
                }}
              >
                {loading ? 'VERIFYING...' : 'RUN VERIFICATION'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#c49a2a' }} />
            <span style={{ color: '#c49a2a' }}>ABOUT THE BLOCKCHAIN AUDIT TRAIL</span>
          </Space>
        }
        open={infoOpen}
        onCancel={() => setInfoOpen(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ borderLeft: '3px solid #c49a2a', paddingLeft: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontStyle: 'italic', color: '#555' }}>
            "Trust, but verify — every seed bag, every transaction, cryptographically sealed."
          </Text>
        </div>

        <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
          <Descriptions.Item label={<><BookOutlined /> Programme</>}>Pfumvudza/Intwasa Input Subsidy Scheme</Descriptions.Item>
          <Descriptions.Item label={<><EnvironmentOutlined /> Jurisdiction</>}>Republic of Zimbabwe — Nationwide</Descriptions.Item>
          <Descriptions.Item label={<><CloudServerOutlined /> Platform</>}>Agri-Logix SeedTracker v1.0</Descriptions.Item>
          <Descriptions.Item label={<><KeyOutlined /> Algorithm</>}>SHA-256 (Secure Hash Algorithm 256-bit)</Descriptions.Item>
          <Descriptions.Item label={<><LinkOutlined /> Genesis Block</>}>GENESIS_BLOCK_AGRI_LOGIX_2026</Descriptions.Item>
          <Descriptions.Item label={<><UserOutlined /> Authority</>}>Ministry of Lands, Agriculture, Fisheries, Water and Rural Development</Descriptions.Item>
        </Descriptions>

        <Divider style={{ borderColor: '#c49a2a' }} />

        <Title level={5} style={{ color: '#0a1628' }}><ExperimentOutlined /> How the Hash Chain Works</Title>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={[
            { title: 'Genesis Block', description: 'The chain starts with a fixed genesis hash: SHA-256("GENESIS_BLOCK_AGRI_LOGIX_2026"). This is the root of trust for the entire system.' },
            { title: 'Block Creation', description: 'Every action (bag generated, dispatched, redeemed, flagged) creates a new block. The block data includes bag ID, action type, timestamp, performer, and location.' },
            { title: 'Hash Chaining', description: 'Each block stores previousHash (the hash of the prior block) and currentHash = SHA-256(previousHash + blockData). This links every block to its predecessor.' },
            { title: 'Verification', description: 'The auditor recomputes every hash and compares against stored values. If any block was tampered with, the hash won\'t match — immediately revealing the breach.' },
            { title: 'Immutability', description: 'Firestore rules enforce that redemptionLog documents are append-only. Once written, they cannot be updated or deleted. Combined with the hash chain, this creates a tamper-evident audit trail.' },
          ]}
        />

        <Divider style={{ borderColor: '#c49a2a' }} />

        <Title level={5} style={{ color: '#0a1628' }}><WarningOutlined /> What Tampering Looks Like</Title>
        <Alert
          type="error"
          message="Breach Detection"
          description="If an attacker modifies a Firestore document directly (bypassing cloud functions), the hash chain breaks. The verification will show which specific block failed, the expected hash vs actual hash, and the bag/action involved. This provides cryptographic proof of tampering admissible for audit and legal proceedings."
          showIcon
          style={{ marginBottom: 12 }}
        />
        <Alert
          type="success"
          message="Clean Chain"
          description="When all blocks link correctly, the system generates a Certificate of Verification — a cryptographic attestation that every seed bag transaction in the programme is authentic and unaltered."
          showIcon
        />

        <Divider style={{ borderColor: '#c49a2a' }} />

        <Title level={5} style={{ color: '#0a1628' }}><FlagOutlined /> Why This Matters for Zimbabwe</Title>
        <Paragraph style={{ fontSize: 13 }}>
          The Pfumvudza/Intwasa Input Subsidy Scheme distributes millions of seed bags to smallholder farmers across all 10 provinces.
          Without cryptographic verification, there is no way to prove that distribution records haven't been manipulated —
          leading to potential fraud, double-claiming, and loss of public trust.
        </Paragraph>
        <Paragraph style={{ fontSize: 13 }}>
          This blockchain audit trail provides independent, mathematical proof that every seed bag's journey
          from warehouse to farmer is authentic. It is a key pillar of the Ministry's commitment to transparency
          and accountability in public agricultural programmes.
        </Paragraph>
      </Modal>

      {}
      <Card style={{
        marginBottom: 20, borderTop: result ? (result.verified ? '3px solid #52c41a' : '3px solid #ff4d4f') : '3px solid #d9d9d9',
        background: result && !result.verified ? '#fff2f0' : '#fff',
      }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              {result ? (
                result.verified ? (
                  <VerifiedOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                )
              ) : (
                <LockOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
              )}
              <div>
                <Text style={{ fontWeight: 700, fontSize: 15, color: result ? (result.verified ? '#1f7b1f' : '#cf1322') : '#666' }}>
                  {result ? (result.verified ? 'AUDIT PASSED — CHAIN INTACT' : 'AUDIT FAILED — CHAIN COMPROMISED') : 'AWAITING VERIFICATION'}
                </Text>
                <br />
                <Text style={{ color: '#888', fontSize: 12 }}>
                  {result
                    ? `Last verified: ${dayjs().format('DD MMM YYYY [at] HH:mm:ss')} | ${result.checkedBlocks} blocks checked`
                    : 'Click "Run Verification" to perform a cryptographic integrity check on the entire audit trail'}
                </Text>
              </div>
            </Space>
          </Col>
          {result && (
            <Col>
              <Button icon={<ReloadOutlined />} onClick={reset} size="small">New Audit</Button>
            </Col>
          )}
        </Row>
      </Card>

      {error && !result && (
        <Alert type="error" message="Verification Error" description={error} showIcon style={{ marginBottom: 16 }} closable />
      )}

      {loading && !result && (
        <Card style={{ textAlign: 'center', padding: 60, borderTop: '3px solid #c49a2a' }}>
          <Spin indicator={<AuditOutlined style={{ fontSize: 48, color: '#c49a2a' }} spin />} />
          <div style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: '#0a1628' }}>Verifying the Hash Chain</div>
          <div style={{ color: '#888', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
            Scanning audit trail blocks, recomputing SHA-256 hashes, and verifying chain integrity...
          </div>
        </Card>
      )}

      {result && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderTop: `4px solid ${result.verified ? '#52c41a' : '#ff4d4f'}` }}>
                <Statistic
                  title={<Text style={{ fontSize: 11, color: '#888' }}>CHAIN STATUS</Text>}
                  value={result.verified ? 'INTACT' : 'COMPROMISED'}
                  valueStyle={{ color: result.verified ? '#52c41a' : '#ff4d4f', fontSize: 22, fontWeight: 700 }}
                  prefix={result.verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
                <Statistic
                  title={<Text style={{ fontSize: 11, color: '#888' }}>BLOCKS VERIFIED</Text>}
                  value={result.checkedBlocks}
                  prefix={<NodeIndexOutlined />}
                  suffix={result.hasMore ? <Tag color="blue">Partial</Tag> : <Tag color="green">Full</Tag>}
                  valueStyle={{ fontSize: 24, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderTop: '4px solid #ff4d4f' }}>
                <Statistic
                  title={<Text style={{ fontSize: 11, color: '#888' }}>FAILED BLOCKS</Text>}
                  value={result.failedBlocks?.length || 0}
                  valueStyle={{ color: (result.failedBlocks?.length || 0) > 0 ? '#ff4d4f' : '#52c41a', fontSize: 24, fontWeight: 700 }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable style={{ borderTop: '4px solid #722ed1' }}>
                <Statistic
                  title={<Text style={{ fontSize: 11, color: '#888' }}>GENESIS HASH</Text>}
                  value={result.genesisHash.slice(0, 14) + '...'}
                  prefix={<LinkOutlined />}
                  valueStyle={{ fontSize: 14 }}
                />
              </Card>
            </Col>
          </Row>

          {}
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ background: '#f6ffed' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>First Block</Text>
                <div><Text code style={{ fontSize: 11 }}>{result.firstBlock?.action.toUpperCase()}</Text></div>
                <Tooltip title={result.firstBlock?.currentHash}>
                  <Text style={{ fontSize: 10, color: '#666' }}>Hash: {result.firstBlock?.currentHash.slice(0, 16)}...</Text>
                </Tooltip>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Text style={{ fontSize: 11, color: '#888' }}>Latest Block</Text>
                <div><Text code style={{ fontSize: 11 }}>{result.lastBlock?.action.toUpperCase()}</Text></div>
                <Tooltip title={result.lastBlock?.currentHash}>
                  <Text style={{ fontSize: 10, color: '#666' }}>Hash: {result.lastBlock?.currentHash.slice(0, 16)}...</Text>
                </Tooltip>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ background: '#fff7e6' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Total Blocks (Full Chain)</Text>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0a1628' }}>{result.totalBlocks || result.checkedBlocks}</div>
              </Card>
            </Col>
          </Row>

          {result.verified && (
            <Alert
              type="success"
              message={
                <Space>
                  <VerifiedOutlined />
                  <span style={{ fontWeight: 700 }}>CRYPTOGRAPHIC VERIFICATION PASSED</span>
                </Space>
              }
              description={
                <div>
                  <Paragraph style={{ margin: 0 }}>
                    The Ministry of Agriculture hereby certifies that all {result.checkedBlocks} audit trail blocks
                    have been cryptographically verified. Each block's SHA-256 hash links correctly to its predecessor,
                    confirming that <strong>no tampering or data corruption</strong> has occurred.
                  </Paragraph>
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f', fontSize: 12 }}>
                    <strong>Verification Reference:</strong> AGRI-CHAIN-{dayjs().format('YYYYMMDD-HHmmss')}
                    <br />
                    <strong>Genesis Hash:</strong> {result.genesisHash}
                    <br />
                    <strong>Last Verified Block:</strong> {result.lastBlock?.currentHash.slice(0, 20)}...
                  </div>
                </div>
              }
              showIcon
              style={{ marginBottom: 16, border: '1px solid #b7eb8f' }}
            />
          )}

          {!result.verified && result.failedBlocks && result.failedBlocks.length > 0 && (
            <>
              <Alert
                type="error"
                message={<><CloseCircleOutlined /> CHAIN INTEGRITY BREACH DETECTED</>}
                description={`${result.failedBlocks.length} block(s) failed hash verification. This indicates possible data tampering. All failed blocks are listed below for investigation.`}
                showIcon
                style={{ marginBottom: 16, border: '1px solid #ffa39e' }}
              />
              <Card title={<><WarningOutlined style={{ color: '#ff4d4f' }} /> Failed Blocks — Investigation Required</>} style={{ marginBottom: 16, border: '1px solid #ffa39e' }}>
                <Table
                  dataSource={result.failedBlocks}
                  rowKey="id"
                  columns={[
                    { title: 'Block ID', dataIndex: 'id', key: 'id', width: 180, render: (id: string) => <Text code style={{ fontSize: 10 }}>{id}</Text> },
                    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', width: 180 },
                    { title: 'Action', dataIndex: 'action', key: 'action', width: 100, render: (a: string) => <Tag color="red">{a}</Tag> },
                    { title: 'Expected Prev Hash', dataIndex: 'expectedHash', key: 'expectedHash', width: 110, render: (h: string) => <Tooltip title={h}><Text code style={{ fontSize: 10 }}>{h.slice(0, 12)}...</Text></Tooltip> },
                    { title: 'Actual Prev Hash', dataIndex: 'actualHash', key: 'actualHash', width: 110, render: (h: string) => <Tooltip title={h}><Text code style={{ fontSize: 10, color: '#ff4d4f' }}>{h.slice(0, 12)}...</Text></Tooltip> },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            </>
          )}

          {}
          <Collapse
            defaultActiveKey={['blocks']}
            style={{ marginBottom: 16, border: '1px solid #e8e8e8', borderRadius: 6 }}
          >
            <Panel
              header={
                <Space>
                  <HistoryOutlined />
                  <span style={{ fontWeight: 600 }}>Audit Trail Blocks</span>
                  <Tag>{result.blocks.length}</Tag>
                  {result.hasMore && <Tag color="processing">Partial — Load More</Tag>}
                  {!result.hasMore && <Tag color="green">Complete Chain</Tag>}
                </Space>
              }
              key="blocks"
              extra={
                <Space>
                  <Input.Search
                    placeholder="Search bag ID..."
                    size="small"
                    style={{ width: 200 }}
                    value={bagSearch}
                    onChange={e => setBagSearch(e.target.value)}
                  />
                </Space>
              }
            >
              <Table
                dataSource={bagSearch
                  ? result.blocks.filter(b => b.bagId?.toLowerCase().includes(bagSearch.toLowerCase()))
                  : result.blocks
                }
                rowKey="id"
                columns={blockColumns}
                pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'], showTotal: (t) => `${t} blocks` }}
                size="small"
                scroll={{ x: 900 }}
                locale={{ emptyText: 'No blocks match your search' }}
              />
              {result.hasMore && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button type="dashed" icon={<ReloadOutlined />} onClick={loadMore} loading={runningMore}>
                    Load More Blocks ({result.checkedBlocks} verified so far)
                  </Button>
                </div>
              )}
            </Panel>
          </Collapse>

          {}
          <Card style={{ background: '#fafafa', border: '1px solid #e8e8e8' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', border: '2px solid #c49a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CrownOutlined style={{ color: '#c49a2a', fontSize: 14 }} />
                  </div>
                  <div>
                    <Text style={{ fontSize: 12, color: '#888' }}>Republic of Zimbabwe</Text>
                    <br />
                    <Text style={{ fontSize: 11, color: '#aaa' }}>Ministry of Agriculture — Blockchain Audit Division</Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Text style={{ fontSize: 10, color: '#bbb' }}>
                  Agri-Logix SeedTracker v1.0 | SHA-256 | Pfumvudza/Intwasa Programme
                </Text>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default ChainAudit;
