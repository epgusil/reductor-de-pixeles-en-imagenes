# PIXEL SHRINKER 98 🖼

Herramienta web **100% client-side** para redimensionar imágenes, con una interfaz que imita un programa de escritorio de Windows 95/98/XP temprano.

Ninguna imagen se sube a ningún servidor: todo el procesamiento ocurre en el navegador del usuario mediante Canvas API.

## Características

- Carga por arrastrar y soltar o mediante botón "Examinar...".
- Soporta PNG, JPG, JPEG, JFIF, WEBP, GIF, BMP (y cualquier formato que el navegador pueda decodificar).
- Muestra información del archivo original: nombre, formato, dimensiones y peso.
- Redimensionado a píxeles exactos, con opción de mantener el aspect ratio (bloqueo/desbloqueo bidireccional ancho↔alto).
- Previsualización antes/después.
- Formatos de salida: JPG/JPEG, PNG (con transparencia) y WEBP.
- Control de calidad (10–100) para JPG y WEBP.
- Downscale progresivo por mitades (step-down) para mejor calidad en reducciones grandes, en vez de un solo `drawImage` directo.
- Estadísticas reales (no simuladas): tamaño original, tamaño nuevo y % de reducción, calculados sobre el `Blob` generado.
- Barra de progreso y status bar con mensajes tipo "Ready.", "Image loaded.", "Processing image...", "Done.".
- Manejo de errores amigable para archivos no compatibles o corruptos.
- Diseño responsive (prioridad visual desktop, funcional en móvil).

## Estructura del proyecto

```
pixel-shrinker-98/
├── index.html   # Estructura de la interfaz (ventana, menús, paneles)
├── style.css    # Estética retro Windows 95/98 (bordes 3D, botones raised/pressed, etc.)
├── script.js    # Lógica de carga, redimensionado (Canvas) y exportación
└── README.md    # Este archivo
```

No hay dependencias externas, frameworks ni build steps. Es HTML + CSS + JavaScript vanilla puro.

## Cómo usar localmente

1. Descarga o clona esta carpeta.
2. Abre `index.html` directamente en tu navegador (doble clic) — no requiere servidor.

## Cómo desplegar en GitHub Pages

1. Crea un nuevo repositorio en GitHub (por ejemplo `pixel-shrinker-98`).
2. Sube los archivos `index.html`, `style.css`, `script.js` y `README.md` a la raíz del repositorio (o a una rama `main`).
3. Ve a **Settings → Pages** en el repositorio.
4. En **Source**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
5. Guarda los cambios. GitHub Pages generará una URL del tipo:
   `https://<tu-usuario>.github.io/pixel-shrinker-98/`
6. Abre esa URL: la herramienta funcionará de inmediato, sin configuración adicional.

## Notas técnicas

- El redimensionado usa un `<canvas>` cuyo `width`/`height` se fija exactamente a las dimensiones solicitadas por el usuario — el archivo exportado tendrá esas dimensiones exactas en píxeles.
- Para reducciones grandes, se aplica un algoritmo de downscale escalonado (reduciendo a la mitad sucesivamente antes del ajuste final) para minimizar artefactos de aliasing, en lugar de escalar en un solo paso.
- Los archivos `.jfif` se detectan por extensión y se tratan como JPEG.
- Al exportar a PNG se preserva el canal alfa (transparencia). Al exportar a JPEG, si la imagen original tenía transparencia, se aplica un fondo blanco antes de codificar (JPEG no soporta transparencia).
- Todo el procesamiento ocurre con `Image`, `<canvas>` y `canvas.toBlob()` — no se realiza ninguna petición de red con los datos de la imagen.
