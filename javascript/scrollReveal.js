// ===========================================
// scrollReveal.js
// 역할: .scroll-reveal 클래스를 가진 요소가 뷰포트에 진입할 때
//       아래에서 위로 서서히 올라오는(fade-in + slide-up) 효과를 적용한다.
//       뷰포트를 벗어나면 다시 숨김 상태로 되돌려, 위로 스크롤했다가
//       다시 내리면 효과가 재생되도록 한다.
//
// 핵심 원리: IntersectionObserver API
//  - 스크롤 이벤트(scroll event)를 직접 감지하지 않아 성능 부담이 없다.
//  - 관찰 대상이 뷰포트 기준선(threshold)을 넘나들 때마다 콜백이 실행된다.
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

    // 3. 콜백 함수: 요소가 뷰포트에 진입/이탈할 때마다 is-visible 클래스를 토글
    const revealCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 화면에 들어온 순간 클래스를 추가 → CSS transition 발동
                entry.target.classList.add("is-visible");
            } else {
                // 화면을 벗어나면 클래스를 제거해 숨김 상태로 되돌림
                // → 스크롤을 올렸다가 다시 내리면 효과가 재생됨
                entry.target.classList.remove("is-visible");
            }
        });
    };

    // 4. Observer 인스턴스를 생성하고 모든 대상 요소에 연결
    const observer = new IntersectionObserver(revealCallback, observerOptions);

    revealTargets.forEach(target => {
        observer.observe(target);
    });
});
