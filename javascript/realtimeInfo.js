// ===========================================
// realtimeInfo.js
// 역할: 화면(DOM 조작 + 이벤트) 담당 모듈
//  - weatherAPI.js에서 데이터 함수를 import 하여 사용한다.
//  - 지역명은 기본적으로 입력창(#locationInput)에서 직접 입력받고,
//    오른쪽의 빠른 선택 드롭다운(#citySelect)에서는 자주 찾는 도시를
//    선택하면 좌표를 바로 알고 있어 지오코딩 없이 곧장 조회한다.
// ===========================================

import { fetchWeather, geocodeLocation, describeWeatherCode } from "./weatherAPI.js";

// 1. [도시 정보 Object] 빠른 선택 드롭다운에서 제공할 기본 도시와 좌표
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
    initCurrentLocationSearch();
});

/**
 * 사이드바 상단의 "실시간 날씨 정보" 영역을 초기화한다.
 * - 입력창(#locationInput) + 조회 버튼(#locationSearchBtn): 사용자가 직접 지역명을 입력해 조회
 * - 빠른 선택 드롭다운(#citySelect): 오른쪽 화살표를 눌러 자주 찾는 도시를 기본값으로 바로 조회
 * - 페이지 진입 시 입력창 기본값(광주)으로 최초 1회 자동 조회
 */
function initCurrentLocationSearch() {
    const locationInput = document.getElementById("locationInput");
    const locationSearchBtn = document.getElementById("locationSearchBtn");
    const citySelect = document.getElementById("citySelect");
    const currentLocationBox = document.getElementById("current-location-box");

    if (!locationInput || !locationSearchBtn || !currentLocationBox) {
        return; // 이 페이지에는 해당 요소가 없음
    }

    // 버튼 클릭 시 조회 (사용자가 입력한 지역명 기준)
    locationSearchBtn.addEventListener("click", () => {
        handleLocationSearch(locationInput.value, currentLocationBox);
    });

    // 입력창에서 Enter 키 입력 시에도 조회되도록 처리
    locationInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleLocationSearch(locationInput.value, currentLocationBox);
        }
    });

    if (citySelect) {
        // 오른쪽 화살표(드롭다운)를 누르면 나타날 "빠른 선택" 기본 옵션 구성
        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "▼";
        citySelect.appendChild(placeholderOption);

        for (const cityName in cities) {
            const option = document.createElement("option");
            option.value = cityName;
            option.textContent = cityName;
            citySelect.appendChild(option);
        }

        // 빠른 선택 도시를 고르면 입력창에도 채워주고 즉시 조회한다.
        citySelect.addEventListener("change", () => {
            const cityName = citySelect.value;
            if (!cityName) return;

            locationInput.value = cityName;
            handlePresetCity(cityName, currentLocationBox);

            // 다음 선택을 위해 화살표 표시로 되돌림
            citySelect.value = "";
        });
    }

    // 페이지 최초 진입 시, 입력창에 미리 채워진 기본 지역으로 한 번 조회
    handleLocationSearch(locationInput.value, currentLocationBox);
}
 
/**
 * 사용자가 입력한 지역명으로 좌표를 찾고(geocodeLocation), 오늘의 날씨를 가져와(fetchWeather)
 * #current-location-box에 표시한다.
 * @param {string} query 사용자가 입력한 지역명
 * @param {HTMLElement} box 결과를 표시할 DOM 요소
 */
async function handleLocationSearch(query, box) {
    const trimmed = query.trim();
    if (!trimmed) {
        alert("지역명을 입력해주세요.");
        return;
    }
 
    // (1단계) 로딩 상태 표시
    box.innerHTML = `
        <p>현재 위치: <strong>${trimmed}</strong> 📍</p>
        <p class="weather-loading">로딩 중... ⏳</p>
    `;
 
    try {
        // (2단계) 지역명 → 좌표 변환
        const place = await geocodeLocation(trimmed);
        if (!place) {
            throw new Error("해당 지역을 찾을 수 없습니다.");
        }
 
        // (3단계) 좌표 → 오늘의 날씨 조회
        const { temperature, humidity, weatherCode } = await fetchWeather(place.lat, place.lon);
        const { icon, label } = describeWeatherCode(weatherCode);
 
        // (4단계) 결과 렌더링
        box.innerHTML = `
            <p>현재 위치: <strong>${place.displayName}</strong> 📍</p>
            <p>오늘의 날씨: ${icon} ${label}</p>
            <p>🌡️ 기온: <strong>${temperature}°C</strong> · 💧 습도: <strong>${humidity}%</strong></p>
        `;
    } catch (error) {
        box.innerHTML = `
            <p>현재 위치: <strong>${trimmed}</strong> 📍</p>
            <p class="weather-error">⚠️ 위치를 찾을 수 없거나 날씨 정보를 가져오지 못했습니다.</p>
        `;
        console.error("현재 위치 날씨 조회 중 오류 발생:", error);
    }
}
 
/**
 * 빠른 선택 드롭다운에서 고른 도시의 날씨를 표시한다.
 * 좌표를 이미 알고 있으므로 geocodeLocation 없이 곧장 fetchWeather를 호출한다.
 * @param {string} cityName
 * @param {HTMLElement} box 결과를 표시할 DOM 요소 (#current-location-box)
 */
async function handlePresetCity(cityName, box) {
    const city = cities[cityName];
    if (!city) return;

    // (1단계) 로딩 상태 표시
    box.innerHTML = `
        <p>현재 위치: <strong>${cityName}</strong> 📍</p>
        <p class="weather-loading">로딩 중... ⏳</p>
    `;

    try {
        // (2단계) 좌표 → 오늘의 날씨 조회
        const { temperature, humidity, weatherCode } = await fetchWeather(city.lat, city.lon);
        const { icon, label } = describeWeatherCode(weatherCode);

        // (3단계) 결과 렌더링
        box.innerHTML = `
            <p>현재 위치: <strong>${cityName}</strong> 📍</p>
            <p>오늘의 날씨: ${icon} ${label}</p>
            <p>🌡️ 기온: <strong>${temperature}°C</strong> · 💧 습도: <strong>${humidity}%</strong></p>
        `;
    } catch (error) {
        box.innerHTML = `
            <p>현재 위치: <strong>${cityName}</strong> 📍</p>
            <p class="weather-error">⚠️ 날씨 정보를 가져오지 못했습니다.</p>
        `;
        console.error("빠른 선택 도시 날씨 조회 중 오류 발생:", error);
    }
}