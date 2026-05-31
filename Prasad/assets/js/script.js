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
    const topPanelHeight = 30;
    const topPadding = 20;
    const minTop = topPanelHeight + topPadding;
    const initialTop = minTop + systemState.openWindows.length * 30;
    const initialLeft = 60 + systemState.openWindows.length * 30;
    win.style.top = initialTop + 'px';
    win.style.left = initialLeft + 'px';
    win.style.zIndex = ++systemState.zIndexCounter;
    
    win.querySelector('.title-text').textContent = title;
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
            'contact': 'fa-envelope'
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
const terminalCommands = {
    help: () => "Available: ls, cd, pwd, cat, touch, mkdir, rm, clear, ps, kill, theme, hack, weather, calendar",
    whoami: () => "prasad - Web Developer | Cybersecurity Enthusiast",
    date: () => new Date().toString(),
    pwd: () => systemState.currentDirectory,
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
        if (!args[0]) return "kill: missing PID";
        return killProcess(args[0]) ? `Terminated process ${args[0]}` : "Process not found";
    },
    lock: () => { lockSystem(); return "System locked."; },
    theme: (args) => {
        if (args[0] === 'change') {
            const themes = ['kali', 'hacker', 'light'];
            applyTheme(themes[(themes.indexOf(systemState.theme) + 1) % themes.length]);
            return "Theme updated";
        }
        return "Usage: theme change";
    },
    hack: (args) => { 
        const info = getSystemInfo();
        startHackingAnimation(); 
        return `[!] INITIALIZING SYSTEM BREACH...\n[*] TARGET IP: ${info.ip}\n[*] OS: ${info.os}\n[*] BROWSER: ${info.browser}\n[*] RESOLUTION: ${info.resolution}\n[+] STATUS: BREACHING...`; 
    },
    weather: () => { createWindow('weather', 'Weather', renderWeatherApp); return "Opening weather..."; },
    calendar: () => { createWindow('calendar', 'Calendar', renderCalendarApp); return "Opening calendar..."; },
    snake: (args) => { 
        const difficulty = args[0] ? args[0].toLowerCase() : null;
        if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
            return "Usage: snake [easy|medium|hard]";
        }
        openApp('snake', 'Snake Game', { difficulty }); 
        return difficulty ? `Starting Snake Game (${difficulty})...` : "Starting Snake Game..."; 
    },
    recycle: () => { openApp('recycle', 'Recycle Bin'); return "Opening Recycle Bin..."; },
    ls: (args) => {
        const path = args[0] ? resolvePath(args[0]) : systemState.currentDirectory;
        const node = getFSNode(path);
        return node && node.type === 'dir' ? Object.keys(node.children).sort().join('  ') : "Not a directory";
    },
    cd: (args) => {
        if (!args[0]) return;
        const path = resolvePath(args[0]);
        if (getFSNode(path)?.type === 'dir') { systemState.currentDirectory = path; return ""; }
        return "Directory not found";
    },
    cat: (args) => {
        const path = resolvePath(args[0] || "");
        const node = getFSNode(path);
        return node && node.type === 'file' ? node.content : "File not found";
    },
    touch: (args) => createFSNode(resolvePath(args[0] || ""), 'file').error || "",
    mkdir: (args) => createFSNode(resolvePath(args[0] || ""), 'dir').error || "",
    rm: (args) => deleteFSNode(resolvePath(args[0] || "")).error || "",
    clear: (args, body) => { body.querySelector('.terminal-output').innerHTML = ''; return ""; },
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
        const cmds = Object.keys(terminalCommands).filter(c => c.startsWith(val));
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

            const [cmd, ...args] = val.split(' ');
            output.innerHTML += `<div><span style="color: var(--accent-blue); font-weight: bold;">${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$</span> ${val}</div>`;
            
            if (cmd && terminalCommands[cmd]) {
                const result = terminalCommands[cmd](args, body, win);
                if (result) output.innerHTML += `<div>${result.replace(/\n/g, '<br>')}</div>`;
                // Update prompt immediately (for cd)
                promptSpan.textContent = `${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$`;
            } else if (cmd) {
                output.innerHTML += `<div>${cmd}: command not found</div>`;
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
            const cmds = Object.keys(terminalCommands).filter(c => c.startsWith(val));
            if (cmds.length === 1) {
                input.value = cmds[0];
                suggestionsBox.style.display = 'none';
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
    // Set a premium window size for the contact page
    win.style.width = '1000px';
    win.style.height = '700px';
    
    body.innerHTML = `
        <iframe src="apps/contact-us.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>
    `;
};

const renderAboutApp = (body, win) => {
    win.style.width = '900px';
    win.style.height = '650px';
    body.innerHTML = `<iframe src="apps/about-me.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderSkillsApp = (body, win) => {
    win.style.width = '900px';
    win.style.height = '650px';
    body.innerHTML = `<iframe src="apps/skills.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderProjectsApp = (body, win) => {
    win.style.width = '1000px';
    win.style.height = '700px';
    body.innerHTML = `<iframe src="apps/projects.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderLicensesApp = (body, win) => {
    win.style.width = '1000px';
    win.style.height = '700px';
    body.innerHTML = `<iframe src="apps/licenses.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
};

const renderCertificateApp = (body, win, params) => {
    win.style.width = '800px';
    win.style.height = '900px';
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

const renderSnakeApp = (body, win) => {
    win.style.width = '600px';
    win.style.height = '750px';
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
                const query = globalSearch.value.trim().toLowerCase();
                if (!query) return;

                // 1. Check for Terminal Commands (e.g., 'hack', 'lock', 'clear')
                if (terminalCommands[query]) {
                    const actionCmds = ['hack', 'lock', 'clear', 'snake', 'recycle', 'weather', 'calendar'];
                    if (actionCmds.includes(query)) {
                        terminalCommands[query]([]);
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
            'certificate': renderCertificateApp
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
                'recycle': 'Recycle Bin'
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
