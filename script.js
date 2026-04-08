// Game State
let state = {
    score: 0,
    wps: 0, // Whoppers Per Second
    upgrades: [
        {
            id: 'cursor',
            name: 'Extra Click',
            icon: '🖱️',
            baseCost: 15,
            wps: 0.5,
            count: 0,
            desc: 'A spare hand to click for you.'
        },
        {
            id: 'grill',
            name: 'Auto Grill',
            icon: '🔥',
            baseCost: 100,
            wps: 5,
            count: 0,
            desc: 'Grills fresh patties automatically.'
        },
        {
            id: 'ketchup',
            name: 'Ketchup Dispenser',
            icon: '🍅',
            baseCost: 1100,
            wps: 40,
            count: 0,
            desc: 'Optimized sauce distribution.'
        },
        {
            id: 'franchise',
            name: 'New Franchise',
            icon: '🏢',
            baseCost: 12000,
            wps: 300,
            count: 0,
            desc: 'Open another Whopper restaurant locally.'
        },
        {
            id: 'factory',
            name: 'Whopper Factory',
            icon: '🏭',
            baseCost: 130000,
            wps: 2000,
            count: 0,
            desc: 'Mass produce Whoppers on a conveyor.'
        }
    ]
};

// DOM Elements
const scoreElement = document.getElementById('score');
const wpsElement = document.getElementById('wpsDisplay');
const burgerContainer = document.getElementById('burgerContainer');
const mainBurger = document.getElementById('mainBurger');
const upgradesListElement = document.getElementById('upgradesList');

// Initialize Game
function init() {
    loadGame();
    renderStore();
    updateDisplay();
    // Game loop for Whoppers Per Second
    setInterval(gameTick, 100); // run every 100ms
    // Save loop
    setInterval(saveGame, 10000); // save every 10s
}

// Format numbers nicely
function formatNumber(num, exactDecimal = false) {
    if (num < 1000) {
        if (exactDecimal) {
            const val = Math.floor(num * 10) / 10;
            return val % 1 === 0 ? val.toString() : val.toFixed(1);
        }
        return Math.floor(num).toString();
    }
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    return (num / 1000000000).toFixed(2) + 'B';
}

// Update UI
function updateDisplay() {
    scoreElement.innerText = formatNumber(state.score, true);
    wpsElement.innerText = formatNumber(state.wps, true);
    
    // Update store buttons enabled/disabled state
    state.upgrades.forEach(upg => {
        const el = document.getElementById(`upgrade-btn-${upg.id}`);
        if(el) {
            const cost = getUpgradeCost(upg);
            if(state.score >= cost) {
                el.classList.remove('disabled');
            } else {
                el.classList.add('disabled');
            }
        }
    });
}

// Click Logic
burgerContainer.addEventListener('mousedown', (e) => {
    // Increment score (Click power could be an upgrade later, currently 1)
    state.score += 1;
    
    // Play sound if we had one
    // spawn particle
    spawnParticle(e.clientX, e.clientY);
    
    updateDisplay();
});

// Touch support for mobile (prevents double firing if nicely bound, but mousedown acts fine in most. Let's add touchstart specifically for quick taps)
burgerContainer.addEventListener('touchstart', (e) => {
    e.preventDefault(); // prevent mouse event firing too
    for (let i=0; i<e.changedTouches.length; i++) {
        state.score += 1;
        spawnParticle(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
    }
    updateDisplay();
});


function spawnParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('click-particle');
    particle.innerText = '+1';
    
    // Randomize slight offset
    const offsetX = (Math.random() - 0.5) * 40;
    
    // Calculate relative position to container if needed, or just absolute on body coords
    particle.style.left = `${x + offsetX}px`;
    particle.style.top = `${y}px`;
    
    document.body.appendChild(particle);
    
    // Cleanup
    setTimeout(() => {
        particle.remove();
    }, 1000);
}

// Upgrades Logic
function getUpgradeCost(upgrade) {
    // 15% increase per level usually standard for clickers
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
}

function calculateWPS() {
    let wps = 0;
    state.upgrades.forEach(upg => {
        wps += upg.wps * upg.count;
    });
    return wps;
}

function buyUpgrade(index) {
    const upgrade = state.upgrades[index];
    const cost = getUpgradeCost(upgrade);
    
    if (state.score >= cost) {
        state.score -= cost;
        upgrade.count++;
        state.wps = calculateWPS();
        
        renderStore(); // Re-render to update cost and count
        updateDisplay();
    }
}

// Render Store UI
function renderStore() {
    upgradesListElement.innerHTML = '';
    
    state.upgrades.forEach((upg, index) => {
        const cost = getUpgradeCost(upg);
        const item = document.createElement('div');
        item.className = `upgrade-item ${state.score < cost ? 'disabled' : ''}`;
        item.id = `upgrade-btn-${upg.id}`;
        
        item.onclick = () => buyUpgrade(index);
        
        item.innerHTML = `
            <div class="upgrade-icon">${upg.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${upg.name}</div>
                <div class="upgrade-cost">🍔 ${formatNumber(cost)}</div>
                <div class="upgrade-desc">${upg.desc} (+${upg.wps} WPS)</div>
            </div>
            <div class="upgrade-count">${upg.count}</div>
        `;
        upgradesListElement.appendChild(item);
    });
}

// Game Loop
function gameTick() {
    // Add score proportional to 100ms (1/10th of a second)
    if (state.wps > 0) {
        state.score += state.wps / 10;
        updateDisplay();
    }
}

// Storage
function saveGame() {
    localStorage.setItem('whopperClickerSave', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('whopperClickerSave');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge to keep new upgrades if updated
        state.score = parsed.score || 0;
        state.wps = parsed.wps || 0;
        
        if (parsed.upgrades) {
            parsed.upgrades.forEach(savedUpg => {
                const currentUpg = state.upgrades.find(u => u.id === savedUpg.id);
                if (currentUpg) {
                    currentUpg.count = savedUpg.count;
                }
            });
        }
        state.wps = calculateWPS(); // Recalculate just in case
    }
}

// Start
init();

// Reset Logic
const resetBtn = document.getElementById('resetBtn');
const resetModal = document.getElementById('resetModal');
const confirmReset = document.getElementById('confirmReset');
const cancelReset = document.getElementById('cancelReset');

if (resetBtn && resetModal) {
    resetBtn.addEventListener('click', () => {
        resetModal.classList.add('show');
    });

    cancelReset.addEventListener('click', () => {
        resetModal.classList.remove('show');
    });

    confirmReset.addEventListener('click', () => {
        localStorage.removeItem('whopperClickerSave');
        location.reload();
    });
    
    // Close modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === resetModal) {
            resetModal.classList.remove('show');
        }
    });
}
