const Discord = require("discord.js");
var bot = new Discord.Client();
const chalk = require("chalk");
const fs = require("fs");
const PersistentCollection = require('djs-collection-persistent');
const guildSettings = new PersistentCollection({name:"guildSettings"});

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    bot.guildSettings = guildSettings;
    bot.on(eventName, (...args) => eventFunction.run(bot, ...args));
  });
});

var config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
var checkTokenValid = setTimeout(() => {
	console.log(chalk.bgBlue.white("[Login]") + chalk.white(" Your bot could not turn on within 20 seconds. Check the token or your internet connection."))
	process.exit();
}, 20000)

bot.on('ready', ready => {
	clearTimeout(checkTokenValid);
	console.log(chalk.bgBlue.white("[Login]") + chalk.white(" Logged in as [" + bot.user.tag + "]."))
	bot.user.setGame("on " + bot.guilds.size + " guilds! | o!help", "https://twitch.tv/monstercat");
})

bot.on('message', msg => {
	if(msg.channel.type == 'dm' && msg.author.id !== bot.user.id) {
		msg.channel.send("<:warn_sign:346700821066416128> | Onlimy commands can't be used on DM.");
		console.log(chalk.bgBlue.white("[CMD]") + chalk.white(` (${msg.author.tag}) sent DM ("` + msg.content + `")`));
		return;
	}
	if(msg.author.bot) return;

	if(!guildSettings.has(msg.guild.id)) {
		const defaultSettings = {
		prefix: "o!"
		}
		guildSettings.set(msg.guild.id, defaultSettings);
	}
	fs.readdir("./commands/", (err, files) => {
		var command = msg.content.slice(guildSettings.get(msg.guild.id).prefix.length).split(' ').slice(0, 1)[0];
		var args = msg.content.split(' ').slice(1);
		if(files.some(a => command + ".js" == a) && msg.content.startsWith(guildSettings.get(msg.guild.id).prefix)) {
			let commandFile = require(`./commands/` + command + `.js`);
    		commandFile.run(bot, msg, args, guildSettings);
    		console.log(chalk.bgBlue.white("[CMD]") + chalk.white(` (${msg.author.tag}) used command (` + command + `) with args (${args.join(' ')})`));
		} else if (msg.author.id == '205319106608627722' && command == "reload" && msg.content.startsWith(guildSettings.get(msg.guild.id).prefix)) {
			if(args.length < 1) {
				msg.reply("Please specify a command that exists.");
			} else if (!files.some(a => args.join(' ') + ".js" == a)) {
				msg.reply("`" + args.join(' ') + "` isn't a valid command.");
			} else {
				delete require.cache[require.resolve(`./commands/${args.join(' ')}.js`)];
				msg.reply("Command `" + args.join(' ') + "` was reloaded.");
			}
		} else if (msg.author.id == '205319106608627722' && command == "create" && msg.content.startsWith(guildSettings.get(msg.guild.id).prefix)) {
			if(args.length < 1) {
				msg.reply("Please specify a command name.");
			} else if (files.some(a => args.join(' ') + '.js' == a)) {
				msg.reply("`" + args.join(' ') + "` already exists.");
			} else {
				fs.writeFile(`./commands/${args.join(' ')}.js`, 'const Discord = require("discord.js");\n\nexports.description = "Put description here";\nexports.examples = ["Put examples here"];\n\nexports.run = (bot, msg, args, guildSettings) => {\n\n// Put code here\n\n}', (err) => {if (err) throw err;})
				msg.reply("Command `" + args.join(' ') + "` was created. Check in \"commands\" folder and edit the code.");
			}
	}
	})
})

console.log(chalk.bgBlue.white("[Login]") + chalk.white(" Bot loaded. Trying to log in."));
bot.login(config.token).catch(() => {
	console.log(chalk.bgBlue.white("[Login]") + chalk.white(" Error while logging in. Check your internet connection."))
	process.exit();
});