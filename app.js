const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const mysql = require('mysql2');
const { delay } = require('@whiskeysockets/baileys');
const { chromium } = require('playwright');
const { interpretarMensaje } = require('./gemini'); // Asegúrate de que esta funcione correctamente
const { getOrderStatus } = require('./prestashop'); // Asegúrate de que esta funcione correctamente
const { shortenUrl } = require('./acortar');

require('dotenv').config();

const MYSQL_DB_HOST = process.env.MYSQL_DB_HOST;
const MYSQL_DB_USER = process.env.MYSQL_DB_USER;
const MYSQL_DB_PASSWORD = process.env.MYSQL_DB_PASSWORD;
const MYSQL_DB_NAME = process.env.MYSQL_DB_NAME;
const MYSQL_DB_PORT = process.env.MYSQL_DB_PORT || '3306';

//const MYSQL_DB_HOST = 'localhost';
//const MYSQL_DB_USER = 'Miller';
//const MYSQL_DB_PASSWORD = 'Miller2001*';
//const MYSQL_DB_NAME = 'test';
//const MYSQL_DB_PORT = '3306';


const NumVendor = '51945852553';
let nombreGlobal = '';
let clienteGlobal = '';
let enlaceGlobal = '';
let productoGlobal = '';
let url1 = `https://api.whatsapp.com/send?phone=${NumVendor}&text=Hola, Soy ${clienteGlobal} encontre  *${productoGlobal}* en la pagina web, me podrias ayudar`;
let encodedUrl1 = url1.replace(/ /g, '+');


const flujoFinal = addKeyword(EVENTS.ACTION)
    .addAnswer('Se canceló por inactividad. Si necesitas ayuda, por favor escribe "Hola" para empezar de nuevo.', { capture: true }, async (ctx, { gotoFlow }) => {
        return gotoFlow(flowPrincipal);
    });

// Flujo para calificación
const flowCalificacion = addKeyword('calificacion')
    .addAnswer('Gracias, recuerda que puedes empezar de nuevo escribiendo "Hola". 🤖')
    .addAnswer('Por favor califica nuestro servicio de 1 a 5 estrellas. 🌟', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        const calificacion = parseInt(ctx.body);
        if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
            return fallBack();
        } else {
            const numero = ctx.from;
            console.log("Calificación del cliente:", calificacion);
            console.log("Número del cliente:", numero);

            const sql = 'INSERT INTO calificaciones (numero, calificacion) VALUES (?, ?)';
            const values = [numero, calificacion];

            const connection = mysql.createConnection({
                host: MYSQL_DB_HOST,
                user: MYSQL_DB_USER,
                password: MYSQL_DB_PASSWORD,
                database: MYSQL_DB_NAME,
                port: MYSQL_DB_PORT,
            });

            connection.query(sql, values, (err, results) => {
                if (err) {
                    console.error('Error al insertar calificación: ' + err.stack);
                    return;
                }
                console.log('Calificación insertada con id: ' + results.insertId);
            });

            connection.end();
            await flowDynamic('¡Gracias por tu calificación! 🌟');
        }
    });

const flowNo = addKeyword('noencontre')
    .addAnswer('Si no encontraste el producto que deseas, ingresa aquí para hablar con un agente de ventas📲:')
    .addAnswer(`https://api.whatsapp.com/send?phone=${NumVendor}&text=Hola,+quiero+ayuda+con+un+producto+🚗`)
    .addAnswer('Gracias, recuerda que puedes empezar de nuevo escribiendo "Hola". 🤖')
    .addAnswer('Por favor califica nuestro servicio de 1 a 5 estrellas. 🌟', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        const calificacion = parseInt(ctx.body);
        if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
            return fallBack();
        } else {
            const numero = ctx.from;
            console.log("Calificación del cliente:", calificacion);
            console.log("Número del cliente:", numero);

            const sql = 'INSERT INTO calificaciones (numero, calificacion) VALUES (?, ?)';
            const values = [numero, calificacion];

            const connection = mysql.createConnection({
                host: MYSQL_DB_HOST,
                user: MYSQL_DB_USER,
                password: MYSQL_DB_PASSWORD,
                database: MYSQL_DB_NAME,
                port: MYSQL_DB_PORT,
            });

            connection.query(sql, values, (err, results) => {
                if (err) {
                    console.error('Error al insertar calificación: ' + err.stack);
                    return;
                }
                console.log('Calificación insertada con id: ' + results.insertId);
            });

            connection.end();
            await flowDynamic('¡Gracias por tu calificación! 🌟');
        }
    });

//const flowLink = addKeyword('pregunta')
   // .addAnswer(['Encontraste el producto que buscabas?',
    //    '1. Si',
     //   '2. No'
  //  ],
    //    null,
    //    null,
    //    [flowCalificacion, flowNo]);

const flowLink = addKeyword('pregunta')
    .addAnswer(['Encontraste el producto que buscabas?', 
        '1. Si',
        '2. No'
    ], { capture: true, idle: 300000 }, async (ctx, { gotoFlow }) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        const respuesta = ctx.body;
    if (respuesta === '1' || respuesta === 'si')  {
            return gotoFlow(flowCalificacion);
        } else if (respuesta === '2' || respuesta === 'no') {
            return gotoFlow(flowNo);
        }
    });



// Flujo para búsqueda de productos para usuarios registrados
const flowEnlace = addKeyword('USUARIOS_REGISTRADOS')
    .addAnswer('¿Qué producto deseas comprar? 🛍️', { capture: true, idle: 300000 }, async (ctx, { flowDynamic, gotoFlow }) => {
        // Llamada a la IA para interpretar el mensaje
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }

        const NomProd = await interpretarMensaje(ctx.body);
        console.log("Producto interpretado:", NomProd);
        productoGlobal = NomProd;
        function generarEnlaceDeBusqueda(palabraClave) {
            const enlaceBusqueda = `https://daytonaautopartes.com/busqueda?s=${encodeURIComponent(palabraClave)}`;
            console.log("Enlace de búsqueda:", enlaceBusqueda);
            return enlaceBusqueda;
        }

        await flowDynamic('Procesando tu solicitud...⏳');
        const palabra = NomProd;
        const enlaceCliente = generarEnlaceDeBusqueda(palabra);

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(enlaceCliente);

        const productos = await page.$$eval('article.product-miniature', (results) => results.map((el) => {
            const title = el.querySelector('h3.product-title a').innerText;
            if (!title) return null;

            const image = el.querySelector('img').src;
            const price = el.querySelector('span.price').innerText;
            const link = el.querySelector('h3.product-title a').href;

            return { title, image, price, link };
        }));

        await browser.close();
        await flowDynamic('🚨*PARA COMPRAR EL PRODUCTO INGRESA AL LINK*');
        if (productos.length > 0) {
            for (const producto of productos) {
                if (producto) {

                    const mensaje = `🚗 *Producto:* ${producto.title}\n💲 *Precio:* ${producto.price}\n 🛒*Comprar:* ${producto.link}`;
                    await flowDynamic(mensaje, { media: producto.image });
                }
            }

            await flowDynamic('Ingresa aqui para mas resultados: ' + enlaceCliente, { delay: 10000 });

            return gotoFlow(flowLink);
        } else {
            let url = `https://api.whatsapp.com/send?phone=${NumVendor}&text=Hola, Soy ${clienteGlobal} no encontre  *${palabra}* en la pagina web, me podrias ayudar?`;
            let encodedUrl = url.replace(/ /g, '+');
            await flowDynamic(`No hay resultados por favor contactar con un agente de ventas aquí🔗: ${encodedUrl}`, { delay: 10000 });
            return gotoFlow(flowCalificacion);
        }
    });

// Flujo para búsqueda de productos para usuarios no registrados
const flowEnlace_two = addKeyword('@')
    .addAnswer('Para un mejor resultado por favor escribe el nombre de tu producto más el modelo de vehículo. 🚗🔧')
    .addAnswer('¿Qué producto deseas comprar? 🛍️', { capture: true, idle: 300000 }, async (ctx, { flowDynamic, gotoFlow }) => {
        // Llamada a la IA para interpretar el mensaje
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        
        const NomProd = await interpretarMensaje(ctx.body);
        console.log("Producto interpretado:", NomProd);
        productoGlobal = NomProd;
        function generarEnlaceDeBusqueda(palabraClave) {
            const enlaceBusqueda = `https://daytonaautopartes.com/busqueda?s=${encodeURIComponent(palabraClave)}`;
            console.log("Enlace de búsqueda:", enlaceBusqueda);
            return enlaceBusqueda;
        }

        await flowDynamic('Procesando tu solicitud...⏳');
        const palabra = NomProd;
        const enlaceCliente = generarEnlaceDeBusqueda(palabra);

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(enlaceCliente);

        const productos = await page.$$eval('article.product-miniature', (results) => results.map((el) => {
            const title = el.querySelector('h3.product-title a').innerText;
            if (!title) return null;

            const image = el.querySelector('img').src;
            const price = el.querySelector('span.price').innerText;
            const link = el.querySelector('h3.product-title a').href;

            return { title, image, price, link };
        }));

        await browser.close();
        await flowDynamic('🚨*PARA COMPRAR EL PRODDUCTO INGRESA AL LINK*');
        if (productos.length > 0) {
            for (const producto of productos) {
                if (producto) {

                    const mensaje = `🚗 *Producto:* ${producto.title}\n💲 *Precio:* ${producto.price}\n 🛒*Comprar:* ${producto.link}`;
                    await flowDynamic(mensaje, { media: producto.image });
                }
            }

            await flowDynamic('Ingresa aqui para mas resultados: ' + enlaceCliente, { delay: 10000 });

            return gotoFlow(flowLink);
        } else {
            let url = `https://api.whatsapp.com/send?phone=${NumVendor}&text=Hola, Soy ${clienteGlobal} no encontre  *${palabra}* en la pagina web, me podrias ayudar?`;
            let encodedUrl = url.replace(/ /g, '+');
            await flowDynamic(`No hay resultados por favor contactar con un agente de ventas aquí🔗: ${encodedUrl}`, { delay: 10000 });
            return gotoFlow(flowCalificacion);
        }
    });

// Flujo para obtener datos de usuarios no registrados
const flowDatos = addKeyword('USUARIOS_NO_REGISTRADOS')
    .addAnswer('Es tu primera vez en nuestra tienda en línea. Por favor, proporciona tus datos para continuar. 📝')
    .addAnswer('Por favor, proporciona tu nombre completo:', { capture: true, idle: 300000 }, async (ctx) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        const nombre = ctx.body;
        console.log("Nombre del cliente:", nombre);
        nombreGlobal = nombre;
    })
    .addAnswer('Por favor, proporciona tu correo electrónico:', { capture: true, idle: 30000 }, async (ctx, { fallBack, flowDynamic }) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        const email = ctx.body;
        if (!email.includes('@')) {
            await flowDynamic('Por favor, ingresa un correo electrónico válido. 📧');
            return fallBack();
        }
        const numero = ctx.from;
        console.log("Correo del cliente:", email);
        console.log("Número del cliente:", numero);

        const sql = 'INSERT INTO clientes (nombre, email, numero) VALUES (?, ?, ?)';
        const values = [nombreGlobal, email, numero];

        const connection = mysql.createConnection({
            host: MYSQL_DB_HOST,
            user: MYSQL_DB_USER,
            password: MYSQL_DB_PASSWORD,
            database: MYSQL_DB_NAME,
            port: MYSQL_DB_PORT,
        });

        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error al insertar datos: ' + err.stack);
                return;
            }
            console.log('Datos insertados con id: ' + results.insertId);
        });

        connection.end();
    });

// Flujos principales
// Modifica los flujos existentes para incluir la lógica de inactividad
const flowComprar = addKeyword(['1', 'comprar', 'producto'])
    .addAnswer('Recuerda que puedes comprar en nuestra tienda en línea. Es seguro y confiable. 🛒✨')
    .addAnswer('Para crear una cuenta en nuestra página web y recibir super promociones y descuentos, ingresa al siguiente enlace: 🎁👇')
    .addAnswer('https://daytonaautopartes.com/crear-cuenta')
    .addAnswer('Si deseas seguir la atención por este medio escribe "si" 📝', { capture: true, idle: 60000 }, async (ctx, { flowDynamic, gotoFlow }) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        console.log(ctx);
        const numero = ctx.from;

        const connection = mysql.createConnection({
            host: MYSQL_DB_HOST,
            user: MYSQL_DB_USER,
            password: MYSQL_DB_PASSWORD,
            database: MYSQL_DB_NAME,
            port: MYSQL_DB_PORT,
        });

        const sqlCheck = 'SELECT * FROM clientes WHERE numero = ?';
        connection.query(sqlCheck, [numero], async (err, results) => {
            if (err) {
                console.error('Error al verificar el número: ' + err.stack);
                return;
            }

            if (results.length > 0) {
                const nombreCliente = results[0].nombre;
                clienteGlobal = nombreCliente;
                console.log('Número existe. Nombre del cliente:', nombreCliente);
                await flowDynamic(`Hola ${clienteGlobal}. Para un mejor resultado por favor escribe el nombre de tu producto más el modelo de vehículo. 🚗🔧`);
                return gotoFlow(flowEnlace);
            } else {
                console.log('Número no existe');
                return gotoFlow(flowDatos);
            }
        });
    });

// Aplica la misma lógica de inactividad a otros flujos según sea necesario
const flowRastrear = addKeyword(['2', 'rastrear', 'pedido'])
    .addAnswer('Para rastrear tu pedido, por favor ingresa tu número de pedido. 🚚📦', { media: 'https://daytonaautopartes.com/bot/Numero%20de%20Comprobante.png', capture: true, idle: 300000 }, async (ctx, { flowDynamic, gotoFlow }) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
        const numeroPedido = ctx.body;
        console.log(`Número de pedido recibido: ${numeroPedido}`);
        try {
            const orderStatus = await getOrderStatus(numeroPedido);
            console.log('Estado del pedido:', orderStatus);
            const mensaje = `💲 *Total Pagado:* ${orderStatus.total_paid_tax_incl}\n📅 *Fecha de Pedido:* ${orderStatus.date_add}\n`;
            await flowDynamic(mensaje);
            await flowDynamic('Un agente de ventas te contactara para darte detalles de tu entrega. Gracias por tu compra 🛍️✨');
            return gotoFlow(flowCalificacion);
        } catch (error) {
            console.error('Error al obtener el estado del pedido:', error.message);
            await flowDynamic('Lo siento, no pude encontrar el estado de tu pedido. Por favor, verifica el número de pedido e inténtalo de nuevo.');
            return gotoFlow(flowRastrear);
        }
    });

// Asegúrate de incluir el flujo final en el flujo principal
const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer('Hola, soy Dayana tu asistente virtual. ¿En qué puedo ayudarte hoy? 🤖')
    .addAnswer([
        'Por favor escribe el número de la opción que deseas:',
        '1. 🛒 Comprar producto',
        '2. 📦 Rastrear pedido',
    ], { capture: true, idle: 300000 }, async (ctx, { gotoFlow }) => {
        if (ctx?.idleFallBack) {
            return gotoFlow(flujoFinal);
        }
    }, [flowComprar, flowRastrear]);





const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowDatos, flowEnlace, flowEnlace_two, flowCalificacion, flowComprar, flujoFinal]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
}

main();