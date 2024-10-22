require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fal = require("@fal-ai/serverless-client");
const fs = require('fs');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

const path = require('path');

// CORS-Konfiguration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://white-hill-04b31d903.5.azurestaticapps.net', 'https://digit.cologne'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

fal.config({
  credentials: process.env.FAL_KEY
});

// Function to convert files to Base64 data URIs
function convertFilesToBase64(fileDirectory) {
  const files = fs.readdirSync(fileDirectory);
  const base64Files = [];

  for (const file of files) {
    const filePath = `${fileDirectory}/${file}`;
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const mimeType = 'application/octet-stream'; // Default MIME type
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    base64Files.push(dataUri);
  }

  return base64Files;
}

// Convert files at server start
let base64Files = [];
const fileDirectory = './files';

base64Files = convertFilesToBase64(fileDirectory);
console.log('Files converted to Base64.');

// Store conversations
const conversations = new Map();

app.post('/api/llm', cors(corsOptions), async (req, res) => {
  const { prompt, userPrompt, conversationId } = req.body;
  
  try {
    let conversation;
    if (!conversationId || !conversations.has(conversationId)) {
      conversation = {
        id: Date.now().toString(),
        messages: [{role: 'system', content: prompt}]
      };
      conversations.set(conversation.id, conversation);
    } else {
      conversation = conversations.get(conversationId);
    }

    conversation.messages.push({role: 'user', content: userPrompt});

    const fullPrompt = conversation.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "openai/gpt-4o",
        prompt: fullPrompt,
        files: base64Files
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(update.logs.map((log) => log.message));
        }
      },
    });

    conversation.messages.push({role: 'assistant', content: result.output});

    res.json({
      output: result.output,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  try {
    // Erstellen Sie eine URL für die hochgeladene Datei
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const result = await fal.subscribe("fal-ai/wizper", {
      input: {
        audio_url: fileUrl,
        auto_language: true
      },
    });

    res.json({ text: result.text });
  } catch (error) {
    console.error('Speech to text error:', error);
    res.status(500).json({ error: error.message, details: error.body });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.headers);
  next();
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));