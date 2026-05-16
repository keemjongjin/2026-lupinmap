const axios = require('axios');
const { dfs_xy_conv } = require('./dfs_xy_conv');

/**
 * 기상청 초단기예보 API 호출 (getUltraSrtFcst)
 */
async function fetchRealWeather(lat, lng) {
    const API_KEY = process.env.WEATHER_API_KEY;
    if (!API_KEY) throw new Error("WEATHER_API_KEY is not set in .env");

    // 위경도 -> 기상청 nx, ny 격자 변환
    const { nx, ny } = dfs_xy_conv("toXY", lat, lng);

    // base_date, base_time 계산
    // 초단기예보는 매시간 45분에 발표되며, base_time은 매시간 30분입니다.
    const now = new Date();
    // 로컬 시스템의 타임존에 의존하지 않기 위해 KST(+9) 강제 조정
    const kstOffset = 9 * 60;
    now.setMinutes(now.getMinutes() + kstOffset + now.getTimezoneOffset());

    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // 45분 이전이면 아직 현재 시간의 예보가 발표되지 않았으므로 이전 시간 사용
    if (minutes < 45) {
        hours = hours - 1;
        if (hours < 0) {
            hours = 23;
            now.setDate(now.getDate() - 1);
            year = now.getFullYear();
            month = now.getMonth() + 1;
            date = now.getDate();
        }
    }

    const base_date = `${year}${String(month).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const base_time = `${String(hours).padStart(2, '0')}30`;

    // API 요청
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
    const params = {
        ServiceKey: decodeURIComponent(API_KEY),
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date,
        base_time,
        nx,
        ny
    };

    const response = await axios.get(url, { params });
    const items = response.data?.response?.body?.items?.item;

    if (!items || !Array.isArray(items)) {
        throw new Error(`Invalid API response format: ${JSON.stringify(response.data)}`);
    }

    // 데이터 추출 (가장 빠른 시간대 fcstTime의 값들을 우선으로 채택)
    let temp = 20; // 기온 (T1H)
    let pty = 0;   // 강수형태 (PTY)
    let sky = 1;   // 하늘상태 (SKY)

    let foundT1H = false;
    let foundPTY = false;
    let foundSKY = false;

    items.forEach(item => {
        // 초단기예보의 값은 fcstValue 필드에 있습니다.
        if (item.category === 'T1H' && !foundT1H) {
            temp = parseFloat(item.fcstValue);
            foundT1H = true;
        }
        if (item.category === 'PTY' && !foundPTY) {
            pty = parseInt(item.fcstValue, 10);
            foundPTY = true;
        }
        if (item.category === 'SKY' && !foundSKY) {
            sky = parseInt(item.fcstValue, 10);
            foundSKY = true;
        }
    });

    return { temp, sky, pty };
}

module.exports = { fetchRealWeather };
