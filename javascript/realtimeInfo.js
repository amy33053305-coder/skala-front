// ===========================================
// realtimeInfo.js
// 역할: 화면(DOM 조작 + 이벤트) 담당 모듈
//  - weatherAPI.js에서 데이터 함수를 import 하여 사용한다.
//  - select 변경 이벤트를 감지해 좌표를 먼저 보여주고, 이어서 실시간 날씨를 받아온다.
// ===========================================

import { fetchWeather, describeWeatherCode } from "./weatherAPI.js";

// 1. [도시 정보 Object] 도시 이름을 key로, 좌표를 value로 갖는 객체
const cities = {
    "광주": { lat: 35.1595, lon: 126.8526 },
    "서울": { lat: 37.5665, lon: 126.9780 },
    "부산": { lat: 35.1796, lon: 129.0756 },
    "제주": { lat: 33.4996, lon: 126.5312 },
    "도쿄": { lat: 35.6895, lon: 139.6917 },
    "뉴욕": { lat: 40.7128, lon: -74.0060 },
    "런던": { lat: 51.5074, lon: -0.1278 }
};

// DOM이 모두 로드된 후 초기화를 진행한다.
document.addEventListener("DOMContentLoaded", () => {
    const citySelect = document.getElementById("citySelect");
    const weatherBox = document.getElementById("weather-box");

    if (!citySelect || !weatherBox) {
        // 다른 페이지(myClass.html 등)에는 이 요소가 없으므로 조용히 종료한다.
        return;
    }

    // 2. cities 객체를 기반으로 <select> 옵션을 동적으로 생성
    for (const cityName in cities) {
        const option = document.createElement("option");
        option.value = cityName;
        option.textContent = cityName;
        citySelect.appendChild(option);
    }

    // 3. change 이벤트 등록: 도시를 바꿀 때마다 실행
    citySelect.addEventListener("change", () => {
        handleCityChange(citySelect.value, weatherBox);
    });

    // 4. 페이지 진입 시 기본 선택된 도시(첫 번째 항목)로 최초 1회 실행
    handleCityChange(citySelect.value, weatherBox);
});

/**
 * 선택된 도시가 바뀔 때 좌표를 즉시 표시하고, 이어서 실시간 날씨를 비동기로 가져와 표시한다.
 * @param {string} cityName
 * @param {HTMLElement} weatherBox
 */
async function handleCityChange(cityName, weatherBox) {
    const city = cities[cityName];
    if (!city) return;

    // (1단계) 좌표 정보를 DOM 조작(innerHTML)으로 즉시 표시
    weatherBox.innerHTML = `
        <p><strong>📍 ${cityName}</strong></p>
        <p>위도: ${city.lat} / 경도: ${city.lon}</p>
        <p class="weather-loading">로딩 중... ⏳</p>
    `;

    // (2단계) fetch + async/await로 실제 날씨 데이터 요청
    try {
        const { temperature, humidity, weatherCode } = await fetchWeather(city.lat, city.lon);
        const { icon, label } = describeWeatherCode(weatherCode);

        // (3단계) 다운로드 완료 후 실시간 온도/습도로 화면 갱신
        weatherBox.innerHTML = `
            <p><strong>📍 ${cityName}</strong></p>
            <p>위도: ${city.lat} / 경도: ${city.lon}</p>
            <p class="weather-result">${icon} ${label}</p>
            <p>🌡️ 현재 기온: <strong>${temperature}°C</strong></p>
            <p>💧 현재 습도: <strong>${humidity}%</strong></p>
        `;
    } catch (error) {
        // 네트워크 오류 등 예외 상황 처리
        weatherBox.innerHTML = `
            <p><strong>📍 ${cityName}</strong></p>
            <p>위도: ${city.lat} / 경도: ${city.lon}</p>
            <p class="weather-error">⚠️ 날씨 정보를 불러오지 못했습니다.</p>
        `;
        console.error("날씨 데이터를 가져오는 중 오류 발생:", error);
    }
}
