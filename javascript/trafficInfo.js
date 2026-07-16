// ===========================================
// trafficInfo.js
// 역할: 화면(DOM 조작 + 이벤트) 담당 모듈
//  - 출발지/목적지 지역명을 geocodeLocation(weatherAPI.js)으로 좌표 변환하고,
//    fetchRoute(routeAPI.js)로 거리/소요 시간을 조회해 표시한다.
// ===========================================

import { geocodeLocation } from "./weatherAPI.js";
import { fetchRoute } from "./routeAPI.js";

document.addEventListener("DOMContentLoaded", () => {
    const originInput = document.getElementById("originInput");
    const destinationInput = document.getElementById("destinationInput");
    const routeSearchBtn = document.getElementById("routeSearchBtn");
    const routeBox = document.getElementById("route-box");

    if (!originInput || !destinationInput || !routeSearchBtn || !routeBox) {
        // 이 요소가 없는 페이지(myClass.html 등)에서는 조용히 종료한다.
        return;
    }

    routeSearchBtn.addEventListener("click", () => {
        handleRouteSearch(originInput.value, destinationInput.value, routeBox);
    });

    [originInput, destinationInput].forEach((input) => {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                handleRouteSearch(originInput.value, destinationInput.value, routeBox);
            }
        });
    });
});

/**
 * 출발지/목적지 지역명으로 좌표를 조회한 뒤 경로(거리/소요시간)를 계산해 표시한다.
 * @param {string} originQuery 출발지 지역명
 * @param {string} destinationQuery 목적지 지역명
 * @param {HTMLElement} box 결과를 표시할 DOM 요소
 */
async function handleRouteSearch(originQuery, destinationQuery, box) {
    const origin = originQuery.trim();
    const destination = destinationQuery.trim();

    if (!origin || !destination) {
        alert("출발지와 목적지를 모두 입력해주세요.");
        return;
    }

    box.innerHTML = `
        <p>🚩 출발: <strong>${origin}</strong> → 🏁 도착: <strong>${destination}</strong></p>
        <p class="weather-loading">경로 조회 중... ⏳</p>
    `;

    try {
        const [originPlace, destinationPlace] = await Promise.all([
            geocodeLocation(origin),
            geocodeLocation(destination)
        ]);

        if (!originPlace || !destinationPlace) {
            throw new Error("출발지 또는 목적지를 찾을 수 없습니다.");
        }

        const { distanceKm, durationMin } = await fetchRoute(originPlace, destinationPlace);

        box.innerHTML = `
            <p>🚩 출발: <strong>${originPlace.displayName}</strong></p>
            <p>🏁 도착: <strong>${destinationPlace.displayName}</strong></p>
            <p class="weather-result">📏 거리: <strong>${distanceKm.toFixed(1)}km</strong> · ⏱️ 소요 시간: <strong>${Math.round(durationMin)}분</strong></p>
        `;
    } catch (error) {
        box.innerHTML = `
            <p>🚩 출발: <strong>${origin}</strong> → 🏁 도착: <strong>${destination}</strong></p>
            <p class="weather-error">⚠️ 경로 정보를 가져오지 못했습니다.</p>
        `;
        console.error("경로 조회 중 오류 발생:", error);
    }
}
