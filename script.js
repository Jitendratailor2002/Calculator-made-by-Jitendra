/* --- STATE MANAGEMENT --- */
let currentInput = '0';
let previousInput = '';
let operation = null;
let resetInputOnNextNumber = false;

/* --- DOM ELEMENTS --- */
const wrapper = document.getElementById('calcWrapper');
const calc = document.getElementById('calculator');
const dragHeader = document.getElementById('dragHeader');
const screen = document.getElementById('screen');
const mainText = document.getElementById('mainText');
const historyText = document.getElementById('historyText');
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

/* --- CANVAS RESIZE --- */
function resizeCanvas() {
    canvas.width = calc.offsetWidth;
    canvas.height = calc.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* --- DRAGGABLE CALCULATOR SYSTEM --- */
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentPosX = 0, currentPosY = 0;

function startDrag(e) {
    isDragging = true;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    dragStartX = clientX - currentPosX;
    dragStartY = clientY - currentPosY;
}

function onDrag(e) {
    if (!isDragging) return;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    currentPosX = clientX - dragStartX;
    currentPosY = clientY - dragStartY;
    updateTransform();
}

function endDrag() {
    isDragging = false;
}

dragHeader.addEventListener('mousedown', startDrag);
screen.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', onDrag);
document.addEventListener('mouseup', endDrag);

dragHeader.addEventListener('touchstart', startDrag);
screen.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', onDrag);
document.addEventListener('touchend', endDrag);

/* --- 3D PARALLAX EFFECT --- */
let rotateX = 0, rotateY = 0;
document.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    rotateX = ((clientY / innerHeight) - 0.5) * -25;
    rotateY = ((clientX / innerWidth) - 0.5) * 25;
    updateTransform();
});

function updateTransform() {
    wrapper.style.transform = `translate3d(${currentPosX}px, ${currentPosY}px, 0px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

/* --- PARTICLE SYSTEM ENGINE --- */
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 7;
        this.vy = (Math.random() - 0.5) * 7;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
}

function createBurst(x, y, color) {
    const count = 18;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
    requestAnimationFrame(renderParticles);
}
renderParticles();

/* --- CALCULATOR LOGIC --- */
function updateDisplay() {
    mainText.innerText = currentInput;
    if (operation) {
        historyText.innerText = `${previousInput} ${getOpSymbol(operation)}`;
    } else {
        historyText.innerText = '';
    }
}

function getOpSymbol(op) {
    switch(op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
        default: return '';
    }
}

function handleNumber(num) {
    if (currentInput === '0' || resetInputOnNextNumber) {
        currentInput = num;
        resetInputOnNextNumber = false;
    } else {
        if (currentInput.length < 12) {
            currentInput += num;
        }
    }
    updateDisplay();
}

function handleDecimal() {
    if (resetInputOnNextNumber) {
        currentInput = '0.';
        resetInputOnNextNumber = false;
    } else if (!currentInput.includes('.')) {
        currentInput += '.';
    }
    updateDisplay();
}

function handleOperator(op) {
    if (operation !== null && !resetInputOnNextNumber) {
        calculateResult();
    }
    previousInput = currentInput;
    operation = op;
    resetInputOnNextNumber = true;
    updateDisplay();
}

function calculateResult() {
    if (!operation || resetInputOnNextNumber) return;

    let result = 0;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': 
            result = current === 0 ? 'Error' : prev / current; 
            break;
    }

    if (typeof result === 'number') {
        result = Math.round(result * 100000000) / 100000000;
    }

    currentInput = result.toString();
    operation = null;
    resetInputOnNextNumber = true;
    
    screen.classList.remove('flash');
    void screen.offsetWidth;
    screen.classList.add('flash');

    updateDisplay();
}

function clearAll() {
    currentInput = '0';
    previousInput = '';
    operation = null;
    resetInputOnNextNumber = false;
    updateDisplay();
}

function deleteLast() {
    if (resetInputOnNextNumber) return;
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
        currentInput = '0';
    } else {
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

function handlePercent() {
    currentInput = (parseFloat(currentInput) / 100).toString();
    updateDisplay();
}

/* --- BUTTON CLICK HANDLERS --- */
const buttons = document.querySelectorAll('.btn');

buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const rect = calc.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        let burstColor = '#ffffff';
        if (btn.classList.contains('btn-operator')) burstColor = '#dddddd';
        else if (btn.classList.contains('btn-func')) burstColor = '#aaaaaa';

        createBurst(clickX, clickY, burstColor);

        executeButtonAction(btn);
    });
});

function executeButtonAction(btn) {
    const value = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');
    const opValue = btn.getAttribute('data-op');

    if (value !== null) {
        if (value === '.') handleDecimal();
        else handleNumber(value);
    } else if (action) {
        switch (action) {
            case 'clear': clearAll(); break;
            case 'delete': deleteLast(); break;
            case 'percent': handlePercent(); break;
            case 'operator': handleOperator(opValue); break;
            case 'calculate': calculateResult(); break;
        }
    }
}

/* --- KEYBOARD SUPPORT --- */
window.addEventListener('keydown', (e) => {
    let key = e.key;
    let targetBtn = null;

    if (key >= '0' && key <= '9') {
        targetBtn = document.querySelector(`.btn[data-value="${key}"]`);
    } else if (key === '.') {
        targetBtn = document.querySelector(`.btn[data-value="."]`);
    } else if (key === '+') {
        targetBtn = document.querySelector(`.btn[data-op="+"]`);
    } else if (key === '-') {
        targetBtn = document.querySelector(`.btn[data-op="-"]`);
    } else if (key === '*') {
        targetBtn = document.querySelector(`.btn[data-op="*"]`);
    } else if (key === '/') {
        e.preventDefault();
        targetBtn = document.querySelector(`.btn[data-op="/"]`);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        targetBtn = document.querySelector(`.btn-equal`);
    } else if (key === 'Backspace') {
        targetBtn = document.querySelector(`.btn[data-action="delete"]`);
    } else if (key === 'Escape') {
        targetBtn = document.querySelector(`.btn[data-action="clear"]`);
    } else if (key === '%') {
        targetBtn = document.querySelector(`.btn[data-action="percent"]`);
    }

    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.click();
        setTimeout(() => targetBtn.classList.remove('active'), 120);
    }
});