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
      const saved = fs.readFileSync(STATUS_FILE, "utf8").trim();
      wasLive = saved === "true";
    }

    // 🔥 핵심 API + Referer 최신 적용
    const res = await axios.get(
      `https://bjapi.afreecatv.com/api/${BJ_ID}/station`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": `https://www.sooplive.com/station/${BJ_ID}`
        }
      }
    );

    const broadData = res.data?.broad;

    // 🔥 방송 감지 (가장 안정)
    const isLive = !!broadData?.broad_no;

    // 🔥 카테고리
    const category =
      broadData?.broad_cate_name ||
      broadData?.cate_name ||
      "카테고리 없음";

    console.log("isLive:", isLive);
    console.log("category:", category);

    // 🔥 방송 시작 감지
    if (isLive && (!wasLive || isFirstRun)) {

      const channel = await client.channels.fetch(CHANNEL_ID);

      const title = broadData?.broad_title || "방송 시작!";
      const thumbnail = `https://liveimg.afreecatv.com/m/${broadData?.broad_no}.jpg?cache=${Date.now()}`;

      const embed = new EmbedBuilder()
        .setColor(0xD59EE8)
        .setTitle(`💜 ${title}`)
        .setURL(`https://play.sooplive.com/${BJ_ID}`)
        .addFields({
          name: "📂 방송 카테고리",
          value: category,
          inline: true
        })
        .setImage(thumbnail)
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

    // 🔥 상태 저장 (중요)
    fs.writeFileSync(STATUS_FILE, isLive ? "true" : "false");

  } catch (e) {
    console.log("❌ 에러:", e.message);
  }
}

// 로그인
client.login(TOKEN);