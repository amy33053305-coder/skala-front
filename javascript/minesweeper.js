// ===========================================
// minesweeper.js
// 역할: 클래식 지뢰찾기(Minesweeper Online) 미니게임
//  - 9x9 칸, 지뢰 10개짜리 초급 난이도 보드를 button 격자로 구현한다.
//  - 좌클릭: 칸 열기 (인접 지뢰가 0개면 주변 빈 칸까지 자동으로 열림)
//  - 우클릭: 깃발 표시/해제
//  - gameModal.js가 모달을 열 때 window.mountMinesweeper(container)를 호출한다.
// ===========================================

window.mountMinesweeper = function (container) {
    const SIZE = 9;
    const MINE_COUNT = 10;

    container.innerHTML = `
        <p class="game-instructions">좌클릭: 칸 열기 · 우클릭: 깃발 표시 🚩 · 지뢰를 피해 나머지 칸을 모두 열면 승리!</p>
        <p class="game-status">
            <span id="minesweeperStatus">남은 지뢰: ${MINE_COUNT}</span>
            <button id="minesweeperRestart" class="btn-submit game-restart-btn" type="button">🔄 다시 시작</button>
        </p>
        <div id="minesweeperBoard" class="minesweeper-board" style="grid-template-columns: repeat(${SIZE}, 28px);"></div>
    `;

    const boardEl = container.querySelector("#minesweeperBoard");
    const statusEl = container.querySelector("#minesweeperStatus");
    const restartBtn = container.querySelector("#minesweeperRestart");

    let board = [];
    let ended = false;

    function createBoard() {
        board = Array.from({ length: SIZE }, () =>
            Array.from({ length: SIZE }, () => ({
                mine: false,
                adjacent: 0,
                revealed: false,
                flagged: false
            }))
        );

        let placed = 0;
        while (placed < MINE_COUNT) {
            const r = Math.floor(Math.random() * SIZE);
            const c = Math.floor(Math.random() * SIZE);
            if (!board[r][c].mine) {
                board[r][c].mine = true;
                placed++;
            }
        }

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (!board[r][c].mine) {
                    board[r][c].adjacent = countAdjacentMines(r, c);
                }
            }
        }

        ended = false;
        statusEl.textContent = `남은 지뢰: ${MINE_COUNT}`;
    }

    function countAdjacentMines(r, c) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) {
                    count++;
                }
            }
        }
        return count;
    }

    function render() {
        boardEl.innerHTML = "";
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = board[r][c];
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "minesweeper-cell";
                btn.dataset.row = String(r);
                btn.dataset.col = String(c);

                if (cell.revealed) {
                    btn.classList.add("is-revealed");
                    if (cell.mine) {
                        btn.classList.add("is-mine");
                        btn.textContent = "💣";
                    } else if (cell.adjacent > 0) {
                        btn.textContent = String(cell.adjacent);
                    }
                } else if (cell.flagged) {
                    btn.textContent = "🚩";
                }

                boardEl.appendChild(btn);
            }
        }
    }

    function revealCell(r, c) {
        const cell = board[r][c];
        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;

        if (cell.mine) {
            endGame(false);
            return;
        }

        if (cell.adjacent === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !board[nr][nc].revealed) {
                        revealCell(nr, nc);
                    }
                }
            }
        }

        checkWin();
    }

    function toggleFlag(r, c) {
        const cell = board[r][c];
        if (cell.revealed) return;

        cell.flagged = !cell.flagged;

        let flaggedCount = 0;
        board.forEach((row) => row.forEach((c2) => {
            if (c2.flagged) flaggedCount++;
        }));
        statusEl.textContent = `남은 지뢰: ${MINE_COUNT - flaggedCount}`;
    }

    function checkWin() {
        let revealedCount = 0;
        board.forEach((row) => row.forEach((c2) => {
            if (c2.revealed) revealedCount++;
        }));

        if (revealedCount === SIZE * SIZE - MINE_COUNT) {
            endGame(true);
        }
    }

    function endGame(won) {
        ended = true;
        board.forEach((row) => row.forEach((cell) => {
            if (cell.mine) cell.revealed = true;
        }));
        statusEl.textContent = won
            ? "🎉 승리! 모든 칸을 안전하게 열었습니다."
            : "💥 게임 오버! 지뢰를 밟았습니다.";
    }

    function handleClick(event) {
        const target = event.target.closest(".minesweeper-cell");
        if (!target || ended) return;
        revealCell(Number(target.dataset.row), Number(target.dataset.col));
        render();
    }

    function handleContextMenu(event) {
        const target = event.target.closest(".minesweeper-cell");
        event.preventDefault();
        if (!target || ended) return;
        toggleFlag(Number(target.dataset.row), Number(target.dataset.col));
        render();
    }

    function handleRestart() {
        createBoard();
        render();
    }

    boardEl.addEventListener("click", handleClick);
    boardEl.addEventListener("contextmenu", handleContextMenu);
    restartBtn.addEventListener("click", handleRestart);

    createBoard();
    render();

    // 모달이 닫힐 때 gameModal.js가 호출할 정리 함수
    return function cleanup() {
        boardEl.removeEventListener("click", handleClick);
        boardEl.removeEventListener("contextmenu", handleContextMenu);
        restartBtn.removeEventListener("click", handleRestart);
    };
};
