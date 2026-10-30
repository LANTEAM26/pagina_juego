BIBLIOTECA DE HISTORIAS · Lector compartido

INICIO
Abre index.html o Biblioteca.html. Son la misma biblioteca.
Reemplaza la carpeta Biblioteca completa: la música, los controles y el lector
son comunes a los tres cuentos y sus rutas deben mantenerse juntas.
No hace falta instalar paquetes ni compilar el proyecto.

CUENTOS DISPONIBLES
• Los tres cerditos: 11 páginas, sus narraciones y 5 actividades.
• Bertha Benz: 8 capítulos, moraleja, sus narraciones y 5 actividades.
• Ada Lovelace: 12 páginas, moraleja, 3 decisiones y 5 actividades.
El Principito y las dos nuevas historias conservan el estado Próximamente,
porque el paquete original no incluye sus relatos.

CONTROLES COMPARTIDOS
En Narrador puedes elegir Sin narrador, Por página o Automático.
La voz empieza un segundo después de que termine el giro de la hoja.
El modo automático espera en actividades y continúa cuando se resuelven.
El regulador Volumen de la voz es independiente de la música. Los ajustes de
voz y música se guardan en este navegador cuando el almacenamiento lo permite.
Bertha y Los tres cerditos usan los MP3 originales. Ada no traía grabaciones:
utiliza la voz española del navegador, también regulada. Si cambias su volumen
mientras habla, continúa desde la palabra más reciente al soltar el regulador.
Si no hay voces instaladas, sus páginas siguen disponibles para leer.

ACTIVIDADES
Las cartas se eligen o intercambian antes de pulsar Comprobar.
En el robot de Ada, Comprobar ejecuta el programa; toca una flecha ya añadida
para quitarla. En decisiones y en el invento final de Ada, ambas/todas las
opciones son válidas y se conserva su carácter de exploración.
La victoria usa el sonido compartido y pasa la hoja cuando termina.

ORGANIZACIÓN
assets/audio/musica/: las 6 canciones completas, una sola copia de cada una.
assets/audio/efectos/: efectos de victoria, error y páginas.
assets/fondos/rincon-lectura.png: fondo de todos los lectores.
assets/paginas/hoja-en-blanco.png: hoja de lectura compartida.
lector/lector.js y lector/lector.css: comportamiento y diseño de los cuentos.
js/audio-comun.js: playlist, volumen y ajustes de música compartidos.
cuentos/<nombre>/js/cuento.js: contenido y configuración de cada relato.
cuentos/<nombre>/assets/: ilustraciones, cartas y narraciones de ese cuento.
js/catalogo.js: portadas y enlaces de la biblioteca.

PARA AÑADIR MÚSICA O NARRACIONES
Añade las canciones a assets/audio/musica y su entrada en js/audio-comun.js.
Para una narración grabada, guarda el MP3 en assets/audio de su cuento y añade
la propiedad audio con su ruta en la página correspondiente de js/cuento.js.
La música se activa por defecto. Si el navegador bloquea la reproducción sin
interacción, comenzará al tocar un libro o elegir un modo de lectura.
