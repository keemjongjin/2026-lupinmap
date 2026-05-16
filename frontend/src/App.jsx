import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Dashboard from './components/Dashboard';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 위치 상태 (초기값: 강남역)
  const [location, setLocation] = useState({ lat: 37.498095, lng: 127.027610 });
  const [regionName, setRegionName] = useState('위치 탐색 중');

  const fetchLupinData = async (lat, lng, name, cafes = []) => {
    setLoading(true);
    setError(null);
    if (name) setRegionName(name);

    try {
      // 모바일 기기(동일 네트워크 내 다른 IP)에서도 백엔드에 접속할 수 있도록 동적으로 호스트네임 할당
      const response = await fetch(`http://${window.location.hostname}:5001/api/lupin-index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, cafes })
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      console.error(err);
      setError('백엔드 서버에 연결할 수 없거나 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat, lng, name, cafes) => {
    setLocation(prev => {
      if (prev.lat === lat && prev.lng === lng) return prev;
      return { lat, lng };
    });
    fetchLupinData(lat, lng, name, cafes);
  };

  return (
    <div className="app-container">
      <div className="logo-container">
        <h1 className="logo-text">LupinMap</h1>
        <p className="logo-subtext">사무실에서 벗어나 카페로</p>
      </div>
      <Map 
        cafes={data?.cafes || []} 
        center={location} 
        onLocationChange={handleLocationChange} 
        setRegionName={setRegionName}
      />
      <Dashboard 
        data={data} 
        loading={loading} 
        error={error} 
        regionName={regionName} 
        onQuickSelect={handleLocationChange} 
      />
    </div>
  );
}

export default App;
