const express = require('express');
const { calculateLupinIndex } = require('../utils/lupinCalculator');
const { fetchRealWeather } = require('../utils/weatherApi');
const router = express.Router();

router.post('/lupin-index', async (req, res) => {
    const { lat, lng, cafes } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: '위도(lat)와 경도(lng)가 필요합니다.' });
    }

    try {
        let weatherData = null;
        let isMock = false;

        // 실제 기상청 날씨 데이터 호출 시도
        try {
            weatherData = await fetchRealWeather(lat, lng);
        } catch (apiError) {
            console.error("기상청 API 연동 실패, 임시(Mock) 데이터로 대체합니다:", apiError.message);
            isMock = true;
            weatherData = {
                temp: Math.floor(Math.random() * 18) + 8,
                sky: Math.random() > 0.5 ? 1 : 3,
                pty: Math.random() > 0.85 ? 1 : 0
            };
        }

        // UI에 보여줄 날씨 텍스트 요약 정보 생성
        if (weatherData.pty > 0) {
            if (weatherData.pty === 3 || weatherData.pty === 7) {
                weatherData.summary = "눈 (우산 챙기세요!)";
            } else if (weatherData.pty === 2 || weatherData.pty === 6) {
                weatherData.summary = "비/눈 (우산 챙기세요!)";
            } else {
                weatherData.summary = "비 (우산 챙기세요!)";
            }
        } else {
            if (weatherData.sky === 1) {
                weatherData.summary = "맑음";
            } else if (weatherData.sky === 3) {
                weatherData.summary = "구름 많음";
            } else if (weatherData.sky === 4) {
                weatherData.summary = "흐림";
            } else {
                weatherData.summary = "구름 많음";
            }
        }

        // 루팡 지수 계산 (카카오맵 카페 목록 + 실시간 날씨 데이터)
        const result = calculateLupinIndex(weatherData, cafes || []);

        res.json({
            success: true,
            isMock,
            data: {
                ...result,
                cafes: cafes || [],
                weather: weatherData
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: '서버 내부 에러가 발생했습니다.' });
    }
});

module.exports = router;
