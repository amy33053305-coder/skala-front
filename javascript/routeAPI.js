// ===========================================
// routeAPI.js
// 역할: 두 지점(출발지/목적지) 간 경로 데이터(거리/소요시간) 통신 담당 모듈
//  - OSRM(Open Source Routing Machine) 공개 데모 서버를 사용한다.
//  - 지역명 → 좌표 변환은 weatherAPI.js의 geocodeLocation을 재사용한다.
// ===========================================

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * 출발지/목적지 좌표를 받아 자동차 경로의 거리와 소요 시간을 조회한다.
 * @param {{lat: number, lon: number}} origin 출발지 좌표
 * @param {{lat: number, lon: number}} destination 목적지 좌표
 * @returns {Promise<{distanceKm: number, durationMin: number}>}
 */
export async function fetchRoute(origin, destination) {
    const url = `${OSRM_URL}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`경로 API 요청 실패 (status: ${response.status})`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("출발지와 목적지 사이의 경로를 찾을 수 없습니다.");
    }

    const route = data.routes[0];

    return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60
    };
}
