const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Carga las variables de entorno desde el archivo .env

const API_KEY = process.env.GEMINI_API_KEY; // Obtiene la clave API desde el .env
const genAI = new GoogleGenerativeAI(API_KEY);

async function interpretarMensaje(mensaje) {
    try {
        // Pedimos solo el JSON sin formato adicional
        const prompt = `Extrae únicamente el nombre del repuesto (producto de auto) y el modelo de vehículo del siguiente mensaje: "${mensaje}". 
        Devuelve solo un JSON con las claves "producto" y "modelo", sin texto adicional ni etiquetas de código, tampoco año solo producto y modelo. Pero si es un mensaje de solo producto, devolver solo ese campo.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text(); // Extrae la respuesta de texto

        // Eliminamos posibles etiquetas de código ```json ... ```
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Parseamos la respuesta como JSON
        const data = JSON.parse(text);
        const producto = data.producto?.trim() || "";
        const modelo = data.modelo?.trim() || "";

        // Construimos el mensaje de búsqueda limpio
        const mensajeBusqueda = `${producto} ${modelo}`.trim();

        return mensajeBusqueda;
    } catch (error) {
        console.error("Error en interpretarMensaje:", error);
        return mensaje; // Si hay error, devuelve el mensaje original
    }
}

module.exports = { interpretarMensaje };
