// ===========================================
// dinoGame.js
// 역할: 크롬 오프라인 공룡 게임을 흉내 낸 캔버스 기반 미니게임
//  - 스페이스바 또는 캔버스 클릭으로 점프해 다가오는 선인장을 피한다.
//  - 시간이 지날수록 이동 속도가 빨라지고, 살아남은 시간이 점수가 된다.
//  - gameModal.js가 모달을 열 때 window.mountDinoGame(container)를 호출한다.
// ===========================================

window.mountDinoGame = function (container) {
    container.innerHTML = `
        <p class="game-instructions">스페이스바 또는 캔버스를 클릭해서 점프하세요! 선인장에 부딪히면 게임 오버예요 🌵</p>
        <canvas id="dinoCanvas" width="560" height="200"></canvas>
    `;

    const canvas = container.querySelector("#dinoCanvas");
    const ctx = canvas.getContext("2d");

    const groundY = 160;
    const gravity = 0.7;
    const jumpPower = -13;
    const dinoW = 44;
    const dinoH = 44;

    let dino, obstacles, speed, score, frame, gameOver;

    function resetGame() {
        dino = { x: 40, y: groundY - dinoH, w: dinoW, h: dinoH, vy: 0, jumping: false };
        obstacles = [];
        speed = 5;
        score = 0;
        frame = 0;
        gameOver = false;
    }
    resetGame();

    function spawnObstacle() {
        const h = 25 + Math.random() * 20;
        obstacles.push({ x: canvas.width, y: groundY - h, w: 15, h });
    }

    function jump() {
        if (gameOver) {
            resetGame();
            return;
        }
        if (!dino.jumping) {
            dino.vy = jumpPower;
            dino.jumping = true;
        }
    }

    function update() {
        frame++;

        // 공룡 물리(점프 및 중력) 처리
        dino.vy += gravity;
        dino.y += dino.vy;
        if (dino.y >= groundY - dino.h) {
            dino.y = groundY - dino.h;
            dino.vy = 0;
            dino.jumping = false;
        }

        // 속도가 빨라질수록 장애물 생성 간격도 짧아지게 조정
        const spawnInterval = Math.max(45, 100 - Math.floor(speed * 5));
        if (frame % spawnInterval === 0) {
            spawnObstacle();
        }

        obstacles.forEach((ob) => (ob.x -= speed));
        obstacles = obstacles.filter((ob) => ob.x + ob.w > 0);

        for (const ob of obstacles) {
            const hit =
                dino.x < ob.x + ob.w &&
                dino.x + dino.w > ob.x &&
                dino.y < ob.y + ob.h &&
                dino.y + dino.h > ob.y;
            if (hit) {
                gameOver = true;
            }
        }

        score += 1;
        speed = 5 + Math.floor(score / 300) * 0.5;
    }

    // T-Rex 실루엣을 여러 개의 사각형/삼각형으로 조합해서 그린다 (달릴 때는 다리가 번갈아 움직임).
    function drawDino(x, y, w, h, currentFrame, jumping) {
        ctx.fillStyle = "#9e3b13";

        // 꼬리 (몸통 뒤쪽으로 뻗은 삼각형)
        ctx.beginPath();
        ctx.moveTo(x + w * 0.22, y + h * 0.38);
        ctx.lineTo(x - w * 0.18, y + h * 0.28);
        ctx.lineTo(x + w * 0.22, y + h * 0.55);
        ctx.closePath();
        ctx.fill();

        // 몸통
        ctx.fillRect(x + w * 0.18, y + h * 0.32, w * 0.55, h * 0.42);

        // 목
        ctx.fillRect(x + w * 0.5, y + h * 0.12, w * 0.22, h * 0.3);

        // 머리
        ctx.fillRect(x + w * 0.55, y, w * 0.45, h * 0.34);

        // 주둥이
        ctx.fillRect(x + w * 0.92, y + h * 0.16, w * 0.16, h * 0.12);

        // 짧은 앞다리
        ctx.fillRect(x + w * 0.5, y + h * 0.5, w * 0.14, h * 0.12);

        // 눈
        ctx.fillStyle = "#fdf8ec";
        ctx.fillRect(x + w * 0.78, y + h * 0.06, w * 0.09, h * 0.09);

        // 다리 (달리는 애니메이션: 점프 중이 아닐 때만 좌우로 번갈아 움직임)
        ctx.fillStyle = "#9e3b13";
        const legW = w * 0.16;
        const legH = h * 0.3;
        const legY = y + h * 0.72;

        if (jumping) {
            ctx.fillRect(x + w * 0.2, legY, legW, legH);
            ctx.fillRect(x + w * 0.48, legY, legW, legH);
        } else if (Math.floor(currentFrame / 6) % 2 === 0) {
            ctx.fillRect(x + w * 0.2, legY, legW, legH);
            ctx.fillRect(x + w * 0.48, legY - h * 0.1, legW, legH * 0.65);
        } else {
            ctx.fillRect(x + w * 0.2, legY - h * 0.1, legW, legH * 0.65);
            ctx.fillRect(x + w * 0.48, legY, legW, legH);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fdf8ec";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#7b2e0d";
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();

        drawDino(dino.x, dino.y, dino.w, dino.h, frame, dino.jumping);

        ctx.fillStyle = "#e77e1f";
        obstacles.forEach((ob) => ctx.fillRect(ob.x, ob.y, ob.w, ob.h));

        ctx.fillStyle = "#7b2e0d";
        ctx.font = "16px sans-serif";
        ctx.fillText(`점수: ${Math.floor(score / 10)}`, canvas.width - 110, 25);

        if (gameOver) {
            ctx.fillStyle = "rgba(123, 46, 13, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.font = "20px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("게임 오버! 클릭 또는 스페이스바로 재시작", canvas.width / 2, canvas.height / 2);
            ctx.textAlign = "left";
        }
    }

    let animationId = null;
    function loop() {
        if (!gameOver) {
            update();
        }
        draw();
        animationId = requestAnimationFrame(loop);
    }

    function handleKeydown(event) {
        if (event.code === "Space") {
            event.preventDefault();
            jump();
        }
    }

    canvas.addEventListener("click", jump);
    document.addEventListener("keydown", handleKeydown);

    loop();

    // 모달이 닫힐 때 gameModal.js가 호출할 정리 함수
    return function cleanup() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        document.removeEventListener("keydown", handleKeydown);
    };
};
