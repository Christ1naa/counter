let meterData = JSON.parse(localStorage.getItem("meterData")) || CONFIG.initialMeters;
let meterHistory = JSON.parse(localStorage.getItem("meterHistory")) || {};

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

  // Update current values
  meterData[id] = { day: newDay, night: newNight };

  // Log history
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
    container.innerText = "Історія показників порожня.";
    return;
  }

  for (const id in meterHistory) {
    const entries = meterHistory[id];
    const meterBlock = document.createElement("div");
    meterBlock.classList.add("mb-4");

    const title = document.createElement("h3");
    title.classList.add("font-bold", "text-blue-700");
    title.innerText = `Лічильник ${id}`;
    meterBlock.appendChild(title);

    const list = document.createElement("ul");
    list.classList.add("list-disc", "ml-6");

    entries.forEach(entry => {
      const li = document.createElement("li");
      li.innerText = `[${new Date(entry.timestamp).toLocaleString()}] День: ${entry.day}, Ніч: ${entry.night}, Сума: ${entry.bill.toFixed(2)} грн${entry.adjusted ? " (накрутка)" : ""}`;
      list.appendChild(li);
    });

    meterBlock.appendChild(list);
    container.appendChild(meterBlock);
  }
}

// Завантажити історію при старті
renderHistory();
