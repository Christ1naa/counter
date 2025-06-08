import express from 'express'; 
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// Для роботи з __dirname у ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Підключення до MongoDB через змінну середовища
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Якщо не підключився до бази — завершуємо процес
});

const meterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  readings: [
    {
      day: Number,
      night: Number,
      bill: Number,
      adjusted: Boolean,
      timestamp: Date,
    },
  ],
});

const Meter = mongoose.model('Meter', meterSchema);

const TARIFFS = { day: 3.5, night: 2.0 };
const PENALTY = { day: 100, night: 80 };

// Маршрут для додавання/оновлення показників
app.post('/api/meter', async (req, res) => {
  try {
    const { id, day, night } = req.body;

    if (!id || typeof day !== 'number' || typeof night !== 'number') {
      return res.status(400).json({ error: 'Неправильні вхідні дані' });
    }

    let meter = await Meter.findOne({ id });
    const prev = meter?.readings?.slice(-1)[0] || { day: 0, night: 0 };

    let deltaDay = day - prev.day;
    let deltaNight = night - prev.night;

    let adjusted = false;
    if (deltaDay < 0) {
      deltaDay = PENALTY.day;
      adjusted = true;
    }
    if (deltaNight < 0) {
      deltaNight = PENALTY.night;
      adjusted = true;
    }

    const bill = deltaDay * TARIFFS.day + deltaNight * TARIFFS.night;
    const reading = { day, night, bill, adjusted, timestamp: new Date() };

    if (!meter) {
      meter = new Meter({ id, readings: [reading] });
    } else {
      meter.readings.push(reading);
    }

    await meter.save();
    res.json({ bill, adjusted });
  } catch (error) {
    console.error('POST /api/meter error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Маршрут для отримання історії конкретного лічильника
app.get('/api/history/:id', async (req, res) => {
  try {
    const meter = await Meter.findOne({ id: req.params.id });
    if (!meter) return res.status(404).json({ error: 'Лічильник не знайдений' });
    res.json(meter.readings);
  } catch (error) {
    console.error('GET /api/history/:id error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Маршрут для отримання всієї історії по всіх лічильниках
app.get('/api/history', async (req, res) => {
  try {
    const meters = await Meter.find();
    const result = {};
    meters.forEach(meter => {
      result[meter.id] = meter.readings;
    });
    res.json(result);
  } catch (error) {
    console.error('GET /api/history error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Віддаємо фронтенд — папка docs
app.use(express.static(path.join(__dirname, 'docs')));

// Для будь-яких інших маршрутів віддаємо index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
