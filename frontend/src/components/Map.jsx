import React, { useEffect, useRef, useState } from 'react';

function Map({ cafes, center, onLocationChange, setRegionName }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [geocoder, setGeocoder] = useState(null);
  const [places, setPlaces] = useState(null);

  // 1. 지도 초기화 및 이벤트 리스너 등록
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const { kakao } = window;
    const initialPos = new kakao.maps.LatLng(center.lat, center.lng);

    const map = new kakao.maps.Map(mapContainer.current, {
      center: initialPos,
      level: 4,
    });
    mapInstance.current = map;

    // 주소-좌표 변환 및 장소 검색 객체
    const geocoderObj = new kakao.maps.services.Geocoder();
    const placesObj = new kakao.maps.services.Places();
    setGeocoder(geocoderObj);
    setPlaces(placesObj);

    const fetchRegionAndCafes = (lat, lng, posObj) => {
      geocoderObj.coord2RegionCode(lng, lat, (result, status) => {
        let name = '알 수 없는 지역';
        if (status === kakao.maps.services.Status.OK) {
          const region = result.find(r => r.region_type === 'H') || result[0];
          name = region.region_3depth_name || region.address_name;
        }

        // 카페 카테고리(CE7) 검색
        placesObj.categorySearch('CE7', (data, pStatus) => {
          let newCafes = [];
          if (pStatus === kakao.maps.services.Status.OK) {
            newCafes = data.map(cafe => ({
              id: cafe.id,
              name: cafe.place_name,
              lat: cafe.y,
              lng: cafe.x,
              distance: cafe.distance,
              url: cafe.place_url
            }));
          }
          onLocationChange(lat, lng, name, newCafes);
        }, {
          location: posObj,
          radius: 500,
          size: 17 // 점수 계산을 위해 충분한 갯수
        });
      });
    };

    // 클릭 이벤트 리스너
    kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();
      fetchRegionAndCafes(lat, lng, latlng);
    });

  }, []); // Run once

  // 2. 외부에서 좌표가 변경되었을 때 지도 이동 및 동 이름/카페 추출
  useEffect(() => {
    if (!mapInstance.current || !geocoder || !places) return;
    const { kakao } = window;
    const newPos = new kakao.maps.LatLng(center.lat, center.lng);

    // 부드럽게 이동
    mapInstance.current.panTo(newPos);

    // 초기 로딩 시 혹은 Quick Select 시 카페 정보 갱신
    geocoder.coord2RegionCode(center.lng, center.lat, (result, status) => {
      let name = '알 수 없는 지역';
      if (status === kakao.maps.services.Status.OK) {
        const region = result.find(r => r.region_type === 'H') || result[0];
        name = region.region_3depth_name || region.address_name;
        setRegionName(name);
      }

      places.categorySearch('CE7', (data, pStatus) => {
        let newCafes = [];
        if (pStatus === kakao.maps.services.Status.OK) {
          newCafes = data.map(cafe => ({
            id: cafe.id,
            name: cafe.place_name,
            lat: cafe.y,
            lng: cafe.x,
            distance: cafe.distance,
            url: cafe.place_url
          }));
        }
        // 처음 로딩이나 칩 클릭 시 App으로 데이터 전송
        // App.jsx에서 cafes를 받아서 백엔드로 전송함
        onLocationChange(center.lat, center.lng, name, newCafes);
      }, {
        location: newPos,
        radius: 500,
        size: 15
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, geocoder, places]); // setRegionName, onLocationChange 제거하여 무한루프 방지

  // 3. 마커 및 오버레이 그리기 (데이터 변경 시)
  useEffect(() => {
    if (!mapInstance.current) return;
    const { kakao } = window;
    const map = mapInstance.current;
    const newPos = new kakao.maps.LatLng(center.lat, center.lng);

    if (map.markers) map.markers.forEach(m => m.setMap(null));
    if (map.overlays) map.overlays.forEach(o => o.setMap(null));
    if (map.circle) map.circle.setMap(null);

    map.markers = [];
    map.overlays = [];

    const userMarker = new kakao.maps.Marker({ position: newPos });
    userMarker.setMap(map);
    map.markers.push(userMarker);

    cafes.forEach((cafe) => {
      const position = new kakao.maps.LatLng(cafe.lat, cafe.lng);

      // 마커를 클릭하면 카카오맵 상세페이지로 이동할 수 있도록 a 태그 적용
      const content = document.createElement('div');
      content.className = 'custom-marker';
      content.innerHTML = `<a href="${cafe.url || `https://place.map.kakao.com/${cafe.id}`}" target="_blank" style="color: white; text-decoration: none; display: block; width: 100%; height: 100%;">${cafe.name}</a>`;

      const customOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });
      customOverlay.setMap(map);
      map.overlays.push(customOverlay);
    });

    if (cafes.length > 0) {
      const circle = new kakao.maps.Circle({
        center: newPos,
        radius: 500,
        strokeWeight: 2,
        strokeColor: '#6366f1',
        strokeOpacity: 0.5,
        fillColor: '#6366f1',
        fillOpacity: 0.15
      });
      circle.setMap(map);
      map.circle = circle;
    }

  }, [cafes, center]);

  return <div id="map" ref={mapContainer} className="map-container"></div>;
}

export default Map;
