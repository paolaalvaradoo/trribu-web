# TRRIBÚ · tema de Shopify

Tema Online Store 2.0 hecho a medida a partir del prototipo de Claude Design
(`project/Web TRRIBÚ/`). Todo el texto, las fotos y los productos se editan
desde **Tienda online → Temas → Personalizar**, sin tocar código.

## Subir el tema

```bash
npm i -g @shopify/cli
cd theme
shopify theme dev --store <tu-tienda>.myshopify.com   # vista previa local
shopify theme push --unpublished                     # sube como borrador
```

O comprime la carpeta `theme/` en un .zip y súbelo en *Temas → Agregar tema → Subir archivo zip*.

## Páginas y plantillas

| Página del prototipo | URL | Plantilla |
|---|---|---|
| Home | `/` | `index.json` |
| El Sistema | `/pages/sistema` | `page.sistema` |
| Síntomas | `/pages/sintomas` | `page.sintomas` |
| Quiz | `/pages/quiz` | `page.quiz` |
| Productos | `/collections/all` | `collection.json` |
| Ficha de producto | `/products/<handle>` | `product.json` |
| Kits | `/pages/kits` | `page.kits` |
| Arma tu ritual | `/pages/arma-tu-ritual` | `page.arma-tu-ritual` |
| Herramientas | `/collections/herramientas` | `collection.herramientas` |
| Transparencia | `/pages/transparencia` | `page.transparencia` |
| Estudio | `/pages/estudio` | `page.estudio` |
| FAQ | `/pages/faq` | `page.faq` |
| Nosotros | `/pages/nosotros` | `page.nosotros` |

Crea cada página en *Tienda online → Páginas* con ese handle y elige la plantilla en "Plantilla del tema".
La Lista de espera (La llamada V8) queda para una segunda etapa.

## Productos (handles)

Los handles importan: el tema los usa para encontrar productos y para los valores por defecto.

| Producto | Handle | Precio referencial |
|---|---|---|
| El Shampoo | `el-shampoo` | S/ 79 |
| El Acondicionador | `el-acondicionador` | S/ 79 |
| La Mascarilla | `la-mascarilla` | S/ 89 |
| El Acondicionador Sin Enjuague | `el-acondicionador-sin-enjuague` | S/ 109 |
| El Peine | `el-peine` | S/ 42 |
| La Toalla | `la-toalla` | S/ 45 |
| El Gorro | `el-gorro` | S/ 39 |
| Las Pinzas | `las-pinzas` | S/ 34 |
| El Dúo (kit) | `el-duo` | S/ 142 · antes S/ 158 |
| Kit Esencial (kit) | `kit-esencial` | S/ 210 · antes S/ 247 |
| El Kit Completo (kit) | `el-kit-completo` | S/ 354 · antes S/ 443 |

Los precios salen siempre de Shopify. El "antes" de los kits es el *Precio de comparación*.
Los kits pueden ser productos simples o bundles de la app Shopify Bundles.

Colecciones: `all` (automática) y `herramientas` (los 4 accesorios).

## Datos de marca por producto (metafields)

*Configuración → Datos personalizados → Productos*, namespace `trribu`.
Si un metafield está vacío, el tema usa el valor del prototipo.

| Clave | Tipo | Ejemplo |
|---|---|---|
| `trribu.number` | Texto | 01 |
| `trribu.color` | Color | #BB7B73 |
| `trribu.ink` | Color | #8E524B (color legible sobre blanco) |
| `trribu.tint` | Color | #F4EFE9 (fondo de foto) |
| `trribu.verbs` | Texto | Limpia · Equilibra · Repara |
| `trribu.size` | Texto | 300 ml |
| `trribu.badge` | Texto | El paso 1 |
| `trribu.shape` | Texto | bottle · tall · jar (envase dibujado si no hay foto) |

Las demás claves de la ficha (señales, INCI, modo de uso, FAQ) están documentadas al inicio de `snippets/pdp-data.liquid`.

## Menús

*Tienda online → Navegación*:

- `main-menu`: El Sistema · Síntomas · Quiz · Productos · Kits · Transparencia · Herramientas · Nosotros
- `footer-cuarteto`: los 4 productos
- `footer-marca`: El Sistema · Kits · El estudio · Nosotros · Herramientas
- `footer-siguenos`: Instagram · TikTok · Newsletter

## Descuento por cantidad (Arma tu ritual)

*Descuentos → Crear descuento → Descuento automático → Monto de descuento en productos*:
−10 % desde 3 artículos y −15 % desde 5 (dos descuentos automáticos con requisito mínimo de cantidad, o una app de descuentos por volumen).
**Excluye los productos kit** del descuento para que no se descuenten dos veces.
El tema solo lo **muestra** en vivo (constructor, ficha, carrito). Si cambias los tramos, actualízalos también en
*Personalizar → Configuración del tema → Comercial*.

## Quiz

El motor de puntaje (preguntas, pesos, umbrales, señales decisivas, diagnóstico, herramientas) es idéntico al del prototipo
y vive como JSON en `snippets/qz-config.liquid`. Para cambiarlo sin tocar código, pega un JSON completo en
*Personalizar → Quiz → Configuración del quiz (JSON)*. Al terminar, el botón arma el carrito con los productos (propiedad `_origen: quiz`).
Con la opción "Usar el kit cuando el resultado coincide" activa, si el resultado coincide con El Dúo o el Kit Esencial agrega ese kit a su precio.

## Día de despacho

El carrito pide el día y lo guarda en el pedido como atributo **"Día de despacho"** (visible en el pedido y exportable).
Las opciones se editan en *Configuración del tema → Comercial → Días de despacho*.

## Integraciones

*Configuración del tema → Integraciones*:

- **Klaviyo**: public API key (6 caracteres) + ID de la lista. El quiz suscribe a la lista y guarda en el perfil:
  kit recomendado, señal dominante, tipo de pelo, tratamientos y señales de fase 2. Instala también la app de Klaviyo
  en Shopify para sincronizar pedidos y clientes.
- **Webhook de análisis** (Airtable, Make o Zapier): recibe una copia en JSON de cada quiz completado.

## Pendiente del lado de marca

- Fotos del shooting: cada espacio de foto dice en el editor qué va ahí.
- INCI definitivo (fórmula V15), % de origen natural, precios finales.
- Resultados del estudio de autopercepción (hoy "—%").
