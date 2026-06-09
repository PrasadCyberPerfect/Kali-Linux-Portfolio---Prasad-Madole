// --- System State Management ---
const systemState = {
    currentDirectory: "/home/prasad",
    openWindows: [],
    processes: [],
    recycleBin: (() => { try { return JSON.parse(localStorage.getItem('prasad_os_recycle')) || []; } catch(e) { return []; } })(),
    isLocked: false,
    networkOnline: navigator.onLine,
    theme: "kali",
    commandHistory: [],
    historyIndex: -1,
    zIndexCounter: 1000,
    activeWindow: null,
    booted: false,
    weather: {},
    systemInfo: { ip: "127.0.0.1" },
    powerState: "on",
    events: (() => { try { return JSON.parse(localStorage.getItem('prasad_os_events')) || {}; } catch(e) { return {}; } })(),
    privacy: (() => { try { return JSON.parse(localStorage.getItem('cookiePreferences')) || null; } catch(e) { return null; } })()
};

const CONFIG = {
    user: "prasad",
    hostname: "kali",
    bootTime: 3000,
    bootLogSpeed: 50,
    weatherApiKey: "b1b154b0000000000000000000000000" // Placeholder
};

// --- State-based File System Structure ---
let fileSystem = JSON.parse(localStorage.getItem('prasad_os_fs')) || {
    '/': { type: 'dir', children: {
        'home': { type: 'dir', children: {
            'prasad': { type: 'dir', children: {
                'documents': { type: 'dir', children: {} },
                'projects': { type: 'dir', children: {} },
                'about.txt': { type: 'file', content: "Name: Prasad Madole\nRole: Web Developer | Cybersecurity Enthusiast\nBio: Passionate about building secure web applications." },
                'skills.txt': { type: 'file', content: "- Frontend: HTML, CSS, JS, React\n- Security: Pen Testing, Network Security" },
                'projects.txt': { type: 'file', content: "1. Cyber Portfolio (This OS)\n2. Vulnerability Scanner\n3. Secure Chat App" },
                'contact.txt': { type: 'file', content: "Email: prasadmadole36720@gmail.com\nGitHub: github.com/PrasadCyberPerfect\nLinkedIn: linkedin.com/in/prasad-madole-2360823ba" }
            }}
        }},
        'bin': { type: 'dir', children: {
            'bash': { type: 'file', content: "Binary file [bash]" },
            'ls': { type: 'file', content: "Binary file [ls]" }
        }},
        'etc': { type: 'dir', children: {
            'hostname': { type: 'file', content: "kali" }
        }}
    }}
};

const saveFileSystem = () => {
    if (systemState.privacy && systemState.privacy.storage) {
        localStorage.setItem('prasad_os_fs', JSON.stringify(fileSystem));
    } else {
        showNotification("Storage disabled. Changes will not persist.");
    }
};

const saveEvents = () => {
    if (systemState.privacy && systemState.privacy.storage) {
        localStorage.setItem('prasad_os_events', JSON.stringify(systemState.events));
    } else {
        showNotification("Storage disabled. Events will not persist.");
    }
};

// --- System Information Collection ---
const fetchIp = async () => {
    if (systemState.privacy && !systemState.privacy.api) return;
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
            const data = await res.json();
            systemState.systemInfo.ip = data.ip;
        }
    } catch (e) {
        console.warn('IP fetch failed (using local loopback)');
    }
};

const getSystemInfo = () => {
    const hasConsent = systemState.privacy && systemState.privacy.analytics;
    
    if (!hasConsent) {
        return {
            ip: "127.0.0.1",
            os: "Secure Kernel",
            browser: "Encrypted Client",
            language: "Unknown",
            resolution: "Unknown",
            timezone: "Protected",
            status: "Protected"
        };
    }

    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "Unknown";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("X11")) os = "UNIX";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone")) os = "iOS";

    return {
        ip: systemState.systemInfo.ip || "127.0.0.1",
        os: os,
        browser: browser,
        language: navigator.language,
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "Detected"
    };
};

// System Stats state
let cpuState = {
    usage: 0,
    targetUsage: 0,
    activeProcesses: 0,
    lastCommandTime: 0
};

// --- Utility Functions ---
const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const updateClock = () => {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = getTimestamp();
};

const handleOnline = () => {
    systemState.networkOnline = true;
    updateNetworkStatus();
    showNotification("System is back online.");
    fetchWeather(); // Resume updates
};

const handleOffline = () => {
    systemState.networkOnline = false;
    updateNetworkStatus();
    showNotification("No internet connection. Entering offline mode.");
};

window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'openCertificate') {
        const certData = event.data.data;
        createWindow('certificate-' + Date.now(), certData.title, renderCertificateApp, certData);
    }
});

const updateNetworkStatus = () => {
    const icon = document.querySelector('.panel-icon i.fa-wifi');
    if (icon) {
        icon.style.color = systemState.networkOnline ? 'var(--accent-green)' : '#ff5f56';
        icon.title = systemState.networkOnline ? 'Online' : 'No Internet Connection';
    }
};

const fetchWeather = async () => {
    if (!systemState.networkOnline) {
        systemState.weather = { main: { temp: "--" }, weather: [{ main: 'Offline Mode', icon: '' }], name: 'Offline' };
        renderWeatherWidget();
        return;
    }
    if (systemState.privacy && !systemState.privacy.api) {
        systemState.weather = { main: { temp: "--" }, weather: [{ main: 'API Disabled', icon: '' }], name: 'No Access' };
        renderWeatherWidget();
        return;
    }
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=${CONFIG.weatherApiKey}&units=metric`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        systemState.weather = data;
        renderWeatherWidget();
    } catch (e) {
        console.warn('Weather API failed (using mock data)');
        systemState.weather = { main: { temp: 28 }, weather: [{ main: 'Clear', icon: '01d' }], name: 'Mumbai' };
        renderWeatherWidget();
    }
};

const updateCpuUsage = () => {
    const cpuEl = document.getElementById('cpu-usage');
    if (!cpuEl) return;

    const timeSinceLastCommand = Date.now() - cpuState.lastCommandTime;
    const spikeDecay = Math.max(0, 50 - (timeSinceLastCommand / 100));
    
    const baseLoad = 5 + Math.random() * 5;
    const windowLoad = systemState.openWindows.length * 5;
    const processLoad = systemState.processes.length * 2;
    
    cpuState.targetUsage = Math.min(100, baseLoad + windowLoad + processLoad + spikeDecay);
    cpuState.usage += (cpuState.targetUsage - cpuState.usage) * 0.3;
    const displayUsage = Math.round(cpuState.usage);

    const span = cpuEl.querySelector('span');
    span.textContent = `CPU: ${displayUsage}%`;
    cpuEl.title = `CPU Usage: ${displayUsage}%`;

    cpuEl.classList.remove('cpu-low', 'cpu-medium', 'cpu-high');
    if (displayUsage < 30) cpuEl.classList.add('cpu-low');
    else if (displayUsage < 70) cpuEl.classList.add('cpu-medium');
    else cpuEl.classList.add('cpu-high');
};

const renderWeatherWidget = () => {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;
    const temp = Math.round(systemState.weather.main.temp);
    widget.querySelector('span').textContent = `${temp}°C`;
    widget.title = `${systemState.weather.name}: ${systemState.weather.weather[0].main}`;
    
    widget.onclick = () => createWindow('weather', 'Weather', renderWeatherApp);
};

const renderWeatherApp = (body) => {
    const isApiDisabled = systemState.privacy && !systemState.privacy.api;
    body.innerHTML = `
        <div style="padding: 25px; text-align: center; color: var(--accent-blue); background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); height: 100%; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 10px;">Current Weather</div>
            <h2 style="font-size: 28px; margin: 0; color: #fff;">${systemState.weather.name || 'Unknown'}</h2>
            <div style="font-size: 64px; margin: 20px 0; font-weight: bold; color: var(--accent-green); text-shadow: 0 0 20px rgba(0,255,65,0.3);">
                ${systemState.weather.main.temp}${systemState.weather.main.temp !== '--' ? '°C' : ''}
            </div>
            <p style="font-size: 18px; color: #aaa; margin: 0;">${systemState.weather.weather[0].main}</p>
            
            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; font-size: 13px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Humidity</div>
                    <div style="color: #eee;">${systemState.weather.main.humidity || 0}%</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Wind Speed</div>
                    <div style="color: #eee;">${systemState.weather.wind?.speed || 0} m/s</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Pressure</div>
                    <div style="color: #eee;">${systemState.weather.main.pressure || 0} hPa</div>
                </div>
                <div>
                    <div style="color: #555; margin-bottom: 4px;">Visibility</div>
                    <div style="color: #eee;">${(systemState.weather.visibility / 1000) || 0} km</div>
                </div>
            </div>
            ${isApiDisabled ? `
                <div style="margin-top: 20px; font-size: 11px; color: #ff5f56; background: rgba(255,95,86,0.1); padding: 8px; border-radius: 4px;">
                    <i class="fas fa-exclamation-triangle"></i> API Access is disabled in Privacy Settings
                </div>
            ` : ''}
        </div>
    `;
};

// File System Helpers
const getFSNode = (path) => {
    if (path === '/') return fileSystem['/'];
    const parts = path.split('/').filter(p => p !== '');
    let current = fileSystem['/'];
    for (const part of parts) {
        if (current.type === 'dir' && current.children[part]) {
            current = current.children[part];
        } else {
            return null;
        }
    }
    return current;
};

const resolvePath = (path) => {
    if (path === '~') return '/home/prasad';
    if (path === '.') return systemState.currentDirectory;
    if (path === '..') {
        if (systemState.currentDirectory === '/') return '/';
        const parts = systemState.currentDirectory.split('/').filter(p => p !== '');
        parts.pop();
        return '/' + parts.join('/');
    }
    
    let resolved;
    if (path.startsWith('/')) {
        resolved = path;
    } else {
        const base = systemState.currentDirectory === '/' ? '' : systemState.currentDirectory;
        resolved = base + '/' + path;
    }
    
    // Normalize: remove double slashes and trailing slash (except for root)
    resolved = resolved.replace(/\/+/g, '/');
    if (resolved.length > 1) resolved = resolved.replace(/\/$/, '');
    return resolved;
};

const createFSNode = (path, type, content = "") => {
    const parts = path.split('/').filter(p => p !== '');
    const name = parts.pop();
    const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    const parent = getFSNode(parentPath);
    
    if (parent && parent.type === 'dir') {
        if (parent.children[name]) return { error: 'Already exists' };
        parent.children[name] = type === 'dir' ? { type: 'dir', children: {} } : { type: 'file', content };
        saveFileSystem();
        return { success: true };
    }
    return { error: 'Parent directory not found' };
};

const deleteFSNode = (path) => {
    if (path === '/' || path === '/home' || path === '/home/prasad') {
        return { error: 'Permission denied: Cannot delete system directories' };
    }
    const parts = path.split('/').filter(p => p !== '');
    if (parts.length === 0) return { error: 'Cannot delete root' };
    const name = parts.pop();
    const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    const parent = getFSNode(parentPath);
    
    if (parent && parent.type === 'dir' && parent.children[name]) {
        delete parent.children[name];
        saveFileSystem();
        return { success: true };
    }
    return { error: 'File or directory not found' };
};

const renameFSNode = (oldPath, newName) => {
    if (oldPath === '/' || oldPath === '/home' || oldPath === '/home/prasad') {
        return { error: 'Permission denied: Cannot rename system directories' };
    }
    
    const parts = oldPath.split('/').filter(p => p !== '');
    const oldName = parts.pop();
    const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
    const parent = getFSNode(parentPath);
    
    if (parent && parent.type === 'dir' && parent.children[oldName]) {
        if (parent.children[newName]) return { error: 'A file or folder with that name already exists' };
        
        parent.children[newName] = parent.children[oldName];
        delete parent.children[oldName];
        saveFileSystem();
        return { success: true };
    }
    return { error: 'File or directory not found' };
};

// --- Process Management ---
const registerProcess = (name, windowId) => {
    const pid = Math.floor(Math.random() * 9000) + 1000;
    const cpu = Math.floor(Math.random() * 15) + 1; // 1-15%
    const memory = Math.floor(Math.random() * 200) + 50; // 50-250MB
    const process = { pid, name, status: 'running', windowId, cpu, memory };
    systemState.processes.push(process);
    return pid;
};

const killProcess = (pid) => {
    const index = systemState.processes.findIndex(p => p.pid === parseInt(pid));
    if (index !== -1) {
        const process = systemState.processes[index];
        // We only call closeWindow, which handles both openWindows and processes removal
        closeWindow(process.windowId);
        return true;
    }
    return false;
};

// --- Task Manager App ---
const renderTaskManager = (body) => {
    const updateTable = () => {
        body.innerHTML = `
            <div style="padding: 15px; height: 100%; background: #0a0a0a; color: #eee; font-family: var(--font-mono); overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--accent-green);">System Task Manager</h3>
                    <div style="font-size: 11px; color: #666;">Active Processes: ${systemState.processes.length}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="text-align: left; color: var(--accent-blue); border-bottom: 1px solid #222;">
                            <th style="padding: 8px;">App Name</th>
                            <th style="padding: 8px;">PID</th>
                            <th style="padding: 8px;">CPU %</th>
                            <th style="padding: 8px;">Memory</th>
                            <th style="padding: 8px; text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${systemState.processes.map(p => `
                            <tr style="border-bottom: 1px solid #111; transition: background 0.2s;">
                                <td style="padding: 8px;">${p.name}</td>
                                <td style="padding: 8px; color: #888;">${p.pid}</td>
                                <td style="padding: 8px;">${p.cpu.toFixed(1)}%</td>
                                <td style="padding: 8px;">${p.memory.toFixed(1)} MB</td>
                                <td style="padding: 8px; text-align: center;">
                                    <button onclick="window.killProcess(${p.pid})" style="background: rgba(255,95,86,0.1); border: 1px solid rgba(255,95,86,0.2); color: #ff5f56; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">End Task</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    updateTable();
    const interval = setInterval(() => {
        if (!document.contains(body)) { clearInterval(interval); return; }
        // Randomize CPU/Memory slightly for realism
        systemState.processes.forEach(p => {
            p.cpu = Math.max(1, Math.min(100, p.cpu + (Math.random() * 4 - 2)));
            p.memory = Math.max(50, p.memory + (Math.random() * 10 - 5));
        });
        updateTable();
    }, 2000);
};

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
                closeWindow('snake');
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
                
                // Dynamic speed increase every 5 points
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

    // Clean up
    const observer = new MutationObserver(() => {
        if (!document.contains(body)) {
            clearInterval(gameInterval);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};

// --- Window Manager ---
const createWindow = (appId, title, contentRenderer, params = {}) => {
    const existing = systemState.openWindows.find(w => w.appId === appId);
    if (existing) {
        focusWindow(existing.element);
        if (existing.element.classList.contains('minimized')) {
            existing.element.classList.remove('minimized');
        }
        return;
    }

    const template = document.getElementById('window-template');
    const winClone = template.content.cloneNode(true);
    const win = winClone.querySelector('.window');
    
    win.dataset.app = appId;
    
    // Fixed size for all windows
    const FIXED_WIDTH = 600;
    const FIXED_HEIGHT = 700;
    win.style.width = `${FIXED_WIDTH}px`;
    win.style.height = `${FIXED_HEIGHT}px`;
    
    // Fixed centered position
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = (viewportWidth - FIXED_WIDTH) / 2;
    const top = (viewportHeight - FIXED_HEIGHT) / 2;
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    
    win.style.zIndex = ++systemState.zIndexCounter;
    
    win.querySelector('.title-text').textContent = title;
    // Set window icon based on appId
    const iconMap = {
        'terminal': 'fa-terminal',
        'explorer': 'fa-folder-open',
        'chrome': 'fa-chrome',
        'notepad': 'fa-file-alt',
        'monitor': 'fa-microchip',
        'weather': 'fa-cloud-sun',
        'calendar': 'fa-calendar-alt',
        'privacy': 'fa-user-shield',
        'about': 'fa-user-secret',
        'skills': 'fa-code',
        'projects': 'fa-terminal',
        'contact': 'fa-envelope',
        'resume': 'fa-file-alt'
    };
    const iconEl = win.querySelector('.window-title i');
    const appIcon = iconMap[appId] || 'fa-window-maximize';
    iconEl.className = `fab ${appIcon.startsWith('fa-chrome') ? 'fa-chrome' : 'fas'} ${appIcon}`;
    const body = win.querySelector('.window-body');
    contentRenderer(body, win, params);

    win.addEventListener('mousedown', () => focusWindow(win));
    win.querySelector('.close').addEventListener('click', (e) => { e.stopPropagation(); closeWindow(appId); });
    win.querySelector('.minimize').addEventListener('click', (e) => { e.stopPropagation(); win.classList.add('minimized'); });
    win.querySelector('.maximize').addEventListener('click', (e) => { 
        e.stopPropagation(); 
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            if (win.dataset.prevTop) win.style.top = win.dataset.prevTop;
            if (win.dataset.prevLeft) win.style.left = win.dataset.prevLeft;
            if (win.dataset.prevWidth) win.style.width = win.dataset.prevWidth;
            if (win.dataset.prevHeight) win.style.height = win.dataset.prevHeight;
        } else {
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            win.classList.add('maximized');
        }
    });

    makeDraggable(win);
    makeResizable(win);
    document.getElementById('window-container').appendChild(win);
    
    const pid = registerProcess(title, appId);
    win.dataset.pid = pid;
    
    systemState.openWindows.push({ appId, element: win, pid });
    focusWindow(win);
    updateTaskbar();
};

const focusWindow = (win) => {
    // Remove active class from old window
    if (systemState.activeWindow) {
        systemState.activeWindow.classList.remove('active');
    }
    
    if (systemState.activeWindow === win) return;
    
    win.style.zIndex = ++systemState.zIndexCounter;
    win.classList.add('active');
    systemState.activeWindow = win;
    updateTaskbar();
};

const closeWindow = (appId) => {
    const index = systemState.openWindows.findIndex(w => w.appId === appId);
    if (index !== -1) {
        const winInfo = systemState.openWindows[index];
        winInfo.element.remove();
        systemState.openWindows.splice(index, 1);
        
        const pIndex = systemState.processes.findIndex(p => p.windowId === appId);
        if (pIndex !== -1) systemState.processes.splice(pIndex, 1);
        
        updateTaskbar();
    }
};

const makeDraggable = (win) => {
    const header = win.querySelector('.window-header');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let initialWidth = 0;
    let initialHeight = 0;
    const topPanelHeight = 30;
    const topPadding = 20;
    const minTop = topPanelHeight + topPadding;
    let animationFrameId = null;

    // Auto-correct initial position if outside viewport
    const correctPosition = () => {
        const desktopHeight = window.innerHeight;
        const desktopWidth = window.innerWidth;
        const winWidth = win.offsetWidth;
        const winHeight = win.offsetHeight;
        
        let newLeft = win.offsetLeft;
        let newTop = win.offsetTop;
        
        if (newTop < minTop) newTop = minTop;
        if (newTop > desktopHeight - winHeight) newTop = desktopHeight - winHeight;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > desktopWidth - winWidth) newLeft = desktopWidth - winWidth;
        
        if (newTop !== win.offsetTop || newLeft !== win.offsetLeft) {
            win.style.top = newTop + "px";
            win.style.left = newLeft + "px";
        }
    };

    // Correct position on window creation
    setTimeout(correctPosition, 0);

    header.onmousedown = (e) => {
        // If maximized, restore first
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            if (win.dataset.prevTop) win.style.top = win.dataset.prevTop;
            if (win.dataset.prevLeft) win.style.left = win.dataset.prevLeft;
            if (win.dataset.prevWidth) win.style.width = win.dataset.prevWidth;
            if (win.dataset.prevHeight) win.style.height = win.dataset.prevHeight;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
        initialWidth = win.offsetWidth;
        initialHeight = win.offsetHeight;

        // Lock window size during drag
        win.style.width = initialWidth + 'px';
        win.style.height = initialHeight + 'px';
        
        // Prevent page overflow during drag
        document.body.style.overflow = 'hidden';

        header.style.cursor = 'grabbing';
        win.classList.add('dragging');

        document.onmousemove = (e) => {
            if (!isDragging) return;

            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            animationFrameId = requestAnimationFrame(() => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let newTop = initialTop + dy;
                let newLeft = initialLeft + dx;

                const desktopHeight = window.innerHeight;
                const desktopWidth = window.innerWidth;
                const winWidth = win.offsetWidth;
                const winHeight = win.offsetHeight;

                // Full boundary checking
                if (newTop < minTop) newTop = minTop;
                if (newTop > desktopHeight - winHeight) newTop = desktopHeight - winHeight;
                if (newLeft < 0) newLeft = 0;
                if (newLeft > desktopWidth - winWidth) newLeft = desktopWidth - winWidth;

                win.style.left = newLeft + "px";
                win.style.top = newTop + "px";
            });
        };

        document.onmouseup = () => {
            isDragging = false;
            header.style.cursor = 'move';
            win.classList.remove('dragging');
            
            // Restore page overflow
            document.body.style.overflow = '';
            
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    header.ondblclick = (e) => {
        e.preventDefault();
        const maxBtn = win.querySelector('.maximize');
        maxBtn.click();
    };
};

const makeResizable = (win) => {
    const right = win.querySelector('.resize-handle.right');
    const bottom = win.querySelector('.resize-handle.bottom');
    const corner = win.querySelector('.resize-handle.corner');
    
    const minWidth = 300;
    const minHeight = 200;
    const topPanelHeight = 30;
    const topPadding = 20;
    const minTop = topPanelHeight + topPadding;

    let startX, startY, startWidth, startHeight, startTop;
    let animationFrameId = null;

    const startResize = (e, direction) => {
        if (win.classList.contains('maximized')) return;
        e.preventDefault();
        e.stopPropagation();

        startX = e.clientX;
        startY = e.clientY;
        startWidth = win.offsetWidth;
        startHeight = win.offsetHeight;
        startTop = win.offsetTop;

        win.classList.add('resizing');
        focusWindow(win);

        const doResize = (ev) => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            
            animationFrameId = requestAnimationFrame(() => {
                const desktopWidth = window.innerWidth;
                const desktopHeight = window.innerHeight;
                
                if (direction === 'right' || direction === 'corner') {
                    let newWidth = startWidth + (ev.clientX - startX);
                    if (newWidth < minWidth) newWidth = minWidth;
                    if (win.offsetLeft + newWidth > desktopWidth) newWidth = desktopWidth - win.offsetLeft;
                    win.style.width = newWidth + 'px';
                }
                if (direction === 'bottom' || direction === 'corner') {
                    let newHeight = startHeight + (ev.clientY - startY);
                    if (newHeight < minHeight) newHeight = minHeight;
                    if (startTop + newHeight > desktopHeight) newHeight = desktopHeight - startTop;
                    win.style.height = newHeight + 'px';
                }
            });
        };

        const stopResize = () => {
            win.classList.remove('resizing');
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            
            window.dispatchEvent(new Event('resize'));
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    };

    right.onmousedown = (e) => startResize(e, 'right');
    bottom.onmousedown = (e) => startResize(e, 'bottom');
    corner.onmousedown = (e) => startResize(e, 'corner');
};

const updateTaskbar = () => {
    const container = document.querySelector('.taskbar-apps');
    if (!container) return;
    container.innerHTML = '';
    systemState.openWindows.forEach(win => {
        const icon = document.createElement('div');
        icon.className = `taskbar-app-icon ${systemState.activeWindow === win.element ? 'active' : ''}`;
        
        // Try to find the correct icon for the app
        const appIdBase = win.appId.split('-')[0];
        let appIcon = null;
        
        // 1. Try mapping appId to icon
        const iconMap = {
            'terminal': 'fa-terminal',
            'explorer': 'fa-folder-open',
            'chrome': 'fa-chrome',
            'notepad': 'fa-file-alt',
            'monitor': 'fa-microchip',
            'weather': 'fa-cloud-sun',
            'calendar': 'fa-calendar-alt',
            'privacy': 'fa-user-shield',
            'about': 'fa-user-secret',
            'skills': 'fa-code',
            'projects': 'fa-terminal',
            'contact': 'fa-envelope',
            'resume': 'fa-file-alt'
        };
        
        if (iconMap[appIdBase]) {
            appIcon = document.createElement('i');
            appIcon.className = `fab ${iconMap[appIdBase].startsWith('fa-chrome') ? 'fa-chrome' : 'fas'} ${iconMap[appIdBase]}`;
        } else {
            // 2. Fallback to existing DOM icons
            const desktopIcon = document.querySelector(`.dropdown-item[data-app="${appIdBase}"] i, .desktop-icon[data-app="${appIdBase}"] i`);
            if (desktopIcon) appIcon = desktopIcon.cloneNode(true);
            else {
                // 3. Absolute fallback
                appIcon = document.createElement('i');
                appIcon.className = 'fas fa-window-maximize';
            }
        }
        
        if (appIcon) icon.appendChild(appIcon);
        icon.onclick = () => {
            if (win.element.classList.contains('minimized')) {
                win.element.classList.remove('minimized');
                focusWindow(win.element);
            } else if (systemState.activeWindow === win.element) {
                win.element.classList.add('minimized');
            } else {
                focusWindow(win.element);
            }
        };
        container.appendChild(icon);
    });
};

// --- Terminal Engine ---
// Matrix animation state
let matrixActive = false;
let matrixCanvas = null;
let matrixCtx = null;
let matrixAnimationId = null;
let matrixSpeed = 50; // ms per frame
let matrixColor = '#00ff41';
let matrixStreams = [];

const CHARS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Matrix helper functions
function initMatrix(container, terminalOutput) {
    matrixActive = true;
    matrixCanvas = document.createElement('canvas');
    matrixCanvas.style.position = 'absolute';
    matrixCanvas.style.top = '0';
    matrixCanvas.style.left = '0';
    matrixCanvas.style.width = '100%';
    matrixCanvas.style.height = '100%';
    matrixCanvas.style.background = '#000';
    matrixCanvas.style.zIndex = '10';
    container.appendChild(matrixCanvas);
    matrixCtx = matrixCanvas.getContext('2d');
    resizeMatrix();
    window.addEventListener('resize', resizeMatrix);
    initMatrixStreams();
    startMatrixAnimation();
}

function resizeMatrix() {
    if (!matrixCanvas || !matrixCtx) return;
    matrixCanvas.width = matrixCanvas.offsetWidth;
    matrixCanvas.height = matrixCanvas.offsetHeight;
    if (matrixStreams.length > 0) initMatrixStreams();
}

function initMatrixStreams() {
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    matrixStreams = [];
    for (let i = 0; i < columns; i++) {
        matrixStreams.push({
            x: i * fontSize,
            y: Math.random() * -1000,
            speed: Math.random() * 50 + 30,
            length: Math.floor(Math.random() * 30) + 10,
            chars: Array(Math.floor(Math.random() * 30) + 10).fill(0).map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
        });
    }
}

function startMatrixAnimation() {
    let lastTime = 0;
    function animate(time) {
        if (!matrixActive) return;
        if (time - lastTime >= matrixSpeed) {
            drawMatrix();
            lastTime = time;
        }
        matrixAnimationId = requestAnimationFrame(animate);
    }
    matrixAnimationId = requestAnimationFrame(animate);
}

function drawMatrix() {
    const fontSize = 14;
    matrixCtx.fillStyle = 'rgba(0,0,0,0.05)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    matrixCtx.font = `${fontSize}px monospace`;
    matrixStreams.forEach(stream => {
        stream.chars.forEach((char, idx) => {
            const y = stream.y - idx * fontSize;
            if (y > 0 && y < matrixCanvas.height) {
                matrixCtx.fillStyle = idx === 0 ? '#ffffff' : matrixColor;
                if (idx > 0) {
                    const alpha = 1 - (idx / stream.length);
                    matrixCtx.fillStyle = hexToRgba(matrixColor, alpha);
                }
                matrixCtx.fillText(char, stream.x, y);
            }
        });
        // Sometimes change a random character
        if (Math.random() > 0.975) {
            stream.chars[Math.floor(Math.random() * stream.chars.length)] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        stream.y += stream.speed * (matrixSpeed / 1000);
        if (stream.y - stream.length * fontSize > matrixCanvas.height) {
            stream.y = -100;
        }
    });
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stopMatrix() {
    matrixActive = false;
    if (matrixAnimationId) cancelAnimationFrame(matrixAnimationId);
    window.removeEventListener('resize', resizeMatrix);
    if (matrixCanvas && matrixCanvas.parentNode) matrixCanvas.parentNode.removeChild(matrixCanvas);
    matrixCanvas = null;
    matrixCtx = null;
}

const commandAliases = {
    h: 'help',
    gh: 'github',
    li: 'linkedin',
    cv: 'resume',
    c: 'clear',
    nf: 'neofetch',
    si: 'systeminfo',
    proj: 'projects',
    exp: 'experience'
};

const commandDescriptions = {
    help: "Show all commands with descriptions",
    whoami: "Show user profile information",
    about: "Open About Me window",
    skills: "Show categorized technical skills",
    projects: "Open Projects window",
    certifications: "Show certifications",
    education: "Show academic history",
    resume: "Open Resume viewer",
    contact: "Show contact info",
    social: "Show social links",
    github: "Open GitHub profile",
    linkedin: "Open LinkedIn profile",
    experience: "Show work experience",
    services: "Show offered services",
    achievements: "Show accomplishments",
    goals: "Show short-term goals",
    future: "Show long-term vision",
    roadmap: "Show learning roadmap",
    blog: "Show blog articles",
    faq: "Show FAQs",
    tools: "Show cybersecurity tools",
    systeminfo: "Show system information",
    neofetch: "Show system summary",
    banner: "Show ASCII logo",
    clear: "Clear terminal",
    cls: "Clear terminal (alias)",
    date: "Show current date",
    time: "Show current time",
    pwd: "Show current directory",
    ls: "List directory contents",
    cd: "Change directory",
    tree: "Show directory tree",
    history: "Show command history",
    theme: "Change theme",
    matrix: "Matrix animation",
    hack: "Hacking simulation",
    scanner: "Security scan simulation",
    dashboard: "Open dashboard",
    status: "Show system status",
    version: "Show version",
    quote: "Random quote",
    news: "Show news",
    learning: "Show learning path",
    cyber: "Show cybersecurity info",
    network: "Show networking info",
    linux: "Show Linux skills",
    python: "Show Python info",
    java: "Show Java info",
    android: "Show Android portfolio",
    security: "Show security projects",
    echo: "Print text",
    ps: "List processes",
    kill: "Terminate process",
    lock: "Lock system",
    weather: "Open weather app",
    calendar: "Open calendar app",
    snake: "Play Snake game",
    recycle: "Open Recycle Bin",
    explorer: "Open File Explorer",
    exit: "Close terminal"
};

const getSuggestedCommand = (input) => {
    const cmds = Object.keys(terminalCommands);
    let bestMatch = null;
    let bestScore = 0;
    for (const cmd of cmds) {
        let score = 0;
        if (cmd.startsWith(input)) score += 10;
        if (cmd.includes(input)) score += 5;
        for (let i = 0; i < Math.min(input.length, cmd.length); i++) {
            if (input[i] === cmd[i]) score += 2;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = cmd;
        }
    }
    return bestMatch;
};

const progressBar = (percent, width = 30) => {
    const filled = Math.round((percent / 100) * width);
    return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${percent}%`;
};

const terminalCommands = {
    help: () => {
        const categories = {
            "Personal & Profile": ["whoami", "about", "skills", "projects", "certifications", "education", "resume", "contact", "social"],
            "Social & Links": ["github", "linkedin"],
            "Professional": ["experience", "services", "achievements", "goals", "future", "roadmap"],
            "Content": ["blog", "faq", "tools"],
            "System": ["systeminfo", "neofetch", "banner", "clear", "cls", "date", "time", "pwd", "ls", "cd", "tree", "history", "theme", "ps", "kill", "lock", "status", "version", "exit"],
            "Fun & Simulations": ["matrix", "hack", "scanner"],
            "Apps": ["weather", "calendar", "snake", "recycle", "explorer", "dashboard"],
            "Learning": ["learning", "cyber", "network", "linux", "python", "java", "android", "security"],
            "Misc": ["quote", "news", "echo"]
        };
        let output = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                    HELP                                          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  ALIASES: h, gh, li, cv, c, nf, si, proj, exp                                    ║
╠══════════════════════════════════════════════════════════════════════════════════╣
`;
        for (const [cat, cmds] of Object.entries(categories)) {
            output += `║  ${cat.toUpperCase().padEnd(77)}║\n`;
            output += `║  ${'─'.repeat(77)}║\n`;
            for (const cmd of cmds) {
                const desc = commandDescriptions[cmd] || "";
                const aliases = Object.entries(commandAliases).filter(([a, c]) => c === cmd).map(([a]) => a).join(', ');
                const aliasStr = aliases ? ` (${aliases})` : '';
                output += `║    ${(cmd + aliasStr).padEnd(20)}  ${desc.padEnd(53)}║\n`;
            }
        }
        output += `╚══════════════════════════════════════════════════════════════════════════════════╝`;
        return output;
    },
    whoami: () => `
╔══════════════════════════════════════════════════════════════╗
║                        USER PROFILE                          ║
╠══════════════════════════════════════════════════════════════╣
║  Name:         Prasad Madole                                 ║
║  Role:         Web Developer | Cybersecurity Enthusiast      ║
║  Education:    B.Tech (Computer Science & Security)          ║
║  Interests:    Ethical Hacking, Web Dev, AI/ML               ║
║  Focus:        Cybersecurity, Full-Stack Development         ║
║  Last Login:   ${new Date().toLocaleString().padEnd(40)}          ║
╚══════════════════════════════════════════════════════════════╝
`,
    about: () => { createWindow('about', 'About Me', renderAboutApp); return "Opening About Me window..."; },
    skills: () => {
        const skillCategories = {
            Cybersecurity: ["Penetration Testing", "Vulnerability Assessment", "Network Security", "Web Security", "Ethical Hacking"],
            Linux: ["Kali Linux", "Ubuntu", "Bash Scripting", "System Administration", "Linux Commands"],
            Networking: ["TCP/IP", "Routing", "Subnetting", "Nmap", "Wireshark"],
            Python: ["Flask", "Django", "Automation Scripts", "Web Scraping", "Data Analysis"],
            Java: ["Core Java", "OOP", "Android Development", "Spring Boot"],
            "Android Development": ["Kotlin", "Android Studio", "UI/UX", "Firebase"],
            "Web Development": ["HTML5", "CSS3", "JavaScript", "React", "Node.js", "Tailwind CSS"],
            AI: ["Machine Learning", "TensorFlow", "Neural Networks"]
        };
        let output = `
╔══════════════════════════════════════════════════════════════╗
║                        SKILLS                                ║
╠══════════════════════════════════════════════════════════════╣
`;
        for (const [cat, skills] of Object.entries(skillCategories)) {
            output += `║  ${cat.toUpperCase().padEnd(61)}║\n`;
            output += `║  ${'─'.repeat(61)}║\n`;
            skills.forEach(skill => {
                const level = Math.floor(Math.random() * 40) + 60; // 60-100%
                output += `║    ${skill.padEnd(28)} ${progressBar(level, 23)} ║\n`;
            });
        }
        output += `╚══════════════════════════════════════════════════════════════╝`;
        return output;
    },
    projects: () => { createWindow('projects', 'Projects', renderProjectsApp); return "Opening Projects window..."; },
    certifications: () => { createWindow('licenses', 'Licenses & Certifications', renderLicensesApp); return "Opening Certifications window..."; },
    education: () => `
╔══════════════════════════════════════════════════════════════╗
║                       EDUCATION                              ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Diploma (Computer Science)                              │║
║  │ - Year: 2021-2024                                       │║
║  │ - CGPA: 8.5/10                                         │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ B.Tech (Computer Science & Security)                   │║
║  │ - Year: 2024-Present                                   │║
║  │ - Status: Pursuing                                     │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    resume: (args) => {
        if (args.length === 0 || args[0] === 'open' || args[0] === 'view') {
            createWindow('resume', 'Resume - Prasad Madole', renderResume);
            return "Opening Resume viewer...";
        }
        return "Invalid resume command. Use 'resume', 'resume open', or 'resume view'.";
    },
    contact: () => { createWindow('contact', 'Contact', renderContactApp); return "Opening Contact window..."; },
    social: () => `
╔══════════════════════════════════════════════════════════════╗
║                      SOCIAL LINKS                            ║
╠══════════════════════════════════════════════════════════════╣
║  GitHub:      https://github.com/PrasadCyberPerfect          ║
║  LinkedIn:    https://linkedin.com/in/prasad-madole-2360823ba║
║  Portfolio:   https://prasadcyberperfect.github.io/          ║
║  Email:       prasadmadole36720@gmail.com                   ║
╚══════════════════════════════════════════════════════════════╝
`,
    github: () => {
        window.open('https://github.com/PrasadCyberPerfect', '_blank');
        return `Opening GitHub profile...
Username: PrasadCyberPerfect
Repos: 5+
Followers: 10+
`;
    },
    linkedin: () => {
        window.open('https://linkedin.com/in/prasad-madole-2360823ba', '_blank');
        return `Opening LinkedIn profile...
Name: Prasad Madole
Title: Web Developer | Cybersecurity Enthusiast
`;
    },
    experience: () => `
╔══════════════════════════════════════════════════════════════╗
║                       EXPERIENCE                             ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Security Researcher                                     │║
║  │ - 2023-Present                                          │║
║  │ - Vulnerability research and disclosure                 │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Projects (Portfolio)                                    │║
║  │ - Kali Linux Style Terminal (This one!)                 │║
║  │ - Cybersecurity Tools Suite                             │║
║  │ - Android Security Scanner App                          │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    services: () => `
╔══════════════════════════════════════════════════════════════╗
║                        SERVICES                              ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Android Development                                      │║
║  │ - Native Android apps (Kotlin/Java)                     │║
║  │ - UI/UX design, Firebase integration                    │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Web Development                                          │║
║  │ - Full-stack (React, Node.js)                           │║
║  │ - Frontend (HTML, CSS, JavaScript)                      │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Cybersecurity Services                                  │║
║  │ - Penetration Testing, Vulnerability Assessments        │║
║  │ - Security Audits, Consultation                         │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    achievements: () => `
╔══════════════════════════════════════════════════════════════╗
║                     ACHIEVEMENTS                             ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ 🎓 Certifications                                        │║
║  │ - Cisco Networking Academy                               │║
║  │ - Great Learning - Python Programming                    │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ 🏆 Projects & Milestones                                 │║
║  │ - Built Portfolio OS (Kali Terminal)                     │║
║  │ - Contributed to Open Source Projects                    │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    goals: () => `
╔══════════════════════════════════════════════════════════════╗
║                   SHORT-TERM GOALS                          ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Learning Targets                                         │║
║  │ - Master Advanced Penetration Testing                    │║
║  │ - Learn Cloud Security (AWS/Azure)                       │║
║  │ - Complete OSCP/CEH Certifications                       │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Career Objectives                                        │║
║  │ - Build more Security Tools & Apps                       │║
║  │ - Contribute to Cybersecurity Research                   │║
║  │ - Join a Security Team as a Penetration Tester           │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    future: () => `
╔══════════════════════════════════════════════════════════════╗
║                    LONG-TERM VISION                          ║
╠══════════════════════════════════════════════════════════════╣
║  To become a leading cybersecurity professional, specializing ║
║  in ethical hacking, red team operations, and security research.║
║  I aim to protect organizations from digital threats through  ║
║  innovative security solutions, while contributing to the     ║
║  cybersecurity community.                                      ║
╚══════════════════════════════════════════════════════════════╝
`,
    roadmap: () => `
╔══════════════════════════════════════════════════════════════╗
║                     LEARNING ROADMAP                         ║
╠══════════════════════════════════════════════════════════════╣
║  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    ║
║  │  COMPLETED   │→ │  IN PROGRESS │→ │  UPCOMING      │    ║
║  │───────────── │  │───────────── │  │─────────────── │    ║
║  │ Networking   │  │ Web Security │  │ Red Team Ops   │    ║
║  │ Linux Basics │  │ Python/Java  │  │ Exploitation   │    ║
║  │ HTML/CSS/JS  │  │ Android Dev  │  │ Cloud Security │    ║
║  └──────────────┘  └──────────────┘  └─────────────────┘    ║
╚══════════════════════════════════════════════════════════════╝
`,
    blog: () => `
╔══════════════════════════════════════════════════════════════╗
║                           BLOG                               ║
╠══════════════════════════════════════════════════════════════╣
║  Blog coming soon! Articles on:                              ║
║  • Ethical Hacking Tutorials                                 ║
║  • Cybersecurity News & Analysis                             ║
║  • Web Development Tips                                      ║
║  • Linux & Networking Guides                                 ║
╚══════════════════════════════════════════════════════════════╝
`,
    faq: () => `
╔══════════════════════════════════════════════════════════════╗
║                           FAQ                                ║
╠══════════════════════════════════════════════════════════════╣
║  Q: What is this?                                            ║
║  A: A Kali Linux style portfolio OS!                        ║
║  Q: Can I edit files?                                        ║
║  A: Yes! Use explorer or terminal commands.                  ║
║  Q: Is this real Linux?                                      ║
║  A: It's a simulation, but feels real!                       ║
║  Q: How do I open the resume?                                ║
║  A: Use 'resume' command or click the desktop icon!          ║
║  Q: Where are my commands saved?                             ║
║  A: In your browser's localStorage!                          ║
╚══════════════════════════════════════════════════════════════╝
`,
    tools: () => `
╔══════════════════════════════════════════════════════════════╗
║                   CYBERSECURITY TOOLS                        ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Nmap                   │ Network Scanner & Port Scanner   │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Wireshark              │ Packet Analyzer & Sniffer        │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Burp Suite             │ Web Vulnerability Scanner        │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Metasploit Framework   │ Exploitation & Post-Exploitation │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ OWASP ZAP              │ Web Application Security Scanner  │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Kali Linux             │ Penetration Testing Distribution   │║
║  └────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════╝
`,
    systeminfo: () => {
        const info = getSystemInfo();
        return `
╔══════════════════════════════════════════════════════════════╗
║                      SYSTEM INFO                             ║
╠══════════════════════════════════════════════════════════════╣
║  OS:           ${info.os}                                      ║
║  Browser:      ${info.browser}                                   ║
║  IP:           ${info.ip}                                       ║
║  Resolution:   ${info.resolution}                               ║
║  Timezone:     ${info.timezone}                                 ║
║  Language:     ${info.language}                                 ║
║  Theme:        Kali-Dark                                       ║
║  User:         ${CONFIG.user}                                   ║
║  Uptime:       ${Math.floor((Date.now() - performance.timing.navigationStart) / 1000)} seconds  ║
║  Status:       Online                                          ║
╚══════════════════════════════════════════════════════════════╝
`;
    },
    neofetch: () => {
        const info = getSystemInfo();
        return `
        ████████████████████  ${CONFIG.user}@${CONFIG.hostname}
        ████████████████████  ──────────────────────
        ████████████████████  OS: Kali Linux (Simulated)
        ████████████████████  Host: Portfolio OS
        ████████████████████  Kernel: Browser.js
        ████████████████████  Uptime: ${Math.floor((Date.now() - performance.timing.navigationStart) / 1000)}s
        ████████████████████  Packages: 1337 (scripts)
        ████████████████████  Shell: terminal 1.0
        ████████████████████  Resolution: ${info.resolution}
        ████████████████████  Theme: Kali-Dark
        ████████████████████  Icons: FontAwesome 6
        ████████████████████  Terminal: This Terminal
        ████████████████████  CPU: JavaScript Engine @ N/A GHz
        ████████████████████  Memory: ${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'}MB / ${Math.round(performance.memory?.totalJSHeapSize / 1024 / 1024) || 'N/A'}MB
        ████████████████████  GPU: Browser Graphics Accelerator
        ████████████████████
`;
    },
    banner: () => `
██████╗ ██████╗  █████╗ ███████╗ █████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗
██████╔╝██████╔╝███████║███████╗███████║██║  ██║
██╔═══╝ ██╔══██╗██╔══██║╚════██║██╔══██║██║  ██║
██║     ██║  ██║██║  ██║███████║██║  ██║██████╔╝
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ 
`,
    clear: (args, body) => { body.querySelector('.terminal-output').innerHTML = ''; return ""; },
    cls: (args, body) => { body.querySelector('.terminal-output').innerHTML = ''; return ""; },
    date: () => new Date().toDateString(),
    time: () => new Date().toLocaleTimeString(),
    pwd: () => systemState.currentDirectory,
    ls: (args) => {
        const path = args[0] ? resolvePath(args[0]) : systemState.currentDirectory;
        const node = getFSNode(path);
        if (!node || node.type !== 'dir') return "Not a directory";
        const items = Object.entries(node.children).map(([name, n]) => {
            return n.type === 'dir' ? `${name}/` : name;
        }).sort();
        return items.join('  ');
    },
    cd: (args) => {
        if (!args[0]) return;
        const path = resolvePath(args[0]);
        if (getFSNode(path)?.type === 'dir') { systemState.currentDirectory = path; return ""; }
        return "cd: " + args[0] + ": No such file or directory";
    },
    tree: (args) => {
        const path = args[0] ? resolvePath(args[0]) : systemState.currentDirectory;
        const node = getFSNode(path);
        if (!node || node.type !== 'dir') return "tree: Not a directory";
        
        const buildTree = (n, prefix = '') => {
            let result = '';
            const keys = Object.keys(n.children);
            keys.forEach((key, i) => {
                const isLast = i === keys.length - 1;
                const child = n.children[key];
                result += prefix + (isLast ? '└── ' : '├── ') + key + (child.type === 'dir' ? '/' : '') + '\n';
                if (child.type === 'dir') {
                    result += buildTree(child, prefix + (isLast ? '    ' : '│   '));
                }
            });
            return result;
        };
        
        return path + '\n' + buildTree(node);
    },
    history: () => {
        if (systemState.commandHistory.length === 0) return "No commands in history";
        return systemState.commandHistory.map((cmd, i) => `${(i + 1).toString().padStart(4)}  ${cmd}`).join('\n');
    },
    theme: (args) => {
        const availableThemes = ['kali-dark'];
        if (args.length === 0) {
            return `Available themes: ${availableThemes.join(', ')}\nCurrent theme: kali-dark`;
        }
        if (args[0] === 'change') {
            return "Only one theme available: kali-dark";
        }
        return "Usage: theme [change]";
    },
    matrix: (args, body, win) => {
        if (args.length === 0) {
            if (!matrixActive) {
                const container = body.querySelector('.terminal-container');
                const output = body.querySelector('.terminal-output');
                output.innerHTML += `<div>Initializing Matrix Environment...</div>`;
                output.innerHTML += `<div>Loading Character Streams...</div>`;
                output.innerHTML += `<div>Starting Digital Rain...</div>`;
                output.innerHTML += `<div>Press ESC to Exit</div>`;
                output.scrollTop = output.scrollHeight;
                setTimeout(() => {
                    initMatrix(container, output);
                }, 500);
                // Add keydown listener to container for ESC and Ctrl+C
                const keydownHandler = (e) => {
                    if ((e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) && matrixActive) {
                        stopMatrix();
                        window.removeEventListener('keydown', keydownHandler);
                    }
                };
                window.addEventListener('keydown', keydownHandler);
                return "";
            } else {
                return "Matrix is already active. Press ESC or use 'matrix stop' to exit.";
            }
        } else if (args[0] === 'stop') {
            if (matrixActive) {
                stopMatrix();
                return "Stopping Matrix animation...";
            } else {
                return "Matrix is not active.";
            }
        } else if (args[0] === 'speed') {
            if (args[1] === 'slow') matrixSpeed = 100;
            else if (args[1] === 'normal') matrixSpeed = 50;
            else if (args[1] === 'fast') matrixSpeed = 20;
            return `Matrix speed set to ${args[1]}`;
        } else if (args[0] === 'color') {
            if (args[1] === 'green') matrixColor = '#00ff41';
            else if (args[1] === 'blue') matrixColor = '#00aaff';
            return `Matrix color set to ${args[1]}`;
        } else if (args[0] === 'info') {
            return `
╔══════════════════════════════════════════════════════════════╗
║                    MATRIX ANIMATION INFO                     ║
╠══════════════════════════════════════════════════════════════╣
║  Status:        ${matrixActive ? 'Active' : 'Inactive'}                                  ║
║  Speed:         ${matrixSpeed === 20 ? 'Fast' : matrixSpeed === 100 ? 'Slow' : 'Normal'}                                ║
║  Color:         ${matrixColor === '#00ff41' ? 'Green' : 'Blue'}                               ║
║  Streams:       ${matrixStreams.length}                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Controls:                                                 ║
║  • ESC / Ctrl+C - Exit Matrix mode                          ║
║  • matrix stop - Stop animation                              ║
║  • matrix speed [slow|normal|fast] - Change speed            ║
║  • matrix color [green|blue] - Change color                  ║
╚══════════════════════════════════════════════════════════════╝
`;
        } else {
            return `Unknown matrix subcommand: ${args[0]}
Available subcommands: stop, speed, color, info`;
        }
    },
    hack: (args) => { 
        const info = getSystemInfo();
        startHackingAnimation(); 
        return `[!] INITIALIZING ETHICAL HACKING SIMULATION...
[*] TARGET: ${info.ip}
[*] OS: ${info.os}
[*] BROWSER: ${info.browser}
[*] SCANNING...
[*] ENUMERATING...
[*] TESTING VULNERABILITIES...
[+] SIMULATION COMPLETE!
[+] No real vulnerabilities found - just for demonstration!
`; 
    },
    scanner: () => {
        startHackingAnimation();
        return `[+] Starting Security Scan...
[*] Initializing Nmap...
[*] Scanning ports 1-65535...
[*] Checking for vulnerabilities...
[*] Analyzing results...
[+] SCAN COMPLETE!
[+] Results: No real threats found - demo only!
[+] Open ports simulated: 80 (HTTP), 443 (HTTPS)
`;
    },
    status: () => `
╔══════════════════════════════════════════════════════════════╗
║                     PORTFOLIO STATUS                         ║
╠══════════════════════════════════════════════════════════════╣
║  System:       Online                                        ║
║  Terminal:     Active                                        ║
║  Services:     All Running                                   ║
║  Last Update:  ${new Date().toLocaleString().padEnd(40)}          ║
║  Version:      1.0.0                                         ║
║  Uptime:       ${Math.floor((Date.now() - performance.timing.navigationStart) / 60000)} minutes  ║
╚══════════════════════════════════════════════════════════════╝
`,
    version: () => `Portfolio OS v1.0.0
Build: 2024
Author: Prasad Madole
Type: Kali Linux Style Terminal Simulation
`,
    quote: () => {
        const quotes = [
            "The only way to do great work is to love what you do. - Steve Jobs",
            "Security is not a product, but a process. - Bruce Schneier",
            "With great power comes great responsibility. - Uncle Ben",
            "Hack the planet!",
            "Code is like humor. When you have to explain it, it’s bad. - Cory House",
            "The best way to predict the future is to invent it. - Alan Kay",
            "Talk is cheap. Show me the code. - Linus Torvalds",
            "Trust, but verify. - Ronald Reagan (Cybersecurity proverb)",
            "Every expert was once a beginner. - Helen Hayes",
            "Stay hungry, stay foolish. - Steve Jobs"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    },
    news: () => `
╔══════════════════════════════════════════════════════════════╗
║                 CYBERSECURITY NEWS                           ║
╠══════════════════════════════════════════════════════════════╣
║  📰 News feed coming soon! Stay tuned for updates on:         ║
║  • Latest vulnerabilities & patches                           ║
║  • Cybersecurity trends & research                           ║
║  • New tools & techniques                                    ║
╚══════════════════════════════════════════════════════════════╝
`,
    learning: () => `
╔══════════════════════════════════════════════════════════════╗
║                    CURRENT LEARNING PATH                     ║
╠══════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────┐║
║  │ Currently Learning:                                      │║
║  │ - Advanced Penetration Testing                           │║
║  │ - Web Application Security (OWASP Top 10)                │║
║  │ - Cloud Security (AWS)                                   │║
║  └────────────────────────────────────────────────────────┘║
║  ┌────────────────────────────────────────────────────────┐║
║  │ Progress: ${progressBar(65, 39)}      │║
║  └────────────────────────────────────────────────────────┘║
║  Use 'skills' command to see all skills!                    ║
╚══════════════════════════════════════════════════════════════╝
`,
    cyber: () => `
╔══════════════════════════════════════════════════════════════╗
║                  CYBERSECURITY SPECIALIZATION                ║
╠══════════════════════════════════════════════════════════════╣
║  Domains:                                                    ║
║  ├─ Penetration Testing (Red Team)                          ║
║  ├─ Vulnerability Assessment & Management                   ║
║  ├─ Web Application Security                                ║
║  ├─ Network Security                                        ║
║  └─ Security Auditing                                       ║
║                                                              ║
║  Tools I Use:                                                ║
║  ├─ Nmap, Wireshark, Burp Suite, Metasploit                 ║
║  └─ OWASP ZAP, Kali Linux, Nikto                            ║
╚══════════════════════════════════════════════════════════════╝
`,
    network: () => `
╔══════════════════════════════════════════════════════════════╗
║                    NETWORKING KNOWLEDGE                      ║
╠══════════════════════════════════════════════════════════════╣
║  Concepts:                                                   ║
║  ├─ TCP/IP Model, OSI Model                                 ║
║  ├─ Routing & Switching                                     ║
║  ├─ Subnetting & CIDR                                       ║
║  ├─ DHCP, DNS, NAT                                          ║
║  └─ Network Security (Firewalls, IDS/IPS)                   ║
║                                                              ║
║  Tools:                                                      ║
║  ├─ Nmap (Port Scanning)                                    ║
║  └─ Wireshark (Packet Analysis)                             ║
╚══════════════════════════════════════════════════════════════╝
`,
    linux: () => `
╔══════════════════════════════════════════════════════════════╗
║                      LINUX SKILLS                            ║
╠══════════════════════════════════════════════════════════════╣
║  Distros:                                                    ║
║  ├─ Kali Linux (Primary)                                    ║
║  ├─ Ubuntu                                                  ║
║  └─ Debian                                                  ║
║                                                              ║
║  Skills:                                                     ║
║  ├─ Bash Scripting                                           ║
║  ├─ System Administration                                    ║
║  ├─ File Permissions & Ownership                             ║
║  ├─ Process Management                                       ║
║  └─ Package Management (apt, dpkg)                           ║
║                                                              ║
║  Common Commands I Know:                                     ║
║  ls, cd, pwd, cat, grep, awk, sed, chmod, chown, ps, top    ║
╚══════════════════════════════════════════════════════════════╝
`,
    python: () => `
╔══════════════════════════════════════════════════════════════╗
║                     PYTHON PROJECTS & SKILLS                 ║
╠══════════════════════════════════════════════════════════════╣
║  Skills:                                                     ║
║  ├─ Core Python (OOP, Data Structures)                      ║
║  ├─ Web Frameworks: Flask, Django                           ║
║  ├─ Automation Scripts                                       ║
║  ├─ Web Scraping (Beautiful Soup, Scrapy)                   ║
║  └─ Data Analysis (Pandas, NumPy)                           ║
║                                                              ║
║  Projects:                                                   ║
║  ├─ Security Automation Tools                                ║
║  ├─ Port Scanner                                             ║
║  └─ Password Generator                                       ║
╚══════════════════════════════════════════════════════════════╝
`,
    java: () => `
╔══════════════════════════════════════════════════════════════╗
║                      JAVA EXPERIENCE                         ║
╠══════════════════════════════════════════════════════════════╣
║  Skills:                                                     ║
║  ├─ Core Java (OOP, Collections, Multithreading)            ║
║  ├─ Android Development (Java & Kotlin)                     ║
║  └─ Spring Boot (Basics)                                    ║
║                                                              ║
║  Projects:                                                   ║
║  ├─ Android Security Scanner App                            ║
║  └─ Java Console Games                                      ║
╚══════════════════════════════════════════════════════════════╝
`,
    android: () => `
╔══════════════════════════════════════════════════════════════╗
║                 ANDROID DEVELOPMENT PORTFOLIO                ║
╠══════════════════════════════════════════════════════════════╣
║  Skills:                                                     ║
║  ├─ Kotlin & Java                                            ║
║  ├─ Android Studio                                           ║
║  ├─ UI/UX Design (Material Design)                           ║
║  ├─ Firebase Integration                                     ║
║  └─ Android Security & Permissions                           ║
║                                                              ║
║  Projects:                                                   ║
║  ├─ Security Scanner App (Android)                           ║
║  └─ Portfolio App                                            ║
╚══════════════════════════════════════════════════════════════╝
`,
    security: () => { openApp('licenses', 'Licenses & Certifications'); return "Opening Security section..."; },
    dashboard: () => {
        const skillsCount = 20;
        const projectsCount = 5;
        const certsCount = 3;
        return `
╔══════════════════════════════════════════════════════════════╗
║                     CYBERSECURITY DASHBOARD                  ║
╠══════════════════════════════════════════════════════════════╣
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        ║
║  │  Skills  │ │ Projects │ │  Certs   │ │  Uptime  │        ║
║  │   ${skillsCount.toString().padEnd(6)} │ │   ${projectsCount.toString().padEnd(6)} │ │   ${certsCount.toString().padEnd(6)} │ │${Math.floor((Date.now() - performance.timing.navigationStart) / 60000).toString().padEnd(5)}m│        ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘        ║
╚══════════════════════════════════════════════════════════════╝
Opening full dashboard window...
`;
        createWindow('monitor', 'Task Manager', renderTaskManager);
    },
    echo: (args) => args.join(' '),
    ps: () => {
        let output = "PID   | NAME            | CPU % | MEMORY\n";
        output += "----------------------------------------\n";
        systemState.processes.forEach(p => {
            output += `${p.pid.toString().padEnd(5)} | ${p.name.padEnd(15)} | ${p.cpu.toFixed(1).padEnd(5)} | ${p.memory.toFixed(1)} MB\n`;
        });
        return output;
    },
    kill: (args) => {
        if (!args[0]) return "kill: usage: kill <pid>";
        return killProcess(args[0]) ? `[+] Terminated process ${args[0]}` : `kill: ${args[0]}: No such process`;
    },
    lock: () => { lockSystem(); return "System locked."; },
    weather: () => { createWindow('weather', 'Weather', renderWeatherApp); return "Opening weather application..."; },
    calendar: () => { createWindow('calendar', 'Calendar', renderCalendarApp); return "Opening calendar application..."; },
    snake: (args) => { 
        const difficulty = args[0] ? args[0].toLowerCase() : null;
        if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
            return "usage: snake [easy|medium|hard]";
        }
        createWindow('snake', 'Snake Game', renderSnakeApp, { difficulty }); 
        return difficulty ? `Starting Snake Game (${difficulty})...` : "Starting Snake Game..."; 
    },
    recycle: () => { createWindow('recycle', 'Recycle Bin', renderRecycleBin); return "Opening Recycle Bin..."; },
    explorer: () => { createWindow('explorer', 'File Explorer', renderExplorer); return "Opening File Explorer..."; },
    exit: (args, body, win) => { closeWindow(win.dataset.app); return ""; }
};

const renderTerminal = (body, win) => {
    body.style.padding = '0';
    body.innerHTML = `
        <div class="terminal-container" style="background: black; height: 100%; padding: 10px; font-family: 'Fira Code', monospace; position: relative; overflow: hidden;">
            <div class="terminal-output" style="color: var(--accent-green); white-space: pre-wrap; margin-bottom: 5px; height: calc(100% - 30px); overflow-y: auto;">Welcome to Kali Terminal\nType 'help' for commands.\n\n</div>
            <div class="terminal-input-line" style="display: flex; gap: 8px;">
                <span class="prompt" style="color: var(--accent-blue); font-weight: bold;">${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$</span>
                <input type="text" class="terminal-input" style="flex: 1; background: transparent; border: none; outline: none; color: white; font-family: inherit;" autofocus spellcheck="false">
            </div>
            <div class="terminal-suggestions" style="position: absolute; bottom: 40px; left: 10px; background: #1a1a1a; border: 1px solid #333; display: none; flex-direction: column; z-index: 10;"></div>
        </div>
    `;

    const input = body.querySelector('.terminal-input');
    const output = body.querySelector('.terminal-output');
    const promptSpan = body.querySelector('.prompt');
    const suggestionsBox = body.querySelector('.terminal-suggestions');

    const updateSuggestions = (val) => {
        if (!val) { suggestionsBox.style.display = 'none'; return; }
        const valLower = val.toLowerCase();
        let cmds = Object.keys(terminalCommands).filter(c => c.toLowerCase().startsWith(valLower));
        // Also include aliases in suggestions
        const aliasMatches = Object.keys(commandAliases).filter(a => a.startsWith(valLower));
        cmds = [...new Set([...cmds, ...aliasMatches])];
        if (cmds.length > 0) {
            suggestionsBox.innerHTML = cmds.map(c => `<div style="padding: 4px 10px; cursor: pointer; font-size: 12px; color: #888;">${c}</div>`).join('');
            suggestionsBox.style.display = 'flex';
            suggestionsBox.querySelectorAll('div').forEach(div => {
                div.onclick = () => { input.value = div.textContent; suggestionsBox.style.display = 'none'; input.focus(); };
            });
        } else {
            suggestionsBox.style.display = 'none';
        }
    };

    input.addEventListener('input', (e) => updateSuggestions(input.value.trim()));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            suggestionsBox.style.display = 'none';
            if (!val) return;

            // Add to history
            systemState.commandHistory.push(val);
            systemState.historyIndex = systemState.commandHistory.length;

            const [cmdRaw, ...args] = val.split(' ');
            let cmd = cmdRaw.toLowerCase();
            
            // Check for alias
            if (commandAliases[cmd]) {
                cmd = commandAliases[cmd];
            }
            
            output.innerHTML += `<div><span style="color: var(--accent-blue); font-weight: bold;">${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$</span> ${val}</div>`;
            
            // Find command (case-insensitive)
            let foundCmd = null;
            for (const key of Object.keys(terminalCommands)) {
                if (key.toLowerCase() === cmd) {
                    foundCmd = terminalCommands[key];
                    break;
                }
            }
            
            if (foundCmd) {
                const result = foundCmd(args, body, win);
                if (result) output.innerHTML += `<div>${result.replace(/\n/g, '<br>')}</div>`;
                // Update prompt immediately (for cd)
                promptSpan.textContent = `${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$`;
            } else if (cmd) {
                let outputMsg = `${cmdRaw}: command not found<br>`;
                const suggested = getSuggestedCommand(cmd);
                if (suggested && suggested !== cmd) {
                    outputMsg += `Did you mean: ${suggested}<br>`;
                }
                outputMsg += `Type 'help' to view available commands.`;
                output.innerHTML += `<div>${outputMsg}</div>`;
            }
            
            input.value = '';
            output.scrollTop = output.scrollHeight;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (systemState.historyIndex > 0) {
                systemState.historyIndex--;
                input.value = systemState.commandHistory[systemState.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (systemState.historyIndex < systemState.commandHistory.length - 1) {
                systemState.historyIndex++;
                input.value = systemState.commandHistory[systemState.historyIndex];
            } else {
                systemState.historyIndex = systemState.commandHistory.length;
                input.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;
            const valLower = val.toLowerCase();
            let cmds = Object.keys(terminalCommands).filter(c => c.toLowerCase().startsWith(valLower));
            // Also include aliases in suggestions
            const aliasMatches = Object.keys(commandAliases).filter(a => a.startsWith(valLower));
            cmds = [...new Set([...cmds, ...aliasMatches])];
            if (cmds.length === 1) {
                input.value = cmds[0];
                suggestionsBox.style.display = 'none';
            } else if (cmds.length > 1) {
                // Show partial completion if possible
                let commonPrefix = cmds[0];
                for (let i = 1; i < cmds.length; i++) {
                    while (!cmds[i].toLowerCase().startsWith(commonPrefix.toLowerCase())) {
                        commonPrefix = commonPrefix.slice(0, -1);
                    }
                }
                if (commonPrefix.length > val.length) {
                    input.value = commonPrefix;
                } else {
                    // Show suggestions
                    updateSuggestions(val);
                }
            }
        }
    });
    body.onclick = () => input.focus();
};

// --- Notepad Logic ---
const renderNotepad = (body, win, params = {}) => {
    const fileName = params.fileName || 'Untitled';
    let content = params.content || '';
    
    body.innerHTML = `
        <div class="notepad-container" style="display: flex; flex-direction: column; height: 100%; background: #050505;">
            <div class="notepad-menu" style="display: flex; background: #111; padding: 4px 12px; gap: 15px; border-bottom: 1px solid #222; font-size: 12px; color: #aaa;">
                <div class="notepad-menu-item" id="note-new" style="cursor: pointer; padding: 2px 8px; border-radius: 4px;">New</div>
                <div class="notepad-menu-item" id="note-save" style="cursor: pointer; padding: 2px 8px; border-radius: 4px; color: var(--accent-green);">Save</div>
                <div class="notepad-menu-item" id="note-close" style="cursor: pointer; padding: 2px 8px; border-radius: 4px;">Exit</div>
            </div>
            <textarea class="notepad-textarea" style="flex: 1; background: transparent; border: none; outline: none; color: #00ff41; padding: 15px; font-family: 'Fira Code', monospace; font-size: 14px; resize: none; line-height: 1.5;" spellcheck="false">${content}</textarea>
            <div class="notepad-status" style="background: #111; padding: 4px 12px; font-size: 11px; color: #666; border-top: 1px solid #222; display: flex; justify-content: space-between;">
                <span><i class="fas fa-file-alt" style="margin-right: 6px;"></i>${fileName}</span>
                <span id="char-count">Length: ${content.length} | Lines: ${content.split('\n').length}</span>
            </div>
        </div>
    `;

    const textarea = body.querySelector('.notepad-textarea');
    const statusLine = body.querySelector('#char-count');
    
    textarea.oninput = () => {
        const text = textarea.value;
        statusLine.textContent = `Length: ${text.length} | Lines: ${text.split('\n').length}`;
    };

    body.querySelectorAll('.notepad-menu-item').forEach(item => {
        item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.1)';
        item.onmouseleave = () => item.style.background = 'transparent';
    });

    body.querySelector('#note-save').onclick = () => {
        const name = prompt('File name:', fileName);
        if (name) {
            const res = createFSNode(resolvePath(name), 'file', textarea.value);
            if (res.error && res.error === 'Already exists') {
                // Update existing file
                const node = getFSNode(resolvePath(name));
                if (node && node.type === 'file') {
                    node.content = textarea.value;
                    saveFileSystem();
                    showNotification(`Updated ${name}`);
                }
            } else if (res.success) {
                showNotification(`Saved ${name}`);
            } else {
                alert(res.error);
            }
        }
    };

    body.querySelector('#note-new').onclick = () => {
        if (textarea.value && !confirm('Discard changes?')) return;
        textarea.value = '';
        statusLine.textContent = 'Length: 0 | Lines: 1';
    };

    body.querySelector('#note-close').onclick = () => closeWindow(win.dataset.app);
};

// --- Explorer Upgrade ---
const renderExplorer = (body, win, params = {}) => {
    let path = params.path || systemState.currentDirectory;
    let selectedItem = null;
    
    const refresh = (newPath) => {
        path = newPath;
        const node = getFSNode(path);
        if (!node) return;

        body.innerHTML = `
            <div class="explorer-container" style="display: flex; flex-direction: column; height: 100%; background: #111; position: relative;">
                <div class="explorer-toolbar" style="display: flex; gap: 10px; padding: 8px 12px; background: #222; border-bottom: 1px solid #333;">
                    <div class="explorer-tool-btn" id="ex-back" title="Go Back"><i class="fas fa-arrow-left"></i></div>
                    <div class="explorer-tool-btn" id="ex-home" title="Home"><i class="fas fa-home"></i></div>
                    <div style="flex: 1;"></div>
                    <div class="explorer-tool-btn" id="ex-new-file"><i class="fas fa-file-medical"></i> New File</div>
                    <div class="explorer-tool-btn" id="ex-new-folder"><i class="fas fa-folder-plus"></i> New Folder</div>
                </div>
                <div class="path-bar" style="padding: 6px 12px; font-size: 11px; background: #1a1a1a; color: #888; border-bottom: 1px solid #222;">
                    <i class="fas fa-folder-open" style="margin-right: 8px; color: var(--accent-blue);"></i>${path}
                </div>
                <div class="explorer-grid" id="explorer-grid" style="padding: 15px; flex: 1; display: grid; grid-template-columns: repeat(auto-fill, 85px); grid-template-rows: repeat(auto-fill, 95px); gap: 15px; overflow-y: auto;">
                    ${Object.keys(node.children).sort().map(name => {
                        const child = node.children[name];
                        const isDir = child.type === 'dir';
                        return `
                            <div class="explorer-item" data-name="${name}" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                                <i class="fas ${isDir ? 'fa-folder' : 'fa-file-alt'}" style="font-size: 32px; color: ${isDir ? 'var(--accent-blue)' : '#999'}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                                <div class="item-name" style="font-size: 11px; text-align: center; word-break: break-all; max-height: 2.4em; overflow: hidden;">${name}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const container = body.querySelector('.explorer-container');
        const grid = body.querySelector('#explorer-grid');

        const showMenu = (e, itemData = null) => {
            e.preventDefault();
            e.stopPropagation(); // Stop from reaching document context menu
            
            const existing = body.querySelector('.explorer-context-menu');
            if (existing) existing.remove();

            const menu = document.createElement('div');
            menu.className = 'explorer-context-menu context-menu'; // Use existing styles
            menu.style.position = 'absolute';
            
            // Calculate position relative to container
            const rect = container.getBoundingClientRect();
            menu.style.top = `${e.clientY - rect.top}px`;
            menu.style.left = `${e.clientX - rect.left}px`;

            const options = itemData ? [
                { label: 'Rename', icon: 'fa-edit', action: () => renameItem(itemData.name) },
                { label: 'Delete', icon: 'fa-trash-alt', action: () => deleteItem(itemData.name) }
            ] : [
                { label: 'New File', icon: 'fa-file-medical', action: () => createNewFile() },
                { label: 'New Folder', icon: 'fa-folder-plus', action: () => createNewFolder() },
                { separator: true },
                { label: 'Refresh', icon: 'fa-sync-alt', action: () => refresh(path) }
            ];

            options.forEach(opt => {
                if (opt.separator) {
                    const sep = document.createElement('div');
                    sep.className = 'context-menu-separator';
                    menu.appendChild(sep);
                    return;
                }
                const div = document.createElement('div');
                div.className = 'context-menu-item';
                div.innerHTML = `<i class="fas ${opt.icon}"></i> ${opt.label}`;
                div.onclick = () => { opt.action(); menu.remove(); };
                menu.appendChild(div);
            });

            container.appendChild(menu);
            
            const closeMenu = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', closeMenu); } };
            document.addEventListener('mousedown', closeMenu);
        };

        const createNewFile = () => {
            let n = prompt('Filename:');
            if (n) { 
                if (!n.includes('.')) n += '.txt';
                const res = createFSNode(path + (path === '/' ? '' : '/') + n, 'file');
                if (res.error) alert(res.error);
                refresh(path); 
            }
        };

        const createNewFolder = () => {
            const n = prompt('Folder name:');
            if (n) { 
                const res = createFSNode(path + (path === '/' ? '' : '/') + n, 'dir');
                if (res.error) alert(res.error);
                refresh(path); 
            }
        };

        const deleteItem = (name) => {
            if (confirm(`Move ${name} to Recycle Bin?`)) {
                const res = moveToRecycleBin(path + (path === '/' ? '' : '/') + name);
                if (res.error) alert(res.error);
                else refresh(path);
            }
        };

        const renameItem = (oldName) => {
            const newName = prompt('New name:', oldName);
            if (newName && newName !== oldName) {
                const res = renameFSNode(path + (path === '/' ? '' : '/') + oldName, newName);
                if (res.error) alert(res.error);
                else refresh(path);
            }
        };

        // Scoped Context Menu
        grid.oncontextmenu = (e) => showMenu(e);
        
        body.querySelectorAll('.explorer-item').forEach(item => {
            item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.05)';
            item.onmouseleave = () => { if (selectedItem !== item) item.style.background = 'transparent'; };
            
            item.onclick = (e) => {
                e.stopPropagation();
                body.querySelectorAll('.explorer-item').forEach(i => i.style.background = 'transparent');
                item.style.background = 'rgba(0, 168, 255, 0.2)';
                selectedItem = item;
            };

            item.ondblclick = () => {
                const n = item.dataset.name;
                const p = (path === '/' ? '' : path) + '/' + n;
                const node = getFSNode(p);
                if (node.type === 'dir') refresh(p);
                else createWindow('notepad-' + n, n, renderNotepad, { fileName: n, content: node.content });
            };
            
            item.oncontextmenu = (e) => showMenu(e, { name: item.dataset.name });
        });

        // Toolbar actions
        body.querySelector('#ex-back').onclick = () => {
            if (path === '/') return;
            const p = path.split('/').filter(x => x).slice(0, -1).join('/') || '/';
            refresh(p.startsWith('/') ? p : '/' + p);
        };
        body.querySelector('#ex-home').onclick = () => refresh('/home/prasad');
        body.querySelector('#ex-new-file').onclick = createNewFile;
        body.querySelector('#ex-new-folder').onclick = createNewFolder;

        // Deselect when clicking empty grid space
        grid.onclick = () => {
            body.querySelectorAll('.explorer-item').forEach(i => i.style.background = 'transparent');
            selectedItem = null;
        };
    };
    refresh(path);
};

// --- Calendar Logic ---
const renderCalendarApp = (body) => {
    const now = new Date();
    let viewMonth = now.getMonth();
    let viewYear = now.getFullYear();

    const refresh = () => {
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const startDay = new Date(viewYear, viewMonth, 1).getDay();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(viewYear, viewMonth));

        body.innerHTML = `
            <div class="calendar-container" style="display: flex; flex-direction: column; height: 100%; background: #0a0a0a; color: #eee; padding: 20px;">
                <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <button id="cal-prev" style="background: #222; border: 1px solid #333; color: #fff; padding: 5px 12px; border-radius: 4px; cursor: pointer;"><i class="fas fa-chevron-left"></i></button>
                    <div style="font-size: 18px; font-weight: bold; color: var(--accent-blue);">${monthName} ${viewYear}</div>
                    <button id="cal-next" style="background: #222; border: 1px solid #333; color: #fff; padding: 5px 12px; border-radius: 4px; cursor: pointer;"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; flex: 1;">
                    ${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => `<div class="calendar-day-header" style="text-align: center; font-size: 10px; color: #555; font-weight: bold; padding-bottom: 10px;">${d}</div>`).join('')}
                    ${Array(startDay).fill('').map(() => `<div></div>`).join('')}
                    ${Array(daysInMonth).fill(0).map((_, i) => {
                        const d = i + 1;
                        const dateKey = `${viewYear}-${viewMonth + 1}-${d}`;
                        const isToday = d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                        const hasEvent = systemState.events[dateKey];
                        return `
                            <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" 
                                 data-date="${dateKey}"
                                 style="aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${isToday ? 'rgba(0, 168, 255, 0.2)' : '#111'}; border: 1px solid ${isToday ? 'var(--accent-blue)' : '#222'}; border-radius: 8px; cursor: pointer; position: relative; transition: all 0.2s;">
                                <span style="font-size: 14px; ${isToday ? 'color: var(--accent-blue); font-weight: bold;' : ''}">${d}</span>
                                ${hasEvent ? `<div style="position: absolute; bottom: 6px; width: 4px; height: 4px; background: var(--accent-green); border-radius: 50%; box-shadow: 0 0 5px var(--accent-green);"></div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div id="event-preview" style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 11px; min-height: 40px; color: #888; border-left: 3px solid #333;">
                    Click a date to manage events
                </div>
            </div>
        `;

        body.querySelectorAll('.calendar-day[data-date]').forEach(el => {
            el.onmouseenter = () => {
                const date = el.dataset.date;
                const event = systemState.events[date];
                body.querySelector('#event-preview').innerHTML = event ? `<span style="color: var(--accent-green);">Event:</span> ${event}` : 'No events for this date';
                el.style.transform = 'translateY(-2px)';
                el.style.borderColor = 'var(--accent-blue)';
            };
            el.onmouseleave = () => {
                el.style.transform = 'translateY(0)';
                if (!el.classList.contains('today')) el.style.borderColor = '#222';
            };
            el.onclick = () => {
                const date = el.dataset.date;
                const note = prompt(`Event for ${date}:`, systemState.events[date] || '');
                if (note !== null) {
                    if (note.trim()) systemState.events[date] = note;
                    else delete systemState.events[date];
                    saveEvents();
                    refresh();
                }
            };
        });

        body.querySelector('#cal-prev').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } refresh(); };
        body.querySelector('#cal-next').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } refresh(); };
    };
    refresh();
};

const renderBrowser = (body, win, params = {}) => {
    let currentUrl = params.url || '';

    body.innerHTML = `
        <div class="browser-container" style="display: flex; flex-direction: column; height: 100%; background: #f1f3f4; border-radius: 0 0 8px 8px; overflow: hidden;">
            <div class="browser-toolbar" style="display: flex; align-items: center; gap: 12px; padding: 8px 15px; background: #fff; border-bottom: 1px solid #dee1e6;">
                <div class="browser-nav-btns" style="display: flex; gap: 15px; color: #5f6368;">
                    <i class="fas fa-arrow-left" id="br-back" style="cursor: pointer;" title="Back"></i>
                    <i class="fas fa-arrow-right" id="br-forward" style="cursor: pointer;" title="Forward"></i>
                    <i class="fas fa-redo" id="br-reload" style="cursor: pointer;" title="Reload"></i>
                    <i class="fas fa-home" id="br-home" style="cursor: pointer;" title="Home"></i>
                </div>
                <div class="browser-address-bar" style="flex: 1; display: flex; align-items: center; background: #f1f3f4; border-radius: 20px; padding: 5px 15px; border: 1px solid transparent; transition: all 0.2s;">
                    <i class="fas fa-lock" style="font-size: 11px; color: #1a73e8; margin-right: 10px;"></i>
                    <input type="text" id="br-url-input" value="${currentUrl}" placeholder="Search or enter URL" style="flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: #202124;" spellcheck="false">
                </div>
                <div class="browser-actions" style="display: flex; gap: 12px; color: #5f6368;">
                    <i class="fas fa-external-link-alt" id="br-new-tab" style="cursor: pointer;" title="Open in New Tab (Fix Connection Issues)"></i>
                </div>
            </div>
            <div class="browser-content-wrapper" id="browser-content-wrapper">
                <div id="browser-loader" class="browser-loader" style="position: absolute; top: 0; left: 0; height: 2px; background: #1a73e8; width: 0; transition: width 0.3s; z-index: 10;"></div>
                <div id="browser-home" class="browser-home" style="display: ${currentUrl ? 'none' : 'flex'};">
                    <h1 class="browser-home-title">Prasad OS</h1>
                    <div class="browser-home-greeting">Welcome, ${CONFIG.user} | ${getTimestamp()}</div>
                    
                    <div class="browser-home-search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" class="browser-home-search-input" id="home-search-input" placeholder="Search the web...">
                    </div>

                    <div class="browser-shortcuts">
                        <div class="shortcut-card linkedin" id="sc-linkedin">
                            <i class="fab fa-linkedin"></i>
                            <span>LinkedIn</span>
                        </div>
                        <div class="shortcut-card github" id="sc-github">
                            <i class="fab fa-github"></i>
                            <span>GitHub</span>
                        </div>
                        <div class="shortcut-card portfolio" id="sc-portfolio">
                            <i class="fas fa-briefcase"></i>
                            <span>Portfolio</span>
                        </div>
                    </div>
                </div>
                <iframe id="browser-iframe" src="${currentUrl || 'about:blank'}" style="width: 100%; height: 100%; border: none; display: ${currentUrl ? 'block' : 'none'};"></iframe>
                <div id="iframe-blocked-msg" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; padding: 40px; text-align: center; color: #333; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
                    <i class="fas fa-user-shield" style="font-size: 48px; color: #ff5f56; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">Connection Restricted</h3>
                    <p style="font-size: 14px; color: #666; max-width: 300px; margin-bottom: 20px;">Some sites (like Google or GitHub) block being viewed inside other apps for security.</p>
                    <button id="msg-open-tab" style="background: #1a73e8; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Open in New Tab</button>
                </div>
            </div>
        </div>
    `;

    const iframe = body.querySelector('#browser-iframe');
    const homeView = body.querySelector('#browser-home');
    const urlInput = body.querySelector('#br-url-input');
    const loader = body.querySelector('#browser-loader');
    const blockedMsg = body.querySelector('#iframe-blocked-msg');
    const homeSearchInput = body.querySelector('#home-search-input');

    const updateUrl = (url) => {
        let finalUrl = url.trim();
        
        if (!finalUrl) {
            homeView.style.display = 'flex';
            iframe.style.display = 'none';
            iframe.src = 'about:blank';
            urlInput.value = '';
            currentUrl = '';
            blockedMsg.style.display = 'none';
            return;
        }

        homeView.style.display = 'none';
        iframe.style.display = 'block';

        // Smart URL detection
        if (!finalUrl.startsWith('http') && !finalUrl.includes('.')) {
            finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}&igu=1`;
        } else if (!finalUrl.startsWith('http')) {
            finalUrl = 'https://' + finalUrl;
        }

        currentUrl = finalUrl;
        urlInput.value = finalUrl;
        blockedMsg.style.display = 'none';
        
        loader.style.width = '30%';
        iframe.src = finalUrl;
        iframe.onload = () => {
            loader.style.width = '100%';
            setTimeout(() => loader.style.width = '0', 1000);
        };
    };

    const openShortcut = (url) => {
        // LinkedIn and GitHub usually block iframes
        if (url.includes('linkedin.com') || url.includes('github.com')) {
            window.open(url, '_blank');
            showNotification("Opening shortcut in new tab...");
        } else {
            updateUrl(url);
        }
    };

    urlInput.onkeydown = (e) => { if (e.key === 'Enter') updateUrl(urlInput.value); };
    urlInput.onfocus = () => urlInput.parentElement.style.border = '1px solid #1a73e8';
    urlInput.onblur = () => urlInput.parentElement.style.border = '1px solid transparent';
    homeSearchInput.onkeydown = (e) => { if (e.key === 'Enter') updateUrl(homeSearchInput.value); };
    
    body.querySelector('#sc-linkedin').onclick = () => openShortcut('https://www.linkedin.com/in/prasad-madole-2360823ba');
    body.querySelector('#sc-github').onclick = () => openShortcut('https://github.com/PrasadCyberPerfect');
    body.querySelector('#sc-portfolio').onclick = () => updateUrl('https://prasadmadole.github.io/portfolio');

    body.querySelector('#br-home').onclick = () => updateUrl('');
    body.querySelector('#br-reload').onclick = () => { if (currentUrl) updateUrl(currentUrl); };
    body.querySelector('#br-new-tab').onclick = () => { if (currentUrl) window.open(currentUrl, '_blank'); };
    body.querySelector('#msg-open-tab').onclick = () => { if (currentUrl) window.open(currentUrl, '_blank'); };

    body.querySelector('#br-back').onclick = () => {
        try { iframe.contentWindow.history.back(); } catch(e) { console.warn('History navigation blocked'); }
    };
    body.querySelector('#br-forward').onclick = () => {
        try { iframe.contentWindow.history.forward(); } catch(e) { console.warn('History navigation blocked'); }
    };
};

const renderContactApp = (body, win) => {
    
    body.innerHTML = `
        <iframe src="apps/contact-us.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>
    `;
};

const renderAboutApp = (body, win) => {
    body.innerHTML = `<iframe src="apps/about-me.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderSkillsApp = (body, win) => {
    body.innerHTML = `<iframe src="apps/skills.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderProjectsApp = (body, win) => {
    body.innerHTML = `<iframe src="apps/projects.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderLicensesApp = (body, win) => {
    body.innerHTML = `<iframe src="apps/licenses.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderCertificateApp = (body, win, params) => {
    const { title, image, link, skills } = params;
    body.innerHTML = `
        <div style="padding: 30px; background: #0B0B0C; height: 100%; overflow-y: auto; color: white; font-family: 'Inter', sans-serif;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="font-size: 28px; margin: 0 0 10px 0; background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</h1>
            </div>
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="${image}" alt="${title}" style="max-width: 100%; max-height: 450px; object-fit: contain; border-radius: 8px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${link}" target="_blank" style="display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #00a8ff, #0088cc); color: white; padding: 15px 35px; border-radius: 50px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; border: none; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-external-link-alt"></i> Show Credential
                </a>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 16px; padding: 25px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h3 style="font-size: 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-graduation-cap" style="color: #00a8ff;"></i> Skills
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${skills.map(skill => `
                        <li style="display: flex; align-items: center; gap: 12px; padding: 12px 0; font-size: 15px;">
                            <i class="fas fa-check-circle" style="color: #00a8ff; font-size: 18px;"></i> ${skill}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
};

const renderResume = (body, win) => {
    let zoomLevel = 1;
    const fitWidth = () => {
        const container = body.querySelector('.resume-pages');
        if (!container) return;
        const containerWidth = container.clientWidth;
        const img1 = container.querySelector('img');
        if (img1) {
            zoomLevel = containerWidth / img1.naturalWidth;
            applyZoom();
        }
    };
    const applyZoom = () => {
        const pages = body.querySelectorAll('.resume-page');
        pages.forEach(page => {
            page.style.transform = `scale(${zoomLevel})`;
            page.style.transformOrigin = 'top center';
        });
        const container = body.querySelector('.resume-pages');
        if (container) {
            const firstPage = container.querySelector('.resume-page');
            if (firstPage) {
                container.style.height = `${firstPage.offsetHeight * zoomLevel * 2 + 40}px`;
            }
        }
    };
    body.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; background: #0B0B0C;">
            <!-- Toolbar -->
            <div style="padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; align-items: center;">
                <button id="zoom-in" style="padding: 8px 16px; background: rgba(0,168,255,0.1); border: 1px solid rgba(0,168,255,0.3); border-radius: 6px; color: white; cursor: pointer; font-family: 'Fira Code', monospace;">
                    <i class="fas fa-search-plus"></i> Zoom In
                </button>
                <button id="zoom-out" style="padding: 8px 16px; background: rgba(0,168,255,0.1); border: 1px solid rgba(0,168,255,0.3); border-radius: 6px; color: white; cursor: pointer; font-family: 'Fira Code', monospace;">
                    <i class="fas fa-search-minus"></i> Zoom Out
                </button>
                <button id="fit-width" style="padding: 8px 16px; background: rgba(0,168,255,0.1); border: 1px solid rgba(0,168,255,0.3); border-radius: 6px; color: white; cursor: pointer; font-family: 'Fira Code', monospace;">
                    <i class="fas fa-expand"></i> Fit Width
                </button>
            </div>
            <!-- Resume Pages -->
            <div class="resume-pages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; align-items: center;">
                <div class="resume-page" style="width: 100%; max-width: 800px;">
                    <img src="resume 3.PNG" alt="Resume Page 1" style="width: 100%; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                </div>
                <div class="resume-page" style="width: 100%; max-width: 800px;">
                    <img src="resume 2.PNG" alt="Resume Page 2" style="width: 100%; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                </div>
            </div>
        </div>
    `;
    // Add event listeners
    body.querySelector('#zoom-in').onclick = () => { zoomLevel += 0.1; applyZoom(); };
    body.querySelector('#zoom-out').onclick = () => { if (zoomLevel > 0.3) { zoomLevel -= 0.1; applyZoom(); } };
    body.querySelector('#fit-width').onclick = fitWidth;
    // Fit width on load
    const images = body.querySelectorAll('.resume-page img');
    let loadedCount = 0;
    images.forEach(img => {
        img.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) fitWidth();
        };
    });
};

const renderSnakeApp = (body, win) => {
    body.innerHTML = `<iframe src="apps/snake-game.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderGenericApp = (appId) => (body) => {
    const data = {
        'about': { 
            title: "About Me", 
            icon: "fa-user-secret",
            content: getFSNode('/home/prasad/about.txt')?.content || "" 
        },
        'skills': { 
            title: "Skills", 
            icon: "fa-code",
            content: getFSNode('/home/prasad/skills.txt')?.content || "" 
        },
        'projects': { 
            title: "Projects", 
            icon: "fa-terminal",
            content: getFSNode('/home/prasad/projects.txt')?.content || "" 
        },
        'contact': { 
            title: "Contact", 
            icon: "fa-envelope",
            content: getFSNode('/home/prasad/contact.txt')?.content || "" 
        }
    }[appId];

    body.innerHTML = `
        <div style="padding: 30px; color: #eee; line-height: 1.6; height: 100%; overflow-y: auto; background: #0a0a0a;">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #222; padding-bottom: 15px;">
                <i class="fas ${data?.icon}" style="font-size: 40px; color: var(--accent-blue);"></i>
                <h2 style="font-size: 24px; margin: 0; color: #fff; letter-spacing: 1px;">${data?.title}</h2>
            </div>
            <div style="font-family: 'Fira Code', monospace; white-space: pre-wrap; font-size: 14px; color: #ccc;">${data?.content}</div>
            
            <div style="margin-top: 40px; padding: 15px; background: rgba(0, 168, 255, 0.05); border-radius: 8px; border: 1px solid rgba(0, 168, 255, 0.1);">
                <div style="font-size: 11px; color: var(--accent-blue); text-transform: uppercase; margin-bottom: 8px;">System Note</div>
                <div style="font-size: 12px; color: #888;">This information is pulled directly from the local virtual file system (VFS). You can edit these files using the terminal or explorer to see changes here.</div>
            </div>
        </div>
    `;
};

// --- Privacy Consent Logic ---
const showCookieModal = () => {
    const modal = document.getElementById('privacy-modal');
    modal.classList.remove('hidden');

    const storageCheckbox = document.getElementById('pref-storage');
    const apiCheckbox = document.getElementById('pref-api');
    const analyticsCheckbox = document.getElementById('pref-analytics');

    // Pre-fill if exists
    if (systemState.privacy) {
        storageCheckbox.checked = systemState.privacy.storage;
        apiCheckbox.checked = systemState.privacy.api;
        analyticsCheckbox.checked = systemState.privacy.analytics;
    }

    document.getElementById('accept-all').onclick = () => {
        savePreferences({ essential: true, storage: true, api: true, analytics: true });
        modal.classList.add('hidden');
    };

    document.getElementById('reject-all').onclick = () => {
        savePreferences({ essential: true, storage: false, api: false, analytics: false });
        modal.classList.add('hidden');
    };

    document.getElementById('save-prefs').onclick = () => {
        savePreferences({
            essential: true,
            storage: storageCheckbox.checked,
            api: apiCheckbox.checked,
            analytics: analyticsCheckbox.checked
        });
        modal.classList.add('hidden');
    };
};

const savePreferences = (prefs) => {
    systemState.privacy = prefs;
    localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
    applyPreferences();
    showNotification("Privacy preferences updated.");
};

const applyPreferences = () => {
    if (!systemState.privacy) return;

    // Handle Storage Preference
    if (!systemState.privacy.storage) {
        localStorage.removeItem('prasad_os_fs');
        localStorage.removeItem('prasad_os_events');
        // We don't clear the object state in memory, just the persistence
    } else {
        saveFileSystem();
        saveEvents();
    }

    // Handle API Preference
    fetchWeather(); // Re-trigger weather with new privacy settings
};

const lockSystem = () => {
    systemState.isLocked = true;
    const lockScreen = document.createElement('div');
    lockScreen.id = 'lock-screen';
    lockScreen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
        z-index: 30000; display: flex; flex-direction: column;
        justify-content: center; align-items: center; color: #fff;
        font-family: var(--font-mono);
    `;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    lockScreen.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 80px; font-weight: 300; margin-bottom: 10px;">${timeStr}</div>
            <div style="font-size: 20px; color: #888;">${dateStr}</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 300px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div style="width: 80px; height: 80px; background: var(--accent-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
                    <i class="fas fa-user"></i>
                </div>
                <div style="font-weight: bold; font-size: 18px;">${CONFIG.user}</div>
                <input type="password" id="lock-pass" placeholder="Password: 1234" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #444; padding: 10px; border-radius: 4px; color: #fff; text-align: center; outline: none;">
                <button id="unlock-btn" style="width: 100%; background: var(--accent-blue); border: none; padding: 10px; border-radius: 4px; color: #fff; cursor: pointer; font-weight: bold;">Unlock</button>
                <div id="lock-err" style="color: #ff5f56; font-size: 12px; height: 15px;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(lockScreen);

    const input = lockScreen.querySelector('#lock-pass');
    const btn = lockScreen.querySelector('#unlock-btn');
    const err = lockScreen.querySelector('#lock-err');

    const attemptUnlock = () => {
        if (input.value === "1234") {
            systemState.isLocked = false;
            lockScreen.style.opacity = '0';
            lockScreen.style.transition = 'opacity 0.3s';
            setTimeout(() => lockScreen.remove(), 300);
            resetInactivityTimer();
        } else {
            err.textContent = "Incorrect password";
            input.value = "";
            input.focus();
        }
    };

    btn.onclick = attemptUnlock;
    input.onkeydown = (e) => { if (e.key === 'Enter') attemptUnlock(); };
    input.focus();
};

let inactivityTimer;
const resetInactivityTimer = () => {
    if (systemState.isLocked) return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(lockSystem, 300000); // 5 minutes
};

window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('keydown', resetInactivityTimer);
resetInactivityTimer();

// --- Recycle Bin System ---
const updateRecycleBinIcon = () => {
    const icon = document.querySelector('.desktop-icon[data-app="recycle"] i');
    if (icon) {
        icon.className = systemState.recycleBin.length > 0 ? 'fas fa-trash-restore' : 'fas fa-trash';
        icon.style.color = systemState.recycleBin.length > 0 ? 'var(--accent-blue)' : '#888';
    }
};

const moveToRecycleBin = (path) => {
    const node = getFSNode(path);
    if (!node) return { error: "File not found" };
    
    if (path === '/' || path === '/home' || path === '/home/prasad') {
        return { error: "Permission denied: Cannot delete system directories" };
    }

    const name = path.split('/').pop();
    systemState.recycleBin.push({
        name: name,
        content: node.content,
        originalPath: path,
        type: node.type,
        deletedAt: Date.now()
    });

    // Actually remove from VFS
    const res = deleteFSNode(path);
    if (res.success) {
        localStorage.setItem('prasad_os_recycle', JSON.stringify(systemState.recycleBin));
        updateRecycleBinIcon();
        showNotification(`${name} moved to Recycle Bin`);
    }
    return res;
};

const restoreFile = (index) => {
    const file = systemState.recycleBin[index];
    const res = createFSNode(file.originalPath, file.type, file.content);
    if (res.success || res.error === 'Already exists') {
        systemState.recycleBin.splice(index, 1);
        localStorage.setItem('prasad_os_recycle', JSON.stringify(systemState.recycleBin));
        updateRecycleBinIcon();
        showNotification(`Restored ${file.name}`);
        return { success: true };
    }
    return res;
};

const deletePermanently = (index) => {
    const file = systemState.recycleBin[index];
    systemState.recycleBin.splice(index, 1);
    localStorage.setItem('prasad_os_recycle', JSON.stringify(systemState.recycleBin));
    updateRecycleBinIcon();
    showNotification(`Permanently deleted ${file.name}`);
};

const emptyRecycleBin = () => {
    if (confirm("Are you sure you want to empty the Recycle Bin?")) {
        systemState.recycleBin = [];
        localStorage.setItem('prasad_os_recycle', JSON.stringify(systemState.recycleBin));
        updateRecycleBinIcon();
        showNotification("Recycle Bin emptied");
    }
};

const renderRecycleBin = (body) => {
    const refresh = () => {
        body.innerHTML = `
            <div style="padding: 15px; height: 100%; background: #0a0a0a; color: #eee; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--accent-blue);"><i class="fas fa-trash" style="margin-right: 10px;"></i>Recycle Bin</h3>
                    <button id="empty-bin" style="background: rgba(255,95,86,0.1); border: 1px solid rgba(255,95,86,0.2); color: #ff5f56; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">Empty Bin</button>
                </div>
                <div style="flex: 1; overflow-y: auto;">
                    ${systemState.recycleBin.length === 0 ? '<div style="text-align: center; color: #555; margin-top: 50px;">Recycle Bin is empty</div>' : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <tr style="text-align: left; color: #666; border-bottom: 1px solid #222;">
                                <th style="padding: 8px;">Name</th>
                                <th style="padding: 8px;">Original Location</th>
                                <th style="padding: 8px; text-align: center;">Actions</th>
                            </tr>
                            ${systemState.recycleBin.map((f, i) => `
                                <tr style="border-bottom: 1px solid #111;">
                                    <td style="padding: 8px;"><i class="fas ${f.type === 'dir' ? 'fa-folder' : 'fa-file-alt'}" style="margin-right: 8px; color: #888;"></i>${f.name}</td>
                                    <td style="padding: 8px; color: #666;">${f.originalPath}</td>
                                    <td style="padding: 8px; text-align: center; display: flex; gap: 5px; justify-content: center;">
                                        <button class="restore-btn" data-index="${i}" style="background: rgba(0,168,255,0.1); border: 1px solid rgba(0,168,255,0.2); color: var(--accent-blue); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Restore</button>
                                        <button class="perm-del-btn" data-index="${i}" style="background: rgba(255,95,86,0.1); border: 1px solid rgba(255,95,86,0.2); color: #ff5f56; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    `}
                </div>
            </div>
        `;

        body.querySelector('#empty-bin')?.addEventListener('click', () => { emptyRecycleBin(); refresh(); });
        body.querySelectorAll('.restore-btn').forEach(btn => btn.onclick = () => { restoreFile(btn.dataset.index); refresh(); });
        body.querySelectorAll('.perm-del-btn').forEach(btn => btn.onclick = () => { deletePermanently(btn.dataset.index); refresh(); });
    };
    refresh();
};

const showNotification = (message) => {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    container.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

const renderPrivacySettings = (body) => {
    body.innerHTML = `
        <div style="padding: 20px; color: white; font-family: var(--font-mono);">
            <h3 style="color: var(--accent-green); margin-bottom: 20px;"><i class="fas fa-user-shield"></i> Privacy Settings</h3>
            <div class="permission-options">
                <div class="permission-item">
                    <div class="permission-info">
                        <span class="permission-title">Essential</span>
                        <span class="permission-desc">Required for system boot.</span>
                    </div>
                    <label class="switch"><input type="checkbox" checked disabled><span class="slider round"></span></label>
                </div>
                <div class="permission-item">
                    <div class="permission-info">
                        <span class="permission-title">Storage</span>
                        <span class="permission-desc">Enable file system persistence.</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="settings-storage" ${systemState.privacy?.storage ? 'checked' : ''}><span class="slider round"></span></label>
                </div>
                <div class="permission-item">
                    <div class="permission-info">
                        <span class="permission-title">API Access</span>
                        <span class="permission-desc">Enable weather data requests.</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="settings-api" ${systemState.privacy?.api ? 'checked' : ''}><span class="slider round"></span></label>
                </div>
                <div class="permission-item">
                    <div class="permission-info">
                        <span class="permission-title">Analytics</span>
                        <span class="permission-desc">Allow usage data collection.</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="settings-analytics" ${systemState.privacy?.analytics ? 'checked' : ''}><span class="slider round"></span></label>
                </div>
            </div>
            <button id="save-settings" class="modal-btn primary" style="margin-top: 20px; width: 100%;">Apply Changes</button>
        </div>
    `;

    body.querySelector('#save-settings').onclick = () => {
        savePreferences({
            essential: true,
            storage: body.querySelector('#settings-storage').checked,
            api: body.querySelector('#settings-api').checked,
            analytics: body.querySelector('#settings-analytics').checked
        });
    };
};

const startHackingAnimation = () => {
    const overlay = document.createElement('div');
    overlay.className = 'hacking-overlay';
    
    overlay.innerHTML = `
        <div id="hack-code-container" style="width: 100%; height: 100%; padding: 20px; overflow: hidden; font-family: 'Fira Code', monospace; color: #0f0; font-size: 14px; line-height: 1.4; opacity: 0.8;"></div>
        <div id="hack-status-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 10; background: rgba(0,0,0,0.8); padding: 40px; border: 2px solid #0f0; display: none; box-shadow: 0 0 50px #0f0;">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px; text-shadow: 0 0 20px #0f0;">SYSTEM HACKED</div>
            <div class="hack-progress-container" style="width: 300px; height: 15px; background: #111; border: 1px solid #0f0; margin: 0 auto 10px; border-radius: 8px; overflow: hidden;">
                <div id="hack-progress-bar" style="width: 0%; height: 100%; background: #0f0; box-shadow: 0 0 15px #0f0;"></div>
            </div>
            <div id="hack-percentage" style="font-size: 24px; font-weight: bold;">0%</div>
            <div style="margin-top: 20px; font-size: 14px; color: #888;">Accessing sensitive data...</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const codeContainer = overlay.querySelector('#hack-code-container');
    const statusOverlay = overlay.querySelector('#hack-status-overlay');
    const progressBar = overlay.querySelector('#hack-progress-bar');
    const percentageText = overlay.querySelector('#hack-percentage');

    const info = getSystemInfo();
    const systemDetectionLines = [
        `[!] INITIALIZING SYSTEM SCAN...`,
        `[*] TARGET IP DETECTED: ${info.ip}`,
        `[*] TARGETING ENVIRONMENT: ${info.os}`,
        `[*] BROWSER AGENT: ${info.browser}`,
        `[*] LOCALE DETECTED: ${info.language}`,
        `[*] RESOLUTION: ${info.resolution}`,
        `[*] TIMEZONE: ${info.timezone}`,
        `[+] SYSTEM STATUS: ${info.status}`,
        `[!] EXPLOITING VULNERABILITIES...`,
        `----------------------------------------`
    ];

    const pythonCode = [
        "import socket",
        "import sys",
        "from datetime import datetime",
        "target = '192.168.1.1'",
        "def port_scan(target):",
        "    try:",
        "        for port in range(1, 1025):",
        "            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)",
        "            socket.setdefaulttimeout(1)",
        "            result = s.connect_ex((target, port))",
        "            if result == 0:",
        "                print(f'Port {port} is open')",
        "            s.close()",
        "    except KeyboardInterrupt:",
        "        sys.exit()",
        "payload = b'\\x41' * 512 + b'\\x42' * 8 + b'\\x43' * 32",
        "print('[+] Sending buffer overflow payload...')",
        "shellcode = '\\x31\\xc0\\x50\\x68\\x2f\\x2f\\x73\\x68\\x68\\x2f\\x62\\x69\\x6e\\x89\\xe3\\x50\\x53\\x89\\xe1\\xb0\\x0b\\xcd\\x80'",
        "print('[!] Exploiting vulnerability CVE-2023-XXXX...')",
        "print('[*] Escalating privileges to root...')",
        "print('[SUCCESS] Root access obtained!')",
        "print('[*] System scan completed')"
    ];

    let lineCount = 0;
    const totalLines = 150; // Total lines for the animation
    const scrollCode = () => {
        if (lineCount < totalLines) { 
            const line = document.createElement('div');
            
            // Show system detection lines sequentially first
            if (lineCount < systemDetectionLines.length) {
                line.textContent = systemDetectionLines[lineCount];
                line.style.color = '#fff'; // Highlight system info
                line.style.fontWeight = 'bold';
            } else {
                // Then show random python code
                line.textContent = pythonCode[Math.floor(Math.random() * pythonCode.length)];
            }
            
            codeContainer.appendChild(line);
            codeContainer.scrollTop = codeContainer.scrollHeight;
            lineCount++;
            
            // Show status overlay (SYSTEM HACKED) after detection lines
            if (lineCount === systemDetectionLines.length + 5) {
                statusOverlay.style.display = 'block';
            }
            
            // Update progress bar based on total animation progress
            if (statusOverlay.style.display === 'block') {
                const startLine = systemDetectionLines.length + 5;
                const progress = Math.min(100, ((lineCount - startLine) / (totalLines - startLine)) * 100);
                progressBar.style.width = `${progress}%`;
                percentageText.textContent = `${Math.round(progress)}%`;
            }

            setTimeout(scrollCode, 40);
        } else {
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    showWarningMessage();
                    displaySystemInfoInTerminal();
                }, 500);
            }, 1500);
        }
    };

    scrollCode();
};

const showWarningMessage = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '20000';
    modal.innerHTML = `
        <div class="modal-content" style="background: #0a0a0a; border: 1px solid #ffcc00; max-width: 400px; text-align: center; padding: 30px; border-radius: 8px; box-shadow: 0 0 30px rgba(255, 204, 0, 0.2); animation: modalFadeIn 0.5s ease-out;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ffcc00; margin-bottom: 20px;"></i>
            <h2 style="color: #fff; margin-bottom: 15px; font-size: 20px;">System Scan Complete</h2>
            <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                This was a simulated scan. No real hacking or data collection beyond basic system info has occurred.
            </p>
            <button id="close-warning" class="modal-btn primary" style="background: #ffcc00; color: #000; font-weight: bold; border: none; padding: 10px 30px; border-radius: 4px; cursor: pointer; transition: all 0.3s;">OK / Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-warning');
    closeBtn.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.onmouseenter = () => { closeBtn.style.boxShadow = '0 0 15px #ffcc00'; };
    closeBtn.onmouseleave = () => { closeBtn.style.boxShadow = 'none'; };
};

const displaySystemInfoInTerminal = () => {
    const activeTerminal = systemState.openWindows.find(w => w.appId === 'terminal');
    if (!activeTerminal) return;

    const output = activeTerminal.element.querySelector('.terminal-output');
    if (!output) return;

    const info = getSystemInfo();
    const hasConsent = systemState.privacy && systemState.privacy.analytics;

    const lines = [
        "",
        "> scan complete...",
        "> collecting system info...",
        "",
        `> OS: ${hasConsent ? info.os : 'Protected'}`,
        `> Browser: ${hasConsent ? info.browser : 'Hidden'}`,
        `> Language: ${hasConsent ? info.language : 'Unknown'}`,
        `> Resolution: ${hasConsent ? info.resolution : 'Unknown'}`,
        `> Timezone: ${hasConsent ? info.timezone : 'Protected'}`,
        "",
        `> status: ${hasConsent ? 'scan successful' : 'Restricted Mode'}`,
        "> returning to normal mode...",
        ""
    ];

    let i = 0;
    const typeLine = () => {
        if (i < lines.length) {
            const line = document.createElement('div');
            line.style.color = lines[i].startsWith('>') ? 'var(--accent-green)' : 'inherit';
            line.textContent = lines[i++];
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            setTimeout(typeLine, 100);
        }
    };
    typeLine();
};

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    systemState.theme = theme;
    showNotification(`Theme set to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
};

// --- Power Management ---
const shutdownSystem = () => {
    const overlay = document.createElement('div');
    overlay.className = 'power-overlay';
    overlay.innerHTML = `
        <div class="power-message">Shutting down...</div>
        <div class="power-spinner"></div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add('visible'), 10);
    
    setTimeout(() => {
        location.reload(); // Returns to initial "System Powered Off" screen with Power On button
    }, 2500);
};

const restartSystem = () => {
    const overlay = document.createElement('div');
    overlay.className = 'power-overlay';
    overlay.innerHTML = `
        <div class="power-message">Restarting...</div>
        <div class="power-spinner"></div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add('visible'), 10);
    setTimeout(() => {
        sessionStorage.setItem('os_restarting', 'true');
        location.reload();
    }, 2500);
};

const sleepSystem = () => {
    systemState.powerState = "sleep";
    const overlay = document.createElement('div');
    overlay.className = 'power-overlay sleep-overlay';
    overlay.innerHTML = `
        <div class="power-message"><i class="fas fa-moon"></i> System Asleep</div>
        <div class="wake-msg">Click anywhere or press any key to wake</div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add('visible'), 10);

    const wake = () => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            systemState.powerState = "on";
            lockSystem(); // Require login after sleep
        }, 500);
        document.removeEventListener('keydown', wake);
        overlay.removeEventListener('click', wake);
    };

    setTimeout(() => {
        document.addEventListener('keydown', wake);
        overlay.addEventListener('click', wake);
    }, 1000);
};

const initDragAndDrop = () => {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.draggable = true;
        icon.addEventListener('dragstart', (e) => e.dataTransfer.setData('text', icon.dataset.app));
    });
    document.querySelector('.desktop').addEventListener('dragover', (e) => e.preventDefault());
    document.querySelector('.desktop').addEventListener('drop', (e) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData('text');
        const icon = document.querySelector(`[data-app="${appId}"]`);
        if (icon) { icon.style.left = e.clientX + 'px'; icon.style.top = e.clientY + 'px'; icon.style.position = 'absolute'; }
    });
};

const initDesktop = () => {
    updateClock();
    setInterval(updateClock, 1000);
    updateNetworkStatus();
    setInterval(updateCpuUsage, 1000);
    fetchIp(); // Pre-fetch user IP
    updateRecycleBinIcon(); // Set initial icon state
    
    // Privacy Logic
    if (!systemState.privacy) {
        setTimeout(showCookieModal, 2000);
    } else {
        applyPreferences();
    }

    // Global Search Functionality
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let query = globalSearch.value.trim().toLowerCase();
                if (!query) return;

                // Resolve alias
                if (commandAliases[query]) {
                    query = commandAliases[query];
                }

                // 1. Check for Terminal Commands (e.g., 'hack', 'lock', 'clear')
                // Find case-insensitive match
                let foundTerminalCmd = null;
                for (const key of Object.keys(terminalCommands)) {
                    if (key.toLowerCase() === query) {
                    foundTerminalCmd = terminalCommands[key];
                    break;
                    }
                }
                if (foundTerminalCmd) {
                    const actionCmds = ['hack', 'lock', 'clear', 'snake', 'recycle', 'weather', 'calendar'];
                    if (actionCmds.includes(query)) {
                        foundTerminalCmd([]);
                        globalSearch.value = '';
                        return;
                    }
                }

                // 2. Search Apps (Fuzzy matching)
                const apps = {
                    'terminal': 'Terminal', 
                    'explorer': 'File Explorer', 
                    'chrome': 'Chrome',
                    'monitor': 'Task Manager', 
                    'about': 'About Me', 
                    'skills': 'Skills',
                    'projects': 'Projects',
                    'licenses': 'Licenses & Certifications',
                    'contact': 'Contact', 
                    'weather': 'Weather',
                    'calendar': 'Calendar', 
                    'privacy': 'Privacy Settings',
                    'snake': 'Snake Game',
                    'recycle': 'Recycle Bin'
                };

                // Exact match first
                if (apps[query]) {
                    openApp(query, apps[query]);
                    globalSearch.value = '';
                    return;
                }

                // Fuzzy match
                for (const [id, name] of Object.entries(apps)) {
                    if (name.toLowerCase().includes(query) || id.includes(query)) {
                        openApp(id, name);
                        globalSearch.value = '';
                        return;
                    }
                }

                // 3. Search Files (Recursive search)
                const searchFiles = (node, currentPath) => {
                    for (const name in node.children) {
                        const child = node.children[name];
                        const fullPath = currentPath + (currentPath === '/' ? '' : '/') + name;
                        
                        if (name.toLowerCase().includes(query)) {
                            if (child.type === 'file') {
                                createWindow('notepad-' + name, name, renderNotepad, { fileName: name, content: child.content });
                            } else {
                                createWindow('explorer-' + name, name, renderExplorer, { path: fullPath });
                            }
                            return true;
                        }
                        
                        if (child.type === 'dir') {
                            if (searchFiles(child, fullPath)) return true;
                        }
                    }
                    return false;
                };

                if (searchFiles(fileSystem['/'], '/')) {
                    globalSearch.value = '';
                    return;
                }

                // 4. Fallback to Browser Search (using iframe-friendly Google)
                openApp('chrome', 'Chrome', { url: `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1` });
                globalSearch.value = '';
            }
        });
    }

    const openApp = (appId, title, params = {}) => {
        const apps = {
            'terminal': renderTerminal, 
            'explorer': renderExplorer, 
            'chrome': renderBrowser,
            'monitor': renderTaskManager, 
            'about': renderAboutApp,
            'skills': renderSkillsApp, 
            'projects': renderProjectsApp,
            'licenses': renderLicensesApp,
            'contact': renderContactApp, 
            'weather': renderWeatherApp, 
            'calendar': renderCalendarApp, 
            'privacy': renderPrivacySettings,
            'snake': renderSnakeApp,
            'recycle': renderRecycleBin,
            'certificate': renderCertificateApp,
            'resume': renderResume
        };
        if (apps[appId]) createWindow(appId, title, apps[appId], params);
    };

    document.querySelectorAll('[data-app]').forEach(el => {
        el.ondblclick = () => {
            const appId = el.dataset.app;
            const titles = {
                'terminal': 'Terminal', 
                'explorer': 'File Explorer', 
                'chrome': 'Chrome',
                'monitor': 'Task Manager', 
                'about': 'About Me', 
                'skills': 'Skills',
                'projects': 'Projects',
                'licenses': 'Licenses & Certifications',
                'contact': 'Contact', 
                'weather': 'Weather',
                'calendar': 'Calendar', 
                'privacy': 'Privacy Settings',
                'snake': 'Snake Game',
                'recycle': 'Recycle Bin',
                'resume': 'Resume - Prasad Madole'
            };
            openApp(appId, titles[appId] || appId);
        };
    });

    document.querySelectorAll('[data-path]').forEach(el => {
        el.onclick = () => openApp('explorer', 'File Explorer', { path: el.dataset.path });
    });

    document.getElementById('clock').onclick = () => openApp('calendar', 'Calendar');
    initDragAndDrop();

    // Power Controls Integration
    document.querySelectorAll('.power-option').forEach(opt => {
        opt.onclick = () => {
            const mode = opt.dataset.power;
            if (mode === 'shutdown') shutdownSystem();
            else if (mode === 'restart') restartSystem();
            else if (mode === 'sleep') sleepSystem();
        };
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.top = `${e.clientY}px`; menu.style.left = `${e.clientX}px`;
        const items = [
            { label: 'New Terminal', icon: 'fa-terminal', action: () => openApp('terminal', 'Terminal') },
            { label: 'New Explorer', icon: 'fa-folder-open', action: () => openApp('explorer', 'File Explorer') },
            { label: 'Task Manager', icon: 'fa-microchip', action: () => openApp('monitor', 'Task Manager') },
            { label: 'Lock System', icon: 'fa-lock', action: () => lockSystem() },
            { separator: true },
            { label: 'Privacy Settings', icon: 'fa-user-shield', action: () => openApp('privacy', 'Privacy Settings') },
            { separator: true },
            { label: 'Theme: Hacker', icon: 'fa-mask', action: () => applyTheme('hacker') },
            { label: 'Theme: Kali', icon: 'fa-dragon', action: () => applyTheme('kali') },
            { label: 'Theme: Light', icon: 'fa-sun', action: () => applyTheme('light') },
            { separator: true },
            { label: 'Refresh', icon: 'fa-sync-alt', action: () => location.reload() }
        ];

        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'context-menu-separator';
                menu.appendChild(sep);
                return;
            }
            const div = document.createElement('div');
            div.className = 'context-menu-item';
            div.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
            div.onclick = () => { item.action(); menu.remove(); };
            menu.appendChild(div);
        });
        document.body.appendChild(menu);
    });

    document.addEventListener('click', () => {
        const menu = document.querySelector('.context-menu');
        if (menu) menu.remove();
    });
};

const startBoot = () => {
    const logContainer = document.getElementById('boot-log');
    const loaderBar = document.querySelector('.loader-bar');
    const bootLogo = document.querySelector('.boot-logo');
    const audio = new Audio('https://www.soundjay.com/buttons/beep-07.wav');
    audio.volume = 0.2;
    
    const logs = [
        "[  OK  ] Finished Load Kernel Modules.",
        "[  OK  ] Started Remount Root and Kernel File Systems.",
        "[  OK  ] Started Coldplug All udev Devices.",
        "[  OK  ] Reached target Local File Systems.",
        "[  OK  ] Started Network Service.",
        "[  OK  ] Reached target Network.",
        "Initializing system components...",
        "Loading Kali Linux Desktop...",
        "Mounting /dev/sda1 on /home...",
        "Starting system message bus...",
        "Setting up TTY...",
        "Welcome to Kali GNU/Linux Rolling"
    ];

    let logIndex = 0;
    const addLog = () => {
        if (logIndex < logs.length) {
            const p = document.createElement('p');
            p.textContent = logs[logIndex++];
            logContainer.appendChild(p);
            logContainer.scrollTop = logContainer.scrollHeight;
            
            // Update loader bar
            const progress = (logIndex / logs.length) * 100;
            if (loaderBar) loaderBar.style.width = `${progress}%`;
            
            setTimeout(addLog, CONFIG.bootLogSpeed + Math.random() * 100);
        } else {
            if (bootLogo) bootLogo.classList.add('show');
            audio.play().catch(() => {});
            
            setTimeout(() => {
                document.getElementById('boot-screen').classList.add('hidden');
                document.getElementById('desktop').classList.remove('hidden');
                systemState.booted = true;
                initDesktop();
                lockSystem(); // Require password after boot
            }, 1200);
        }
    };
    addLog();
};

const showPowerOnScreen = () => {
    const overlay = document.createElement('div');
    overlay.className = 'power-overlay visible shutdown-screen';
    overlay.innerHTML = `
        <div class="power-message" style="color: #444;">System Powered Off</div>
        <button class="power-btn"><i class="fas fa-power-off"></i> Power On</button>
    `;
    document.body.appendChild(overlay);
    
    overlay.querySelector('.power-btn').onclick = () => {
        overlay.innerHTML = `
            <div class="power-message">Starting System...</div>
            <div class="power-spinner"></div>
        `;
        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                startBoot();
            }, 500);
        }, 1500);
    };
};

window.onload = () => {
    if (sessionStorage.getItem('os_restarting')) {
        sessionStorage.removeItem('os_restarting');
        startBoot();
    } else {
        showPowerOnScreen();
    }
};

// ==========================================
// BRIGHTNESS CONTROL
// ==========================================
// - DOM Selection
// - Event Listeners
// - LocalStorage Save/Load
// - Real-time Filter Update
// - Popup Toggle
// ==========================================

// --- DOM Selection ---
const brightnessToggle = document.getElementById('brightness-toggle');
const brightnessPopup = document.getElementById('brightness-popup');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessPercentage = document.getElementById('brightness-percentage');
const desktop = document.getElementById('desktop');

// --- Initialize Brightness Control ---
const initBrightnessControl = () => {
    // --- Load saved brightness from localStorage ---
    const savedBrightness = localStorage.getItem('prasad-os-brightness');
    if (savedBrightness) {
        const brightnessInt = parseInt(savedBrightness);
        applyBrightness(brightnessInt);
        brightnessSlider.value = brightnessInt;
    } else {
        // Default to 100% if no saved value
        applyBrightness(100);
        brightnessSlider.value = 100;
    }

    // --- Brightness Icon Click Listener ---
    brightnessToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from closing immediately
        toggleBrightnessPopup();
    });

    // --- Click outside popup to close ---
    document.addEventListener('click', (e) => {
        if (!brightnessPopup.contains(e.target) && !brightnessToggle.contains(e.target)) {
            closeBrightnessPopup();
        }
    });

    // --- Slider Input Listener (Real-time Update) ---
    brightnessSlider.addEventListener('input', () => {
        const currentValue = parseInt(brightnessSlider.value);
        applyBrightness(currentValue);
    });

    // --- Slider Change Listener (Save to localStorage) ---
    brightnessSlider.addEventListener('change', () => {
        const finalValue = parseInt(brightnessSlider.value);
        saveBrightness(finalValue);
    });
};

// --- Apply Brightness to Desktop ---
const applyBrightness = (value) => {
    // Apply brightness filter to desktop container
    desktop.style.filter = `brightness(${value}%)`;
    // Update percentage display with sun emoji
    brightnessPercentage.textContent = `🔆 ${value}%`;
};

// --- Save Brightness to localStorage ---
const saveBrightness = (value) => {
    localStorage.setItem('prasad-os-brightness', value.toString());
};

// --- Toggle Brightness Popup ---
const toggleBrightnessPopup = () => {
    brightnessPopup.classList.toggle('hidden');
};

// --- Close Brightness Popup ---
const closeBrightnessPopup = () => {
    brightnessPopup.classList.add('hidden');
};

// --- Initialize Brightness Control when page loads ---
// Check if DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrightnessControl);
} else {
    // If DOM is already loaded, initialize immediately
    initBrightnessControl();
}
