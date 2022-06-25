const { Telegraf } = require('telegraf')

const bot = new Telegraf("5532849447:AAEB8VKtefVK5k-HSiNAJaEMZNmnF4Er-PU")
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => console.log("ctx.from ", ctx.from, "ctx.chat ", ctx.chat))
bot.on('sticker', (ctx) => ctx.reply('👍'))
//bot.hears('hi', (ctx) => ctx.reply('Hey there')
bot.hears('', (ctx) => console.log("ctx.from ", ctx.from, "ctx.chat ", ctx.chat))
bot.telegram.sendMessage("-1001522873890", "Hola grupo");
bot.launch()