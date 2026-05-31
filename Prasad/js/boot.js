// ======================================
// BOOT & INITIALIZATION
// System boot, lock screen, power management
// ======================================

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
                <input type="password" id="lock-pass" placeholder="Password: 1234" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #444; padding: 10px; border-radius: 4px; color: white; text-align: center; outline: none;">
                <button id="unlock-btn" style="width: 100%; background: var(--accent-blue); border: none; padding: 10px; border-radius: 4px; color: white; cursor: pointer; font-weight: bold;">Unlock</button>
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
        location.reload();
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
            lockSystem();
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
    fetchIp();
    updateRecycleBinIcon();

    // --- Data Migration: Update contact.txt with new info
    const contactFile = getFSNode('/home/prasad/contact.txt');
    if (contactFile && contactFile.type === 'file') {
        const oldContent = "Email: prasad@example.com";
        if (contactFile.content.includes(oldContent)) {
            console.log("Updating contact information...");
            contactFile.content = "Email: prasadmadole36720@gmail.com\nGitHub: github.com/PrasadCyberPerfect\nLinkedIn: linkedin.com/in/prasad-madole-2360823ba";
            saveFileSystem();
            console.log("Contact info updated!");
        }
    }
    
    if (!systemState.privacy) {
        setTimeout(showCookieModal, 2000);
    } else {
        applyPreferences();
    }

    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = globalSearch.value.trim().toLowerCase();
                if (!query) return;

                if (terminalCommands[query]) {
                    const actionCmds = ['hack', 'lock', 'clear', 'snake', 'recycle', 'weather', 'calendar'];
                    if (actionCmds.includes(query)) {
                        terminalCommands[query]([]);
                        globalSearch.value = '';
                        return;
                    }
                }

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

                if (apps[query]) {
                    openApp(query, apps[query]);
                    globalSearch.value = '';
                    return;
                }

                for (const [id, name] of Object.entries(apps)) {
                    if (name.toLowerCase().includes(query) || id.includes(query)) {
                        openApp(id, name);
                        globalSearch.value = '';
                        return;
                    }
                }

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

                openApp('chrome', 'Chrome', { url: `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1` });
                globalSearch.value = '';
            }
        });
    }

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
                lockSystem();
            }, 1200);
        }
    };
    addLog();
};

const showCookieModal = () => {
    const modal = document.getElementById('privacy-modal');
    modal.classList.remove('hidden');

    const storageCheckbox = document.getElementById('pref-storage');
    const apiCheckbox = document.getElementById('pref-api');
    const analyticsCheckbox = document.getElementById('pref-analytics');

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
