const BACKEND_URL = "https://counter-9c2t.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  renderAllHistories();
});

document.getElementById("meter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("meter-id").value.trim();
  const day = parseInt(document.getElementById("day-value").value);
  const night = parseInt(document.getElementById("night-value").value);

  if (!id || isNaN(day) || isNaN(night)) {
    alert("Будь ласка, введіть усі поля.");
    return;
  }

  fetch(`${BACKEND_URL}/api/meter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, day, night })
  })
    .then(res => res.json())
    .then(result => {
      const msg = `Сума до оплати: ${result.bill.toFixed(2)} грн${result.adjusted ? " (накрутка!)" : ""}`;
      document.getElementById("result").innerText = msg;
      renderAllHistories();
    })
    .catch(err => {
      console.error(err);
      alert("Помилка при обробці запиту.");
    });
});

function renderAllHistories() {
  const container = document.getElementById("history");
  container.innerHTML = "Завантаження...";

  fetch(`${BACKEND_URL}/api/history`)
    .then(res => res.json())
    .then(data => {
      if (!data || Object.keys(data).length === 0) {
        container.innerText = "Історія порожня.";
        return;
      }

      container.innerHTML = "";

      for (const id in data) {
        const title = document.createElement("h3");
        title.innerText = `Лічильник ${id}`;
        title.classList.add("font-bold", "text-blue-700", "mt-4");
        container.appendChild(title);

        const list = document.createElement("ul");
        list.classList.add("list-disc", "ml-6", "mb-4");

        data[id].forEach(entry => {
          const item = document.createElement("li");
          item.textContent = `[${new Date(entry.timestamp).toLocaleString()}] День: ${entry.day}, Ніч: ${entry.night}, Сума: ${entry.bill.toFixed(2)} грн${entry.adjusted ? " (накрутка)" : ""}`;
          list.appendChild(item);
        });

        container.appendChild(list);
      }
    })
    .catch(err => {
      console.error(err);
      container.innerText = "Помилка при отриманні історії.";
    });
}
