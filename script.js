const GITHUB_USERNAME = "Smiley-droid"; // ⚠️ À remplacer par ton pseudo GitHub
const REPO_NAME = "exploration-mapexploration-map"; // ⚠️ À remplacer par ton dépôt GitHub
const FILE_PATH = "zones_decouvertes.json"; 

let token = localStorage.getItem("githubToken");

// 📍 Initialisation de la carte Leaflet
const map = L.map('map').setView([48.8566, 2.3522], 13); // Paris par défaut
const tileLayers = {
    "Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    "Topographique": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
};
let currentLayer = tileLayers["Standard"];
currentLayer.addTo(map);

// 📌 Change le style de la carte
function changeMapStyle() {
    map.removeLayer(currentLayer);
    currentLayer = (currentLayer === tileLayers["Standard"]) ? tileLayers["Topographique"] : tileLayers["Standard"];
    currentLayer.addTo(map);
}

// 🔑 Connexion GitHub
function setGitHubToken() {
    token = prompt("Entrez votre token GitHub personnel :");
    if (token) localStorage.setItem("githubToken", token);
}

// 🔍 Suivi de position et mise à jour des zones
navigator.geolocation.watchPosition(position => {
    const { latitude, longitude } = position.coords;
    L.circle([latitude, longitude], { radius: 50, color: "blue" }).addTo(map);
    updateDiscoveredZones({ lat: latitude, lng: longitude });
}, console.error, { enableHighAccuracy: true });

// 📂 Vérifie si le fichier existe et récupère son SHA
async function getFileSha() {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (response.ok) {
        const data = await response.json();
        return data.sha;
    }
    return null;
}

// 📤 Met à jour les zones découvertes sur GitHub
async function updateDiscoveredZones(newZone) {
    const sha = await getFileSha();
    const existingZones = await fetch(`https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`)
        .then(res => res.ok ? res.json() : [])
        .catch(() => []);

    existingZones.push(newZone);
    const content = btoa(JSON.stringify(existingZones, null, 2)); // Encodage Base64
    
    const body = JSON.stringify({
        message: "Mise à jour des zones découvertes",
        content: content,
        sha: sha
    });

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: body
    });

    if (response.ok) alert("Zones mises à jour !");
    else alert("Erreur : Vérifie ton token et ton dépôt.");
}
