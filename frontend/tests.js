function runTests() {
  let results = [];

  function assertEqual(actual, expected, label) {
    const passed = actual === expected;
    results.push(`${passed ? "✅" : "❌"} ${label}: ${actual} === ${expected}`);
  }

  // Скидання даних
  meterData = {};
  meterHistory = {};

  // 1. Новий лічильник
  let res = processMeterReading("TEST1", 500, 300);
  assertEqual(res.bill, 500 * CONFIG.tariffs.day + 300 * CONFIG.tariffs.night, "Новий лічильник");

  // 2. Оновлення даних
  res = processMeterReading("TEST1", 600, 350);
  assertEqual(res.bill, 100 * CONFIG.tariffs.day + 50 * CONFIG.tariffs.night, "Оновлення існуючого");

  // 3. Занижений нічний
  res = processMeterReading("TEST1", 700, 100); // 100 < 350
  assertEqual(res.adjusted, true, "Занижений нічний");

  // 4. Занижений денний
  res = processMeterReading("TEST1", 100, 500); // 100 < 700
  assertEqual(res.adjusted, true, "Занижений денний");

  // 5. Обидва занижені
  res = processMeterReading("TEST1", 50, 100); // обидва < попередніх
  assertEqual(res.adjusted, true, "Обидва занижені");

  document.getElementById("test-results").innerText = results.join("\n");
}
