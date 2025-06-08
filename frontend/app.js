document.addEventListener("DOMContentLoaded", () => {
  renderHistory(); // можна поки що пусто, бо без ID
});

document.getElementById("meter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("meter-id").value.trim();
  const day = parseInt(document.getElementById("day-value").value);
  const night = parseInt(document.getElementById("night-value").value);

  if (!id) {
    alert("Будь ласка, введіть ID лічильника");
    return;
  }

  // Надіслати дані на backend
  fetch("https://electricity-backend.onrender.com/api/meter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, day, night })
  })
    .then(res => res.json())
    .then(result => {
      document.getElementById("result").innerText =
        `Сума до оплати: ${result.bill.toFixed(2)} грн${result.adjusted ? " (накрутка!)" : ""}`;

      // Після успішного запису оновити історію
      fetchHistory(id);
    })
    .catch(err => {
      console.error(err);
      alert("Помилка при збереженні даних");
    });
});

// Функція для завантаження і відображення історії по лічильнику
function fetchHistory(id) {
  fetch(`https://electricity-backend.onrender.com/api/history/${id}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("history");
      container.innerHTML = "";

      if (!data || data.length === 0) {
        container.innerText = "Історія порожня.";
        return;
      }

      const title = document.createElement("h3");
      title.innerText = `Історія лічильника ${id}`;
      title.classList.add("font-bold", "text-blue-700", "mt-4");
      container.appendChild(title);

      const list = document.createElement("ul");
      list.classList.add("list-disc", "ml-6", "mb-4");

      data.forEach(entry => {
        const item = document.createElement("li");
        item.textContent = `[${new Date(entry.timestamp).toLocaleString()}] День: ${entry.day}, Ніч: ${entry.night}, Сума: ${entry.bill.toFixed(2)} грн${entry.adjusted ? " (накрутка)" : ""}`;
        list.appendChild(item);
      });

      container.appendChild(list);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("history").innerText = "Не вдалося завантажити історію.";
    });
}

// Можна викликати fetchHistory(id) на початку, якщо хочеш завантажувати історію одразу після введення ID
