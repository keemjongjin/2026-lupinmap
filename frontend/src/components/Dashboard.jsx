import React, { useState } from 'react';

// 별점 렌더링 컴포넌트 (반개짜리 제외, 1~5 정수형)
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;

  return (
    <span className="star-rating">
      {'★'.repeat(fullStars)}
      {'☆'.repeat(emptyStars)}
      <span className="rating-num">({rating}점)</span>
    </span>
  );
};

const HOTSPOTS = [
  { name: '강남', lat: 37.498095, lng: 127.027610 },
  { name: '여의도', lat: 37.521569, lng: 126.924296 },
  { name: '용산', lat: 37.529883, lng: 126.964801 },
  { name: '판교', lat: 37.394776, lng: 127.111160 },
  { name: '성수', lat: 37.544588, lng: 127.056066 },
];

function Dashboard({ data, loading, error, regionName, onQuickSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        onQuickSelect(pos.coords.latitude, pos.coords.longitude, '현재 위치');
      }, () => {
        alert('위치 정보를 가져올 수 없습니다.');
      });
    } else {
      alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
    }
  };

  return (
    <div className={`dashboard-overlay glass ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 상단 헤더: 제목 및 접기 버튼 */}
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {isCollapsed ? (
            <h1 style={{ fontSize: '20px', margin: 0 }}>
              {regionName} <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>{data?.score ? `${data.score}점` : ''}</span>
            </h1>
          ) : (
            <>
              <h1 style={{ fontSize: '22px' }}>{regionName} 루팡 지수</h1>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>지도 클릭 또는 하단 칩으로 지역 이동</p>
            </>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-secondary)', 
            cursor: 'pointer', padding: '4px', fontSize: '13px', fontWeight: 'bold' 
          }}
        >
          {isCollapsed ? '펼치기 ▼' : '접기 ▲'}
        </button>
      </div>

      {/* 펼쳐져 있을 때만 세부 내용 표시 */}
      {!isCollapsed && (
        <>
          {/* 로딩/에러/데이터 영역 */}
          <div className="content-area" style={{ minHeight: 'auto' }}>
            {loading ? (
              <div className="inner-loading" style={{ minHeight: '100px' }}>분석 중... ⏳</div>
            ) : error ? (
              <div className="inner-error">{error}</div>
            ) : data ? (
              <>
                <div className="score-card">
                  <div className={`score-circle ${data.level === 'PERFECT' ? 'perfect' : data.level === 'BAD' ? 'bad' : ''}`}>
                    {data.score}점
                  </div>
                  <h3 style={{ fontSize: '15px' }}>{data.level === 'PERFECT' ? '완벽한 루팡 타임!' : data.level === 'GOOD' ? '눈치껏 나가기 좋은 날' : '오늘은 참으세요'}</h3>
                </div>

                <div className="ratings-box">
                  {/* 날씨 요약 텍스트 영역 */}
                  <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {data.weather.summary} ({data.weather.temp}℃)
                  </div>
                  <div className="rating-row">
                    <span>날씨 만족도</span>
                    <StarRating rating={data.ratings.weather} />
                  </div>
                  <div className="rating-row">
                    <span>카페 밀집도</span>
                    <StarRating rating={data.ratings.cafe} />
                  </div>
                </div>
                
                <div className="comment-list" style={{ marginTop: '8px' }}>
                  {data.comments.map((comment, i) => (
                    <div key={i} className="comment-item">{comment}</div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* 핫스팟, 스크롤 가능한 카페 리스트, GPS 액션 */}
          <div className="actions" style={{ marginTop: '4px' }}>
            <div className="chips-container">
              {HOTSPOTS.map(spot => (
                <button key={spot.name} className="chip" onClick={() => onQuickSelect(spot.lat, spot.lng, spot.name)}>
                  {spot.name}
                </button>
              ))}
            </div>

            {/* 카페 리스트 (핫스팟과 내 위치 버튼 사이) */}
            {data && !loading && !error && (
              <div className="cafe-list" style={{ maxHeight: '130px', overflowY: 'auto', margin: '4px 0', paddingRight: '4px' }}>
                <h4 style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>주변 카페 ({data.cafes.length}개)</h4>
                {data.cafes.length > 0 ? (
                  data.cafes.map(cafe => (
                    <div key={cafe.id} className="cafe-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="cafe-name" style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{cafe.name}</span>
                        <span className="cafe-distance" style={{ color: 'gray', fontSize: '11px' }}>{cafe.distance}m</span>
                      </div>
                      <a href={cafe.url || `https://map.kakao.com/link/to/${cafe.name},${cafe.lat},${cafe.lng}`} target="_blank" rel="noreferrer" style={{ flexShrink: 0, fontSize: '11px', padding: '4px 8px', background: 'var(--bg-color)', borderRadius: '4px', textDecoration: 'none', color: 'var(--primary)', fontWeight: 'bold' }}>상세/길찾기</a>
                    </div>
                  ))
                ) : (
                   <div style={{ fontSize: '13px', color: 'gray', padding: '8px' }}>주변에 카페가 없습니다.</div>
                )}
              </div>
            )}

            <button className="gps-btn" onClick={handleGPS}>📍 내 위치로 이동</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
