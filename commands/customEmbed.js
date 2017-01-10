const rssConfig = require('../config.json')
const rssList = rssConfig.sources
const updateConfig = require('../util/updateJSON.js')

module.exports = function (message, rssIndex, callback) {

  var embedProperties = [["Color", "The sidebar color of the embed\nThis MUST be an integer color. See https://www.shodor.org/stella2java/rgbint.html", "color"],
                        ["Author Title", "Title of the embed\nAccepts tags.", "authorTitle"],
                        ["Author Avatar URL", "The avatar picture to the left of author title.\nThis MUST be a link to an image. If an Author Title is not specified, the Author Avatar URL will not be shown.", "authorAvatarURL"],
                        ["Thumbnail URL", "The picture on the right hand side of the embed\nThis MUST be a link to an image, OR the {thumbnail} tag for YouTube videos.", "thumbnailURL"],
                        ["Message", "Main message of the embed\nAcceps tags.", "message"],
                        ["Footer Text", "The bottom-most text\nAccepts tags.", "footerText"],
                        ["URL", "A link that clicking on the title will lead to.\nThis MUST be a link. By default this is set to the feed's url", "url"],
                        ["Remove", "Remove and reset all properties.", "remove"]]

  var embedListMsg = "```Markdown\n"
  for (var prop in embedProperties) {
    embedListMsg += `[${embedProperties[prop][0]}]: ${embedProperties[prop][1]}\n\n`
  }
  embedListMsg += "```"


  if (rssList[rssIndex].embedMessage == null || rssList[rssIndex].embedMessage.properties == null)
    rssList[rssIndex].embedMessage = {
      enabled: 0,
      properties: {}
    };

  let currentEmbedProps = "```Markdown\n";
  let propertyList = rssList[rssIndex].embedMessage.properties;
  for (var property in propertyList) {
    //let current = "";
    for (var y in embedProperties)
      if (embedProperties[y][2] == property && propertyList[property] != null && propertyList[property] != "") {
        currentEmbedProps += `[${embedProperties[y][0]}]: ${propertyList[property]}\n`
      }
  }
  if (currentEmbedProps == "```Markdown\n") currentEmbedProps = "```\nNo properties set.\n";

  message.channel.sendMessage(`The current embed properties for ${rssList[rssIndex].link} are: \n${currentEmbedProps + "```"}\nThe available properties are: ${embedListMsg}\n**Type the embed property (shown in brackets [property]) you want to set/reset**, or type exit to cancel.`);

  const filter = m => m.author.id == message.author.id;
  const customCollect = message.channel.createCollector(filter,{time:240000});
  customCollect.on('message', function (chosenProp) {
    if (chosenProp.content.toLowerCase() == "exit") {callback(); return customCollect.stop("RSS customization menu closed.");}

    var choice = "";
    for (var e in embedProperties) {
      if (chosenProp.content.toLowerCase() == embedProperties[e][0].toLowerCase())
        choice = embedProperties[e][2];
    }

    if (choice == "") return message.channel.sendMessage("That is not a valid property.");
    else if (choice == "remove") {
      message.channel.startTyping();
      customCollect.stop();
      rssList[rssIndex].embedMessage = {};
      updateConfig('./config.json', rssConfig);
      callback();
      message.channel.stopTyping();
      return message.channel.sendMessage("Embed has been disabled, and all properties have been removed.");//.then(m => m.channel.stopTyping());
    }
    else {
      //property collector
      customCollect.stop()
      message.channel.sendMessage(`Set the property now. To reset the property, type \`reset\`.\n\nRemember that you can use tags \`{title}\`, \`{description}\`, \`{link}\`, and etc. in the correct fields. To find other tags, you may first type \`exit\` then use \`${rssConfig.prefix}rsstest\`.`);
      const propertyCollect = message.channel.createCollector(filter, {time: 240000});

      propertyCollect.on('message', function (propSetting) {
        if (propSetting.content.toLowerCase() == "exit") {callback(); return propertyCollect.stop("RSS customization menu closed.");}
        else if (choice == "color" && isNaN(parseInt(propSetting.content,10)) && propSetting.content !== "reset") return message.channel.sendMessage("The color must be an **number**. See https://www.shodor.org/stella2java/rgbint.html. Try again.");
        else if ((choice == "authorAvatarURL" || choice == "thumbnailURL") && propSetting.content !== "reset" && !rssList[rssIndex].link.includes("youtube") && !propSetting.content.startsWith("http")) return message.channel.sendMessage("URLs must link to actual images. Try again.");
        else if (choice == "attachURL" && propSetting.content !== "reset" && !propSetting.content.startsWith("http")) {return message.channel.sendMessage("URL option must be a link. Try again.");}
        else {
          message.channel.startTyping();
          let finalChange = propSetting.content;
          if (choice == "color") finalChange = parseInt(propSetting.content,10);
          propertyCollect.stop();
          if (isNaN(parseInt(finalChange,10)) && finalChange.toLowerCase() == "reset") delete rssList[rssIndex].embedMessage.properties[choice];
          else rssList[rssIndex].embedMessage.properties[choice] = finalChange;
          rssList[rssIndex].embedMessage.enabled = 1;
          updateConfig('./config.json', rssConfig);
          callback();
          if (isNaN(parseInt(finalChange,10)) && finalChange.toLowerCase() == "reset") {
            message.channel.stopTyping();
            return message.channel.sendMessage(`Settings updated. The property \`${choice}\` has been reset.`);
          }
          else {
            message.channel.stopTyping();
            return message.channel.sendMessage(`Settings updated. The property \`${choice}\` has been set to \`\`\`${finalChange}\`\`\`You may use \`${rssConfig.prefix}rsstest\` to see your new embed format.`);
          }
        }
      });
      propertyCollect.on('end', (collected, reason) => {
        if (reason == "time") return message.channel.sendMessage(`I have closed the menu due to inactivity.`);
        else if (reason !== "user") return message.channel.sendMessage(reason);
      });
      }
    });
    customCollect.on('end', (collected, reason) => {
      if (reason == "time") return message.channel.sendMessage(`I have closed the menu due to inactivity.`);
      else if (reason !== "user") return message.channel.sendMessage(reason);
    });
 }
