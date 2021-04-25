const linebot = require('./lib/linebot');
const express = require('express');
const rp = require('request-promise');
const bodyParser = require('body-parser');


// 讀取開放資料庫資料
function readAQI(repos){
    let data;
    for (i in repos) {
        if (repos[i].SiteName == SITE_NAME) {
            data = repos[i];
            break;
        }
    }
    return data;
}

const bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const linebotParser = bot.parser();

const app = express();
app.set('view engine', 'ejs');

const SITE_NAME = '楠梓';

// 空氣品質開放資料庫
const aqiOpt = {
    uri: "http://opendata2.epa.gov.tw/AQI.json",
    json: true
}; 

app.get('/',function(req,res){
    rp(aqiOpt)
    .then(function (repos) {
        res.render('index', {AQI:readAQI(repos)});
    })
    .catch(function (err) {
		res.send("無法取得空氣品質資料～");
    });
});


//app.get('/',function(req,res){
//    res.send('Hello World!');
//});

app.post('/linewebhook', linebotParser);

// 回覆收到的訊息文字
bot.on('message', function (event) {
	switch (event.message.type) {
		case 'text':
			let data;
			rp(aqiOpt)
			.then(function (repos) {
				data = readAQI(repos);
				event.reply(
					data.County + data.SiteName +'\n\nPM2.5指數：'+ data["PM2.5_AVG"] + 
					    '\n狀態：' + data.Status);
					})
					.catch(function (err) {
				event.reply('無法取得空氣品質資料～');
					});
			break;
		case 'sticker':
			event.reply({
				type: 'sticker',
				packageId: 1,
				stickerId: 1
			});
			break;
	}
	
});

app.listen(process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
