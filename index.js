const Discord = require("discord.js");
const fs = require("fs");
const mineflayer = require("mineflayer");
const ms = require("ms");
const chalk = require("chalk");
const client = new Discord.Client();

let config = require("./config.json");
let token = config.token;
let guild = config.guild;
let prefix = config.prefix;
let admin = config.adminRole
let username = config.username;
let password = config.password;
let server = config.server;
let joincommand = config.joincommand;

let timer = new Set();
let timercooldown = 7;

let color = "FF4848";
let white = chalk.hex("#ffffff");
let consolecolor = chalk.hex("#FF4848");

let bot = mineflayer.createBot({
    version: "1.9",
    host: server,
    username: username,
    password: password,
});

let perms = new Discord.RichEmbed()
    .setDescription(`:warning: You must have the \`${admin}\` role to use this command`)
    .setColor(color)
let norole = new Discord.RichEmbed()
    .setDescription(`:warning: The admin role does not exist in this guild`)
    .setColor(color)
let nosettings = new Discord.RichEmbed()
    .setDescription(`:warning: This guild has not been setup with \`${prefix}config\` yet`)
    .setColor(color)

client.on("ready", async () => {
    console.log('\x1B[2J\x1B[3J\x1B[H\x1Bc')
    console.log(white("────────────────────────────────────────────────────────────"))
    console.log(`${consolecolor("• Bot User \u00bb")} ${white(`Logged into user`)} ${consolecolor(client.user.tag)}`)
    console.log(`${consolecolor("• Credits \u00bb")} ${white(`Made By`)} ${consolecolor("Max.#0069")}`)
    console.log(white("────────────────────────────────────────────────────────────"))
})

bot.on("login", async () => {
    console.log(`${consolecolor("• Bot User \u00bb")} ${white(`Logged into IGN`)} ${consolecolor(bot.username)}`)
    console.log(`${consolecolor("• Server \u00bb")} ${white(`Logged into`)} ${consolecolor(server)}`)
    console.log(white("────────────────────────────────────────────────────────────"))
    bot.chat(joincommand)
})

// Explosion Event (TNT Detector Itself)
bot._client.on('explosion', data => {
    fs.readFile("./settings.json", "utf8", function (err, datam) {
        var setting = JSON.parse(datam);

        if (setting.enabled == true) {
            const embed = new Discord.RichEmbed()
                .setThumbnail("http://icons.iconarchive.com/icons/chrisl21/minecraft/256/Tnt-icon.png")
                .setColor(color)
                .setTitle("TNT Detected")
                .setDescription(`**Tnt has been detected near this bot**
                
                **Explosion X** - ${(Math.round(data.x * 100) / 100).toFixed(0)}
                **Explosion Y** - ${(Math.round(data.y * 100) / 100).toFixed(0)}
                **Explosion Z** - ${(Math.round(data.z * 100) / 100).toFixed(0)}`)

            if (timer.has(guild)) return

            let channel = client.channels.get(setting.channel)
            if (!channel) return
            let role = client.guilds.get(guild).roles.find(role => role.name === setting.pingrole)
            if (!role) { channel.send("@everyone") } else { channel.send(`${role}`) }
            channel.send(embed)
            timer.add(guild)

            if (setting.ingamealerts == true) {
                bot.chat(` TNT at X - ${(Math.round(data.x * 100) / 100).toFixed(0)}, Y - ${(Math.round(data.y * 100) / 100).toFixed(0)}, Z - ${(Math.round(data.z * 100) / 100).toFixed(0)}`)
                // Change the Chat message here (I.E Add /ff ETC.)
            }
            setTimeout(() => {
                timer.delete(guild)
            }, 1000 * timercooldown);
        }
    })
})

// Discord Bot Commands
client.on("message", async msg => {
    if (msg.channel.type === "dm") return;
    if (msg.guild.id !== guild) return
    const perms = msg.guild.roles.find(x => x.name === `${admin}`)
    if (!msg.content.startsWith(prefix)) return
    let args = msg.content.split(" ").slice(1)
    let command = msg.content.split(" ")[0];
    command = command.slice(prefix.length)

    function success(sent) {
        const embed = new Discord.RichEmbed()
            .setDescription(`:white_check_mark: ${sent}`)
            .setColor(color)
        msg.channel.send(embed)
    }

    function usage(sent) {
        const embed = new Discord.RichEmbed()
            .setDescription(`:warning: Usage: \`${prefix}${sent}\``)
            .setColor(color)
        msg.channel.send(embed)
    }

    function warning(sent) {
        const embed = new Discord.RichEmbed()
            .setDescription(`:warning: ${sent}`)
            .setColor(color)
        msg.channel.send(embed)
    }

    function error(sent) {
        const embed = new Discord.RichEmbed()
            .setDescription(`:x: ${sent}`)
            .setColor(color)
        msg.channel.send(embed)
    }

    fs.readFile("./settings.json", "utf8", function (err, data) {
        var setting = JSON.parse(data);

        if (command == "help") {
            if (setting.blacklists.includes(msg.channel.id)) return warning("This channel is currently blacklisted")

            const embed = new Discord.RichEmbed()
                .setDescription(`**${prefix}help -** Show this menu
            **${prefix}blacklist [#channel] -** Blacklist a channel from bot commands
            **${prefix}setchannel [#channel] -** Set the notify channel 
            **${prefix}togglealerts -** Enable / Disable the TNT detectors
            **${prefix}setrole [role name] -** Set the role to be pinged by detectors 
            **${prefix}toggleingame -** Enable / Disable ingame tnt alerts 
            **${prefix}configs -** Show all set configuration`)
                .setColor(color)
                .setTitle("Help Menu")
                .setFooter("Charged Development")
            msg.channel.send(embed)


        } else if (command == "blacklist") {
            if (!perms) return msg.channel.send(norole)
            if (!msg.member.roles.has(perms.id) && !msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(noperms)

            if (!args[0]) return usage("blacklist [#channel]")
            let mention = args[0].toString().replace(/[<>@#!]+/g, "")
            if (!mention) return usage("blacklist [#channel]")

            if (setting.blacklists.includes(mention)) {
                setting.blacklists.splice(setting.blacklists.indexOf(`${mention}`), 1);
                success(`Removed <#${mention}> from the command blacklist.`)
            } else {
                setting.blacklists.push(mention)
                success(`Added <#${mention}> to the command blacklist.`)
            }
            const toWrite = JSON.stringify(setting, null, 2)
            fs.writeFileSync('./settings.json', toWrite)


        } else if (command == "setchannel") {
            if (setting.blacklists.includes(msg.channel.id)) return

            if (!perms) return msg.channel.send(norole)
            if (!msg.member.roles.has(perms.id) && !msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(noperms)

            if (!args[0]) return usage("setchannel [#channel]")
            let mention = args[0].toString().replace(/[<>@#!]+/g, "")
            if (!mention) return usage("setchannel [#channel]")

            setting.channel = mention
            success(`Set alerts channel to <#${mention}>`)

            const toWrite = JSON.stringify(setting, null, 2)
            fs.writeFileSync('./settings.json', toWrite)


        } else if (command == "togglealerts") {
            if (setting.blacklists.includes(msg.channel.id)) return

            if (!perms) return msg.channel.send(norole)
            if (!msg.member.roles.has(perms.id) && !msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(noperms)

            if (setting.enabled == false) {
                setting.enabled = true
                success("Alerts are now set to **TRUE**")
            } else {
                setting.enabled = false
                success("Alerts are now set to **FALSE**")
            }
            const toWrite = JSON.stringify(setting, null, 2)
            fs.writeFileSync('./settings.json', toWrite)


        } else if (command == "setrole") {
            if (setting.blacklists.includes(msg.channel.id)) return

            if (!msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(perm)

            let mention = args[0]
            if (!mention) return usage("setrole [role name]")
            setting.pingrole = mention

            success(`Set ping role to **${mention}**`)
            const toWrite = JSON.stringify(setting, null, 2)
            fs.writeFileSync('./settings.json', toWrite)


        } else if (command == "toggleingame") {
            if (setting.blacklists.includes(msg.channel.id)) return

            if (!msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(perm)
            if (setting.ingamealerts == false) {
                setting.ingamealerts = true
                success("Ingame Alerts are now set to **TRUE**")
            } else {
                setting.ingamealerts = false
                success("Ingame Alerts are now set to **FALSE**")
            }
            const toWrite = JSON.stringify(setting, null, 2)
            fs.writeFileSync('./settings.json', toWrite)


        } else if (command == "configs") {
            if (setting.blacklists.includes(msg.channel.id)) return

            if (!msg.member.hasPermission(`ADMINISTRATOR`)) return msg.channel.send(perm)
            const embed = new Discord.RichEmbed()
                .setDescription(`:white_check_mark: **Configurations for this guild**
                
                **Alerts Channel** - <#${setting.channel}>
                **Ingame Alerts**- ${setting.ingamealerts}
                **Ping Role** - ${setting.pingrole}
                **Alerts Enabled** - ${setting.enabled}`)
                .setThumbnail(msg.guild.iconURL)
                .setColor(color)
            msg.channel.send(embed)
        }
    })
})

client.login(token) 