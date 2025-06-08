import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Підключення до MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Схема лічильника
const meterSchema = new mongoose.Schema({
  id: String,
  readings: [
    {
      day: Number,
      night: Number,
      bill: Number,
      adjusted: Boolean,
      timestamp: Date
    }
  ]
});

const Meter = mongoose.model('Meter', meterSchema);

// Тарифи й штрафи
const TARIFFS = { day: 3.5, night: 2.0 };
const PENALTY = { day: 100, night: 80 };

// Додавання показників
app.post('/api/meter', async (req, res) => {
  const { id, day, night } = req.body;

  try {
    let meter = await Meter.findOne({ id });
    const prev = meter?.readings?.slice(-1)[0] || { day: 0, night: 0 };

    let deltaDay = day - prev.day;
    let deltaNight = night - prev.night;

    let adjusted = false;
    if (deltaDay < 0) { deltaDay = PENALTY.day; adjusted = true; }
    if (deltaNight < 0) { deltaNight = PENALTY.night; adjusted = true; }

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
    console.error('❌ Error in /api/meter:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отримати історію по конкретному ID
app.get('/api/history/:id', async (req, res) => {
  try {
    const meter = await Meter.findOne({ id: req.params.id });
    res.json(meter?.readings || []);
  } catch (error) {
    console.error('❌ Error in /api/history/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const meters = await Meter.find();
    const result = {};
    meters.forEach(m => {
      result[m.id] = m.readings;
    });
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
