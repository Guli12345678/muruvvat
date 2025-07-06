import { BotService } from "./bot.service";
import {
  Action,
  Ctx,
  Hears,
  On,
  Start,
  Update,
  Command,
} from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { Bot } from "./models/bot.model";
import axios from "axios";
import { Muruvvat } from "./models/muruvvat.model";

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

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @Action("register_sahiy")
  async onRegisterSahiy(@Ctx() ctx: Context) {
    await this.botService.onRegisterSahiy(ctx);
  }

  @Action("register_sabrlilar")
  async onRegisterSabrlilar(@Ctx() ctx: Context) {
    await this.botService.onRegisterSabrlilar(ctx);
  }

  @Action(/^sahiy__+\d+/)
  async onClickSahiy(@Ctx() ctx: Context) {
    await this.botService.onClickSahiy(ctx);
  }

  @On("location")
  async onLocation(@Ctx() ctx: Context) {
    await this.botService.onLocation(ctx);
  }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    await this.botService.onText(ctx);
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    await this.botService.onContact(ctx);
  }

  @Hears("Muruvvat qilish")
  async muruvvatQilish(@Ctx() ctx: Context) {
    await this.botService.muruvvatQilish(ctx);
  }

  @Command("stop")
  async onStop(@Ctx() ctx: Context) {
    await this.botService.onStop(ctx);
  }
}
