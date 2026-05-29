import React, { useState } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Row, Col,
  Select, Statistic, message, Descriptions, Divider,
} from 'antd';
import {
  DollarOutlined, FilePdfOutlined,
  FileExcelOutlined, SearchOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import { ALL_DISTRICTS } from '../utils/zimbabwe';
import { escapeHtml } from '../utils/sanitize';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UNIT_VALUE = 15;

const PaymentReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [district, setDistrict] = useState<string>('all');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await api.getReconciliationReport({ district });
      setReport(result.data);
      message.success('Payment verification report generated');
    } catch (err: any) {
      message.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportTreasuryPDF = () => {
    if (!report) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const s = report.summary;

    win.document.write(`<!DOCTYPE html>
<html><head><title>Treasury Payment Report</title>
<style>
  body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { color: #0d1b2a; text-align: center; font-size: 22px; margin-bottom: 4px; }
  h2 { color: #333; font-size: 16px; text-align: center; font-weight: normal; margin-top: 0; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0d1b2a; padding-bottom: 16px; }
  .ref { text-align: right; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th, td { border: 1px solid #333; padding: 10px; text-align: left; font-size: 13px; }
  th { background: #f0f0f0; }
  .total-row td { font-weight: bold; background: #f9f9f9; }
  .summary-box { border: 1px solid #333; padding: 20px; margin: 24px 0; }
  .summary-box div { margin: 8px 0; font-size: 14px; }
  .signature { margin-top: 60px; }
  .signature div { display: inline-block; width: 250px; text-align: center; border-top: 1px solid #333; padding-top: 8px; margin-right: 60px; font-size: 12px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; }
  .stamp { text-align: center; margin: 20px 0; font-size: 18px; color: #C62828; border: 2px dashed #C62828; padding: 12px; transform: rotate(-5deg); display: inline-block; }
</style></head><body>
<div class="header">
  <h1>MINISTRY OF AGRICULTURE</h1>
  <h2>Pfumvudza Input Scheme — Verified Delivery Certificate</h2>
  <h2>Subsidy Payment Verification Report</h2>
</div>
<div class="ref">
  <div>Ref: AGRI-LOGIX/${escapeHtml(dayjs().format('YYYYMMDD'))}/${escapeHtml(district === 'all' ? 'NAT' : district.toUpperCase())}</div>
  <div>Date: ${escapeHtml(dayjs().format('DD MMMM YYYY'))}</div>
</div>
<div class="summary-box">
  <div><strong>District:</strong> ${escapeHtml(district === 'all' ? 'National (All Districts)' : district)}</div>
  <div><strong>Reporting Period:</strong> ${escapeHtml(dayjs().subtract(30, 'day').format('DD MMM YYYY'))} — ${escapeHtml(dayjs().format('DD MMM YYYY'))}</div>
  <div><strong>Total Bags Dispatched:</strong> ${s.totalDispatched}</div>
  <div><strong>Total Bags Verified (Redeemed by Farmers):</strong> ${s.totalRedeemed}</div>
  <div><strong>Redemption Rate:</strong> ${s.redemptionRate}%</div>
  <div><strong>Total Value Verified:</strong> USD $${(s.totalRedeemed * UNIT_VALUE).toLocaleString()}</div>
  <div><strong>Value per Bag:</strong> USD $${UNIT_VALUE}</div>
  <div><strong>Unique Farmers:</strong> ${s.uniqueFarmers}</div>
</div>
<div style="text-align: center; margin: 20px 0;">
  <div class="stamp">VERIFIED FOR PAYMENT</div>
</div>
<h3>Seed House Payment Breakdown</h3>
<table>
  <tr><th>Seed House</th><th>Bags Dispatched</th><th>Bags Verified</th><th>Verification Rate</th><th>Verified Value (USD)</th></tr>
  ${(report.houseBreakdown || []).map((h: any) =>
    `<tr><td>${escapeHtml(h.seedHouse)}</td><td>${h.dispatched}</td><td>${h.redeemed}</td><td>${h.dispatched > 0 ? Math.round(h.redeemed / h.dispatched * 100) : 0}%</td><td>$${(h.redeemed * UNIT_VALUE).toLocaleString()}</td></tr>`
  ).join('')}
  <tr class="total-row"><td>TOTAL</td><td>${s.totalDispatched}</td><td>${s.totalRedeemed}</td><td>${s.redemptionRate}%</td><td>$${(s.totalRedeemed * UNIT_VALUE).toLocaleString()}</td></tr>
</table>
<h3>Variety Breakdown</h3>
<table>
  <tr><th>Variety</th><th>Dispatched</th><th>Verified</th><th>Rate</th></tr>
  ${(report.varietyBreakdown || []).map((v: any) =>
    `<tr><td>${escapeHtml(v.variety)}</td><td>${v.dispatched}</td><td>${v.redeemed}</td><td>${v.dispatched > 0 ? Math.round(v.redeemed / v.dispatched * 100) : 0}%</td></tr>`
  ).join('')}
</table>
<h3>Unreturned Bags (Requires Investigation)</h3>
<p>${s.unreturnedBags} bags dispatched but not yet redeemed by farmers. These are excluded from this payment certificate.</p>
<table>
  <tr><th>Bag ID</th><th>Variety</th><th>Batch</th><th>Seed House</th><th>District</th></tr>
  ${(report.unreturnedBags || []).slice(0, 30).map((b: any) =>
    `<tr><td>${escapeHtml(b.bagId)}</td><td>${escapeHtml(b.variety)}</td><td>${escapeHtml(b.batchNumber)}</td><td>${escapeHtml(b.seedHouse)}</td><td>${escapeHtml(b.dispatchedTo)}</td></tr>`
  ).join('')}
  ${report.unreturnedBags?.length > 30 ? `<tr><td colspan="5"><em>... and ${escapeHtml(report.unreturnedBags.length - 30)} more</em></td></tr>` : ''}
</table>
<div class="signature">
  <div>For Ministry of Agriculture</div>
  <div>For Treasury</div>
</div>
<div class="footer">
  <p>Agri-Logix SeedTracker — Blockchain-Verified Supply Chain Platform</p>
  <p>This report is generated from verified farmer redemption data. Each bag's chain of custody is recorded immutably.</p>
  <p>Document Ref: AGRI-LOGIX/PAY/${dayjs().format('YYYYMMDD')}/${district === 'all' ? 'NAT' : district.toUpperCase()}</p>
</div>
</body></html>`);
    win.document.close();
    win.print();
  };

  const valuePerBag = 15;
  const s = report?.summary;

  const houseColumns = [
    { title: 'Seed House', dataIndex: 'seedHouse', key: 'seedHouse' },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
    { title: 'Verified', dataIndex: 'redeemed', key: 'redeemed' },
    {
      title: 'Rate', key: 'rate',
      render: (_: any, r: any) => (
        <span>{r.dispatched > 0 ? Math.round((r.redeemed / r.dispatched) * 100) : 0}%</span>
      ),
    },
    {
      title: 'Verified Value (USD)', key: 'value',
      render: (_: any, r: any) => (
        <Text strong>${(r.redeemed * valuePerBag).toLocaleString()}</Text>
      ),
    },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}><DollarOutlined /> Subsidy Payment Verification</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Generate Treasury payment certificates backed by verified farmer redemption data</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Generate verified delivery certificates that seed houses can use to request subsidy payments from Treasury.
          Each report is backed by immutable farmer redemption records with GPS verification.
        </Text>
      </Card>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Select District</Text>
              <Select
                style={{ width: '100%' }}
                value={district}
                onChange={setDistrict}
                showSearch
              >
                <Select.Option value="all">All Districts (National)</Select.Option>
                {ALL_DISTRICTS.map(d => (
                  <Select.Option key={d} value={d}>{d}</Select.Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleGenerate}
                loading={loading}
                block
                size="large"
              >
                Generate Verification Report
              </Button>
            </Space>
          </Card>
        </Col>

        {s && (
          <Col xs={24} sm={12}>
            <Card className="report-summary-card">
              <Statistic
                title="Total Verified Value for Payment"
                value={`$${(s.totalRedeemed * valuePerBag).toLocaleString()}`}
                valueStyle={{ color: '#2E7D32', fontSize: 28 }}
                prefix={<DollarOutlined />}
              />
              <Divider />
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Bags Verified">{s.totalRedeemed}</Descriptions.Item>
                <Descriptions.Item label="Redemption Rate">{s.redemptionRate}%</Descriptions.Item>
                <Descriptions.Item label="Unique Farmers">{s.uniqueFarmers}</Descriptions.Item>
                <Descriptions.Item label="Unreturned Bags (Excluded)">
                  <Tag color="orange">{s.unreturnedBags}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}
      </Row>

      {s && (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={exportTreasuryPDF}
              size="large"
            >
              Generate Treasury Certificate (PDF)
            </Button>
            <Button icon={<FileExcelOutlined />} size="large">
              Export CSV
            </Button>
          </Space>

          <Card title="Seed House Payment Breakdown">
            <Table
              dataSource={report.houseBreakdown}
              columns={houseColumns}
              rowKey="houseId"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Payment Summary" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Verified"
                  value={s.totalRedeemed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#2E7D32' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Value per Bag"
                  value={`$${valuePerBag}`}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Payment Due"
                  value={`$${(s.totalRedeemed * valuePerBag).toLocaleString()}`}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1565C0', fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default PaymentReports;
