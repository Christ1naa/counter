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
