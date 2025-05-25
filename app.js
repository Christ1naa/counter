let meterData = JSON.parse(localStorage.getItem("meterData")) || { ...CONFIG.initialMeters };
let meterHistory = JSON.parse(localStorage.getItem("meterHistory")) || {};

document.addEventListener("DOMContentLoaded", () => {
  renderHistory(); // ВАЖЛИВО: відображення при старті
});

document.getElementById("meter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("meter-id").value.trim();
  const day = parseInt(document.getElementById("day-value").value);
  const night = parseInt(document.getElementById("night-value").value);

  const result = processMeterReading(id, day, night);
  document.getElementById("result").innerText = `Сума до оплати: ${result.bill.toFixed(2)} грн${result.adjusted ? " (накрутка!)" : ""}`;

  saveData();
  renderHistory();
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

  // Оновити дані
  meterData[id] = { day: newDay, night: newNight };

  // Додати до історії
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

function saveData() {
  localStorage.setItem("meterData", JSON.stringify(meterData));
  localStorage.setItem("meterHistory", JSON.stringify(meterHistory));
}

function renderHistory() {
  const container = document.getElementById("history");
  container.innerHTML = "";

  if (Object.keys(meterHistory).length === 0) {
    container.innerText = "Історія порожня.";
    return;
  }

  for (const id in meterHistory) {
    const title = document.createElement("h3");
    title.innerText = `Лічильник ${id}`;
    title.classList.add("font-bold", "text-blue-700", "mt-4");

    container.appendChild(title);

    const list = document.createElement("ul");
    list.classList.add("list-disc", "ml-6", "mb-4");

    meterHistory[id].forEach(entry => {
      const item = document.createElement("li");
      item.textContent = `[${new Date(entry.timestamp).toLocaleString()}] День: ${entry.day}, Ніч: ${entry.night}, Сума: ${entry.bill.toFixed(2)} грн${entry.adjusted ? " (накрутка)" : ""}`;
      list.appendChild(item);
    });

    container.appendChild(list);
  }
}
