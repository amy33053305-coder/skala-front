// ===========================================
// pacmanGame.js
// 역할: Google Pac-Man을 흉내 낸 간이 팩맨 미니게임
//  - 방향키로 팩맨을 움직여 미로 안의 점을 모두 먹으면 승리
//  - 유령(👻)에게 닿으면 게임 오버 (거리 기반 단순 추격 AI)
//  - gameModal.js가 모달을 열 때 window.mountPacman(container)를 호출한다.
// ===========================================

window.mountPacman = function (container) {
    const CELL = 24;

    // #: 벽 / .: 점이 있는 통로 / (공백): 빈 통로 / P: 팩맨 시작 위치 / G: 유령 시작 위치
    const rawMaze = [
        "#############",
        "#...........#",
        "#.###.#.###.#",
        "#.#.......#.#",
        "#.#.##G##.#.#",
        "#...........#",
        "#.#.#####.#.#",
        "#.#...P...#.#",
        "#.###.#.###.#",
        "#...........#",
        "#############"
    ];

    const rows = rawMaze.length;
    const cols = rawMaze[0].length;

    container.innerHTML = `
        <p class="game-instructions">방향키로 이동해서 점을 모두 먹으면 승리! 유령👻에 닿으면 게임 오버예요.</p>
        <p class="game-status">
            <span id="pacmanStatus">점수: 0</span>
            <button id="pacmanRestart" class="btn-submit game-restart-btn" type="button">🔄 다시 시작</button>
        </p>
        <div id="pacmanMaze" class="pacman-maze" style="width:${cols * CELL}px; height:${rows * CELL}px;"></div>
    `;

    const mazeEl = container.querySelector("#pacmanMaze");
    const statusEl = container.querySelector("#pacmanStatus");
    const restartBtn = container.querySelector("#pacmanRestart");

    // 벽 여부는 미로가 바뀌지 않는 한 고정이므로 한 번만 파싱한다.
    const walls = [];
    let pacmanStart = { r: 0, c: 0 };
    let ghostStart = { r: 0, c: 0 };
    const dotPositions = [];

    for (let r = 0; r < rows; r++) {
        const wallRow = [];
        for (let c = 0; c < cols; c++) {
            const ch = rawMaze[r][c];
            if (ch === "#") {
                wallRow.push(true);
            } else {
                wallRow.push(false);
                if (ch === "P") {
                    pacmanStart = { r, c };
                } else if (ch === "G") {
                    ghostStart = { r, c };
                } else if (ch === ".") {
                    dotPositions.push({ r, c });
                }
            }
        }
        walls.push(wallRow);
    }

    function canMove(r, c) {
        return r >= 0 && r < rows && c >= 0 && c < cols && !walls[r][c];
    }

    // 매 판마다 다시 채워질 상태값들
    let dots, dotEls, pacman, ghost, score, dir, nextDir, ended, intervalId;

    function buildBoard() {
        mazeEl.innerHTML = "";
        dots = new Set(dotPositions.map((p) => `${p.r},${p.c}`));
        dotEls = new Map();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellEl = document.createElement("div");
                cellEl.className = "pacman-cell" + (walls[r][c] ? " is-wall" : "");
                cellEl.style.left = `${c * CELL}px`;
                cellEl.style.top = `${r * CELL}px`;

                if (dots.has(`${r},${c}`)) {
                    const dot = document.createElement("span");
                    dot.className = "pacman-dot";
                    cellEl.appendChild(dot);
                    dotEls.set(`${r},${c}`, dot);
                }

                mazeEl.appendChild(cellEl);
            }
        }

        const pacmanEl = document.createElement("div");
        pacmanEl.className = "pacman-player";
        mazeEl.appendChild(pacmanEl);

        const ghostEl = document.createElement("div");
        ghostEl.className = "pacman-ghost";
        mazeEl.appendChild(ghostEl);

        return { pacmanEl, ghostEl };
    }

    let pacmanEl, ghostEl;

    function positionEntities() {
        pacmanEl.style.transform = `translate(${pacman.c * CELL}px, ${pacman.r * CELL}px)`;
        ghostEl.style.transform = `translate(${ghost.c * CELL}px, ${ghost.r * CELL}px)`;
    }

    function eatDotIfAny() {
        const key = `${pacman.r},${pacman.c}`;
        if (dots.has(key)) {
            dots.delete(key);
            const dotEl = dotEls.get(key);
            if (dotEl) dotEl.remove();

            score += 10;
            statusEl.textContent = `점수: ${score}`;

            if (dots.size === 0) {
                endGame(true);
            }
        }
    }

    function tick() {
        if (ended) return;

        // 팩맨 이동: 예약된 방향으로 갈 수 있으면 전환, 아니면 기존 방향 유지
        if (canMove(pacman.r + nextDir.r, pacman.c + nextDir.c)) {
            dir = nextDir;
        }
        if (canMove(pacman.r + dir.r, pacman.c + dir.c)) {
            pacman = { r: pacman.r + dir.r, c: pacman.c + dir.c };
        }
        eatDotIfAny();
        if (ended) {
            positionEntities();
            return;
        }

        // 유령 이동: 팩맨과의 맨해튼 거리를 좁히는 방향을 우선 선택하는 단순 추격 AI
        const options = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 }
        ].filter((o) => canMove(ghost.r + o.r, ghost.c + o.c));

        if (options.length > 0) {
            options.sort((a, b) => {
                const da = Math.abs(ghost.r + a.r - pacman.r) + Math.abs(ghost.c + a.c - pacman.c);
                const db = Math.abs(ghost.r + b.r - pacman.r) + Math.abs(ghost.c + b.c - pacman.c);
                return da - db;
            });
            const best = options[0];
            ghost = { r: ghost.r + best.r, c: ghost.c + best.c };
        }

        positionEntities();

        if (ghost.r === pacman.r && ghost.c === pacman.c) {
            endGame(false);
        }
    }

    function endGame(won) {
        ended = true;
        clearInterval(intervalId);
        statusEl.textContent = won
            ? `🎉 승리! 모든 점을 먹었습니다. (점수: ${score})`
            : `💥 게임 오버! 유령에게 잡혔습니다. (점수: ${score})`;
    }

    function handleKeydown(event) {
        const map = {
            ArrowUp: { r: -1, c: 0 },
            ArrowDown: { r: 1, c: 0 },
            ArrowLeft: { r: 0, c: -1 },
            ArrowRight: { r: 0, c: 1 }
        };
        if (map[event.key]) {
            event.preventDefault();
            nextDir = map[event.key];
        }
    }

    function startRound() {
        const els = buildBoard();
        pacmanEl = els.pacmanEl;
        ghostEl = els.ghostEl;

        pacman = { ...pacmanStart };
        ghost = { ...ghostStart };
        score = 0;
        dir = { r: 0, c: 0 };
        nextDir = { r: 0, c: 0 };
        ended = false;

        statusEl.textContent = "점수: 0";
        positionEntities();

        clearInterval(intervalId);
        intervalId = setInterval(tick, 220);
    }

    document.addEventListener("keydown", handleKeydown);
    restartBtn.addEventListener("click", startRound);

    startRound();

    // 모달이 닫힐 때 gameModal.js가 호출할 정리 함수
    return function cleanup() {
        clearInterval(intervalId);
        document.removeEventListener("keydown", handleKeydown);
        restartBtn.removeEventListener("click", startRound);
    };
};
