import Car from '../models/Car.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithBot = async (req, res) => {
  try {
    const { messages } = req.body; // array of {role, parts:[{text}]}

    if (!messages || messages.length === 0) {
      return res.json({ success: false, message: 'No messages provided' });
    }

    // Fetch all available cars from DB
    const cars = await Car.find({ isAvailable: true }).lean();

    // Build a concise car inventory summary for the AI
    const inventorySummary = cars.map((car, i) =>
      `Car #${i + 1}:
  - ID: ${car._id}
  - Name: ${car.brand} ${car.model} (${car.year})
  - Category: ${car.category}
  - Transmission: ${car.transmission}
  - Fuel: ${car.fuel_type}
  - Seats: ${car.seating_capacity}
  - Price: $${car.pricePerDay}/day
  - Location: ${car.location}
  - Rating: ${car.rating || 5}/5
  - Description: ${car.description}`
    ).join('\n\n');

    const systemInstruction = `You are a friendly and knowledgeable car rental assistant for a car rental platform.
Your ONLY job is to help users find the best car to rent from the available inventory listed below.

RULES:
1. ONLY recommend cars from the inventory list below. Never invent or mention cars not in the list.
2. When recommending a car, ALWAYS include its Car ID in this exact format: [CAR_ID:the_id_here] — this is how the UI shows a clickable card.
3. Ask clarifying questions if needed (budget, purpose, passengers, location preference, fuel type).
4. Keep responses friendly, concise, and helpful.
5. If no cars match the user's needs, say so honestly and suggest the closest alternatives.
6. Do not discuss anything unrelated to car rentals.

AVAILABLE CARS INVENTORY:
${inventorySummary}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    // Build history (all messages except the last user one)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.parts[0].text }]
    }));

    const chat = model.startChat({ history });

    // Send last user message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const responseText = result.response.text();

    res.json({ success: true, reply: responseText });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ success: false, message: error.message });
  }
};
