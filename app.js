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

  meterData[id] = { day: newDay, night: newNight };

  history.push({
    timestamp: new Date().toISOString(),
    day: newDay,
    night: newNight,
    bill,
    adjusted
  });

  meterHistory[id] = history;

  return { bill, adjusted };
}

function showHistory() {
  const id = document.getElementById("meter-id").value.trim();
  const historyContainer = document.getElementById("history");
  const historyBody = document.getElementById("history-body");
  historyBody.innerHTML = "";

  if (!id || !meterHistory[id]) {
    historyContainer.classList.remove("hidden");
    historyBody.innerHTML = `<tr><td colspan="5" class="text-center p-2">Немає історії для цього лічильника</td></tr>`;
    return;
  }

  const entries = meterHistory[id];
  for (const entry of entries) {
    const row = `<tr>
      <td class="border px-2 py-1">${new Date(entry.timestamp).toLocaleString()}</td>
      <td class="border px-2 py-1">${entry.day}</td>
      <td class="border px-2 py-1">${entry.night}</td>
      <td class="border px-2 py-1">${entry.bill.toFixed(2)} грн</td>
      <td class="border px-2 py-1">${entry.adjusted ? "✅" : "❌"}</td>
    </tr>`;
    historyBody.innerHTML += row;
  }

  historyContainer.classList.remove("hidden");
}

function saveData() {
  localStorage.setItem("meterData", JSON.stringify(meterData));
  localStorage.setItem("meterHistory", JSON.stringify(meterHistory));
}
