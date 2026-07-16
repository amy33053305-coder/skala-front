// ===========================================
// tripAlbum.js
// 역할: 여행 앨범(myTrip.html)에서 사진을 클릭하면
//       해당 여행지에 대한 설명을 모달 창으로 보여준다.
//  - 설명 데이터는 각 <img> 태그의 data-desc 속성에 저장되어 있다.
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
    const tripImages = document.querySelectorAll(".trip-card img[data-desc]");
    const modal = document.getElementById("tripModal");
    const modalCloseBtn = document.getElementById("tripModalClose");
    const modalImg = document.getElementById("tripModalImg");
    const modalTitle = document.getElementById("tripModalTitle");
    const modalDesc = document.getElementById("tripModalDesc");

    if (!tripImages.length || !modal || !modalCloseBtn || !modalImg || !modalTitle || !modalDesc) {
        return; // 이 페이지에는 해당 요소가 없으므로 조용히 종료한다.
    }

    tripImages.forEach((img) => {
        img.addEventListener("click", () => {
            openTripModal(img);
        });
    });

    modalCloseBtn.addEventListener("click", closeTripModal);

    // 어두운 배경(오버레이) 클릭 시에도 닫히도록 처리
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeTripModal();
        }
    });

    // ESC 키로도 모달을 닫을 수 있게 처리
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) {
            closeTripModal();
        }
    });

    function openTripModal(img) {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalTitle.textContent = img.alt;
        modalDesc.textContent = img.dataset.desc;
        modal.classList.add("is-open");
    }

    function closeTripModal() {
        modal.classList.remove("is-open");
    }
});
