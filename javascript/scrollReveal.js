// ===========================================
// scrollReveal.js
// 역할: .scroll-reveal 클래스를 가진 요소가 뷰포트에 진입할 때
//       아래에서 위로 서서히 올라오는(fade-in + slide-up) 효과를 적용한다.
//
// 핵심 원리: IntersectionObserver API
//  - 스크롤 이벤트(scroll event)를 직접 감지하지 않아 성능 부담이 없다.
//  - 관찰 대상이 뷰포트 기준선(threshold)을 넘는 순간 콜백이 한 번 실행된다.
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    // 1. 페이지 내 .scroll-reveal 클래스를 가진 요소를 모두 선택
    const revealTargets = document.querySelectorAll(".scroll-reveal");

    // 2. IntersectionObserver 옵션 설정
    const observerOptions = {
        root: null,         // 뷰포트(브라우저 화면) 자체를 기준으로 감지
        rootMargin: "0px",  // 뷰포트 경계에 추가 여백 없음
        threshold: 0.15     // 요소가 15% 이상 보이는 순간 콜백 실행
    };

    // 3. 콜백 함수: 요소가 뷰포트에 진입했을 때 is-visible 클래스를 추가
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 화면에 들어온 순간 클래스를 추가 → CSS transition 발동
                entry.target.classList.add("is-visible");

                // 한 번 등장한 요소는 더 이상 관찰할 필요가 없으므로 해제
                observer.unobserve(entry.target);
            }
        });
    };

    // 4. Observer 인스턴스를 생성하고 모든 대상 요소에 연결
    const observer = new IntersectionObserver(revealCallback, observerOptions);

    revealTargets.forEach(target => {
        observer.observe(target);
    });
});
