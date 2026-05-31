// ======================================
// APPLICATION INITIALIZATION
// Main entry point and state management
// ======================================

// --- System State Management ---
const systemState = {
    currentDirectory: "/home/prasad",
    openWindows: [],
    processes: [],
    recycleBin: (() => { 
        try { 
            return JSON.parse(localStorage.getItem('prasad_os_recycle')) || []; 
        } catch(e) { 
            return []; 
        } 
    })(),
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
    events: (() => { 
        try { 
            return JSON.parse(localStorage.getItem('prasad_os_events')) || {}; 
        } catch(e) { 
            return {}; 
        } 
    })(),
    privacy: (() => { 
        try { 
            return JSON.parse(localStorage.getItem('cookiePreferences')) || null; 
        } catch(e) { 
            return null; 
        } 
    })()
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

// --- File System Helpers ---
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

const updateNetworkStatus = () => {
    const icon = document.querySelector('.panel-icon i.fa-wifi');
    if (icon) {
        icon.style.color = systemState.networkOnline ? 'var(--accent-green)' : '#ff5f56';
        icon.title = systemState.networkOnline ? 'Online' : 'No Internet Connection';
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

const showNotification = (message) => {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
};

// --- Global Event Listeners ---
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'openCertificate') {
        const certData = event.data.data;
        createWindow('certificate-' + Date.now(), certData.title, renderCertificateApp, certData);
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize system
    updateClock();
    setInterval(updateClock, 1000);
    updateNetworkStatus();
    fetchIp();
    fetchWeather();
    setInterval(updateCpuUsage, 1000);
});
