let meterData = JSON.parse(localStorage.getItem("meterData")) || CONFIG.initialMeters;
let meterHistory = JSON.parse(localStorage.getItem("meterHistory")) || {};

document.getElementById("meter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("meter-id").value.trim();
  const day = parseInt(document.getElementById("day-value").value);
  const night = parseInt(document.getElementById("night-value").value);

  const result = processMeterReading(id, day, night);
  document.getElementById("result").innerText = `Сума до оплати: ${result.bill.toFixed(2)} грн`;

  saveData();
});

function processMeterReading(id, newDay, newNight) {
  const previous = meterData[id] || { day: 0, night: 0 };
  const history = meterHistory[id] || [];

  let deltaDay = newDay - previous.day;
  let deltaNight = newNight - previous.night;

  let adjusted = false;
  if (deltaDay < 0) {
    deltaDay = CONFIG.penalty.day;
    adjusted = true;
  }
  if (deltaNight < 0) {
    deltaNight = CONFIG.penalty.night;
    adjusted = true;
  }

  const bill = deltaDay * CONFIG.tariffs.day + deltaNight * CONFIG.tariffs.night;

  // Update current values
  meterData[id] = { day: newDay, night: newNight };

  // Log history
  history.push({ timestamp: new Date(), day: newDay, night: newNight, bill, adjusted });
  meterHistory[id] = history;

  return { bill, adjusted };
}

function saveData() {
  localStorage.setItem("meterData", JSON.stringify(meterData));
  localStorage.setItem("meterHistory", JSON.stringify(meterHistory));
}
function renderHistory() {
  const container = document.getElementById("history-section");
  container.innerHTML = ""; // очистити попереднє

  if (Object.keys(meterHistory).length === 0) {
    container.innerHTML = "<p>Історія відсутня.</p>";
    return;
  }

  for (const [id, entries] of Object.entries(meterHistory)) {
    const table = document.createElement("table");
    table.className = "w-full border border-gray-300 mb-6";
    const thead = `
      <thead class="bg-gray-200">
        <tr>
          <th class="border px-2 py-1">Дата</th>
          <th class="border px-2 py-1">День</th>
          <th class="border px-2 py-1">Ніч</th>
          <th class="border px-2 py-1">Сума (грн)</th>
          <th class="border px-2 py-1">Накрутка?</th>
        </tr>
      </thead>
    `;
    const rows = entries.map(entry => `
      <tr>
        <td class="border px-2 py-1">${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="border px-2 py-1">${entry.day}</td>
        <td class="border px-2 py-1">${entry.night}</td>
        <td class="border px-2 py-1">${entry.bill.toFixed(2)}</td>
        <td class="border px-2 py-1 text-center">${entry.adjusted ? "✅" : "—"}</td>
      </tr>
    `).join("");

    table.innerHTML = `
      <caption class="text-left font-semibold py-2">${id}</caption>
      ${thead}
      <tbody>${rows}</tbody>
    `;

    container.appendChild(table);
  }
}

