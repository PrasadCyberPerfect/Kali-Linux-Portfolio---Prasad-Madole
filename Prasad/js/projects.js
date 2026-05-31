// ======================================
// APP RENDERERS
// All individual application render functions
// ======================================

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

const renderContactApp = (body, win) => {
    win.style.width = '1000px';
    win.style.height = '700px';
    body.innerHTML = `<iframe src="apps/contact-us.html" style="width: 100%; height: 100%; border: none; background: #0B0B0C;"></iframe>`;
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

            systemState.commandHistory.push(val);
            systemState.historyIndex = systemState.commandHistory.length;

            const [cmd, ...args] = val.split(' ');
            output.innerHTML += `<div><span style="color: var(--accent-blue); font-weight: bold;">${CONFIG.user}@${CONFIG.hostname}:${systemState.currentDirectory}$</span> ${val}</div>`;
            
            if (cmd && terminalCommands[cmd]) {
                const result = terminalCommands[cmd](args, body, win);
                if (result) output.innerHTML += `<div>${result.replace(/\n/g, '<br>')}</div>`;
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
                    <i class="fas fa-external-link-alt" id="br-new-tab" style="cursor: pointer;" title="Open in New Tab"></i>
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
                    <p style="font-size: 14px; color: #666; max-width: 300px; margin-bottom: 20px;">Some sites block being viewed inside other apps for security.</p>
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
};

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
            e.stopPropagation();
            
            const existing = body.querySelector('.explorer-context-menu');
            if (existing) existing.remove();

            const menu = document.createElement('div');
            menu.className = 'explorer-context-menu context-menu';
            menu.style.position = 'absolute';
            
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

            options.forEach(item => {
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
                const fullPath = (path === '/' ? '' : path) + '/' + n;
                const child = getFSNode(fullPath);
                if (child.type === 'dir') refresh(fullPath);
                else createWindow('notepad-' + n, n, renderNotepad, { fileName: n, content: child.content });
            };
            
            item.oncontextmenu = (e) => showMenu(e, { name: item.dataset.name });
        });

        body.querySelector('#ex-back').onclick = () => {
            if (path === '/') return;
            const parentPath = path.split('/').filter(x => x).slice(0, -1).join('/') || '/';
            refresh(parentPath.startsWith('/') ? parentPath : '/' + parentPath);
        };
        body.querySelector('#ex-home').onclick = () => refresh('/home/prasad');
        body.querySelector('#ex-new-file').onclick = createNewFile;
        body.querySelector('#ex-new-folder').onclick = createNewFolder;

        grid.onclick = () => {
            body.querySelectorAll('.explorer-item').forEach(i => i.style.background = 'transparent');
            selectedItem = null;
        };
    };
    refresh(path);
};

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

const terminalCommands = {
    help: () => "Available: ls, cd, pwd, cat, touch, mkdir, rm, clear, ps, kill, theme, hack, weather, calendar, snake",
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
    exit: (args, body, win) => { closeWindow(win.dataset.app); return ""; },
    snake: (args) => { 
        const difficulty = args[0] ? args[0].toLowerCase() : null;
        openApp('snake', 'Snake Game', { difficulty }); 
        return difficulty ? `Starting Snake Game (${difficulty})...` : "Starting Snake Game..."; 
    },
    weather: () => { createWindow('weather', 'Weather', renderWeatherApp); return "Opening weather..."; },
    calendar: () => { createWindow('calendar', 'Calendar', renderCalendarApp); return "Opening calendar..."; },
    recycle: () => { openApp('recycle', 'Recycle Bin'); return "Opening Recycle Bin..."; }
};

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
        'snake': renderSnakeGame,
        'recycle': renderRecycleBin,
        'certificate': renderCertificateApp
    };
    if (apps[appId]) createWindow(appId, title, apps[appId], params);
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

const updateRecycleBinIcon = () => {
    const icon = document.querySelector('.desktop-icon[data-app="recycle"] i');
    if (icon) {
        icon.className = systemState.recycleBin.length > 0 ? 'fas fa-trash-restore' : 'fas fa-trash';
        icon.style.color = systemState.recycleBin.length > 0 ? 'var(--accent-blue)' : '#888';
    }
};

const showNotification = (message) => {
    const container = document.getElementById('notification-container');
    if (!container) return;
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

const savePreferences = (prefs) => {
    systemState.privacy = prefs;
    localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
    applyPreferences();
    showNotification("Privacy preferences updated.");
};

const applyPreferences = () => {
    if (!systemState.privacy) return;

    if (!systemState.privacy.storage) {
        localStorage.removeItem('prasad_os_fs');
        localStorage.removeItem('prasad_os_events');
    } else {
        saveFileSystem();
        saveEvents();
    }

    fetchWeather();
};
