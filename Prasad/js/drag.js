// ======================================
// DRAG & RESIZE SYSTEM
// Fully fixed with boundary clamping
// ======================================

const makeDraggable = (element, handle) => {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const TOP_PANEL_HEIGHT = 30; // From CSS

    const onMouseDown = (e) => {
        isDragging = true;
        element.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // Boundary clamping
        const maxLeft = window.innerWidth - 100;
        const maxTop = window.innerHeight - 100;

        newLeft = Math.max(-50, Math.min(newLeft, maxLeft));
        newTop = Math.max(TOP_PANEL_HEIGHT, Math.min(newTop, maxTop));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
};

const makeResizable = (element) => {
    const resizeRight = element.querySelector('.resize-handle.right');
    const resizeBottom = element.querySelector('.resize-handle.bottom');
    const resizeCorner = element.querySelector('.resize-handle.corner');

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let initialWidth = 0;
    let initialHeight = 0;

    const startResize = (e, type) => {
        isResizing = true;
        element.classList.add('resizing');
        startX = e.clientX;
        startY = e.clientY;
        initialWidth = element.offsetWidth;
        initialHeight = element.offsetHeight;
        document.addEventListener('mousemove', (e) => resize(e, type));
        document.addEventListener('mouseup', stopResize);
    };

    const resize = (e, type) => {
        if (!isResizing) return;
        if (type.includes('right') || type === 'corner') {
            const width = initialWidth + (e.clientX - startX);
            if (width >= 300) {
                element.style.width = `${width}px`;
            }
        }
        if (type.includes('bottom') || type === 'corner') {
            const height = initialHeight + (e.clientY - startY);
            if (height >= 200) {
                element.style.height = `${height}px`;
            }
        }
    };

    const stopResize = () => {
        isResizing = false;
        element.classList.remove('resizing');
    };

    resizeRight.addEventListener('mousedown', (e) => startResize(e, 'right'));
    resizeBottom.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
    resizeCorner.addEventListener('mousedown', (e) => startResize(e, 'corner'));
};
