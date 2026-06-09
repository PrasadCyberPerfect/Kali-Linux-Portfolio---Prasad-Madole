// ======================================
// WINDOW MANAGER
// Handles creation, focus, resizing, and destruction of windows
// ======================================

let windowX = 120;
let windowY = 80;

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
    const initialTopCalc = minTop + systemState.openWindows.length * 30;
    const initialLeftCalc = 60 + systemState.openWindows.length * 30;
    win.style.top = initialTopCalc + 'px';
    win.style.left = initialLeftCalc + 'px';
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

const updateTaskbar = () => {
    const container = document.querySelector('.taskbar-apps');
    if (!container) return;
    container.innerHTML = '';
    systemState.openWindows.forEach(win => {
        const icon = document.createElement('div');
        icon.className = `taskbar-app-icon ${systemState.activeWindow === win.element ? 'active' : ''}`;
        
        const appIdBase = win.appId.split('-')[0];
        let appIcon = null;
        
        const iconMap = {
            'terminal': 'fa-terminal',
            'explorer': 'fa-folder-open',
            'chrome': 'fa-chrome',
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
            const desktopIcon = document.querySelector(`[data-app="${appIdBase}"] i`);
            if (desktopIcon) appIcon = desktopIcon.cloneNode(true);
            else {
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

const registerProcess = (name, windowId) => {
    const pid = Math.floor(Math.random() * 9000) + 1000;
    const cpu = Math.floor(Math.random() * 15) + 1;
    const memory = Math.floor(Math.random() * 200) + 50;
    const process = { pid, name, status: 'running', windowId, cpu, memory };
    systemState.processes.push(process);
    return pid;
};

const killProcess = (pid) => {
    const index = systemState.processes.findIndex(p => p.pid === parseInt(pid));
    if (index !== -1) {
        const process = systemState.processes[index];
        closeWindow(process.windowId);
        return true;
    }
    return false;
};

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
        systemState.processes.forEach(p => {
            p.cpu = Math.max(1, Math.min(100, p.cpu + (Math.random() * 4 - 2)));
            p.memory = Math.max(50, p.memory + (Math.random() * 10 - 5));
        });
        updateTable();
    }, 2000);
};
