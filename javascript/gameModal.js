// ===========================================
// gameModal.js
// 역할: 미니게임 공용 모달을 열고 닫는다.
//  - 각 게임 모듈(dinoGame.js, minesweeper.js, pacmanGame.js)이 전역에 등록한
//    mount 함수(window.mountXxx)를 모달 안에서 실행하고, 정리(cleanup) 함수를
//    돌려받아 모달을 닫을 때 인터벌/이벤트 리스너를 해제한다.
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
    const gameModal = document.getElementById("gameModal");
    const gameModalTitle = document.getElementById("gameModalTitle");
    const gameModalBody = document.getElementById("gameModalBody");
    const gameModalClose = document.getElementById("gameModalClose");

    if (!gameModal || !gameModalTitle || !gameModalBody || !gameModalClose) {
        return; // 이 페이지에는 해당 요소가 없으므로 조용히 종료한다.
    }

    let currentCleanup = null;

    function openGameModal(title, mount) {
        // 이전에 열려 있던 게임이 있다면 먼저 정리(인터벌/리스너 해제)
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        gameModalTitle.textContent = title;
        gameModalBody.innerHTML = "";
        gameModal.classList.add("is-open");

        // 각 게임의 mount 함수는 정리 함수를 반환한다.
        currentCleanup = mount(gameModalBody) || null;
    }

    function closeGameModal() {
        gameModal.classList.remove("is-open");
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }
        gameModalBody.innerHTML = "";
    }

    gameModalClose.addEventListener("click", closeGameModal);

    // 어두운 배경(오버레이) 클릭 시에도 닫히도록 처리
    gameModal.addEventListener("click", (event) => {
        if (event.target === gameModal) {
            closeGameModal();
        }
    });

    // ESC 키로도 모달을 닫을 수 있게 처리
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && gameModal.classList.contains("is-open")) {
            closeGameModal();
        }
    });

    const dinoBtn = document.getElementById("dinoGameBtn");
    const minesweeperBtn = document.getElementById("minesweeperBtn");
    const pacmanBtn = document.getElementById("pacmanBtn");

    if (dinoBtn) {
        dinoBtn.addEventListener("click", () => {
            openGameModal("🦖 구글 공룡 게임", window.mountDinoGame);
        });
    }

    if (minesweeperBtn) {
        minesweeperBtn.addEventListener("click", () => {
            openGameModal("💣 지뢰찾기", window.mountMinesweeper);
        });
    }

    if (pacmanBtn) {
        pacmanBtn.addEventListener("click", () => {
            openGameModal("👻 팩맨", window.mountPacman);
        });
    }
});
