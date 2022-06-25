import { Boom } from '@hapi/boom';
import makeWASocket, { AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, toNumber, useSingleFileAuthState } from './src';
import logger from './src/Utils/logger';
import { Sticker, createSticker, StickerTypes } from 'wa-sticker-formatter' // ES6
var request = require("request");
var requestProno = require("request");
import fetch from 'cross-fetch';
const fs = require("fs");
const schedule = require("node-schedule");
const setTitle = require('node-bash-title');
const { Telegraf } = require('telegraf')
const botTelegram = new Telegraf("5532849447:AAEB8VKtefVK5k-HSiNAJaEMZNmnF4Er-PU")




var data = {};
var cookieVisa = "";

var numeroDeBoton;

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger: logger.child({ level: 'debug', stream: 'store' }) })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store_multi.json')
}, 10_000)

const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

// start a connection
const startSock = async() => {
	setTitle('Server-Sid');

	
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWASocket({
		version,
		logger: logger.child({ level: 'silent' }),
		printQRInTerminal: true,
		auth: state,
		// implement to handle retries
		getMessage: async key => {
			return {
				conversation: 'hello'
			}
		}
	})

	store.bind(sock.ev)

	//leerData(data.json);
    if (fs.existsSync("data.json")) {
        let data2 = fs.readFileSync("data.json", "utf-8");
        data = JSON.parse(data2);
    }
    
	// Se ejecuta en cada mensaje entrante
	sock.ev.on('messages.upsert', async m => {
		const msg = m.messages[0];
		muestroMensajePorConsola(msg);
		
		
		if(!msg.key.fromMe && m.type === 'notify' && msg.key.remoteJid != "status@broadcast"  ){
			let nroOnceDig = msg.key.remoteJid.substring(0,13);
			await sock!.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id]);
			let key = {
				remoteJid: msg.key.remoteJid,
				id: msg.key.id, // id of the message you want to read
				participant: msg.key.participant // the ID of the user that sent the  message (undefined for individual chats)
			}
			await sock.readMessages([key]);

			//Si el mensaje es de un grupo
			let isGroup = msg.key.remoteJid.includes("-");
			if (msg.key.remoteJid.includes("-")) {
				let mensaje = String(msg.message.conversation).toLocaleUpperCase();
				//Si es el primer mensaje que recibe en un grupo
				if (!data[nroOnceDig]) {
					//user = await chat.getContact();
					data[nroOnceDig] = {
						camino: "0",
						nombre: msg.pushName,
						esGrupo: isGroup,
					};
					// guardo en local
					console.log("PRIMERA VEZ DE " + data[nroOnceDig].nombre);
					await sendMessageWTyping(msg.key.remoteJid, { text: "Hola grupo *" +
					msg.pushName + "*. Soy el Sid. Escribe *!info* para conocer como te puedo ayudar" }, sock);
					let sticker = new Sticker('stickers/saludoGrupo.png');
					sock.sendMessage(msg.key.remoteJid, await sticker.toMessage())
					fs.writeFileSync('data.json',JSON.stringify(data));

				}
			
				// if (String(String(msg.message.conversation).toUpperCase()).startsWith("!STATUS")) {
				// 	menuProvincias(msg);
				// }
				// if (String(String(msg.selectedRowId).toUpperCase()).startsWith("L")) {
				// 	menuLocalidades(msg);
				// }
				// if (String(String(msg.selectedRowId).toUpperCase()).startsWith("M")) {
				// 	prono(msg);
				// 	await delay(2000);
				// }
	
				// mensaje == "!INFO" ? infoGrupo(msg, grupos) : false;
				// mensaje == "!MEME" ? memeGrupo(msg) : false;
				// mensaje == "!CLANDE" || mensaje == "!CLANDES" ? clande(msg) : false;
				// mensaje == "!TOMEMUCHO" || mensaje == "!TOME MUCHO"
				// 	? tomemucho(msg)
				// 	: false;
				
				if (msg.message.conversation.startsWith("!coti")) {
					eth(msg, sock);
				}
	
				if (msg.message.conversation.startsWith("!resto")) {
					resto(msg, sock);
				}
	
				if (msg.message.conversation.startsWith("!kios")) {
					kiosko(msg, sock);
				}
	
				// if (msg.message.conversation.startsWith("!dolar")) {
				// 	dolarHoy(msg);
				// }
				if (msg.message.conversation.toUpperCase().startsWith("!REPORTEMANUAL")) {
					reporteMineros(msg, sock);
				}
			}
			else{ // Si el mensaje no es de grupo

				if (!data[nroOnceDig]) {
					data[nroOnceDig] = {
						camino: "0",
						nombre: msg.pushName,
						esGrupo: isGroup,
					};
					// guardo en local
					console.log("PRIMERA VEZ DE " + data[nroOnceDig].nombre);
					await sendMessageWTyping(msg.key.remoteJid, { text:"Hola *" + msg.pushName + "*! Soy el Sid, un demo de asistente virtual para Empresas 🙂"}, sock);
					let sticker = new Sticker('stickers/saludoGrupo.png');
					sock.sendMessage(msg.key.remoteJid, await sticker.toMessage())
					fs.writeFileSync('data.json',JSON.stringify(data));
				}

				// Si el mensaje es boton
				if(msg.message?.buttonsResponseMessage){
					switch (msg.message.buttonsResponseMessage.selectedButtonId) {
						case "1":
							menuProvincias(msg, sock);
							break;
						case "2":
							menuMasInfo(msg, sock);
							break;
						case "3":
							await sendMessageWTyping(msg.key.remoteJid, {text: "Quieres agregar algún comentario? _(nombre de la empresa u horarios de contacto)_"}, sock );
							data[nroOnceDig].camino = "contactar";
							break;
						case "S":
							menu0(msg, sock);
							break;
						case "N":
							await sendMessageWTyping(msg.key.remoteJid, {text: "Gracias por comunicarse"}, sock );
							break;
						case "Cripto":
							//await eth(msg);
							eth(msg, sock).then(() => {
								menuFin(msg, sock);
							});
							break;
						case "Dolar":
							await dolarHoy(msg, sock);
							menuFin(msg, sock);
							break;
						default:
					}
				}
				else{// Si el mensaje no es un botón

					//Si el mensaje es lista
					if(typeof msg.message?.listResponseMessage != 'undefined' && msg.message?.listResponseMessage){
						if(msg.message.listResponseMessage.singleSelectReply.selectedRowId.toUpperCase().startsWith("L")){
							menuLocalidades(msg, sock);
							data[nroOnceDig].camino = "muestroLocalidades";
						}
						if(msg.message.listResponseMessage.singleSelectReply.selectedRowId.toUpperCase().startsWith("M")){
							await prono(msg, sock);
							await menuFin(msg, sock);
							data[nroOnceDig].camino = "muestroMunicipios";
						}
					}
					switch (data[nroOnceDig].camino) {
						case '0':
							menu0(msg, sock);
							break;
						case 'contactar':
							let nroOnceDig = msg.key.remoteJid.substring(0,13);
							await sendMessageWTyping(msg.key.remoteJid, { text: "Gracias por comunicarse. Nos pondremos en contacto a la brevedad 🙂"}, sock);
							await sendMessageWTyping("5493434614428@s.whatsapp.net", { text: "Nuevo cliente. Comentario " + msg.message.conversation + "\n\r\n\rEnviar WSP: https://wa.me/" + nroOnceDig}, sock);
							await menuFin(msg, sock);
							break;
						default:
						}
					}
				}

			if(!msg.key.fromMe && m.type === 'notify' && msg.key.remoteJid == "5493434614428@s.whatsapp.net"){
			//await sendMessageWTyping(msg.key.remoteJid, {text: "Prueba escribiendo"}, sock );
			}
				
			
		}
        
	
	})

	sock.ev.on('chats.set', item => console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`))
	sock.ev.on('messages.set', item => console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`))
	sock.ev.on('contacts.set', item => console.log(`recv ${item.contacts.length} contacts`))


	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		console.log("connection.update");
		console.log("connection ", connection);
		console.log("lastDisconnect ", lastDisconnect);
		if(connection === 'close') {
			// reconnect if not logged out
			if((lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
				startSock()
			} else {
				console.log(`Connection closed. You are logged out.`)
			}
		}
        
		console.log(` connection update `, update)
	})

	const rule = new schedule.RecurrenceRule();

	rule.hour = 8;
	rule.minute = 0;

	const job = schedule.scheduleJob(rule, async function () {
		try {
			reporteEzilAutomatico(sock);
		} catch (error) {
			console.log("Error en reporteEzilAutomatico",error)
		}
	});

	botTelegram.launch();
	// while (true) {
		
    // }

	return sock
}

startSock();

const sendMessageWTyping = async(jid: string, msg: AnyMessageContent, sock) => {
	await sock.presenceSubscribe(jid)
	await delay(500)

	await sock.sendPresenceUpdate('composing', jid)
	await delay(500)

	await sock.sendPresenceUpdate('paused', jid)

	await sock.sendMessage(jid, msg)
}


// funciones
function muestroMensajePorConsola(msg){
	//console.log(msg);
	try {
		if(msg.message.conversation !== ""){
			console.log(msg.key.remoteJid + " en texto dice " + msg.message.conversation)
		}
	} catch (error) {
		
	}
	try {
		if(msg.message.listResponseMessage.singleSelectReply.selectedRowId !== ""){
			console.log(msg.key.remoteJid + " en lista dice " + msg.message.listResponseMessage.singleSelectReply.selectedRowId)
		}
	} catch (error) {
		
	}
	try{
		if(msg.message.buttonsResponseMessage.selectedButtonId !== ""){
			console.log(msg.key.remoteJid + " en boton dice " + msg.message.buttonsResponseMessage.selectedButtonId)
		}
	}	
	catch (error) {
		
	}

}


async function eth(msg, sock) {
	let mensaje = "";
	var options = {
		method: "GET",
		url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2C%20ethereum%2C%20cardano%2C%20zilliqa&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h"           
	};
	request(options, function (error, response) {
		if (error) throw new Error(error);
		let dataETH = JSON.parse(response.body);
		// Bitcoin
		if(dataETH[0].price_change_percentage_24h >= -0.5 && dataETH[0].price_change_percentage_24h <= 0.5){
			mensaje += "⚪ "
		}
		if(dataETH[0].price_change_percentage_24h < -0.5 ){
			mensaje += "🔴 "
		}
		if(dataETH[0].price_change_percentage_24h > 0.5 ){
			mensaje += "🟢 "
		}
		mensaje +=
			"*" + String(dataETH[0].symbol).toUpperCase() + "* " +
			dataETH[0].current_price + " *" + String(dataETH[0].price_change_percentage_24h).substring(0,4) +  "%*\n";
		// ETH
		if(dataETH[1].price_change_percentage_24h >= -0.5 && dataETH[1].price_change_percentage_24h <= 0.5){
			mensaje += "⚪ "
		}
		if(dataETH[1].price_change_percentage_24h < -0.5 ){
			mensaje += "🔴 "
		}
		if(dataETH[1].price_change_percentage_24h > 0.5 ){
			mensaje += "🟢 "
		}
		mensaje +=
		"*" + String(dataETH[1].symbol).toUpperCase() + "* " +
		dataETH[1].current_price + " *" + String(dataETH[1].price_change_percentage_24h).substring(0,4) +  "%*\n";
		// ADA
		if(dataETH[2].price_change_percentage_24h >= -0.5 && dataETH[2].price_change_percentage_24h <= 0.5){
			mensaje += "⚪ "
		}
		if(dataETH[2].price_change_percentage_24h < -0.5 ){
			mensaje += "🔴 "
		}
		if(dataETH[2].price_change_percentage_24h > 0.5 ){
			mensaje += "🟢 "
		}
		mensaje += "*" + String(dataETH[2].symbol).toUpperCase() + "* " + 	dataETH[2].current_price + " *" + String(dataETH[2].price_change_percentage_24h).substring(0,4) +  "%*\n";
		
		// ZIL
		if(dataETH[3].price_change_percentage_24h >= -0.5 && dataETH[3].price_change_percentage_24h <= 0.5){
			mensaje += "⚪ "
		}
		if(dataETH[3].price_change_percentage_24h < -0.5 ){
			mensaje += "🔴 "
		}
		if(dataETH[3].price_change_percentage_24h > 0.5 ){
			mensaje += "🟢 "
		}
		mensaje += "*" + String(dataETH[3].symbol).toUpperCase() + "* " + 	dataETH[3].current_price + " *" + String(dataETH[3].price_change_percentage_24h).substring(0,4) +  "%*\n";
		
		sock.sendMessage(msg.key.remoteJid, {text: mensaje });
	});
}
// info peya

async function resto(msg, sock){	
	let separador_1 = String(msg.message.conversation).indexOf(" ");
	let palabraBuscada = String(msg.message.conversation).substring(separador_1 + 1, msg.message.conversation.length).toUpperCase();
	console.log("palabraBuscada ", palabraBuscada);	
	let mensaje = "";
	try {
		const options = {
			headers: {
				"Cookie": "__cf_bm=vhyKMrea.ksvV0PkmUlulJksouEVJNOsZVP66LpHDgs-1652460630-0-AYQc2oIyvTFjw+4TuyEfLveJhnRMu12CA/QGAeEex5C+WdWtFkpdhJuDd0EGVpcGsC/12f+ynPLTZ3piZ4DlBvs=; __Secure-peya.sid=s%3A3bc58c0b-c0d1-4f67-8604-0af38c687aef.T%2BuzY%2BurOZtf9t98ynf0b0gKYUAxs%2FS2wQTe74kZns4; __Secure-peyas.sid=s%3A8ae74ee8-89f7-48db-9a6b-fd8daf9357d0.v7w%2FcECoKYzDx8Oln2egJnHYADmw8p5hKoq80Upc3zM; _pxhd=J8ryt44rqt9M9ds5Hp22PFBAM7OVdmt0SGsxZ6n2Hnqp3tJ5SF7oG7It1fiB1Chg4RJOQy9YV5iO9Ukhq3vyrg==:kzjViQs7XJxUV6ylFxnO61EghUuxVJH0UpPC3WpSpdrCAO1eAU3tzYqAuKvSe7K3tfIz0a1SMCpQooEQTGMFnm53LtweMljmWMbhhF97eDE=; dhhPerseusGuestId=1652459145608.464051755445313860.oswpfz4x1ha; dhhPerseusHitId=1652460647457.941337551076386400.qu8c8viodp; dhhPerseusSessionId=1652459145608.236012217951970140.4hx6ln75w7a",
				"referer": " https://www.pedidosya.com.ar/restaurantes?address=Victoria%20250&areaId=21584&areaName=Paran%C3%A1&city=Paran%C3%A1&lat=-31.727399826049805&lng=-60.523399353027344"
			  }
		}
        const response = await fetch("https://www.pedidosya.com.ar/mobile/v5/shopList?businessType=RESTAURANT&country=3&includePaymentMethods=Decidir%2CSpreedly%20AR&max=100&offset=0&point=-31.727399826049805%2C-60.523399353027344&sortBy=default&withFilters=true", options);
        const data = await response.json();
		let comercios  = data.list.data;
		let informoComercioNombres = String(Array.from(comercios, x => x['name'] + "\n"));
		informoComercioNombres = "*En " + (comercios.length * 1) +" segundos obtendrás resultados de los siguientes comercios:* \n\n" + informoComercioNombres.replace(/,/g,'');
		sock.sendMessage(msg.key.remoteJid, {text: informoComercioNombres});
		for(let i = 0; i< comercios.length; i++) {
			let enComercio = "";
			console.log("Buscando en " + comercios[i].name + " " + comercios[i].id + " ...⌛");
			//sock.sendMessage(msg.key.remoteJid, {text: "Buscando en " + comercios[i].name + " " + comercios[i].id + " ...⌛" });
			const responseRes = await fetch("https://www.pedidosya.com.ar/v2/niles/partners/"+ comercios[i].id + "/menus", options);
			const dataRes = await responseRes.json();
			dataRes.sections.forEach(element => {
				let encontrados = "";
				//console.log("Seccion " + element.name + ":");
				element.products.forEach(product =>{
					if(String(product.name).toUpperCase().includes(palabraBuscada)){
						encontrados += "▪️ " + product.name + ": $" + product.price.finalPrice + "\n";
					}
				});
				enComercio += encontrados;
			});
			console.log("enComercio ", enComercio);
			if(enComercio != ""){
				mensaje += "👇" + comercios[i].name + "\n" + enComercio;
			}
			await delay(1000);
		}
		if(mensaje != ""){
			sock.sendMessage(msg.key.remoteJid, {text: mensaje});
		}else{
			sock.sendMessage(msg.key.remoteJid, {text: "Servicio saturado"});
		}
    } catch (error) {
        console.error(error);
    }
}

async function kiosko(msg, sock){	
	let separador_1 = String(msg.message.conversation).indexOf(" ");
	let palabraBuscada = String(msg.message.conversation).substring(separador_1 + 1, msg.message.conversation.length).toUpperCase();
	console.log("palabraBuscada ", palabraBuscada);	
	let mensaje = "";
	try {
		const options = {
			headers: {
				"Cookie": "__cf_bm=vhyKMrea.ksvV0PkmUlulJksouEVJNOsZVP66LpHDgs-1652460630-0-AYQc2oIyvTFjw+4TuyEfLveJhnRMu12CA/QGAeEex5C+WdWtFkpdhJuDd0EGVpcGsC/12f+ynPLTZ3piZ4DlBvs=; __Secure-peya.sid=s%3A3bc58c0b-c0d1-4f67-8604-0af38c687aef.T%2BuzY%2BurOZtf9t98ynf0b0gKYUAxs%2FS2wQTe74kZns4; __Secure-peyas.sid=s%3A8ae74ee8-89f7-48db-9a6b-fd8daf9357d0.v7w%2FcECoKYzDx8Oln2egJnHYADmw8p5hKoq80Upc3zM; _pxhd=J8ryt44rqt9M9ds5Hp22PFBAM7OVdmt0SGsxZ6n2Hnqp3tJ5SF7oG7It1fiB1Chg4RJOQy9YV5iO9Ukhq3vyrg==:kzjViQs7XJxUV6ylFxnO61EghUuxVJH0UpPC3WpSpdrCAO1eAU3tzYqAuKvSe7K3tfIz0a1SMCpQooEQTGMFnm53LtweMljmWMbhhF97eDE=; dhhPerseusGuestId=1652459145608.464051755445313860.oswpfz4x1ha; dhhPerseusHitId=1652460647457.941337551076386400.qu8c8viodp; dhhPerseusSessionId=1652459145608.236012217951970140.4hx6ln75w7a",
				"referer": " https://www.pedidosya.com.ar/restaurantes?address=Victoria%20250&areaId=21584&areaName=Paran%C3%A1&city=Paran%C3%A1&lat=-31.727399826049805&lng=-60.523399353027344"
			  }
		}
        const response = await fetch("https://www.pedidosya.com.ar/mobile/v5/shopList?businessType=KIOSKS&country=3&includePaymentMethods=Decidir%2CSpreedly%20AR&max=100&offset=0&point=-31.727399826049805%2C-60.523399353027344&sortBy=default&withFilters=true", options);
        const data = await response.json();
		let comercios  = data.list.data;
		
		let informoComercioNombres = String(Array.from(comercios, x => x['name'] + "\n"));
		informoComercioNombres = "*En " + (comercios.length * 1) +" segundos obtendrás resultados de los siguientes comercios:* \n\n" + informoComercioNombres.replace(/,/g,'');
		sock.sendMessage(msg.key.remoteJid, {text: informoComercioNombres});
		for(let i = 0; i< comercios.length; i++) {
			let enComercio = "";
			console.log("Buscando en " + comercios[i].name + " " + comercios[i].id + " ...⌛");
			//sock.sendMessage(msg.key.remoteJid, {text: "Buscando en " + comercios[i].name + " " + comercios[i].id + " ...⌛" });
			const responseRes = await fetch("https://www.pedidosya.com.ar/v2/niles/partners/"+ comercios[i].id + "/menus", options);
			const dataRes = await responseRes.json();
			dataRes.sections.forEach(element => {
				let encontrados = "";
				//console.log("Seccion " + element.name + ":");
				element.products.forEach(product =>{
					if(String(product.name).toUpperCase().includes(palabraBuscada)){
						encontrados += "▪️ " + product.name + ": $" + product.price.finalPrice + "\n";
					}
				});
				enComercio += encontrados;
			});
			console.log("enComercio ", enComercio);
			if(enComercio != ""){
				mensaje += "👇" + comercios[i].name + "\n" + enComercio;
			}
			await delay(1000);
		}
		if(mensaje != ""){
			sock.sendMessage(msg.key.remoteJid, {text: mensaje});
		}else{
			sock.sendMessage(msg.key.remoteJid, {text: "Servicio saturado"});
		}
    } catch (error) {
        console.error(error);
    }
}

function reporteMineros(msg, sock) {
	let mensaje = "";
	fetch("https://stats.ezil.me/current_stats/0x742e321ad8052a6ae7240e0c8e2b2c037ede19cd/workers/paginated?page=1&coin=eth&per_page=50") //1
		.then(res => res.json())
		.then((data_mineros) => {
			let bodyS = data_mineros;
			//console.log("JSON",JSON.stringify(bodyS));
			// do something with JSON
			var d = new Date();
			var n = d.toLocaleTimeString();
			mensaje = "";
			
			let sumatoriahd = 0;
			let contadorActivos = 0;
			for (let index = 0; index < bodyS.data.items.length; index++) {
				switch (bodyS.data.items[index].status) {
					case 'online':
						contadorActivos++;
						mensaje += "🟢 ";
						break;
					case 'warning':
						contadorActivos++;
						mensaje += "🟡 ";
						break;
					case 'offline':
						mensaje += "🔴 ";
						break;
				}
				sumatoriahd += bodyS.data.items[index].daily_hashrate;
				let hd;
				//console.log(bodyS.data.items[index].worker, " ", bodyS.data.items[index].daily_hashrate);
				switch (String(bodyS.data.items[index].daily_hashrate).length) {
					case 9:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 5);
						hd = [hd.slice(0, 3), ",", hd.slice(3)].join("");
						break;
					case 8:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 4);
						hd = [hd.slice(0, 2), ",", hd.slice(2)].join("");
						break;
					case 7:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 3);
						hd = [hd.slice(0, 1), ",", hd.slice(1)].join("");
						break;
					default:
						break;
				}

				// if (String(bodyS.data.items[index].daily_hashrate).length > 8) {
				// 	hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 5);
				// 	hd = [hd.slice(0, 3), ",", hd.slice(3)].join("");
				// } else {
				// 	hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 4);
				// 	hd = [hd.slice(0, 2), ",", hd.slice(2)].join("");
				// }
				mensaje +=
					"*" + hd + "*    " + bodyS.data.items[index].worker + " " + "\n";
			}
			
			let sumatoriahdAInformar = String(sumatoriahd).substring(0, 5);
			sumatoriahdAInformar = [sumatoriahdAInformar.slice(0, 3), ".", sumatoriahdAInformar.slice(3)].join(
				""
			 );
			mensaje += "\n*" + sumatoriahdAInformar + "* promedio Workers activos";
			fetch("https://stats.ezil.me/current_stats/0x742e321ad8052a6ae7240e0c8e2b2c037ede19cd/reported")
				.then(res => res.json())
				.then((data_general) => {
					let promedioGeneral = data_general.eth.daily_hashrate;
					promedioGeneral = String(promedioGeneral).substring(0, 5);
					promedioGeneral = [promedioGeneral.slice(0, 3), ".", promedioGeneral.slice(3)].join("");
					mensaje += "\n*" + promedioGeneral + "* promedio general";

					// Agrego la consulta de coti
					const cc = require("cryptocompare");
					cc.setApiKey("3091aa001da7e9ae556aff7130476dee223a9b180c25d974e1067caaee3a1156");

					mensaje += "\n\n"

					
					var options = {
						method: "GET",
						url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2C%20ethereum%2C%20cardano&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h"           
					};
					request(options, function (error, response) {
						if (error) throw new Error(error);
						let dataETH = JSON.parse(response.body);
						// Bitcoin
						if(dataETH[0].price_change_percentage_24h >= -0.5 && dataETH[0].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[0].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[0].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje +=
							"*" + String(dataETH[0].symbol).toUpperCase() + "* " +
							dataETH[0].current_price + " *%" + String(dataETH[0].price_change_percentage_24h).substring(0,4) +  "*\n";
						// ETH
						if(dataETH[1].price_change_percentage_24h >= -0.5 && dataETH[1].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[1].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[1].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje +=
						"*" + String(dataETH[1].symbol).toUpperCase() + "* " +
						dataETH[1].current_price + " *%" + String(dataETH[1].price_change_percentage_24h).substring(0,4) +  "*\n";
						// ADA
						if(dataETH[2].price_change_percentage_24h >= -0.5 && dataETH[2].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[2].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[2].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje += "*" + String(dataETH[2].symbol).toUpperCase() + "* " + 	dataETH[2].current_price + " *%" + String(dataETH[2].price_change_percentage_24h).substring(0,4) +  "*\n";
						
						let mensajeFinal = "Reporte diario " + String(n).substring(0, 5) + "hs \n\n *Activos: " + contadorActivos + "*\n\n" + mensaje;
						sock.sendMessage(msg.key.remoteJid, {text: mensajeFinal });
					});
				})
		});

}
    
function reporteEzilAutomatico(sock) {
	let mensaje = "";
	fetch("https://stats.ezil.me/current_stats/0x742e321ad8052a6ae7240e0c8e2b2c037ede19cd/workers/paginated?page=1&coin=eth&per_page=30&name=") //1
		.then(res => res.json())
		.then((data_mineros) => {
			let bodyS = data_mineros;
			//console.log("JSON",JSON.stringify(bodyS));
			// do something with JSON
			var d = new Date();
			var n = d.toLocaleTimeString();
			mensaje = "";
			
			let sumatoriahd = 0;
			let contadorActivos = 0;
			for (let index = 0; index < bodyS.data.items.length; index++) {
				switch (bodyS.data.items[index].status) {
					case 'online':
						contadorActivos++;
						mensaje += "🟢 ";
						break;
					case 'warning':
						contadorActivos++;
						mensaje += "🟡 ";
						break;
					case 'offline':
						mensaje += "🔴 ";
						break;
				}
				sumatoriahd += bodyS.data.items[index].daily_hashrate;
				let hd;
				//console.log(bodyS.data.items[index].worker, " ", bodyS.data.items[index].daily_hashrate);
				switch (String(bodyS.data.items[index].daily_hashrate).length) {
					case 9:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 5);
						hd = [hd.slice(0, 3), ",", hd.slice(3)].join("");
						break;
					case 8:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 4);
						hd = [hd.slice(0, 2), ",", hd.slice(2)].join("");
						break;
					case 7:
						hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 3);
						hd = [hd.slice(0, 1), ",", hd.slice(1)].join("");
						break;
					default:
						break;
				}

				// if (String(bodyS.data.items[index].daily_hashrate).length > 8) {
				// 	hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 5);
				// 	hd = [hd.slice(0, 3), ",", hd.slice(3)].join("");
				// } else {
				// 	hd = String(bodyS.data.items[index].daily_hashrate).substring(0, 4);
				// 	hd = [hd.slice(0, 2), ",", hd.slice(2)].join("");
				// }
				mensaje +=
					"*" + hd + "*    " + bodyS.data.items[index].worker + " " + "\n";
			}
			
			let sumatoriahdAInformar = String(sumatoriahd).substring(0, 5);
			sumatoriahdAInformar = [sumatoriahdAInformar.slice(0, 3), ".", sumatoriahdAInformar.slice(3)].join(
				""
			 );
			mensaje += "\n*" + sumatoriahdAInformar + "* promedio Workers activos";
			fetch("https://stats.ezil.me/current_stats/0x742e321ad8052a6ae7240e0c8e2b2c037ede19cd/reported")
				.then(res => res.json())
				.then((data_general) => {
					let promedioGeneral = data_general.eth.daily_hashrate;
					promedioGeneral = String(promedioGeneral).substring(0, 5);
					promedioGeneral = [promedioGeneral.slice(0, 3), ".", promedioGeneral.slice(3)].join("");
					mensaje += "\n*" + promedioGeneral + "* promedio general";

					// Agrego la consulta de coti
					const cc = require("cryptocompare");
					cc.setApiKey("3091aa001da7e9ae556aff7130476dee223a9b180c25d974e1067caaee3a1156");

					mensaje += "\n\n"

					
					var options = {
						method: "GET",
						url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2C%20ethereum%2C%20cardano&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h"           
					};
					request(options, function (error, response) {
						if (error) throw new Error(error);
						let dataETH = JSON.parse(response.body);
						// Bitcoin
						if(dataETH[0].price_change_percentage_24h >= -0.5 && dataETH[0].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[0].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[0].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje +=
							"*" + String(dataETH[0].symbol).toUpperCase() + "* " +
							dataETH[0].current_price + " *%" + String(dataETH[0].price_change_percentage_24h).substring(0,4) +  "*\n";
						// ETH
						if(dataETH[1].price_change_percentage_24h >= -0.5 && dataETH[1].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[1].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[1].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje +=
						"*" + String(dataETH[1].symbol).toUpperCase() + "* " +
						dataETH[1].current_price + " *%" + String(dataETH[1].price_change_percentage_24h).substring(0,4) +  "*\n";
						// ADA
						if(dataETH[2].price_change_percentage_24h >= -0.5 && dataETH[2].price_change_percentage_24h <= 0.5){
							mensaje += "⚪ "
						}
						if(dataETH[2].price_change_percentage_24h < -0.5 ){
							mensaje += "🔴 "
						}
						if(dataETH[2].price_change_percentage_24h > 0.5 ){
							mensaje += "🟢 "
						}
						mensaje += "*" + String(dataETH[2].symbol).toUpperCase() + "* " + 	dataETH[2].current_price + " *%" + String(dataETH[2].price_change_percentage_24h).substring(0,4) +  "*\n";
						
						let mensajeFinal = "Reporte diario " + String(n).substring(0, 5) + "hs \n\n *Activos: " + contadorActivos + "*\n\n" + mensaje;
						sock.sendMessage('5493435168151-1617190656@g.us', {text: mensajeFinal });
					});
				})
		});
}

async function menu0(msg, sock) {
    const buttons0 = [
        {buttonId: '1', buttonText: {displayText: 'Pronostico de hoy'}, type: 1},
        {buttonId: '2', buttonText: {displayText: 'Más información'}, type: 1},
        {buttonId: '3', buttonText: {displayText: 'Comprar un asistente'}, type: 1}
      ]
      const buttonmessages0 = {
          text: "Por favor *presiona* una opción del menú " + msg.pushName + "👇",
          buttons: buttons0,
          headerType: 1
      }
	await sendMessageWTyping(msg.key.remoteJid,buttonmessages0 , sock);

}

function menuProvincias(msg, sock) {
    var headers = {
        "Content-Type": "application/json",
    };

    var options = {
        url: "https://apis.datos.gob.ar/georef/api/provincias?orden=nombre&aplanar=true&campos=estandar&exacto=true&max=100",
        method: "GET",
        headers: headers,
    };
    try {
        request(options,async function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let bodyS = JSON.parse(body);
                let mensaje = bodyS;
                //client.sendMessage(msg.from, mensaje);

                var objetoData = Object.keys(bodyS["provincias"]);
                // Si no tiene un solo plan

                let row = [];
                //Listo las boletas del dni seleccionado
                let cantidad = 1;
                objetoData.forEach(function (key) {
                    let obj = {
                        rowId: "L" + String(bodyS["provincias"][key]["id"]),
                        title: String(bodyS["provincias"][key]["nombre"]),
                    };
                    row[cantidad - 1] = obj;
                    cantidad++;
                });

				let sections = [{ rows: row }];
				const listMessage = {
				  text: "*Elija su provincia*",
				  buttonText: "Provincias",
				  sections,
				};
				await sendMessageWTyping(msg.key.remoteJid,listMessage , sock);
            }
            error ? console.log(error) : null;
        });
    } catch (error) {
        console.log("Error en la consulta de provincias", error);
    }
}

function menuLocalidades(msg, sock) {
    var headers = {
        "Content-Type": "application/json",
    };
    var options = {
        url:
            "https://apis.datos.gob.ar/georef/api/departamentos?provincia=" +
            msg.message.listResponseMessage.singleSelectReply.selectedRowId.substring(1, msg.message.listResponseMessage.singleSelectReply.selectedRowId.length) +
            "&aplanar=true&campos=estandar&exacto=true&max=100",
        method: "GET",
        headers: headers,
    };
    try {
        request(options, async function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let bodyS = JSON.parse(body);
                let mensaje = bodyS;
                var objetoData = Object.keys(bodyS["departamentos"]);
                // Si no tiene un solo plan

                let row = [];
                //Listo las boletas del dni seleccionado
                let cantidad = 1;
                objetoData.forEach(function (key) {
                    let obj = {
                        rowId: "M" + String(bodyS["departamentos"][key]["id"]),
                        title: String(bodyS["departamentos"][key]["nombre"]),
                    };
                    row[cantidad - 1] = obj;
                    cantidad++;
                });

				let sections = [{ rows: row }];
				const listMessage = {
				  text: "*Elija su departamento*",
				  buttonText: "Departamentos",
				  sections,
				};
				await sendMessageWTyping(msg.key.remoteJid,listMessage , sock);
            }
            error ? console.log(error) : null;
        });
    } catch (error) {
        console.log("Error en la consulta de provincias", error);
    }
}

function prono(msg, sock) {
	return new Promise(function (resolve, reject) {
		var headers = {
			"Content-Type": "application/json",
		};

		var options = {
			url:
				"https://apis.datos.gob.ar/georef/api/departamentos?id=" +
				String(msg.message.listResponseMessage.singleSelectReply.selectedRowId).substring(1, msg.message.listResponseMessage.singleSelectReply.selectedRowId.length) +
				"&aplanar=true&max=100",
			method: "GET",
			headers: headers,
		};
		try {
			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					let bodyS = JSON.parse(body);
					var optionsPronostico = {
						url:
							"https://api.openweathermap.org/data/2.5/weather?lat=" +
							bodyS["departamentos"][0]["centroide_lat"] +
							"&lon=" +
							bodyS["departamentos"][0]["centroide_lon"] +
							"&appid=5f0b754c7e74244148500e736a3d74a0&lang=es&units=metric",
						method: "GET",
						headers: headers,
					};
					requestProno(optionsPronostico, async function (error, response, body) {
						if (!error && response.statusCode == 200) {
							let bodyProno = JSON.parse(body);
							let mensaje = "";
							mensaje =
								"*Pronostico en " +
								bodyS["departamentos"][0]["nombre"] +
								"* \n\n";
							mensaje += "*Tiempo* " + bodyProno["weather"][0]["description"];
							bodyProno["weather"][0]["main"] == "Clouds"
								? (mensaje += " ☁️")
								: null;
							bodyProno["weather"][0]["main"] == "Rain"
								? (mensaje += " 🌧️")
								: null;
							bodyProno["weather"][0]["main"] == "Clear"
								? (mensaje += " ☀️")
								: null;
							mensaje += "\n";
							mensaje +=
								"*Temp* °" +
								bodyProno["main"]["temp"] +
								" - Min °" +
								bodyProno["main"]["temp_min"] +
								" - Max °" +
								bodyProno["main"]["temp_max"];
							mensaje += "\n";
							mensaje += "*Humedad* %" + bodyProno["main"]["humidity"];
							await sendMessageWTyping(msg.key.remoteJid, {text: mensaje} , sock);
							resolve('');
						}
					});

					error ? console.log(error) : null;
				}
			});
		} catch (error) {
			console.log("Error en la consulta de provincias", error);
			resolve('');
		}
		
	});
}

async function menuFin(msg, sock) {
	const buttonsFin = [
        {buttonId: 'S', buttonText: {displayText: 'Si'}, type: 1},
        {buttonId: 'N', buttonText: {displayText: 'No'}, type: 1}
      ]
      const buttonmessagesFin = {
          text: "¿Tenés otra consulta " + msg.pushName + "?",
          buttons: buttonsFin,
          headerType: 1
      }
	await sendMessageWTyping(msg.key.remoteJid,buttonmessagesFin , sock);    
}

async function menuMasInfo(msg, sock) {
	const buttonsInfo = [
        {buttonId: 'Cripto', buttonText: {displayText: 'Criptomonedas'}, type: 1},
        {buttonId: 'Dolar', buttonText: {displayText: 'Dolar hoy'}, type: 1}
      ]
      const buttonmessagesInfo = {
          text: "Por favor *presiona* una opción del menú " + msg.pushName + "👇",
          buttons: buttonsInfo,
          headerType: 1
      }
	await sendMessageWTyping(msg.key.remoteJid,buttonmessagesInfo , sock);    

}

async function dolarHoy(msg, sock) {
	return new Promise(function (resolve, reject) {
		var requestDolar = require("request");
		var options = {
			method: "GET",
			url: "https://api.bluelytics.com.ar/v2/latest",
		};
		requestDolar(options, async function (error, response) {
			if (error) throw new Error(error);
			let bodyS = JSON.parse(response.body);
			console.log(bodyS);
			let mensaje = "";
			mensaje +=
				"*Última actualización* " +
				String(bodyS["last_update"]).replace(/T/, " ").replace(/\..+/, "") +
				"hs 💸\n\n";
			mensaje += "*Oficial:* $" + bodyS["oficial"]["value_sell"] + "\n";
			mensaje += "*Blue:* $" + bodyS["blue"]["value_sell"] + "\n";
			mensaje += "*Euro:* $" + bodyS["blue_euro"]["value_sell"] + "";

			await sendMessageWTyping(msg.key.remoteJid,{text: mensaje} , sock);    
			resolve('');
		});
	});

}

var nombresCelu = [
    {
        worker: "Exe",
        celu: "5493434729231@s.whatsapp.net",
        aviso: false,
        aux: false,
        baja: false,
    },
    {
        worker: "german",
        celu: "5493434614428@s.whatsapp.net",
        aviso: false,
        aux: false,
        baja: false,
    },
    {
        worker: "MarianoWork",
        celu: "5493434671746@s.whatsapp.net",
        aviso: false,
        aux: false,
        baja: false,
    },
];



function consulto_ezil(sock) {
    var headers = {
        "Content-Type": "application/json",
    };

    var options = {
        url: "https://stats.ezil.me/current_stats/0x742e321ad8052a6ae7240e0c8e2b2c037ede19cd/workers",
        method: "GET",
        headers: headers,
    };
    try {
        request(options,async  function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let bodyS = JSON.parse(body);
                let mensaje = "";

                for (var nombres of nombresCelu) {
                    if (!nombres.baja) {
                        for (var worker of bodyS) {
                            if (nombres.worker == worker.worker) {
                                nombres.aux = true;
                                //console.log("Esta on " + nombres.worker);
                            }
                        }
                    }
                }

                for (var nombres of nombresCelu) {
                    if (
                        nombres.aux == false &&
                        nombres.aviso == false &&
                        nombres.baja == false
                    ) {
                        const buttonsInfo = [
							{buttonId: 'Arriba', buttonText: {displayText: 'Ya lo levanté'}, type: 1},
							{buttonId: 'Baja', buttonText: {displayText: 'No me avises más'}, type: 1}
						  ]
						const buttonmessagesInfo = {
							  text: "Está caído *" + nombres.worker + "*",
							  buttons: buttonsInfo,
							  headerType: 1
						  }
						await sendMessageWTyping(nombres.celu, buttonmessagesInfo , sock);    

                        nombres.aviso = true;
                        console.log("Avisé a " + nombres.worker);
                    }
                    nombres.aux = false;
                }
            }
            error ? console.log(error) : null;
        });
    } catch (error) {
        console.log("Error en la consulta de activos", error);
    }
}