# Dirección visual de RobotLab

El rediseño Night Arcade usa azul noche y morado oscuro, con bordes cian y violeta y acentos dorados. El brillo se concentra en los bordes y estados importantes, mientras las superficies de trabajo se mantienen tranquilas. Las abejas originales son las protagonistas. Los controles usan una familia de iconos SVG en lugar de emojis.

## Recursos recomendados para crear

| Prioridad | Imagen | Formato y tamaño | Dónde usarla |
| --- | --- | --- | --- |
| 1 | Laboratorio creativo ilustrado | WebP, 1920 × 1080 | Fondo del inicio, detrás de Bee-Bot |
| 2 | Mesa de construcción vacía | WebP, 1600 × 1000 | Fondo del tablero, sin tapar las piezas |
| 3 | Retratos de Rugged y Ludio | PNG transparente, 1024 × 1024 cada uno | Selección de personajes cuando estén disponibles |
| 4 | Colección de insignias | PNG transparente, 512 × 512 por insignia | Resultados y recompensas |
| 5 | Pizarra ilustrada vacía | WebP, 1200 × 900 | Fondo del área para dibujar cuentas |
| 6 | Tarjetas de misión ilustradas | WebP, 1200 × 800 | Fondos temáticos de los seis modelos |

## Prompts listos para usar

Adjunta una Bee-Bot original al generar los recursos para mantener el estilo. Pide fondos sin texto: los títulos y botones deben seguir siendo elementos de la página.

### 1. Laboratorio del inicio

> Fondo ilustrado para un videojuego educativo infantil. Laboratorio creativo nocturno acogedor con una mesa azul oscura, una ventana redondeada, herramientas de manualidades y una pequeña planta. Estilo de ilustración 2D de cuento, contornos suaves, sombreado sencillo. Paleta azul noche y morado oscuro con detalles cian y violeta luminosos y acentos amarillo miel. Iluminación suave, bordes luminosos discretos, sin luces intensas en la zona central. Perspectiva frontal ligeramente elevada. Dejar el centro y el lado derecho despejados para colocar una abeja robot por separado. Sin personajes, sin texto, sin letras, sin logotipos, sin interfaz. Formato horizontal 16:9.

### 2. Mesa de construcción

> Superficie de trabajo vacía para un juego de personalización de robots. Mesa de manualidades vista desde arriba, color azul noche con cuadrícula de puntos cian muy tenue, esquinas decorativas mínimas y algunos detalles pequeños solo en los bordes. Ilustración 2D limpia, cálida y amigable, tonos azul marino y morado oscuro, con bordes cian y violeta. Gran zona central completamente libre y de bajo contraste para colocar piezas de un personaje. Sin personajes, herramientas centrales, texto, botones ni interfaz. Formato horizontal 8:5.

### 3. Personajes futuros

> Retrato de [Rugged, un robot explorador resistente / Ludio, un pequeño robot viajero del espacio] para un videojuego educativo infantil. Personaje completo en tres cuartos, silueta clara, aspecto simpático y expresivo. Ilustración 2D con contorno oscuro y sombreado suave, coherente con la Bee-Bot de referencia. Diseño original. Fondo transparente. Sin textos, sin tarjetas, sin elementos de interfaz. Formato cuadrado.

### 4. Insignias

> Una insignia de recompensa para un videojuego educativo infantil: [estrella de creatividad / medalla de matemáticas / trofeo de constructor / flor de paciencia]. Diseño 2D sencillo, volumen suave, contorno oscuro, paleta amarillo miel, cian y violeta. Alegre y legible a tamaño pequeño. Objeto aislado, fondo transparente, sin letras ni números, sin bordes de tarjeta. Formato cuadrado.

### 5. Pizarra

> Pizarra de borrador ilustrada para un juego educativo, superficie azul noche limpia, marco muy fino morado con esquinas cian luminosas, detalles discretos de lápices solo en las esquinas exteriores. Estilo 2D cálido y amigable. Todo el centro vacío y uniforme, con cuadrícula azul muy tenue para dibujar encima con tiza clara. Sin fórmulas, sin letras, sin trazos, sin personajes, sin botones. Formato horizontal 4:3.

### 6. Temas para las misiones

> Fondo ilustrado 2D para una tarjeta de misión infantil con tema de [jardín de flores / laboratorio de slime / aventura pirata / estación de bomberos / desierto vaquero / estrellas violetas]. Paleta azul noche y morado oscuro con un acento cian, magenta o dorado del tema, contornos suaves, composición sencilla y cálida. Mantener una zona amplia vacía en el centro para superponer la Bee-Bot original. Los detalles del tema solo en el borde. Sin personajes, texto, letras, interfaz ni logotipos. Formato horizontal 3:2.

## Cómo integrarlos después

- El inicio ya usa `assets/ui/lab.svg`, un fondo vectorial ligero creado para este rediseño. Un futuro fondo ilustrado puede reemplazar su referencia en `js/main.js`.
- La mesa actual se dibuja con CSS; puedes añadir una imagen de fondo en `.board` de `css/studio.css`.
- Las abejas siguen siendo los PNG originales en `assets/references/`, separados de sus fondos.
- Conserva los botones y textos en HTML para que sigan siendo interactivos y se adapten a cada pantalla.
- Evita imágenes con títulos o números incrustados y usa fondos sin animaciones intensas detrás de problemas matemáticos.

## Recursos adicionales para el duelo

- Avatares sin texto para los jugadores: uno cian y otro violeta, 512 × 512, PNG transparente.
- Insignia de victoria y medalla de participación, 512 × 512, PNG transparente.
- Fondo de resultados con dos zonas amplias vacías para mostrar las creaciones, 1920 × 1080, WebP.

Prompt de avatares:

> Dos avatares originales de pequeños inventores robot para un videojuego educativo infantil, coherentes con el estilo de la Bee-Bot de referencia. Ilustración 2D, contorno oscuro, sombreado suave, formas amigables, sin armas ni expresiones agresivas. Uno tiene detalles cian y azul; el otro, violeta y magenta. Producir cada avatar por separado sobre fondo transparente, centrado, sin texto, sin números, sin logotipos. Formato cuadrado.

Conserva la distinción entre jugadores por nombre y número, además del color. El color por sí solo no debe indicar quién está jugando.
