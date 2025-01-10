const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MySQLAdapter = require('@bot-whatsapp/database/mysql'); // Asegúrate de que esta es la importación correcta
const mysql = require('mysql'); // Importar el módulo mysql
const { delay } = require('@whiskeysockets/baileys');

const MYSQL_DB_HOST = 'localhost';
const MYSQL_DB_USER = 'Miller';
const MYSQL_DB_PASSWORD = 'Miller2001*';
const MYSQL_DB_NAME = 'test';
const MYSQL_DB_PORT = '3306';

const NumVendor = '51962196883'; // Número de WhatsApp Business
let nombreGlobal = ''; // Variable global para almacenar el nombre
let clienteGlobal = ''; // Variable global para almacenar el nombre del cliente

const flowDatos = addKeyword('USUARIOS_NO_REGISTRADOS')
    .addAnswer('Es tu primera vez en nuestra tienda en línea. Por favor, proporciona tus datos para continuar. 📝')
    .addAnswer('Por favor, proporciona tu nombre completo:', { capture: true }, async (ctx) => {
        const nombre = ctx.body;
        console.log("Nombre del cliente:", nombre);

        // Guardar el nombre en la variable global
        nombreGlobal = nombre;
    })
    .addAnswer('Por favor, proporciona tu correo electrónico:', { capture: true }, async (ctx, { fallBack, flowDynamic }) => {
        const email = ctx.body;
        if (!email.includes('@')) {
            await flowDynamic('Por favor, ingresa un correo electrónico válido. 📧');
            return fallBack();
            
        }
        const numero = ctx.from;
        console.log("Correo del cliente:", email);
        console.log("Número del cliente:", numero);

        // Insertar datos en la base de datos
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

        // Cerrar la conexión
        connection.end();
    });

const flowEnlace_two = addKeyword('@')
    .addAnswer('Para un mejor resultado por favor escribe el nombre de tu producto más el modelo de vehículo. 🚗🔧')
    .addAnswer('¿Qué producto deseas comprar? 🛍️', { capture: true }, async (ctx, { flowDynamic }) => {
        const NomProd = ctx.body;

        function generarEnlaceDeBusqueda(palabraClave) {
            const enlaceBusqueda = `https://daytonaautopartes.com/busqueda?s=${encodeURIComponent(palabraClave)}`;
            console.log("Enlace de búsqueda:", enlaceBusqueda);
            return enlaceBusqueda;
        }

        const palabra = NomProd;
        const enlaceCliente = generarEnlaceDeBusqueda(palabra);
        console.log("Enlace de búsqueda:", enlaceCliente);
        await flowDynamic(`Ingrese aquí para ver su producto: ${enlaceCliente} 🔗`);
    });

const flowEnlace = addKeyword('USUARIOS_REGISTRADOS')
    .addAnswer('¿Qué producto deseas comprar? 🛍️', { capture: true }, async (ctx, { flowDynamic }) => {
        const NomProd = ctx.body;

        function generarEnlaceDeBusqueda(palabraClave) {
            const enlaceBusqueda = `https://daytonaautopartes.com/busqueda?s=${encodeURIComponent(palabraClave)}`;
            console.log("Enlace de búsqueda:", enlaceBusqueda);
            return enlaceBusqueda;
        }

        const palabra = NomProd;
        const enlaceCliente = generarEnlaceDeBusqueda(palabra);
        console.log("Enlace de búsqueda:", enlaceCliente);
        await flowDynamic(`Ingrese aquí para ver su producto: ${enlaceCliente} 🔗`);
        let url = `https://api.whatsapp.com/send?phone=${NumVendor}&text=Hola, Soy ${clienteGlobal} no encontre  *${NomProd}* en la pagina web, me podrias ayudar?`;
        let encodedUrl = url.replace(/ /g, '+');
    
        await flowDynamic(`Si necesita contactar con un agente de ventas ingresar aqui por favor: ${encodedUrl}`, {delay: 10000})
        
    });

const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'buenas', 'buena', 'ola'])
    .addAnswer('Recuerda que puedes comprar en nuestra tienda en línea. Es seguro y confiable. 🛒✨')
    .addAnswer('Para crear una cuenta en nuestra página web y recibir super promociones y descuentos, ingresa al siguiente enlace: 🎁👇')
    .addAnswer('https://daytonaautopartes.com/crear-cuenta')
    .addAnswer('Si deseas seguir la atención por este medio escribe "si" 📝', { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const numero = ctx.from;

        // Verificar si el número ya está registrado
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
                // Si el número está registrado, obtener el nombre y saltar a la pregunta del producto
                const nombreCliente = results[0].nombre;
                clienteGlobal = nombreCliente;
                console.log('Número existe. Nombre del cliente:', nombreCliente);
                await flowDynamic(`Hola ${clienteGlobal}. Para un mejor resultado por favor escribe el nombre de tu producto más el modelo de vehículo. 🚗🔧`);
                return gotoFlow(flowEnlace);
            } else {
                console.log('Número no existe');
                // Si el número no está registrado, continuar con las preguntas de datos
                return gotoFlow(flowDatos);
            }
        });
    });

const main = async () => {
    const adapterDB = new MySQLAdapter({
        host: MYSQL_DB_HOST,
        user: MYSQL_DB_USER,
        database: MYSQL_DB_NAME,
        password: MYSQL_DB_PASSWORD,
        port: MYSQL_DB_PORT,
    });

    const adapterFlow = createFlow([flowPrincipal, flowDatos, flowEnlace, flowEnlace_two]);
    const adapterProvider = createProvider(BaileysProvider);
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
    QRPortalWeb();
}

main();
