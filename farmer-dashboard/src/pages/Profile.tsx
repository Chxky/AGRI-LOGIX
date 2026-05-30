import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Typography, Spin, Tag, Divider } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { isDemoMode } from '../utils/demoMode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface FarmerProfile {
  name: string;
  phone: string;
  nationalId: string;
  village: string;
  ward: string;
  district: string;
  province: string;
  registeredAt: string;
  householdSize: number;
  cropType: string;
}

const MOCK_PROFILE: FarmerProfile = {
  name: 'Tendai Mukanya',
  phone: '+263771234567',
  nationalId: '12-345678-A-90',
  village: 'Mupfurudzi',
  ward: 'Ward 7',
  district: 'Goromonzi',
  province: 'Mashonaland East',
  registeredAt: '2026-04-15T08:30:00Z',
  householdSize: 5,
  cropType: 'Maize',
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemoMode()) {
          await new Promise(r => setTimeout(r, 400));
          setProfile(MOCK_PROFILE);
          setLoading(false);
          return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDocs(query(collection(db, 'farmers'), where('userId', '==', uid)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setProfile({
            name: d.name || d.farmerName || '',
            phone: d.phone || d.farmerPhone || '',
            nationalId: d.nationalId || '',
            village: d.village || '',
            ward: d.ward || '',
            district: d.district || '',
            province: d.province || '',
            registeredAt: d.registeredAt?.toDate?.()?.toISOString() || d.registeredAt || '',
            householdSize: d.householdSize || 0,
            cropType: d.cropType || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  }

  if (!profile) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <br /><br />
          <Text type="secondary">No farmer profile found. Contact your Agritex officer to register.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="gov-page-title">
        <Title level={4} style={{ margin: 0 }}>
          <UserOutlined /> My Profile
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Your registered beneficiary details under the Pfumvudza/Intwasa programme
        </Text>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#004d40', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>{profile.name}</Title>
            <div style={{ marginTop: 4 }}>
              <Tag icon={<SafetyCertificateOutlined />} color="#004d40">Pfumvudza Beneficiary</Tag>
              <Tag color="green">{profile.cropType} Farmer</Tag>
            </div>
          </div>
        </div>

        <Divider />

        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>} span={2}>
            <Text strong>{profile.phone}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="National ID" span={2}>{profile.nationalId}</Descriptions.Item>
          <Descriptions.Item label={<><EnvironmentOutlined /> Village</>}>{profile.village}</Descriptions.Item>
          <Descriptions.Item label="Ward">{profile.ward}</Descriptions.Item>
          <Descriptions.Item label="District">{profile.district}</Descriptions.Item>
          <Descriptions.Item label="Province">{profile.province}</Descriptions.Item>
          <Descriptions.Item label="Household Size">{profile.householdSize}</Descriptions.Item>
          <Descriptions.Item label="Crop Type">{profile.cropType}</Descriptions.Item>
          <Descriptions.Item label="Registered On" span={2}>
            {profile.registeredAt ? dayjs(profile.registeredAt).format('DD MMMM YYYY') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 4, fontSize: 12, color: '#667788' }}>
          <SafetyCertificateOutlined style={{ marginRight: 6 }} />
          To update your details, please contact your local Agritex extension officer
          or dial <strong>*123#</strong> from your mobile phone.
        </div>
      </Card>
    </div>
  );
};

export default Profile;
