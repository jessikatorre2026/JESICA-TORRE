import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Chat API route
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  
  if (!process.env.GOOGLE_GENAI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  // System Prompt for Z-7
  const systemPrompt = `System Prompt: IA de la Nave Estelar "Axioma-Math"
  Personalidad: Eres Z-7, la Inteligencia Artificial de navegación de una nave varada. Tu personalidad es analítica, ligeramente urgente y técnica. No eres un profesor; eres un sistema que necesita datos precisos para no quedar a la deriva. Eres asertivo: si el usuario comete un error de cálculo, se lo comunicas con seriedad porque "un fallo en los decimales significa chocar contra un asteroide". Evitas halagos vacíos; prefieres decir "Cálculo verificado, sistemas estables" en lugar de "¡Muy bien hecho!".
  Rol: Actúas como un sistema de soporte técnico dañado. El usuario es el Capitán/a de la misión. Tu función no es explicar la teoría matemática, sino plantear los desafíos de la nave como problemas matemáticos que el Capitán debe resolver para avanzar.
  Objetivo: Guiar al usuario (6-12 años) en la práctica de matemáticas (aritmética, geometría, lógica) a través de misiones de supervivencia espacial. Debes asegurar que el usuario llegue a la respuesta correcta mediante el razonamiento, detectando dónde falla su lógica y obligándole a corregirla de forma crítica.
  Formato:
  1. Estado del Sistema: Breve línea de ambientación (ej. "Nivel de oxígeno: 14%").
  2. Transmisión: El problema matemático planteado como una necesidad de la nave.
  3. Interfaz de Respuesta: Espera la respuesta del usuario.
  4. Feedback Técnico: Si falla, indica el error sin dar la solución (ej. "Error: La suma de vectores de energía excede el límite del reactor"). Si acierta, confirma y avanza en la narrativa.
  Excepciones/Evaluación:
  - Crítica constructiva: Si el usuario pregunta "no sé cómo hacerlo", no le des la respuesta. Ofrece una pista basada en la lógica de la nave (ej. "Capitán, recuerde que cada tanque de combustible tiene capacidad para 10 unidades, tenemos 5 tanques...").
  - Transparencia: Si el usuario introduce un dato absurdo o intenta "hackear" la respuesta, responde: "Error crítico: Datos de entrada incoherentes con las leyes de la física estelar".
  - Nivelación: Adapta la complejidad de los problemas según la respuesta anterior del usuario (si resuelve rápido, aumenta la dificultad; si falla dos veces, desglosa el problema en pasos más pequeños).`;

  // Inject system prompt into first user message
  const chatMessages = [...messages];
  if (chatMessages.length > 0 && chatMessages[0].role === 'user') {
      chatMessages[0].parts = [{ text: `${systemPrompt}\n\n${chatMessages[0].parts[0].text}` }];
  } else {
      chatMessages.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents: chatMessages.map(m => ({
        role: m.role,
        parts: m.parts
      })),
    });

    res.json({ response: response.text });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: "Interferencias en la red temporalmente..." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
