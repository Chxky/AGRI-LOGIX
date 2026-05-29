import React, { useState } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Row, Col,
  Select, DatePicker, Statistic, message, Descriptions,
} from 'antd';
import {
  ReconciliationOutlined, FilePdfOutlined,
  FileExcelOutlined, SearchOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import { ALL_DISTRICTS } from '../utils/zimbabwe';
import { escapeHtml } from '../utils/sanitize';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ReportSummary {
  totalBags: number; totalDispatched: number; totalRedeemed: number;
  totalFlagged: number; uniqueFarmers: number;
  outstandingForPayment: number; unreturnedBags: number;
  redemptionRate: number;
}

interface VarietyBreakdown {
  variety: string; dispatched: number; redeemed: number;
}

interface HouseBreakdown {
  seedHouse: string; houseId: string; dispatched: number; redeemed: number;
}

interface UnreturnedBag {
  bagId: string; variety: string; batchNumber: string;
  dispatchedTo: string; seedHouse: string;
}

const Reconciliation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [district, setDistrict] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params: any = { district };
      if (dateRange) {
        params.dateFrom = dateRange[0];
        params.dateTo = dateRange[1];
      }
      const result = await api.getReconciliationReport(params);
      setReport(result.data);
      message.success('Reconciliation report generated');
    } catch (err: any) {
      message.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ['Bag ID', 'Variety', 'Batch', 'Seed House', 'Status', 'Dispatched To', 'Farmer Phone', 'Redeemed At'],
      ...(report.unreturnedBags || []).map((b: UnreturnedBag) =>
        [b.bagId, b.variety, b.batchNumber, b.seedHouse, 'dispatched', b.dispatchedTo, '', '']
      ),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${district}-${dayjs().format('YYYYMMDD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!report) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const s = report.summary as ReportSummary;
    win.document.write(`<!DOCTYPE html>
<html><head><title>Reconciliation Report</title>
<style>
  body { font-family: Arial; padding: 40px; }
  h1 { color: #1565C0; }
  .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 24px 0; }
  .card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; text-align: center; }
  .card h2 { margin: 0; font-size: 28px; color: #0d1b2a; }
  .card p { margin: 4px 0 0; color: #666; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
  th { background: #f5f5f5; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
  .seal { margin-top: 30px; text-align: right; }
  .seal div { margin-top: 60px; border-top: 1px solid #333; width: 250px; display: inline-block; text-align: center; padding-top: 8px; font-size: 12px; }
</style></head><body>
<h1>Agri-Logix SeedTracker — Reconciliation Report</h1>
<p>District: ${escapeHtml(district === 'all' ? 'National' : district)} | Generated: ${dayjs().format('DD MMM YYYY HH:mm')}</p>
<div class="summary">
  <div class="card"><h2>${s.totalBags}</h2><p>Total Bags</p></div>
  <div class="card"><h2>${s.totalDispatched}</h2><p>Dispatched</p></div>
  <div class="card"><h2>${s.totalRedeemed}</h2><p>Redeemed</p></div>
  <div class="card"><h2>${s.redemptionRate}%</h2><p>Redemption Rate</p></div>
  <div class="card"><h2>${s.uniqueFarmers}</h2><p>Unique Farmers</p></div>
  <div class="card"><h2>${s.unreturnedBags}</h2><p>Unreturned Bags</p></div>
</div>
<h2>Variety Breakdown</h2>
<table><tr><th>Variety</th><th>Dispatched</th><th>Redeemed</th><th>Rate</th></tr>
${(report.varietyBreakdown || []).map((v: VarietyBreakdown) =>
  `<tr><td>${escapeHtml(v.variety)}</td><td>${v.dispatched}</td><td>${v.redeemed}</td><td>${v.dispatched > 0 ? Math.round(v.redeemed / v.dispatched * 100) : 0}%</td></tr>`
).join('')}
</table>
<h2>Seed House Breakdown</h2>
<table><tr><th>Seed House</th><th>Dispatched</th><th>Redeemed</th></tr>
${(report.houseBreakdown || []).map((h: HouseBreakdown) =>
  `<tr><td>${escapeHtml(h.seedHouse)}</td><td>${h.dispatched}</td><td>${h.redeemed}</td></tr>`
).join('')}
</table>
<h2>Unreturned Bags (${s.unreturnedBags})</h2>
<table><tr><th>Bag ID</th><th>Variety</th><th>Batch</th><th>Seed House</th><th>District</th></tr>
${(report.unreturnedBags || []).slice(0, 50).map((b: UnreturnedBag) =>
  `<tr><td>${escapeHtml(b.bagId)}</td><td>${escapeHtml(b.variety)}</td><td>${escapeHtml(b.batchNumber)}</td><td>${escapeHtml(b.seedHouse)}</td><td>${escapeHtml(b.dispatchedTo)}</td></tr>`
).join('')}
</table>
${report.unreturnedBags?.length > 50 ? `<p><em>Showing first 50 of ${escapeHtml(report.unreturnedBags.length)} unreturned bags</em></p>` : ''}
<div class="seal"><div>Authorised Signature<br/>Ministry of Agriculture</div></div>
<div class="footer">Agri-Logix SeedTracker — Confidential Government Document — ${dayjs().format('YYYY-MM-DD')}</div>
</body></html>`);
    win.document.close();
    win.print();
  };

  const s: ReportSummary | null = report?.summary || null;

  const varietyColumns = [
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed' },
    {
      title: 'Rate', key: 'rate',
      render: (_: any, r: VarietyBreakdown) => (
        <span>{r.dispatched > 0 ? Math.round((r.redeemed / r.dispatched) * 100) : 0}%</span>
      ),
    },
  ];

  const houseColumns = [
    { title: 'Seed House', dataIndex: 'seedHouse', key: 'seedHouse' },
    { title: 'Dispatched', dataIndex: 'dispatched', key: 'dispatched' },
    { title: 'Redeemed', dataIndex: 'redeemed', key: 'redeemed' },
    {
      title: 'Rate', key: 'rate',
      render: (_: any, r: HouseBreakdown) => (
        <span>{r.dispatched > 0 ? Math.round((r.redeemed / r.dispatched) * 100) : 0}%</span>
      ),
    },
  ];

  const unreturnedColumns = [
    { title: 'Bag ID', dataIndex: 'bagId', key: 'bagId', ellipsis: true },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: 'Seed House', dataIndex: 'seedHouse', key: 'seedHouse' },
    { title: 'District', dataIndex: 'dispatchedTo', key: 'dispatchedTo' },
  ];

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}><ReconciliationOutlined /> Reconciliation Report</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Generate official reconciliation reports for district verification</Text>
      </div>

      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select district (all)"
              value={district}
              onChange={setDistrict}
              showSearch
            >
              <Select.Option value="all">All Districts (National)</Select.Option>
              {ALL_DISTRICTS.map(d => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates && dates[0] != null && dates[1] != null) {
                  setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
                } else {
                  setDateRange(null);
                }
              }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleGenerate}
              loading={loading}
              block
              size="large"
            >
              Generate Report
            </Button>
          </Col>
        </Row>
      </Card>

      {report && s && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Total Bags" value={s.totalBags} valueStyle={{ fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Dispatched" value={s.totalDispatched} valueStyle={{ fontSize: 20, color: '#F9A825' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Redeemed" value={s.totalRedeemed} valueStyle={{ fontSize: 20, color: '#2E7D32' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Redemption Rate" value={s.redemptionRate} suffix="%" valueStyle={{ fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Unreturned" value={s.unreturnedBags} valueStyle={{ fontSize: 20, color: s.unreturnedBags > 0 ? '#C62828' : '#2E7D32' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card className="stat-card" size="small">
                <Statistic title="Verified for Payment" value={s.outstandingForPayment} valueStyle={{ fontSize: 20, color: '#1565C0' }} />
              </Card>
            </Col>
          </Row>

          <Space style={{ marginTop: 16, marginBottom: 16 }}>
            <Button icon={<FilePdfOutlined />} onClick={exportPDF}>
              Export PDF Report
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={exportCSV}>
              Export CSV Data
            </Button>
          </Space>

          <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="District">{district === 'all' ? 'National' : district}</Descriptions.Item>
            <Descriptions.Item label="Generated">{dayjs().format('DD MMM YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Unique Farmers">{s.uniqueFarmers}</Descriptions.Item>
            <Descriptions.Item label="Flagged Bags">
              <Tag color={s.totalFlagged > 0 ? 'red' : 'green'}>{s.totalFlagged}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Card title="Variety Breakdown" size="small" style={{ marginBottom: 16 }}>
            <Table dataSource={report.varietyBreakdown} columns={varietyColumns} rowKey="variety" pagination={false} size="small" />
          </Card>

          <Card title="Seed House Performance" size="small" style={{ marginBottom: 16 }}>
            <Table dataSource={report.houseBreakdown} columns={houseColumns} rowKey="houseId" pagination={false} size="small" />
          </Card>

          <Card
            title={`Unreturned Bags (${s.unreturnedBags})`}
            size="small"
            extra={
              <Tag color={s.unreturnedBags > 0 ? 'red' : 'green'}>
                {s.unreturnedBags > 0 ? 'Action Required' : 'All Accounted For'}
              </Tag>
            }
          >
            <Table
              dataSource={report.unreturnedBags}
              columns={unreturnedColumns}
              rowKey="bagId"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default Reconciliation;
