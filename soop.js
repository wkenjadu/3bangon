const axios = require("axios");
const fs = require("fs");
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// 환경설정
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "469136086388441088";
const BJ_ID = "breezy25";
const BJ_NAME = "숩니찡";
const STATUS_FILE = "status.txt";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ✅ 최신 방식 (경고 제거)
client.once("clientReady", () => {
  console.log(`🤖 봇 로그인 완료: ${client.user.tag}`);

  checkStream(); // 시작할 때 1번 실행

  setInterval(() => {
    checkStream();
  }, 30000); // 30초마다 체크
});

// 방송 체크 함수
async function checkStream() {
  try {

    let wasLive = false;

    if (fs.existsSync(STATUS_FILE)) {
      wasLive = fs.readFileSync(STATUS_FILE, "utf8").trim() === "true";
    }

    const res = await axios.get(
      `https://bjapi.afreecatv.com/api/${BJ_ID}/station`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": `https://ch.sooplive.co.kr/${BJ_ID}`
        }
      }
    );

    const broadData = res.data?.broad;

    // ✅ 핵심 수정 (null 방지)
    const isLive = broadData ? (broadData.is_onair === "Y") : false;

    console.log(`[체크] 방송 상태: ${isLive ? "ON" : "OFF"}`);

    // 방송 시작 감지
    if (isLive && !wasLive) {

      const channel = await client.channels.fetch(CHANNEL_ID);

      const title = broadData.broad_title || "방송 시작!";
      const category = broadData.broad_cate_name || "카테고리 없음";

      const thumbnail =
        `https://liveimg.afreecatv.com/m/${broadData.broad_no}.jpg?cache=${Date.now()}`;

      const embed = new EmbedBuilder()
        .setColor(0xD59EE8)
        .setAuthor({
          name: `${BJ_NAME} 방송 시작!`,
          iconURL: `https://profile.img.afreecatv.com/LOGO/${BJ_ID.substring(0,2)}/${BJ_ID}/${BJ_ID}.jpg`
        })
        .setTitle(`💜 ${title}`)
        .setURL(`https://play.sooplive.co.kr/${BJ_ID}`)
        .addFields(
          {
            name: "📂 방송 카테고리",
            value: category,
            inline: true
          }
        )
        .setImage(thumbnail)
        .setFooter({ text: "SOOP Live Checker" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("방송 보러가기")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://play.sooplive.co.kr/${BJ_ID}`)
      );

      await channel.send({
        content: "@everyone 🟣 실시간 스트리밍 ON 🟣",
        embeds: [embed],
        components: [row]
      });

      console.log("✅ 방송 시작 알림 전송 완료!");
    }

    // 방송 종료 감지
    if (!isLive && wasLive) {
      console.log("🔴 방송 종료 감지");
    }

    // ✅ 안전 저장 (에러 방지)
    fs.writeFileSync(STATUS_FILE, String(isLive));

  } catch (e) {
    console.log("❌ 에러:", e.message);
  }
}

// 봇 로그인
client.login(TOKEN);
