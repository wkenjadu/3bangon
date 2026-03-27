const axios = require("axios");
const fs = require("fs");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BJ_ID = "altjs0704";
const BJ_NAME = "323";
const STATUS_FILE = "status.txt";

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
  console.log(`🤖 로그인 완료: ${client.user.tag}`);
  await checkStream();
  process.exit(0);
});

async function checkStream() {
  try {
    let wasLive = false;
    let isFirstRun = false;

    if (!fs.existsSync(STATUS_FILE)) {
      isFirstRun = true;
    } else {
      wasLive = fs.readFileSync(STATUS_FILE, "utf8").trim() === "true";
    }

    // 🔥 최신 방식: 웹페이지 체크
    const res = await axios.get(`https://sooplive.com/station/${BJ_ID}`);
    const html = res.data;

    const isLive = html.includes("onair");

    console.log(`[체크] 방송 상태: ${isLive ? "ON" : "OFF"}`);

    if (isLive && (!wasLive || isFirstRun)) {
      const channel = await client.channels.fetch(CHANNEL_ID);

      const embed = new EmbedBuilder()
        .setColor(0xD59EE8)
        .setTitle(`💜 ${BJ_NAME} 방송 시작!`)
        .setURL(`https://play.sooplive.com/${BJ_ID}`)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("방송 보러가기")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://play.sooplive.com/${BJ_ID}`)
      );

      await channel.send({
        content: "@everyone 🟣 실시간 스트리밍 ON 🟣",
        embeds: [embed],
        components: [row]
      });

      console.log("✅ 방송 알림 전송 완료");
    }

    fs.writeFileSync(STATUS_FILE, isLive ? "true" : "false");

  } catch (e) {
    console.log("❌ 에러:", e.message);
  }
}

client.login(TOKEN);