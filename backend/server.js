import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Підключення до MongoDB через змінну середовища
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const meterSchema = new mongoose.Schema({
  id: String,
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
});

// Маршрут для отримання історії конкретного лічильника
app.get('/api/history/:id', async (req, res) => {
  const meter = await Meter.findOne({ id: req.params.id });
  res.json(meter?.readings || []);
});

// **НОВИЙ маршрут для отримання всієї історії по всіх лічильниках**
app.get('/api/history', async (req, res) => {
  const meters = await Meter.find();
  const result = {};
  meters.forEach(meter => {
    result[meter.id] = meter.readings;
  });
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
