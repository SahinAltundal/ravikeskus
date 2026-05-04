const API_URL = 'http://localhost:3000/api/reservations';

// Bina tanımlamaları - Bunlar olmazsa ekran boş görünür
const buildings = [
    { id: 'A', name: 'Rakennus A', start: 1, end: 18 },
    { id: 'B', name: 'Rakennus B', start: 19, end: 36 },
    { id: 'C', name: 'Rakennus C', start: 71, end: 100 },
    { id: 'D', name: 'Rakennus D', start: 37, end: 38 },
    { id: 'E', name: 'Rakennus E', start: 39, end: 47 },
    { id: 'F', name: 'Rakennus F', start: 48, end: 53 }
];

let reservations = {};
let currentBuildingId = null;

// DOM Elemanları
const buildingsGrid = document.getElementById('buildings-grid');
const emptyState = document.getElementById('empty-state');
const buildingView = document.getElementById('building-view');
const currentBuildingTitle = document.getElementById('current-building-title');
const boxesGrid = document.getElementById('boxes-grid');
const closeBuildingViewBtn = document.getElementById('close-building-view');
const modal = document.getElementById('modal');
const reservationForm = document.getElementById('reservation-form');

// Uygulamayı Başlat
async function init() {
    try {
        const res = await fetch(API_URL);
        reservations = await res.json();
        renderBuildings();
        setupEventListeners();
    } catch (error) {
        console.error("Hata:", error);
        // Sunucu kapalı olsa bile binaları gösterelim
        renderBuildings();
    }
}

// Sol taraftaki binaları çiz
function renderBuildings() {
    if (!buildingsGrid) return;
    buildingsGrid.innerHTML = '';
    
    buildings.forEach(building => {
        const totalBoxes = building.end - building.start + 1;
        let reservedCount = 0;
        for (let i = building.start; i <= building.end; i++) {
            if (reservations[i]) reservedCount++;
        }
        const freeBoxes = totalBoxes - reservedCount;

        const card = document.createElement('div');
        card.className = `building-card ${currentBuildingId === building.id ? 'active' : ''}`;
        card.onclick = () => selectBuilding(building.id);
        
        card.innerHTML = `
            <h3>${building.name}</h3>
            <div class="building-stats">
                <div class="stat-group">
                    <span class="stat-label">Vapaa</span>
                    <span class="stat-value">${freeBoxes}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-label">Yhteensä</span>
                    <span class="stat-value">${totalBoxes}</span>
                </div>
            </div>
        `;
        buildingsGrid.appendChild(card);
    });
}

// Bina seçilince sağ tarafı aç
function selectBuilding(id) {
    currentBuildingId = id;
    renderBuildings();
    
    const building = buildings.find(b => b.id === id);
    if (!building) return;

    emptyState.classList.add('hidden');
    buildingView.classList.remove('hidden');
    currentBuildingTitle.textContent = building.name;
    renderBoxes(building);
}

// Sağ taraftaki karsinaları çiz
function renderBoxes(building) {
    boxesGrid.innerHTML = '';
    for (let i = building.start; i <= building.end; i++) {
        const box = document.createElement('div');
        const r = reservations[i];
        box.textContent = i;
        
        if (r) {
            if (r.status === 'Hyväksytty') {
                box.className = 'box reserved'; // Onaylı - Kırmızı
            } else {
                box.className = 'box';
                box.style.background = '#fbbf24'; // Beklemede - Sarı
                box.style.color = 'white';
                box.style.borderColor = '#d97706';
            }
        } else {
            box.className = 'box'; // Boş - Yeşil (CSS'den gelir)
        }

        box.onclick = () => openModal(i);
        boxesGrid.appendChild(box);
    }
}

// Modal açma (Eski çalışan halini korudum)
function openModal(boxNumber) {
    document.getElementById('box-id').value = boxNumber;
    const res = reservations[boxNumber];
    
    if (res) {
        document.getElementById('modal-title').textContent = `Karsinan ${boxNumber} tiedot`;
        document.getElementById('horse-name').value = res.horse_name;
        document.getElementById('trainer').value = res.trainer;
        document.getElementById('arrival-time').value = res.arrival_time ? res.arrival_time.substring(0, 16) : '';
        document.getElementById('departure-time').value = res.departure_time ? res.departure_time.substring(0, 16) : '';
        document.getElementById('delete-reservation-btn').classList.remove('hidden');
    } else {
        document.getElementById('modal-title').textContent = `Varaa karsina ${boxNumber}`;
        reservationForm.reset();
        document.getElementById('box-id').value = boxNumber;
        document.getElementById('delete-reservation-btn').classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

// Sunucuya Kaydet
async function saveReservation(e) {
    e.preventDefault();
    const data = {
        box_id: document.getElementById('box-id').value,
        horse_name: document.getElementById('horse-name').value,
        trainer: document.getElementById('trainer').value,
        arrival_time: document.getElementById('arrival-time').value,
        departure_time: document.getElementById('departure-time').value
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        location.reload(); // Her şey bitsin ve güncellensin
    } catch (err) {
        alert("Kaydedilemedi!");
    }
}

// Sunucudan Sil
async function deleteReservation() {
    const boxId = document.getElementById('box-id').value;
    if(!confirm('Haluatko varmasti poistaa varauksen?')) return;
    
    try {
        await fetch(`${API_URL}/${boxId}`, { method: 'DELETE' });
        location.reload();
    } catch (err) {
        alert("Silinemedi!");
    }
}

function setupEventListeners() {
    closeBuildingViewBtn.onclick = () => {
        currentBuildingId = null;
        buildingView.classList.add('hidden');
        emptyState.classList.remove('hidden');
        renderBuildings();
    };
    document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('cancel-modal-btn').onclick = () => modal.classList.add('hidden');
    reservationForm.onsubmit = saveReservation;
    document.getElementById('delete-reservation-btn').onclick = deleteReservation;
}

// Motoru çalıştır
init();