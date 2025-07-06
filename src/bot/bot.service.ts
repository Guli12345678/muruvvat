import { Injectable } from "@nestjs/common";
import { Bot } from "./models/bot.model";
import { Muruvvat } from "./models/muruvvat.model";
import { Context, Markup } from "telegraf";

const SAHIY_MENU = Markup.keyboard([
  ["Muruvvat qilish", "Sabrlilarni ko'rish"],
  ["Admin bilan bog'lanish", "Sozlamalar"],
  ["Asosiy menyu"],
]).resize();

const SABRLILAR_MENU = Markup.keyboard([
  ["Muruvvat yo'llash"],
  ["Admin bilan bog'lanish", "Sozlamalar"],
  ["Asosiy menyu"],
]).resize();

@Injectable()
export class BotService {
  async start(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findByPk(user_id);
      await ctx.reply("Kerakli menuni tanlang:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Sahiy", callback_data: "register_sahiy" }],
            [{ text: "Sabrlilar", callback_data: "register_sabrlilar" }],
          ],
        },
      });
      if (!user) {
        await Bot.create({
          user_id: String(user_id)!,
          first_name: ctx.from!.first_name!,
          last_name: ctx.from!.last_name!,
        });
      } else if (!user.status) {
        await ctx.replyWithHTML(
          `Iltimos, Akkauntni faollashtirish uchun <b>📞 Telefon raqamni yuborish</b> tugmasini bosing!`,
          {
            ...Markup.keyboard([
              [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
            ]).resize(),
          }
        );
      }
    } catch (error) {
      console.log(
        `Error on start method. If you want to handle this ${error} GO TO BOT SERVICE`
      );
    }
  }

  async onRegisterSahiy(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await Bot.findOne({
      where: { user_id: String(user_id) },
      order: [["createdAt", "DESC"]],
    });
    if (!user) return;
    user.role = "sahiy";
    user.last_state = "name";
    await user.save();
    await ctx.reply("Ismingizni kiriting:");
  }

  async onRegisterSabrlilar(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await Bot.findOne({
      where: { user_id: String(user_id) },
      order: [["createdAt", "DESC"]],
    });
    if (!user) return;
    user.role = "sabrlilar";
    user.last_state = "name";
    await user.save();
    await ctx.reply("Ismingizni kiriting:");
  }

  async onClickSahiy(ctx: Context) {
    const user_id = ctx.callbackQuery!["data"].split("__");
    const user = await Bot.findOne({
      where: { user_id },
      order: [["createdAt", "DESC"]],
    });
    if (!user) {
      await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      user.role = "sahiy";
      user.last_state = "name";
      await user.save();
      ctx.reply("Ismingizni kiriting:");
    }
  }

  async onLocation(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await Bot.findOne({
      where: { user_id: String(user_id) },
      order: [["createdAt", "DESC"]],
    });
    if (!user) {
      await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else if (user.last_state === "location") {
      if (ctx.msg && "location" in ctx.msg && ctx.msg.location) {
        user.location = JSON.stringify(ctx.msg.location);
        user.last_state = undefined;
        await user.save();
        await ctx.reply("Siz ro'yxatdan muvaffaqiyatli o'tdingiz!", SAHIY_MENU);
      }
    }
  }

  async onText(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await Bot.findOne({
      where: { user_id: String(user_id) },
      order: [["createdAt", "DESC"]],
    });
    if (!user) {
      await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
      return;
    }
    if (user.last_state === "muruvvat_text" && "text" in ctx.msg) {
      await Muruvvat.create({ user_id: String(user_id), text: ctx.msg.text });
      user.last_state = undefined;
      await user.save();
      const allMuruvvat = await Muruvvat.findAll({
        where: { user_id: String(user_id) },
      });
      const list = allMuruvvat.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
      await ctx.reply(
        `Barcha muruvvatlaringiz:\n${list}`,
        Markup.keyboard([["Yangi muruvvat qilish"]]).resize()
      );
      return;
    }
    if (
      !user.last_state &&
      "text" in ctx.msg &&
      ctx.msg.text === "Yangi muruvvat qilish"
    ) {
      user.last_state = "muruvvat_text";
      await user.save();
      await ctx.reply("Yangi muruvvat matnini kiriting:");
      return;
    }
    if (
      (user.last_state === "name" ||
        (!user.name && user.last_state !== "phone_number")) &&
      "text" in ctx.msg
    ) {
      user.name = ctx.msg.text;
      user.last_state = "phone_number";
      await user.save();
      await ctx.reply("Telefon raqamingizni yuboring", {
        ...Markup.keyboard([
          Markup.button.contactRequest("Contactni ulashish"),
        ]).resize(),
      });
      return;
    }
    if (user.last_state === "phone_number" && "text" in ctx.msg) {
      user.phone_number = ctx.msg.text;
      if (user.role === "sahiy") {
        user.last_state = "location";
        await user.save();
        await ctx.reply(
          "Manzilingizni kiriting:",
          Markup.keyboard(["O'tkazib yuborish"]).resize()
        );
      } else if (user.role === "sabrlilar") {
        user.last_state = "region";
        await user.save();
        await ctx.reply("Viloyatingizni kiriting:");
      }
      return;
    }
    if (
      user.last_state === "region" &&
      user.role === "sabrlilar" &&
      "text" in ctx.msg
    ) {
      user.region = ctx.msg.text;
      user.last_state = "district";
      await user.save();
      await ctx.reply("Tumaningizni kiriting:");
      return;
    }
    if (
      user.last_state === "district" &&
      user.role === "sabrlilar" &&
      "text" in ctx.msg
    ) {
      user.district = ctx.msg.text;
      user.last_state = undefined;
      await user.save();
      await ctx.reply("Siz ro'yxatdan muvaffaqiyatli o'tdingiz!", SAHIY_MENU);
      return;
    }
    if (user.last_state === "location" && user.role === "sahiy") {
      if ("text" in ctx.msg && ctx.msg.text === "O'tkazib yuborish") {
        if (!user.last_state) return; // Already registered, do not reply again
        user.location = undefined;
        user.last_state = undefined;
        await user.save();
        await ctx.reply("Siz ro'yxatdan muvaffaqiyatli o'tdingiz!", SAHIY_MENU);
        return;
      } else if ("text" in ctx.msg) {
        user.location = ctx.msg.text;
        user.last_state = undefined;
        await user.save();
        await ctx.reply("Siz ro'yxatdan muvaffaqiyatli o'tdingiz!", SAHIY_MENU);
        return;
      }
    }
    // Do not reply to Sahiy or Sabrlilar menu presses after registration
    const msg: any = ctx.msg;
    if (
      !user.last_state &&
      msg &&
      msg.text &&
      (msg.text === "Sahiy" || msg.text === "Sabrlilar")
    ) {
      return;
    }
  }

  async muruvvatQilish(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await Bot.findOne({
      where: { user_id: String(user_id) },
      order: [["createdAt", "DESC"]],
    });
    if (!user || user.last_state) return;
    user.last_state = "muruvvat_text";
    await user.save();
    await ctx.reply("Nima muruvvat qilmoqchisiz?");
  }

  async onContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({
        where: { user_id: String(user_id) },
        order: [["createdAt", "DESC"]],
      });
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>/start</b> tugmasini bosing!`, {
          ...Markup.keyboard([
            [Markup.button.contactRequest("/start")],
          ]).resize(),
        });
        return;
      }
      const contact = (ctx.message as any).contact;
      if (!contact || !contact.phone_number) {
        await ctx.reply(
          "Kontakt topilmadi. Iltimos, Share contact tugmasini bosing!"
        );
        return;
      }
      user.phone_number = contact.phone_number;
      if (user.role === "sahiy") {
        user.last_state = "location";
        await user.save();
        await ctx.reply(
          "Manzilingizni kiriting:",
          Markup.keyboard(["O'tkazib yuborish"]).resize()
        );
      } else if (user.role === "sabrlilar") {
        user.last_state = "region";
        await user.save();
        await ctx.reply("Viloyatingizni kiriting:");
      } else {
        user.status = true;
        await user.save();
        await ctx.replyWithHTML(`Tabriklayman 🎉. Akkaunt faollashtirildi`, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log(
        `Error happening on bot service on the method named onContact: ${error}`
      );
    }
  }

  async onStop(ctx: Context) {
    await ctx.reply("Bot to'xtatildi.");
  }
}
