import { BotService } from "./bot.service";
import { Action, Ctx, On, Start, Update } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { Bot } from "./models/bot.model";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
  @Start()
  async onStart(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });

      if (!user) {
        const newUser = await Bot.create({
          user_id: String(ctx.from?.id)!,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          last_state: "role",
        });
        ctx.reply("Qaysi ro'ldan ro'yxatdan o'tmoqchisiz?", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Sahiy",
                  callback_data: `sahiy__${user_id}`,
                },
                {
                  text: "Sabrli",
                  callback_data: `sabrli__${user_id}`,
                },
              ],
            ],
          },
        });
      }
    } catch (error) {
      console.log("Error on Start", error);
    }
  }

  @Action(/^sahiy__+\d+/)
  async onClickSahiy(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.callbackQuery!["data"].split("__");
      const user = await Bot.findOne({ where: { user_id } });
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
    } catch (error) {
      console.log("Error on Click Sahiy", error);
    }
  }

  @On("location")
  async onLocation(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });
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
          await ctx.reply(
            "Asosiy menyu:",
            Markup.keyboard([
              ["Muruvvat qilish", "Sabrlilarni ko'rish"],
              ["Admin bilan bog'lanish", "Sozlamalar"],
              ["Asosiy menyu"],
            ]).resize()
          );
        }
      }
    } catch (error) {
      console.log("Error on Location", error);
    }
  }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if (user && user.last_state == "name") {
          if ("text" in ctx.msg) {
            user.name = ctx.msg.text;
            user.last_state = "phone_number";
            await user.save();
            ctx.reply("Telefon raqamingizni yuboring", {
              ...Markup.keyboard([
                Markup.button.contactRequest("Contactni ulashish"),
              ]).resize(),
            });
          }
        } else if (user && user.last_state == "location") {
          if ("text" in ctx.msg && ctx.msg.text === "O'tkazib yuborish") {
            user.location = undefined;
            user.last_state = undefined;
            await user.save();
            await ctx.reply(
              "Siz ro'yxatdan o'tdingiz",
              Markup.keyboard([
                ["Muruvvat qilish", "Sabrlilarni ko'rish"],
                ["Admin bilan bog'lanish", "Sozlamalar"],
                ["Asosiy menyu"],
              ]).resize()
            );
            return;
          } else if ("text" in ctx.msg) {
            user.location = ctx.msg.text;
            user.last_state = undefined;
            await user.save();
            await ctx.reply(
              "Siz ro'yxatdan o'tdingiz",
              Markup.keyboard([
                ["Muruvvat qilish", "Sabrlilarni ko'rish"],
                ["Admin bilan bog'lanish", "Sozlamalar"],
                ["Asosiy menyu"],
              ]).resize()
            );
            return;
          }
        }
      }
    } catch (error) {
      console.log("Error on Text", error);
    }
  }

  async handlePhoneNumber(ctx: Context, user: Bot) {
    if (user.last_state === "phone_number" && "contact" in ctx.msg) {
      user.phone_number = ctx.msg.contact.phone_number;
      user.last_state = "location";
      await user.save();
      await ctx.reply(
        "Manzilingizni kiriting: ",
        Markup.keyboard(["O'tkazib yuborish"]).resize()
      );
    }
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await Bot.findOne({ where: { user_id: String(user_id) } });
      if (!user) {
        await ctx.reply("Siz hali ro'yxatdan o'tmagansiz", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        await this.handlePhoneNumber(ctx, user);
      }
    } catch (error) {
      console.log("Error on Contact", error);
    }
  }
}
