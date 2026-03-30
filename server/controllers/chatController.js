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

    // Build history (all messages except the last user one)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.parts[0].text }]
    }));

    const lastMessage = messages[messages.length - 1];
    const fallbackModels = ['gemini-2.5-flash', 'gemini-3.0-flash'];
    
    let responseText = null;
    let fallbackError = null;

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        responseText = result.response.text();
        
        break; // Break loop if successful
      } catch (err) {
        fallbackError = err;
        // If the error isn't a quota issue (429) or missing model (404), throw it immediately
        if (!err.message.includes('429') && !err.message.includes('404')) {
          throw err;
        }
        console.warn(`[Fallback Warning]: ${modelName} failed or exhausted. Trying next model...`);
        // Loop continues to the next model in the array
      }
    }

    if (!responseText) {
      throw new Error(`All models are exhausted or unavailable. Final error: ${fallbackError.message}`);
    }

    res.json({ success: true, reply: responseText });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ success: false, message: error.message });
  }
};
