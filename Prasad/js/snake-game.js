// ======================================
// SNAKE GAME
// Classic arcade game with difficulty modes
// ======================================

const renderSnakeGame = (body, win, params = {}) => {
    let gameSpeed = 100;
    let score = 0;
    let highCore = localStorage.getItem('snake_high_score') || 0;
    let gameInterval;
    let isPaused = false;
    let currentMode = params.difficulty || null;

    const showStartScreen = () => {
        body.innerHTML = `
            <div class="snake-game-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #000; color: #0f0; font-family: var(--font-mono); text-align: center; padding: 20px;">
                <h2 style="font-size: 32px; margin-bottom: 10px; text-shadow: 0 0 10px #0f0;">SNAKE ARCADE</h2>
                <div style="font-size: 14px; color: #888; margin-bottom: 30px;">Select Difficulty to Start</div>
                <div style="display: flex; flex-direction: column; gap: 15px; width: 200px;">
                    <button class="diff-btn" data-mode="easy" style="background: rgba(0,255,0,0.1); border: 1px solid #0f0; color: #0f0; padding: 10px; cursor: pointer; border-radius: 4px; transition: all 0.2s;">EASY (Slow)</button>
                    <button class="diff-btn" data-mode="medium" style="background: rgba(0,255,0,0.1); border: 1px solid #0f0; color: #0f0; padding: 10px; cursor: pointer; border-radius: 4px; transition: all 0.2s;">MEDIUM (Normal)</button>
                    <button class="diff-btn" data-mode="hard" style="background: rgba(0,255,0,0.1); border: 1px solid #0f0; color: #0f0; padding: 10px; cursor: pointer; border-radius: 4px; transition: all 0.2s;">HARD (Fast)</button>
                </div>
                <div style="margin-top: 40px; font-size: 12px; color: #444;">High Score: ${highCore}</div>
            </div>
        `;

        body.querySelectorAll('.diff-btn').forEach(btn => {
            btn.onmouseenter = () => { btn.style.background = '#0f0'; btn.style.color = '#000'; };
            btn.onmouseleave = () => { btn.style.background = 'rgba(0,255,0,0.1)'; btn.style.color = '#0f0'; };
            btn.onclick = () => startGame(btn.dataset.mode);
        });
    };

    const startGame = (mode) => {
        currentMode = mode;
        const speeds = { 'easy': 150, 'medium': 100, 'hard': 60 };
        gameSpeed = speeds[mode] || 100;
        score = 0;
        
        body.innerHTML = `
            <div class="snake-game-container" style="display: flex; flex-direction: column; align-items: center; height: 100%; background: #000; color: #0f0; font-family: var(--font-mono); position: relative;">
                <div style="width: 100%; display: flex; justify-content: space-between; padding: 10px 20px; font-size: 14px; background: #111; border-bottom: 1px solid #222;">
                    <div>MODE: <span style="color: #fff;">${mode.toUpperCase()}</span></div>
                    <div>SCORE: <span id="snake-score" style="color: #fff;">0</span></div>
                    <div>HIGH: <span style="color: #fff;">${highCore}</span></div>
                </div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden;">
                    <canvas id="snake-canvas" width="400" height="400" style="border: 2px solid #333; max-width: 90%; max-height: 90%;"></canvas>
                </div>
                <div id="pause-overlay" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); flex-direction: column; align-items: center; justify-content: center; z-index: 10;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">PAUSED</div>
                    <div style="font-size: 14px; color: #888;">Press SPACE to Resume</div>
                </div>
                <div style="padding: 10px; font-size: 11px; color: #444; width: 100%; text-align: center; border-top: 1px solid #111;">
                    Arrows: Move | Space: Pause | ESC: Exit
                </div>
            </div>
        `;

        const canvas = body.querySelector('#snake-canvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = body.querySelector('#snake-score');
        const pauseOverlay = body.querySelector('#pause-overlay');
        
        const box = 20;
        let snake = [{ x: 9 * box, y: 10 * box }];
        let food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
        let d;

        const direction = (event) => {
            if (event.code === "Space") {
                isPaused = !isPaused;
                pauseOverlay.style.display = isPaused ? 'flex' : 'none';
                return;
            }
            if (event.key === "Escape") {
                closeWindow(win.dataset.app);
                return;
            }
            if (isPaused) return;
            if (event.keyCode === 37 && d !== "RIGHT") d = "LEFT";
            else if (event.keyCode === 38 && d !== "DOWN") d = "UP";
            else if (event.keyCode === 39 && d !== "LEFT") d = "RIGHT";
            else if (event.keyCode === 40 && d !== "UP") d = "DOWN";
        };

        document.addEventListener("keydown", direction);

        const collision = (head, array) => {
            for (let i = 0; i < array.length; i++) {
                if (head.x === array[i].x && head.y === array[i].y) return true;
            }
            return false;
        };

        const draw = () => {
            if (isPaused) return;

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < snake.length; i++) {
                ctx.fillStyle = i === 0 ? "#0f0" : "#008000";
                ctx.fillRect(snake[i].x, snake[i].y, box, box);
                ctx.strokeStyle = "black";
                ctx.strokeRect(snake[i].x, snake[i].y, box, box);
            }

            ctx.fillStyle = "#ff5f56";
            ctx.fillRect(food.x, food.y, box, box);

            let snakeX = snake[0].x;
            let snakeY = snake[0].y;

            if (d === "LEFT") snakeX -= box;
            if (d === "UP") snakeY -= box;
            if (d === "RIGHT") snakeX += box;
            if (d === "DOWN") snakeY += box;

            if (snakeX === food.x && snakeY === food.y) {
                score++;
                scoreEl.textContent = score;
                food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
                
                if (score % 5 === 0 && gameSpeed > 40) {
                    gameSpeed -= 5;
                    clearInterval(gameInterval);
                    gameInterval = setInterval(draw, gameSpeed);
                }
            } else {
                snake.pop();
            }

            let newHead = { x: snakeX, y: snakeY };

            if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
                endGame();
            }

            snake.unshift(newHead);
        };

        const endGame = () => {
            clearInterval(gameInterval);
            document.removeEventListener("keydown", direction);
            
            if (score > highCore) {
                highCore = score;
                localStorage.setItem('snake_high_score', highCore);
            }

            body.innerHTML = `
                <div class="snake-game-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #000; color: #ff5f56; font-family: var(--font-mono); text-align: center; padding: 20px;">
                    <h2 style="font-size: 48px; margin-bottom: 10px; text-shadow: 0 0 20px #ff5f56;">GAME OVER</h2>
                    <div style="font-size: 20px; color: #fff; margin-bottom: 5px;">Final Score: ${score}</div>
                    <div style="font-size: 14px; color: #888; margin-bottom: 30px;">Difficulty: ${mode.toUpperCase()}</div>
                    
                    ${score === highCore && score > 0 ? '<div style="color: #ffcc00; margin-bottom: 20px; font-weight: bold;">NEW HIGH SCORE!</div>' : ''}
                    
                    <div style="display: flex; gap: 15px;">
                        <button id="snake-retry" style="background: #0f0; color: #000; border: none; padding: 10px 25px; border-radius: 4px; cursor: pointer; font-weight: bold;">Try Again</button>
                        <button id="snake-main-menu" style="background: transparent; border: 1px solid #444; color: #888; padding: 10px 25px; border-radius: 4px; cursor: pointer;">Menu</button>
                    </div>
                </div>
            `;

            body.querySelector('#snake-retry').onclick = () => startGame(mode);
            body.querySelector('#snake-main-menu').onclick = () => showStartScreen();
        };

        gameInterval = setInterval(draw, gameSpeed);
    };

    if (currentMode) startGame(currentMode);
    else showStartScreen();

    const observer = new MutationObserver(() => {
        if (!document.contains(body)) {
            clearInterval(gameInterval);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};
