// ===========================================
// realtimeInfo.js
// 역할: 화면(DOM 조작 + 이벤트) 담당 모듈
//  - weatherAPI.js에서 데이터 함수를 import 하여 사용한다.
//  - select 변경 이벤트를 감지해 좌표를 먼저 보여주고, 이어서 실시간 날씨를 받아온다.
// ===========================================
 
import { fetchWeather, geocodeLocation, describeWeatherCode } from "./weatherAPI.js";
 
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
    // ---- ① 사이드바 상단 "현재 위치 입력" 기능 초기화 ----
    initCurrentLocationSearch();
 
    // ---- ② 도시 선택 드롭다운(citySelect) 기능 초기화 ----
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
 * 사이드바 상단의 "현재 위치 입력" 영역을 초기화한다.
 * - 입력창(#locationInput) + 조회 버튼(#locationSearchBtn) 이벤트를 등록
 * - 페이지 진입 시 입력창 기본값(광주)으로 최초 1회 자동 조회
 */
function initCurrentLocationSearch() {
    const locationInput = document.getElementById("locationInput");
    const locationSearchBtn = document.getElementById("locationSearchBtn");
    const currentLocationBox = document.getElementById("current-location-box");
 
    if (!locationInput || !locationSearchBtn || !currentLocationBox) {
        return; // 이 페이지에는 해당 요소가 없음
    }
 
    // 버튼 클릭 시 조회
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