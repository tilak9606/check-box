const grid = document.getElementById('checkbox-grid');
const activeUsersElement = document.getElementById('active-users');

let checkboxes = new Array(10000).fill(false);
let ws;

const CHECKBOX_BATCH_SIZE = 10000;
let isConnected = false; 

connectToWebSocket();

function connectToWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        startConnection();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
            checkboxes = data;
            renderCheckboxes();
        } else if (data.activeUsers !== undefined) {
            activeUsersElement.textContent = data.activeUsers;
        } else if (data.index !== undefined && data.checked !== undefined) {
            checkboxes[data.index] = data.checked;
            updateCheckbox(data.index, data.checked);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
        grid.style.display = 'none';
        isConnected = false; 
        disableCheckboxes(); 
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function startConnection() {
    grid.style.display = 'grid';
    isConnected = true; 
    enableCheckboxes(); 
}

function handleCheckboxChange(index) {
    if (!isConnected) return; 
    const newCheckedState = !checkboxes[index];
    checkboxes[index] = newCheckedState;
    ws.send(JSON.stringify({ index, checked: newCheckedState }));
}

function renderCheckboxes() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < CHECKBOX_BATCH_SIZE; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${i}`;
        checkbox.className = 'checkbox';
        checkbox.checked = checkboxes[i];
        checkbox.disabled = !isConnected; 
        checkbox.onchange = () => handleCheckboxChange(i);
        fragment.appendChild(checkbox);
    }
    grid.appendChild(fragment);
}

function updateCheckbox(index, checked) {
    const checkbox = document.getElementById(`checkbox-${index}`);
    if (checkbox) {
        checkbox.checked = checked;
    }
}

function enableCheckboxes() {
    document.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.disabled = false;
    });
}

function disableCheckboxes() {
    document.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.disabled = true;
    });
    grid.style.display = 'none';
}

renderCheckboxes();
