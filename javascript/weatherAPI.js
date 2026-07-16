// ===========================================
// weatherAPI.js
// 역할: 데이터(비동기 통신) 담당 모듈
//  - Open-Meteo API 호출만 책임지고, DOM은 절대 건드리지 않는다.
//  - 화면 담당(realtimeInfo.js)에서 import 하여 사용한다.
// ===========================================
 
const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
 
/**
 * 사용자가 입력한 지역명(예: "광주", "Tokyo")을 위도/경도로 변환한다.
 * Open-Meteo의 무료 Geocoding API를 사용한다.
 * @param {string} query 지역명
 * @returns {Promise<{lat: number, lon: number, displayName: string} | null>}
 */
export async function geocodeLocation(query) {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=1&language=ko&format=json`;
 
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`지오코딩 API 요청 실패 (status: ${response.status})`);
    }
 
    const data = await response.json();
 
    // 검색 결과가 없으면 null을 반환해서 호출부가 "지역을 찾을 수 없음" 처리를 하게 한다.
    if (!data.results || data.results.length === 0) {
        return null;
    }
 
    const result = data.results[0];
    // "광산구, 광주, 대한민국" 처럼 사람이 읽기 좋은 이름으로 조합
    const displayName = [result.name, result.admin1, result.country]
        .filter(Boolean)
        .join(", ");
 
    return { lat: result.latitude, lon: result.longitude, displayName };
}
 
/**
 * 위도(lat), 경도(lon)를 받아 Open-Meteo에서 현재 날씨를 가져온다.
 * @param {number} lat 위도
 * @param {number} lon 경도
 * @returns {Promise<{temperature: number, humidity: number, weatherCode: number}>}
 */
export async function fetchWeather(lat, lon) {
    // current 파라미터로 기온(temperature_2m), 습도(relative_humidity_2m),
    // 날씨 코드(weather_code)를 한 번에 요청한다.
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
 
    const response = await fetch(url);
 
    // 서버 응답이 정상(200)이 아니면 에러를 던져서 호출부(catch)에서 처리하게 한다.
    if (!response.ok) {
        throw new Error(`날씨 API 요청 실패 (status: ${response.status})`);
    }
 
    const data = await response.json();
 
    // 호출부가 쓰기 편하도록 필요한 값만 정리해서 반환한다.
    return {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code
    };
}
 
/**
 * Open-Meteo의 weather_code를 사람이 읽기 쉬운 아이콘 + 설명으로 변환한다.
 * (공식 문서 WMO Weather interpretation codes 기준 간략 매핑)
 * @param {number} code
 * @returns {{icon: string, label: string}}
 */
export function describeWeatherCode(code) {
    const table = {
        0: { icon: "☀️", label: "맑음" },
        1: { icon: "🌤️", label: "대체로 맑음" },
        2: { icon: "⛅", label: "구름 조금" },
        3: { icon: "☁️", label: "흐림" },
        45: { icon: "🌫️", label: "안개" },
        48: { icon: "🌫️", label: "짙은 안개" },
        51: { icon: "🌦️", label: "약한 이슬비" },
        61: { icon: "🌧️", label: "약한 비" },
        63: { icon: "🌧️", label: "비" },
        65: { icon: "🌧️", label: "강한 비" },
        71: { icon: "🌨️", label: "약한 눈" },
        73: { icon: "🌨️", label: "눈" },
        75: { icon: "❄️", label: "강한 눈" },
        80: { icon: "🌦️", label: "소나기" },
        95: { icon: "⛈️", label: "뇌우" }
    };
 
    return table[code] || { icon: "🌡️", label: "정보 없음" };
}