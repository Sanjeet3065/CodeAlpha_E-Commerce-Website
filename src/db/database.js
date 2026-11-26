const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('../utils/security');

const SEED_PRODUCTS = [
  {
    slug: 'kuro-pour-over-carafe',
    sku: 'KB-CR-01',
    name: 'Kuro Pour-Over Carafe',
    tagline: 'Wheel-thrown stoneware dripper & insulated server',
    category: 'Ceramics',
    price: 3850,
    compare_at_price: 4400,
    stock: 14,
    image_url: '/images/product-carafe.jpg',
    gallery: ['/images/product-carafe.jpg', '/images/atelier-banner.jpg'],
    variants: ['Charcoal Glaze', 'Raw Sandstone'],
    specs: {
      Material: 'High-fired Japanese stoneware',
      Capacity: '550 ml (2–3 cups)',
      Dimensions: 'Ø 115 × H 195 mm',
      Origin: 'Hand-thrown in small batches',
      Care: 'Dishwasher safe; avoid thermal shock',
    },
    description:
      'Engineered around steady extraction geometry, the Kuro Pour-Over Carafe pairs a ribbed spiral stoneware cone with a double-walled base vessel. The unglazed foot ring offers tactile grip while the satin charcoal glaze resists coffee staining over years of daily use.',
    featured: 1,
  },
  {
    slug: 'hasu-tea-vessel',
    sku: 'KB-CR-02',
    name: 'Hasu Matte Vessel Set',
    tagline: 'Hand-finished unglazed base teapot & twin tasting cups',
    category: 'Ceramics',
    price: 4600,
    compare_at_price: null,
    stock: 9,
    image_url: '/images/product-vessel.jpg',
    gallery: ['/images/product-vessel.jpg', '/images/atelier-banner.jpg'],
    variants: ['Limestone Matte', 'Ash Smoke'],
    specs: {
      Material: 'Mineral-rich clay with matte glaze',
      Capacity: '420 ml pot / 110 ml cups',
      Dimensions: 'Pot Ø 108 × H 98 mm',
      Filter: 'Integrated fine porcelain mesh',
      Care: 'Hand wash with warm water only',
    },
    description:
      'A calm ritual piece designed for slow loose-leaf steeping. The flush lid seats cleanly without rattling, and the wide belly gives whole tea leaves room to unfurl while maintaining a crisp, drip-free pour spout.',
    featured: 1,
  },
  {
    slug: 'vernier-brass-pen',
    sku: 'KB-DK-01',
    name: 'Vernier Solid Brass Pen',
    tagline: 'CNC-machined C36000 brass hexagonal writing instrument',
    category: 'Deskware',
    price: 2450,
    compare_at_price: null,
    stock: 26,
    image_url: '/images/product-pen.jpg',
    gallery: ['/images/product-pen.jpg', '/images/atelier-banner.jpg'],
    variants: ['Raw Brass', 'Anodized Slate'],
    specs: {
      Material: 'Solid C36000 Free-Machining Brass',
      Refill: 'Schmidt P900 / Parker G2 compatible',
      Dimensions: '138 × 9.5 mm hexagonal',
      Weight: '42 g balanced forward center',
      Finish: 'Untreated to develop natural patina',
    },
    description:
      'Turned from solid bar stock with micro-knurled grip chamfers and an all-metal silent click actuator. The balanced 42-gram heft lets the nib glide across cotton paper under its own mass without finger fatigue.',
    featured: 1,
  },
  {
    slug: 'monolith-desk-tray',
    sku: 'KB-DK-02',
    name: 'Monolith Valet Tray',
    tagline: 'Cast architectural concrete & oiled walnut divider',
    category: 'Deskware',
    price: 2950,
    compare_at_price: null,
    stock: 18,
    image_url: '/images/product-tray.jpg',
    gallery: ['/images/product-tray.jpg', '/images/atelier-banner.jpg'],
    variants: ['Warm Concrete', 'Obsidian Slate'],
    specs: {
      Material: 'Sealed glass-fiber concrete & walnut',
      Dimensions: '240 × 115 × 24 mm',
      Weight: '740 g with cork underside',
      Finish: 'Matte beeswax surface sealer',
      Care: 'Wipe with dry microfiber cloth',
    },
    description:
      'Designed to bring quiet order to daily instruments, keys, and timepieces. Cast in precision silicone molds with crisp 2-millimeter chamfers and fitted with a removable solid walnut shelf lined with natural cork underneath.',
    featured: 0,
  },
  {
    slug: 'solis-alabaster-lamp',
    sku: 'KB-LT-01',
    name: 'Solis Alabaster Lamp',
    tagline: 'Turned brushed aluminum plinth with warm 2700K diffuser',
    category: 'Lighting',
    price: 9800,
    compare_at_price: 11500,
    stock: 6,
    image_url: '/images/product-lamp.jpg',
    gallery: ['/images/product-lamp.jpg', '/images/hero-editorial.jpg'],
    variants: ['Brushed Aluminum', 'Burnished Bronze'],
    specs: {
      Material: 'Frosted opal glass & CNC aluminum',
      Output: '2700K Warm LED · CRI 95+ · 450 lm',
      Dimming: '3-stage rotary brass dimmer',
      Dimensions: 'Ø 160 × H 255 mm',
      Power: 'Braided linen cord (USB-C / AC)',
    },
    description:
      'An ambient architectural light source engineered to cast zero glare. Its hand-blown matte opal dome softens light into a gentle evening glow, anchored by a weighty machined pedestal with a knurled rotary dimmer.',
    featured: 1,
  },
  {
    slug: 'kanso-brass-desk-lamp',
    sku: 'KB-LT-02',
    name: 'Kanso Architectural Task Lamp',
    tagline: 'Spun-steel reflector dome & weighted cast iron base',
    category: 'Lighting',
    price: 12400,
    compare_at_price: null,
    stock: 5,
    image_url: '/images/product-desk-lamp.jpg',
    gallery: ['/images/product-desk-lamp.jpg', '/images/hero-editorial.jpg'],
    variants: ['Matte Black', 'Warm Terracotta'],
    specs: {
      Material: 'Powder-coated spun steel & cast base',
      Output: 'Warm E27 LED included · 650 lm',
      Adjustability: '35° tilt brass friction joint',
      Dimensions: 'Ø 220 × H 410 mm',
      Cord: '2.0 m woven textile cable',
    },
    description:
      'Inspired by mid-century drafting studio lamps, Kanso focuses directional task light onto your workspace while concealing the bulb completely from eye level. A precision brass pivot holds its angle cleanly without exposed springs.',
    featured: 1,
  },
  {
    slug: 'field-waxed-canvas-tote',
    sku: 'KB-CY-01',
    name: 'Field Waxed Canvas Tote',
    tagline: '18oz dry-waxed cotton with vegetable-tanned bridle straps',
    category: 'Carry',
    price: 6200,
    compare_at_price: null,
    stock: 11,
    image_url: '/images/product-tote.jpg',
    gallery: ['/images/product-tote.jpg', '/images/atelier-banner.jpg'],
    variants: ['Olive Drab', 'Charcoal Slate'],
    specs: {
      Material: '18oz dry-waxed Martexin cotton canvas',
      Straps: 'Full-grain vegetable-tanned bridle leather',
      Capacity: '18 Liters · Fits 16" laptop',
      Hardware: 'Solid cast brass rivets',
      Dimensions: '390 × 350 × 135 mm',
    },
    description:
      'Stands upright on its own thanks to a double-layered reinforced base. Built with interior suspended sleeve pockets, key tether, and thick full-grain leather straps secured by hand-peened solid brass rivets.',
    featured: 1,
  },
  {
    slug: 'atelier-zip-folio',
    sku: 'KB-CY-02',
    name: 'Atelier Leather Folio',
    tagline: 'Full-grain saddle leather 14" laptop & document sleeve',
    category: 'Carry',
    price: 5400,
    compare_at_price: 5900,
    stock: 15,
    image_url: '/images/product-folio.jpg',
    gallery: ['/images/product-folio.jpg', '/images/atelier-banner.jpg'],
    variants: ['Cognac Tan', 'Espresso'],
    specs: {
      Material: 'Full-grain drum-dyed cowhide & wool felt',
      Compatibility: '14" MacBook / A4 sketchbook',
      Closure: 'YKK Excella brushed brass zipper',
      Dimensions: '345 × 250 × 22 mm',
      Lining: '3 mm German merino wool felt',
    },
    description:
      'Tailored like architectural bookbinding, the Atelier Folio cushions devices inside thick charcoal merino felt while offering an internal gusset for notebooks, cables, and a brass pen loop.',
    featured: 0,
  },
  {
    slug: 'kuro-raku-chawan',
    sku: 'KB-CR-03',
    name: 'Kuro Raku Chawan Bowl',
    tagline: 'Hand-pinched black raku-glazed ceremonial tea bowl',
    category: 'Ceramics',
    price: 3400,
    compare_at_price: null,
    stock: 12,
    image_url: '/images/product-chawan.jpg',
    gallery: ['/images/product-chawan.jpg', '/images/atelier-banner.jpg'],
    variants: ['Obsidian Raku', 'Iron Ash'],
    specs: {
      Material: 'Hand-pinched raku stoneware clay',
      Dimensions: 'Ø 118 × H 86 mm',
      Capacity: '360 ml',
      Glaze: 'Thick hand-dipped vitrified mineral glaze',
      Care: 'Hand wash in warm water; avoid abrasive pads',
    },
    description:
      'Formed slowly by hand rather than on a fast wheel so subtle finger contours remain in the thick clay wall. Raku firing gives the deep obsidian glaze organic warmth and strong thermal retention.',
    featured: 0,
  },
  {
    slug: 'tierra-espresso-duo',
    sku: 'KB-CR-04',
    name: 'Tierra Speckled Espresso Duo',
    tagline: 'Iron-flecked stoneware cups & saucers with raw terracotta rim',
    category: 'Ceramics',
    price: 2150,
    compare_at_price: null,
    stock: 20,
    image_url: '/images/product-espresso-cups.jpg',
    gallery: ['/images/product-espresso-cups.jpg', '/images/atelier-banner.jpg'],
    variants: ['Chalk & Terracotta', 'Warm Sand'],
    specs: {
      Material: 'Iron-speckled stoneware with exposed terracotta slip',
      Set: '2 Cups (110 ml each) + 2 Saucers',
      Dimensions: 'Cup Ø 72 × H 54 mm · Saucer Ø 125 mm',
      Finish: 'Satin food-safe mineral glaze',
      Care: 'Dishwasher and microwave safe',
    },
    description:
      'Sized for double ristrettos, cortados, or strong afternoon pours. Each thick-walled cup is banded by hand with an unglazed iron-terracotta line that grounds the crisp chalk glaze.',
    featured: 0,
  },
  {
    slug: 'fluted-aluminum-igniter',
    sku: 'KB-DK-03',
    name: 'Fluted Aluminum Table Igniter',
    tagline: 'Ribbed anodized aluminum & matte resin architectural desk piece',
    category: 'Deskware',
    price: 4200,
    compare_at_price: 4800,
    stock: 9,
    image_url: '/images/product-table-igniter.jpg',
    gallery: ['/images/product-table-igniter.jpg', '/images/atelier-banner.jpg'],
    variants: ['Brushed Silver / Black', 'Anodized Graphite'],
    specs: {
      Material: 'Extruded ribbed aluminum & high-temp resin',
      Mechanism: 'Flush tactile slide actuator (refillable)',
      Dimensions: '112 × 36 × 24 mm',
      Weight: '195 g weighted desktop body',
      Origin: 'Precision German industrial lineage',
    },
    description:
      'A study in disciplined linear geometry for lighting studio candles and incense without disposable plastic clutter. Milled aluminum ribs provide cool grip and quiet authority on any table.',
    featured: 0,
  },
  {
    slug: 'siro-layflat-notebook',
    sku: 'KB-DK-04',
    name: 'Siro Lay-Flat Studio Journal',
    tagline: 'Thread-sewn 120gsm archival ruled journal with matte linen cover',
    category: 'Deskware',
    price: 1650,
    compare_at_price: null,
    stock: 28,
    image_url: '/images/product-desk-notebook.jpg',
    gallery: ['/images/product-desk-notebook.jpg', '/images/atelier-banner.jpg'],
    variants: ['Matte Obsidian', 'Stone Grey'],
    specs: {
      Paper: '120 gsm archival cream fountain-friendly stock',
      Binding: 'Exposed Smyth-sewn lay-flat binding',
      Ruling: 'Fine 6 mm ruled & numbered pages',
      Size: 'A5 · 148 × 210 mm · 192 pages',
      Features: 'Ribbon marker & back expandable pocket',
    },
    description:
      'Built to open completely flat at 180 degrees from the first page to the last. Thick 120 gsm paper resists feathering and ghosting across rollerballs, fountain inks, and soft graphite.',
    featured: 0,
  },
  {
    slug: 'nori-drafting-lamp',
    sku: 'KB-LT-03',
    name: 'Nori Articulated Drafting Lamp',
    tagline: 'Twin-arm matte black studio task lamp with solid brass joints',
    category: 'Lighting',
    price: 11200,
    compare_at_price: null,
    stock: 4,
    image_url: '/images/product-drafting-lamp.jpg',
    gallery: ['/images/product-drafting-lamp.jpg', '/images/hero-editorial.jpg'],
    variants: ['Matte Black / Brass', 'Chalk / Brass'],
    specs: {
      Material: 'Powder-coated steel & machined solid brass pivots',
      LightSource: '2700K Warm LED included (CRI 95+)',
      Reach: 'Max height 540 mm · 2-joint articulation',
      Base: 'Weighted Ø 165 mm cast steel disk',
      Cord: '2.0 m braided black textile cord',
    },
    description:
      'Twin parallel struts glide effortlessly while friction-fitted solid brass knuckles lock the conical reflector shade at your exact working angle without exposed springs.',
    featured: 1,
  },
  {
    slug: 'hana-pedestal-lamp',
    sku: 'KB-LT-04',
    name: 'Hana Pedestal Opal Lamp',
    tagline: 'Tall turned aluminum column with warm glowing opal diffuser',
    category: 'Lighting',
    price: 7800,
    compare_at_price: 8900,
    stock: 8,
    image_url: '/images/product-column-lamp.jpg',
    gallery: ['/images/product-column-lamp.jpg', '/images/hero-editorial.jpg'],
    variants: ['Brushed Aluminum', 'Champagne Anodized'],
    specs: {
      Material: 'Turned brushed aluminum & frosted opal glass',
      Output: '2700K Warm Ambient LED · 380 lm',
      Dimming: 'Inline rotary dimmer switch',
      Dimensions: 'Ø 145 × H 285 mm',
      Weight: '1.4 kg solid machined base',
    },
    description:
      'A slightly taller architectural silhouette for bookshelves, sideboards, and reading corners. The hand-blown matte opal dome diffuses a soft sunset glow evenly in 360 degrees.',
    featured: 0,
  },
  {
    slug: 'tanaka-bridle-belt',
    sku: 'KB-CY-03',
    name: 'Tanaka Bridle Leather Belt',
    tagline: '4 mm full-grain vegetable-tanned leather with sand-cast buckle',
    category: 'Carry',
    price: 3600,
    compare_at_price: null,
    stock: 16,
    image_url: '/images/product-bridle-belt.jpg',
    gallery: ['/images/product-bridle-belt.jpg', '/images/atelier-banner.jpg'],
    variants: ['Cognac Tan', 'Deep Espresso'],
    specs: {
      Material: '4.0 mm vegetable-tanned full-grain cowhide',
      Width: '35 mm universal trouser width',
      Hardware: 'Solid sand-cast brushed steel buckle & rivets',
      Sizing: 'Adjustable 30"–38" waist',
      Edges: 'Hand-burnished beeswax edge finish',
    },
    description:
      'Cut from a single thick bend of drum-dyed bridle leather that molds to your posture and deepens into a rich burnished amber over years of daily wear.',
    featured: 0,
  },
  {
    slug: 'atelier-saddle-satchel',
    sku: 'KB-CY-04',
    name: 'Atelier Saddle Messenger',
    tagline: 'Full-grain chestnut leather document & 15" laptop satchel',
    category: 'Carry',
    price: 8900,
    compare_at_price: null,
    stock: 7,
    image_url: '/images/product-leather-satchel.jpg',
    gallery: ['/images/product-leather-satchel.jpg', '/images/atelier-banner.jpg'],
    variants: ['Chestnut Saddle', 'Dark Havana'],
    specs: {
      Material: 'Full-grain pull-up leather & cotton twill lining',
      Capacity: 'Fits 15" laptop, A4 folios & daily tools',
      Hardware: 'Solid brass tuck-lock clasp & D-rings',
      Strap: 'Detachable padded shoulder strap',
      Dimensions: '380 × 280 × 95 mm',
    },
    description:
      'Built around traditional saddle-stitch reinforcement and an unlined raw-leather storm flap with solid brass clasp. Designed for decades of daily transit without plastic stiffeners.',
    featured: 1,
  },
  {
    slug: 'tailored-poplin-shirt',
    sku: 'KB-CL-01',
    name: 'Tailored Cotton Poplin Shirt',
    tagline: 'Structured long-staple cotton poplin shirt with corozo buttons',
    category: 'Clothes',
    price: 3600,
    compare_at_price: null,
    stock: 22,
    image_url: '/images/product-poplin-shirt.jpg',
    gallery: ['/images/product-poplin-shirt.jpg', '/images/atelier-banner.jpg'],
    variants: ['Stone Grey · M', 'Stone Grey · L', 'Chalk White · M', 'Chalk White · L'],
    specs: {
      Fabric: '100% 2-ply long-staple Egyptian cotton poplin',
      Weight: '135 gsm crisp year-round weave',
      Construction: 'Single-needle French side seams · 20 SPI',
      Buttons: 'Natural matte corozo nut',
      Care: 'Cold machine wash; hang dry & light steam',
    },
    description:
      'Cut with a clean modern collar roll and single-needle French seams that sit flat under wool layers or stand crisp on their own from studio morning to dinner.',
    featured: 1,
  },
  {
    slug: 'selvedge-indigo-denim',
    sku: 'KB-CL-02',
    name: 'Selvedge Indigo Denim Trouser',
    tagline: '13.5oz rope-dyed straight-taper denim trouser',
    category: 'Clothes',
    price: 4850,
    compare_at_price: null,
    stock: 18,
    image_url: '/images/product-denim-knit.jpg',
    gallery: ['/images/product-denim-knit.jpg', '/images/atelier-banner.jpg'],
    variants: ['Raw Indigo · 30', 'Raw Indigo · 32', 'Raw Indigo · 34', 'Washed Slate · 32'],
    specs: {
      Fabric: '13.5 oz 100% cotton shuttle-loom denim',
      Fit: 'Relaxed mid-rise with subtle taper',
      Hardware: 'Custom matte copper rivets & YKK tack button',
      PocketBags: 'Heavy 8 oz unbleached twill',
      Care: 'Cold wash inside-out sparingly; line dry',
    },
    description:
      'Woven slowly on vintage shuttle looms with subtle slub texture that develops individualized fade contours over time. Tailored slightly roomier through the thigh for all-day movement.',
    featured: 0,
  },
  {
    slug: 'merino-knit-pullover',
    sku: 'KB-CL-03',
    name: 'Extra-Fine Merino Pullover',
    tagline: '19.5-micron ribbed Italian merino crewneck sweater',
    category: 'Clothes',
    price: 5600,
    compare_at_price: 6400,
    stock: 14,
    image_url: '/images/product-merino-knit.jpg',
    gallery: ['/images/product-merino-knit.jpg', '/images/atelier-banner.jpg'],
    variants: ['Charcoal Marl · M', 'Charcoal Marl · L', 'Oatmeal · M', 'Obsidian · L'],
    specs: {
      Material: '100% RWS-certified 19.5-micron merino wool',
      Gauge: '7-gauge half-cardigan textured rib',
      Fit: 'Architectural shoulder drop with ribbed cuffs',
      Breathability: 'Naturally thermoregulating & odor resistant',
      Care: 'Hand wash cold with wool detergent; dry flat',
    },
    description:
      'Knitted densely enough to hold a crisp sculptural drape without pilling, yet light enough to layer smoothly beneath structured outerwear across transitional seasons.',
    featured: 1,
  },
  {
    slug: 'goodyear-brogue-boots',
    sku: 'KB-CL-04',
    name: 'Goodyear Welted Brogue Boots',
    tagline: 'Hand-burnished vegetable-tanned leather derby ankle boots',
    category: 'Clothes',
    price: 9600,
    compare_at_price: null,
    stock: 9,
    image_url: '/images/product-brogue-boots.jpg',
    gallery: ['/images/product-brogue-boots.jpg', '/images/atelier-banner.jpg'],
    variants: ['Burnished Tan · UK 8', 'Burnished Tan · UK 9', 'Burnished Tan · UK 10'],
    specs: {
      Upper: 'Full-grain vegetable-tanned calfskin leather',
      Construction: '360° Goodyear storm welt (resoleable)',
      Lining: 'Breathable vegetable-tanned glove leather',
      Outsole: 'Studded high-density rubber commando sole',
      Laces: 'Waxed braided cotton round cords',
    },
    description:
      'Built on a balanced almond last with a cork-filled midsole that gradually shapes to your footprint. Goodyear storm-welted soles allow complete resoling after years of city miles.',
    featured: 0,
  },
  {
    slug: 'atelier-wool-overcoat',
    sku: 'KB-WN-01',
    name: 'Atelier Tailored Wool Coat',
    tagline: 'Heavyweight 680gsm virgin wool winter overcoat with horn buttons',
    category: 'Winter Wear',
    price: 13900,
    compare_at_price: 15800,
    stock: 7,
    image_url: '/images/product-wool-overcoat.jpg',
    gallery: ['/images/product-wool-overcoat.jpg', '/images/atelier-banner.jpg'],
    variants: ['Midnight Navy · M', 'Midnight Navy · L', 'Charcoal · M', 'Warm Camel · L'],
    specs: {
      Shell: '90% Virgin Melton Wool · 10% Cashmere (680 gsm)',
      Lining: 'Full Bemberg cupro breathable twill',
      Details: 'Genuine horn buttons & welt chest pocket',
      Warmth: 'Comfort rated down to -5°C layered',
      Care: 'Dry clean or brush with soft garment brush',
    },
    description:
      'Dense wind-blocking melton wool tailored with structured natural shoulders and deep slant hand-warmer pockets. Smooth cupro lining slips effortlessly over heavy knits and suiting.',
    featured: 1,
  },
  {
    slug: 'quilted-leather-jacket',
    sku: 'KB-WN-02',
    name: 'Quilted Grain Leather Jacket',
    tagline: 'Diamond-quilted full-grain winter blouson with thermal fill',
    category: 'Winter Wear',
    price: 14400,
    compare_at_price: null,
    stock: 6,
    image_url: '/images/product-quilted-jacket.jpg',
    gallery: ['/images/product-quilted-jacket.jpg', '/images/atelier-banner.jpg'],
    variants: ['Slate Grey · M', 'Slate Grey · L', 'Oxblood Brown · M', 'Obsidian · L'],
    specs: {
      Shell: '1.1 mm drum-dyed full-grain lamb & calfskin',
      Insulation: 'Recycled Primaloft Gold thermal batting',
      Hardware: 'Heavy antique-finish two-way metal zipper',
      Pockets: '2 fleece-lined exterior + 2 internal zip pockets',
      Care: 'Condition leather annually; specialist clean',
    },
    description:
      'Supple drum-dyed leather channel-quilted over lightweight high-loft thermal insulation. Cuts wind chill completely while breaking in with natural crease character.',
    featured: 0,
  },
  {
    slug: 'ribbed-scarf-beanie-set',
    sku: 'KB-WN-03',
    name: 'Fisherman Rib Scarf & Beanie',
    tagline: 'Heavy-gauge 100% Scottish lambswool winter knit duo',
    category: 'Winter Wear',
    price: 3450,
    compare_at_price: null,
    stock: 19,
    image_url: '/images/product-ribbed-scarf-set.jpg',
    gallery: ['/images/product-ribbed-scarf-set.jpg', '/images/atelier-banner.jpg'],
    variants: ['Charcoal Marl', 'Warm Oatmeal'],
    specs: {
      Material: '100% spun first-shear Scottish lambswool',
      ScarfDimensions: '200 × 32 cm full wrap length',
      BeanieFit: 'Turn-up cuff rib · One size fits 55–61 cm',
      Stitch: 'Chunky 5-gauge cable & fisherman rib',
      Care: 'Hand wash cold; press dry in towel',
    },
    description:
      'Lofty first-shear lambswool locks in body heat even in damp winter cold while remaining soft against bare neck skin. Generous two-meter length drapes double-wrapped.',
    featured: 0,
  },
  {
    slug: 'brushed-alpaca-cardigan',
    sku: 'KB-WN-04',
    name: 'Brushed Alpaca Winter Layer',
    tagline: 'Heavyweight Peruvian alpaca-wool textured cold-weather knit',
    category: 'Winter Wear',
    price: 6800,
    compare_at_price: null,
    stock: 11,
    image_url: '/images/product-knit-cardigan.jpg',
    gallery: ['/images/product-knit-cardigan.jpg', '/images/atelier-banner.jpg'],
    variants: ['Warm Oat · S/M', 'Warm Oat · L/XL', 'Forest Olive · S/M'],
    specs: {
      Material: '65% Baby Alpaca · 25% Merino · 10% Polyamide',
      Texture: 'Lofty brushed bouclé thermal handfeel',
      Weight: '540 g substantial winter knit',
      Origin: 'Spun from ethically sheared Andean alpaca',
      Care: 'Air after wear; cool hand wash',
    },
    description:
      'Hollow alpaca fibers offer remarkable warmth-to-weight insulation without bulk. Gently brushed for a soft halo surface in calm neutral earth tones.',
    featured: 0,
  },
  {
    slug: 'studio-matte-headphones',
    sku: 'KB-EL-01',
    name: 'Studio Matte Wireless Headphones',
    tagline: 'Active noise-cancelling reference headphones with 45-hour battery',
    category: 'Electronics',
    price: 14900,
    compare_at_price: 16900,
    stock: 10,
    image_url: '/images/product-headphones.jpg',
    gallery: ['/images/product-headphones.jpg', '/images/hero-editorial.jpg'],
    variants: ['Matte Obsidian', 'Brushed Silver'],
    specs: {
      Drivers: '40 mm custom beryllium-coated dynamic drivers',
      ANC: 'Hybrid 6-mic adaptive noise cancellation (-40 dB)',
      Connectivity: 'Bluetooth 5.4 multipoint + lossless USB-C / 3.5mm',
      Battery: '45 hrs ANC on · 10 min quick charge = 5 hrs',
      Materials: 'CNC aluminum hinges & replaceable memory-foam pads',
    },
    description:
      'Tuned for neutral studio clarity rather than artificially boosted bass. Features physical tactile volume & ANC toggle switches, zero glossy plastic, and replaceable magnetic lambskin ear cushions.',
    featured: 1,
  },
  {
    slug: 'monolith-desk-speakers',
    sku: 'KB-EL-02',
    name: 'Monolith Brushed Desk Speakers',
    tagline: 'Pair of anodized aluminum active desktop studio monitors',
    category: 'Electronics',
    price: 12500,
    compare_at_price: null,
    stock: 8,
    image_url: '/images/product-desk-speakers.jpg',
    gallery: ['/images/product-desk-speakers.jpg', '/images/hero-editorial.jpg'],
    variants: ['Brushed Aluminum Pair', 'Graphite Black Pair'],
    specs: {
      Amplification: '60W RMS Class-D bi-amplified DSP stereo pair',
      Inputs: 'USB-C DAC (24-bit/96kHz), Bluetooth 5.3 aptX, Aux',
      Enclosure: 'Extruded brushed aluminum acoustic housing',
      Dimensions: '78 × 195 × 112 mm per monitor',
      Includes: 'Braided interconnect & isolation pads',
    },
    description:
      'Slim vertical footprint engineered specifically to flank monitors on compact desks while delivering wide near-field soundstage and crisp vocal separation at low evening volumes.',
    featured: 0,
  },
  {
    slug: 'compact-35mm-camera',
    sku: 'KB-EL-03',
    name: 'Milled 35mm Compact Camera',
    tagline: 'Magnesium-alloy pocket digital & prime 35mm f/2.8 travel camera',
    category: 'Electronics',
    price: 18400,
    compare_at_price: null,
    stock: 5,
    image_url: '/images/product-compact-camera.jpg',
    gallery: ['/images/product-compact-camera.jpg', '/images/atelier-banner.jpg'],
    variants: ['Matte Black Body', 'Silver / Black Body'],
    specs: {
      Sensor: '24MP APS-C CMOS with film simulation profiles',
      Lens: 'Fixed 35 mm eq. f/2.8 multi-coated 7-element glass',
      Body: 'Die-cast magnesium alloy · 310 g pocket weight',
      Storage: 'SDXC UHS-II + USB-C tether charging',
      Controls: 'Dedicated tactile aperture & exposure dials',
    },
    description:
      'Stripped of distracting menus so you frame quickly with tactile mechanical dials and a bright optical frame finder. Fits effortlessly into a coat pocket or field sling.',
    featured: 1,
  },
  {
    slug: 'et66-desk-calculator',
    sku: 'KB-EL-04',
    name: 'ET66 Tactile Desk Calculator',
    tagline: 'Bauhaus matte polycarbonate desktop calculator with convex keys',
    category: 'Electronics',
    price: 4900,
    compare_at_price: null,
    stock: 15,
    image_url: '/images/product-desk-calculator.jpg',
    gallery: ['/images/product-desk-calculator.jpg', '/images/atelier-banner.jpg'],
    variants: ['Obsidian Black', 'Warm Ivory'],
    specs: {
      Design: 'Iconic 1987 industrial layout with color-coded keys',
      Display: '8-digit high-contrast tilted LCD panel',
      Keys: 'Domed tactile mechanical-feel ABS caps',
      Dimensions: '138 × 77 × 16 mm with hard slide sleeve',
      Power: 'Long-life cell battery (auto shut-off)',
    },
    description:
      'A classic study in functional clarity: subtly convex keys prevent mis-presses while muted earth-tone function grouping lets your eye locate operators instantaneously.',
    featured: 0,
  },
  {
    slug: 'shiro-ribbed-vase',
    sku: 'KB-HM-01',
    name: 'Shiro Ribbed Porcelain Vase',
    tagline: 'Wheel-turned matte bisque porcelain flower & branch vessel',
    category: 'Home & Living',
    price: 2650,
    compare_at_price: null,
    stock: 17,
    image_url: '/images/product-ceramic-vase.jpg',
    gallery: ['/images/product-ceramic-vase.jpg', '/images/atelier-banner.jpg'],
    variants: ['Matte Chalk', 'Warm Limestone'],
    specs: {
      Material: 'Watertight glazed interior · matte bisque exterior',
      Dimensions: 'Ø 96 × H 185 mm · Narrow 32 mm neck',
      Weight: '480 g weighted base',
      BestFor: 'Single seasonal stems, eucalyptus & dried branches',
      Care: 'Rinse with warm water & mild soap',
    },
    description:
      'Fine lathe ribs catch directional daylight across an unglazed velvety porcelain body while a clear-glazed interior holds fresh water cleanly for days.',
    featured: 0,
  },
  {
    slug: 'hinoki-woodwick-candle',
    sku: 'KB-HM-02',
    name: 'Hinoki Wood-Wick Glass Candle',
    tagline: 'Hand-poured soy & beeswax botanical candle with cedar wood wick',
    category: 'Home & Living',
    price: 1850,
    compare_at_price: null,
    stock: 25,
    image_url: '/images/product-woodwick-candle.jpg',
    gallery: ['/images/product-woodwick-candle.jpg', '/images/atelier-banner.jpg'],
    variants: ['Hinoki & Vetiver', 'Smoked Cedar & Fig'],
    specs: {
      Wax: '100% pure soy & unbleached beeswax (260 g)',
      BurnTime: '55+ hours clean soot-free burn',
      Wick: 'Natural kiln-dried crackling cedar wood wick',
      Notes: 'Japanese cypress, damp moss, vetiver root & bergamot',
      Vessel: 'Reusable heavy apothecary glass jar with brass lid',
    },
    description:
      'Blended with cold-pressed essential oils rather than synthetic perfume so the scent stays subtle and grounding. Its flat wood wick emits a faint fireplace crackle while burning.',
    featured: 0,
  },
  {
    slug: 'twinbell-studio-clock',
    sku: 'KB-HM-03',
    name: 'Twin-Bell Matte Studio Clock',
    tagline: 'Silent sweep quartz mechanical twin-bell bedside & desk clock',
    category: 'Home & Living',
    price: 3250,
    compare_at_price: null,
    stock: 13,
    image_url: '/images/product-desk-clock.jpg',
    gallery: ['/images/product-desk-clock.jpg', '/images/hero-editorial.jpg'],
    variants: ['Matte Black', 'Brushed Pewter'],
    specs: {
      Movement: 'Zero-tick silent continuous sweep quartz',
      Alarm: 'Authentic mechanical brass hammer & twin bells',
      Face: 'Warm ivory non-glare dial with soft backlight button',
      Dimensions: '115 × 158 × 56 mm',
      Power: '1 × AA battery (included)',
    },
    description:
      'Keeps phones out of the bedroom with a genuinely silent sweep hand at night and a clear mechanical twin-bell chime in the morning.',
    featured: 0,
  },
  {
    slug: 'chunky-merino-throw',
    sku: 'KB-HM-04',
    name: 'Chunky Merino Lounge Throw',
    tagline: 'Hand-loomed heavyweight merino wool bed & reading blanket',
    category: 'Home & Living',
    price: 4200,
    compare_at_price: 4900,
    stock: 12,
    image_url: '/images/product-merino-throws.jpg',
    gallery: ['/images/product-merino-throws.jpg', '/images/atelier-banner.jpg'],
    variants: ['Slate Charcoal', 'Olive Moss', 'Oatmeal Cream'],
    specs: {
      Material: '100% long-fiber combed merino wool',
      Dimensions: '140 × 200 cm generous throw size',
      Weight: '920 g substantial tactile drape',
      Weave: 'Hand-loomed honeycomb & cable texture',
      Care: 'Spot clean or cold wool wash',
    },
    description:
      'Draped across a reading chair or foot of the bed, this thick loomed wool throw offers immediate warmth and rich architectural textile texture.',
    featured: 1,
  },
];

/**
 * Initialize SQLite database, create tables if absent, and seed starter data.
 */
function initDatabase(dbPath) {
  const resolvedPath =
    dbPath || path.join(__dirname, '..', '..', 'database', 'store.db');

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (resolvedPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      default_address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0),
      compare_at_price INTEGER,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      image_url TEXT NOT NULL,
      gallery_json TEXT NOT NULL,
      variants_json TEXT NOT NULL,
      specs_json TEXT NOT NULL,
      description TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id, variant)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      payment_method TEXT NOT NULL,
      promo_code TEXT DEFAULT '',
      subtotal INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_slug TEXT NOT NULL,
      product_image TEXT NOT NULL,
      variant TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      line_total INTEGER NOT NULL
    );
  `);

  seedProductsIfEmpty(db);
  seedDemoUserIfMissing(db);

  return db;
}

function seedProductsIfEmpty(db) {
  const checkExisting = db.prepare('SELECT id FROM products WHERE slug = ?');
  const insert = db.prepare(`
    INSERT INTO products (
      slug, sku, name, tagline, category, price, compare_at_price,
      stock, image_url, gallery_json, variants_json, specs_json,
      description, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    for (const p of SEED_PRODUCTS) {
      if (checkExisting.get(p.slug)) continue;
      insert.run(
        p.slug,
        p.sku,
        p.name,
        p.tagline,
        p.category,
        p.price,
        p.compare_at_price,
        p.stock,
        p.image_url,
        JSON.stringify(p.gallery),
        JSON.stringify(p.variants),
        JSON.stringify(p.specs),
        p.description,
        p.featured
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function seedDemoUserIfMissing(db) {
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('demo@kobo-studio.in');
  if (existing) return;

  const passwordHash = hashPassword('Demo@1234');
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, phone, default_address)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      'Aarav Mehta',
      'demo@kobo-studio.in',
      passwordHash,
      '+91 98201 44120',
      '402 Kala Ghoda Loft, Fort, Mumbai 400001'
    );

  const userId = Number(result.lastInsertRowid);
  const sampleProduct = db
    .prepare('SELECT id, name, slug, image_url, price FROM products WHERE slug = ?')
    .get('vernier-brass-pen');

  if (sampleProduct) {
    const orderResult = db
      .prepare(
        `INSERT INTO orders (
          order_number, user_id, status, customer_name, customer_email,
          customer_phone, shipping_address, city, postal_code, country,
          payment_method, promo_code, subtotal, discount, shipping_fee, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'KBO-2610-1042',
        userId,
        'Dispatched',
        'Aarav Mehta',
        'demo@kobo-studio.in',
        '+91 98201 44120',
        '402 Kala Ghoda Loft, Fort',
        'Mumbai',
        '400001',
        'India',
        'UPI',
        '',
        sampleProduct.price,
        0,
        250,
        sampleProduct.price + 250
      );

    db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_slug, product_image,
        variant, unit_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      Number(orderResult.lastInsertRowid),
      sampleProduct.id,
      sampleProduct.name,
      sampleProduct.slug,
      sampleProduct.image_url,
      'Raw Brass',
      sampleProduct.price,
      1,
      sampleProduct.price
    );
  }
}

module.exports = {
  initDatabase,
  SEED_PRODUCTS,
};
