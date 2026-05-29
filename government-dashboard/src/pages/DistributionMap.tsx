import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, message, Row, Col, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { DISTRICT_COORDINATES } from '../utils/zimbabwe';

const { Title, Text } = Typography;

interface DistrictData {
  name: string; dispatched: number; redeemed: number;
  farmers: number; gap: number;
}

const defaultCenter: [number, number] = [-19.0154, 29.1549];
const defaultZoom = 7;

const FitBounds: React.FC<{ districts: DistrictData[] }> = ({ districts }) => {
  const map = useMap();
  useEffect(() => {
    if (districts.length > 0) {
      const coords = districts
        .map(d => DISTRICT_COORDINATES[d.name])
        .filter(Boolean) as [number, number][];
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    // Handle layout shifts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [districts, map]);
  return null;
};

const DistributionMap: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.getDistrictsSummary();
        setDistricts((result.data as any).districts || []);
      } catch (err: any) {
        message.error('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const getRadius = (redeemed: number) => Math.max(8, Math.min(30, redeemed / 5));
  const getColor = (rate: number) => {
    if (rate >= 80) return '#2E7D32';
    if (rate >= 50) return '#F9A825';
    return '#C62828';
  };

  const totalDispatched = districts.reduce((s, d) => s + d.dispatched, 0);
  const totalRedeemed = districts.reduce((s, d) => s + d.redeemed, 0);
  const totalFarmers = districts.reduce((s, d) => s + d.farmers, 0);

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}><EnvironmentOutlined /> National Distribution Map</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Geographic distribution of seed bags across Zimbabwe districts</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Text strong>{totalDispatched}</Text>
            <br /><Text type="secondary">Total Dispatched</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Text strong>{totalRedeemed}</Text>
            <br /><Text type="secondary">Total Redeemed</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Text strong>{totalFarmers}</Text>
            <br /><Text type="secondary">Total Farmers</Text>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="map-container" style={{ height: 600 }}>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds districts={districts} />

            {districts.map(d => {
              const coord = DISTRICT_COORDINATES[d.name];
              if (!coord) return null;
              const rate = d.dispatched > 0 ? (d.redeemed / d.dispatched) * 100 : 0;

              return (
                <CircleMarker
                  key={d.name}
                  center={coord}
                  radius={getRadius(d.redeemed)}
                  pathOptions={{
                    color: getColor(rate),
                    fillColor: getColor(rate),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <Text strong style={{ fontSize: 16 }}>{d.name}</Text>
                      <br /><br />
                      <Text>Dispatched: <strong>{d.dispatched}</strong></Text><br />
                      <Text>Redeemed: <strong>{d.redeemed}</strong></Text><br />
                      <Text>Farmers: <strong>{d.farmers}</strong></Text><br />
                      <Text>Rate: <strong>{Math.round(rate)}%</strong></Text><br />
                      <Tag color={d.gap === 0 ? 'green' : 'red'} style={{ marginTop: 8 }}>
                        {d.gap === 0 ? 'Matched' : `${d.gap} outstanding`}
                      </Tag>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      <Card title="Legend" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col><Tag color="#2E7D32">80-100% Redeemed</Tag></Col>
          <Col><Tag color="#F9A825">50-79% Redeemed</Tag></Col>
          <Col><Tag color="#C62828">&lt;50% Redeemed</Tag></Col>
          <Col><Text type="secondary">Circle size = redemption volume</Text></Col>
        </Row>
      </Card>
    </div>
  );
};

export default DistributionMap;
