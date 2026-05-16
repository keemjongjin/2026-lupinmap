/**
 * 루팡 지수 산출 알고리즘 (100점 만점 기반)
 */
function calculateLupinIndex(weatherData, cafeData) {
    let weatherScore100 = 0; // 0 ~ 100점
    let cafeScore100 = 0;    // 0 ~ 100점
    let comments = [];

    // 날씨 점수 산출 (Max 100점 = 기온 40점 + 하늘 60점)
    if (weatherData) {
        const { temp, sky, pty } = weatherData;
        let tScore = 0;
        let sScore = 0;

        // 기온 평가 (Max 40)
        if (temp >= 18 && temp <= 24) tScore = 40;
        else if ((temp >= 10 && temp < 18) || (temp > 24 && temp <= 28)) tScore = 25;
        else if ((temp >= 5 && temp < 10) || (temp > 28 && temp <= 32)) tScore = 15;
        else tScore = 0; // 폭염/혹한

        // 하늘 및 강수 평가 (Max 60)
        if (pty > 0) {
            sScore = 0; // 비/눈 오면 무조건 0점 처리 
            comments.push("우산이 필요해서 나가기 귀찮을 수 있어요.");
        } else {
            if (sky === 1) {
                sScore = 60;
                if (tScore >= 25) comments.push("날씨가 완벽해요! 당장 나갑시다.");
            } else if (sky === 3) {
                sScore = 45;
            } else { // sky === 4
                sScore = 30;
                comments.push("조금 흐리지만 커피 한 잔은 괜찮아요.");
            }
        }

        weatherScore100 = tScore + sScore;
    } else {
        weatherScore100 = 60; // 기본값
    }

    // 카페 인프라 점수 산출 (Max 100점)
    const count = (cafeData && Array.isArray(cafeData)) ? cafeData.length : 0;

    if (count > 0) {
        // 최대 15개를 100점으로 산정하여 비례 점수 부여
        cafeScore100 = Math.min(100, Math.round((count / 15) * 100));

        if (count >= 14) {
            comments.push("주변에 카페가 넘쳐납니다. 골라가는 재미!");
        } else if (count >= 10) {
            comments.push("선택지가 꽤 다양한 편입니다.");
        } else if (count >= 6) {
            comments.push("산책 삼아 갈만한 카페들이 있습니다.");
        } else {
            comments.push("선택지가 적지만 숨돌릴 곳은 있네요.");
        }
    } else {
        cafeScore100 = 0;
        comments.push("주변에 카페가 없어요... 사무실 탕비실을 이용하세요.");
    }

    // 종합 점수 환산
    let totalScore = 0;
    if (count === 0) {
        // 카페가 0개면 날씨 비중 10%, 카페 비중 90%
        totalScore = Math.round((weatherScore100 * 0.1) + (cafeScore100 * 0.9));
    } else {
        // 기본 비중 (날씨 40%, 카페 60%)
        totalScore = Math.round((weatherScore100 * 0.4) + (cafeScore100 * 0.6));
    }

    // 별점 역산 (1~5점)
    // 0점이어도 최소 별점 1점을 보장
    const weatherRating = Math.max(1, Math.ceil(weatherScore100 / 20));
    const cafeRating = Math.max(1, Math.ceil(cafeScore100 / 20));

    return {
        score: totalScore,
        ratings: {
            weather: weatherRating,
            cafe: cafeRating
        },
        comments,
        level: getLupinLevel(totalScore)
    };
}

function getLupinLevel(score) {
    if (score >= 80) return "PERFECT";
    if (score >= 50) return "GOOD";
    if (score >= 30) return "SOSO";
    return "BAD";
}

module.exports = { calculateLupinIndex };
