import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { db, savedOutfitsTable } from "@workspace/db";
import {
  AnalyzeStyleBody,
  AnalyzeStyleResponse,
  SaveOutfitBody,
  ListOutfitsResponse,
} from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  const baseURL = process.env.OPENAI_BASE_URL;
  const config: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (baseURL) {
    config.baseURL = baseURL;
  }
  return new OpenAI(config);
}

function buildStylePrompt(
  quizAnswers: {
    gender?: string | null;
    style: string;
    styleCustom?: string | null;
    colors: string[];
    season: string;
    purpose: string;
    budget: string;
    brands: string[];
    chatMessage?: string | null;
    quickAction?: string | null;
  },
  hasPhoto: boolean,
): string {
  const gender = quizAnswers.gender || "male";
  const isMale = gender === "male";
  const isFemale = gender === "female";

  const genderBlock = isMale
    ? `GENDER: MALE
CRITICAL GENDER RULES — THESE ARE HARD CONSTRAINTS:
- NEVER include: handbags, purses, tote bags (feminine style), high heels, feminine jewelry, feminine silhouettes
- For bags: use ONLY backpacks, messenger bags, male crossbody bags, belt bags, or duffel bags
- Accessories: watches, sunglasses, chains, signet rings, caps, wallets — all masculine
- Every single item must read as menswear or gender-neutral`
    : isFemale
    ? `GENDER: FEMALE
Style with feminine sensibility:
- Bags: handbags, clutches, tote bags, structured shoulder bags are encouraged
- Accessories: rings, necklaces, bracelets, earrings, feminine details welcome
- Silhouettes: include feminine cuts where appropriate for the style`
    : `GENDER: NON-BINARY
Style gender-neutrally — avoid exclusively masculine or exclusively feminine items. Lean androgynous.`;

  const styleGuides: Record<string, string> = {
    "old-money": isMale
      ? "OUTFIT BLUEPRINT: Polo shirt or fine linen shirt (open collar), tailored wool or linen trousers, leather loafers (Gucci or Tod's), slim dress watch (IWC / Patek), elegant tortoiseshell or metal-frame sunglasses, leather belt. COLORS: navy, cream, camel, white, olive. NO sneakers, NO streetwear elements."
      : "OUTFIT BLUEPRINT: Cashmere or silk blouse, tailored trousers or pleated midi skirt, kitten heels or loafers, structured leather handbag (quiet luxury), simple gold jewelry (thin chain, stud earrings), slim watch. COLORS: cream, camel, navy, white, taupe.",

    "streetwear": isMale
      ? "OUTFIT BLUEPRINT: Oversized graphic hoodie OR premium tee, cargo pants or slim joggers (Carhartt WIP / Fear of God), chunky sneakers (Jordan 1 / New Balance 550 / Nike Dunk), fitted cap or beanie, Cuban chain necklace, male crossbody bag or backpack. COLORS: stay coordinated — no random clashing. Bold but intentional."
      : "OUTFIT BLUEPRINT: Oversized hoodie or graphic tee, baggy jeans or bike shorts, chunky sneakers, mini crossbody bag, bucket hat or cap, layered jewelry (chains, rings), bold socks. COLORS: coordinated and intentional.",

    "minimalist": isMale
      ? "OUTFIT BLUEPRINT: Clean fitted crew-neck tee or Oxford shirt, straight-leg trousers or slim chinos (Acne / COS / Jil Sander), low-profile white leather sneakers or suede loafers, slim minimal watch, NO statement accessories. COLORS: monochrome or max 2 neutrals — black, white, grey, cream, navy."
      : "OUTFIT BLUEPRINT: Clean silk or cotton top, tailored trousers or midi skirt, minimal leather mules or low sneakers, structured mini bag, one simple gold ring or stud earrings, slim watch. COLORS: monochrome — black, white, grey, cream.",

    "techwear": isMale
      ? "OUTFIT BLUEPRINT: Technical shell jacket (Acronym / Arc'teryx / Nike ACG), utility cargo pants (black or graphite), futuristic technical sneakers (Salomon Speedcross / Nike ISPA / On Running), tactical backpack or waterproof belt bag, goggle sunglasses or visor, no traditional accessories. ALL BLACK or dark grey palette."
      : "OUTFIT BLUEPRINT: Technical windbreaker or softshell jacket, utility cargos or track pants, technical sneakers, waterproof crossbody pack, visor or tinted goggle glasses, minimal techy accessories.",

    "dark-academia": isMale
      ? "OUTFIT BLUEPRINT: Oxford shirt or fine turtleneck sweater, tailored wool trousers, Chelsea boots or wingtip brogues, wool overcoat or blazer, leather satchel or briefcase, tortoiseshell glasses, vintage watch. COLORS: charcoal, brown, burgundy, cream, forest green."
      : "OUTFIT BLUEPRINT: Knit sweater or collared blouse, plaid or tweed skirt or wide-leg trousers, Mary Janes or Oxford heels, structured leather satchel, tortoiseshell glasses, dainty chain necklace. COLORS: dark brown, burgundy, forest green, cream, charcoal.",

    "bohemian": isMale
      ? "OUTFIT BLUEPRINT: Loose linen shirt (open collar or printed), straight jeans or linen trousers, suede Chelsea boots or espadrilles, woven leather belt, silver rings, thin beaded bracelet, simple round sunglasses. COLORS: earthy — rust, cream, tan, brown, olive."
      : "OUTFIT BLUEPRINT: Flowing maxi dress or embroidered blouse with wide-leg trousers, strappy leather sandals, fringe or woven tote bag, layered rings and pendant necklace, round tinted sunglasses, dainty bracelets. COLORS: rust, cream, tan, sage, terracotta.",

    "power-suit": isMale
      ? "OUTFIT BLUEPRINT: Crisp white dress shirt, structured suit jacket, matching tailored trousers, polished Oxford leather shoes, leather dress watch (Rolex / IWC), silk pocket square (optional). COLORS: charcoal, navy, black, grey, ivory."
      : "OUTFIT BLUEPRINT: Sharp double-breasted blazer or structured power suit (matching jacket + trousers/skirt), pointed-toe heels or loafers, structured leather briefcase or top-handle bag, statement watch or cuff bracelet. COLORS: black, charcoal, navy, ivory.",

    "avant-garde": isMale
      ? "OUTFIT BLUEPRINT: Deconstructed jacket or sculptural coat (Rick Owens / Yohji / Comme des Garçons), asymmetric or wide-leg trousers, architectural boots or unusual sneakers, minimal avant-garde jewelry (geometric rings), unusual proportions. COLORS: black, white, grey — or one dramatic accent."
      : "OUTFIT BLUEPRINT: Sculptural dress or deconstructed layered ensemble, architectural footwear (platforms or unusual boots), statement bag with unusual shape, geometric jewelry, experimental proportions. COLORS: monochrome with one dramatic statement color.",
  };

  const styleGuide =
    styleGuides[quizAnswers.style] ||
    `Create a highly coordinated ${quizAnswers.style} outfit for a ${gender} person.`;

  const quickActionModifier = quizAnswers.quickAction
    ? `\nSPECIAL DIRECTIVE: ${
        quizAnswers.quickAction === "billionaire"
          ? "Dress like a tech billionaire — ultra-premium, understated quiet wealth, impeccable quality, no loud logos"
          : quizAnswers.quickAction === "luxury"
          ? "Generate a luxury editorial outfit — Vogue or GQ level, investment-grade brands, statement pieces"
          : quizAnswers.quickAction === "celebrity"
          ? "Celebrity-level look — bold, statement-making, photographed in the front row or at a red carpet event"
          : quizAnswers.quickAction
      }.`
    : "";

  const chatContext = quizAnswers.chatMessage
    ? `\n\nUser's specific request: "${quizAnswers.chatMessage}"`
    : "";

  return `You are a world-class personal stylist with deep expertise in contemporary and luxury fashion. ${
    hasPhoto ? "Analyze the user's photo to understand their body type, skin tone, and current style." : ""
  }

${genderBlock}

${styleGuide}

USER PREFERENCES:
- Aesthetic: ${quizAnswers.style}${quizAnswers.styleCustom ? ` (customized: ${quizAnswers.styleCustom})` : ""}
- Colors: ${quizAnswers.colors.join(", ")}
- Season: ${quizAnswers.season}
- Occasion: ${quizAnswers.purpose}
- Budget: ${quizAnswers.budget}
- Brands: ${quizAnswers.brands.length > 0 ? quizAnswers.brands.join(", ") : "AI's choice — match style and budget"}
${quickActionModifier}${chatContext}

COLOR COORDINATION RULES — MANDATORY:
- ALL items must use colors from the user's selected palette or close neutrals that complement it
- NO random colors: no pink accessories with dark outfits, no clashing tones
- Every item's colorPalette array must reflect the actual color of that item (2-4 hex codes)
- The outfit as a whole must look like one cohesive coordinated look

MANDATORY ITEMS TO INCLUDE (produce at least 7 items):
1. A top (shirt, tee, hoodie, sweater, blouse — appropriate for gender and style)
2. A jacket or outerwear if season/style calls for it
3. Bottoms (trousers, jeans, shorts, skirt — gender appropriate)
4. Shoes (specific model and brand — never generic)
5. A watch (ALWAYS include — choose appropriate for the style and budget)
6. Sunglasses or eyewear (ALWAYS include — choose frame style appropriate for the aesthetic)
7. A bag (GENDER-APPROPRIATE: male → backpack/messenger/belt bag; female → handbag/crossbody/clutch)
8. At least one more accessory (belt, chain, ring, cap, etc. — gender appropriate)

Return ONLY a valid JSON object (no markdown, no code blocks) with this EXACT structure:
{
  "items": [
    {
      "category": "tops",
      "name": "exact item name",
      "brand": "real brand name",
      "estimatedPrice": "$X-$Y",
      "aestheticTag": "style tag",
      "colorPalette": ["#hex1", "#hex2"],
      "description": "why this specific item completes the look"
    }
  ],
  "overallAesthetic": "The overall aesthetic name",
  "styleNarrative": "A vivid 2-3 sentence description of the complete look and the story it tells",
  "chatResponse": ${quizAnswers.chatMessage ? '"Response to user request"' : "null"}
}

Use these exact category values: tops, shirts, jackets, outerwear, pants, shoes, watches, glasses, bags, accessories, jewelry`;
}

type DemoOutfitResult = ReturnType<typeof AnalyzeStyleResponse.parse>;

function buildDemoOutfit(quizAnswers: {
  gender?: string | null;
  style: string;
  colors: string[];
  season: string;
  purpose: string;
  budget: string;
  brands: string[];
  chatMessage?: string | null;
}): DemoOutfitResult {
  const style = quizAnswers.style || "minimalist";
  const budget = quizAnswers.budget || "luxury";
  const gender = quizAnswers.gender || "male";
  const isMale = gender !== "female";

  const priceMap: Record<string, string> = {
    budget: "$80-$200",
    "mid-range": "$300-$800",
    luxury: "$800-$2,500",
    "ultra-luxury": "$2,500-$8,000",
  };
  const watchPriceMap: Record<string, { brand: string; name: string; price: string }> = {
    budget: { brand: "Casio", name: "G-Shock DW5600E", price: "$80-$130" },
    "mid-range": { brand: "Seiko", name: "Presage Cocktail Time", price: "$400-$700" },
    luxury: { brand: "IWC Schaffhausen", name: "Portugieser Automatic", price: "$4,500-$7,000" },
    "ultra-luxury": { brand: "Patek Philippe", name: "Calatrava Ref. 6119", price: "$20,000-$35,000" },
  };
  const watchData = watchPriceMap[budget] ?? watchPriceMap["luxury"];
  const price = priceMap[budget] ?? priceMap["luxury"];

  const styleKey = `${style}-${isMale ? "m" : "f"}`;

  const presets: Record<string, DemoOutfitResult> = {
    "old-money-m": {
      overallAesthetic: "Old Money Gentleman",
      styleNarrative: "A masterclass in understated elegance — tailored linen, polished leather, and a timepiece that speaks without shouting. This is the uniform of someone who inherited taste, not just wealth.",
      chatResponse: quizAnswers.chatMessage ? "Here's a curated look that embodies old money elegance." : null,
      items: [
        { category: "shirts", name: "Fine Linen Spread-Collar Shirt", brand: budget === "ultra-luxury" ? "Loro Piana" : "Brioni", estimatedPrice: price, aestheticTag: "Old Money", colorPalette: ["#f5f0e8", "#e8e0d0"], description: "Open-collar linen in ecru — the cornerstone of summer old money dressing." },
        { category: "pants", name: "Tailored Straight-Leg Linen Trousers", brand: budget === "ultra-luxury" ? "Brunello Cucinelli" : "Zegna", estimatedPrice: price, aestheticTag: "Old Money", colorPalette: ["#c9b89a", "#b8a688"], description: "Camel linen trousers with a clean break — effortlessly polished." },
        { category: "shoes", name: "Horsebit Leather Loafer", brand: "Gucci", estimatedPrice: price, aestheticTag: "Heritage", colorPalette: ["#2c1810", "#4a3020"], description: "The quintessential old money shoe — instantly recognizable, never trying." },
        { category: "jackets", name: "Unstructured Cotton-Linen Blazer", brand: budget === "ultra-luxury" ? "Loro Piana" : "Brunello Cucinelli", estimatedPrice: price, aestheticTag: "Old Money", colorPalette: ["#e8dfc8", "#d4c8b0"], description: "A deconstructed blazer that drapes naturally — never stiff, always considered." },
        { category: "watches", name: watchData.name, brand: watchData.brand, estimatedPrice: watchData.price, aestheticTag: "Horological", colorPalette: ["#c8b88a", "#1a1a1a", "#f5f0e8"], description: "A slim dress watch on a tan leather strap — the quiet flex of old money." },
        { category: "glasses", name: "Acetate Aviator Sunglasses", brand: "Oliver Peoples", estimatedPrice: "$380-$520", aestheticTag: "Heritage", colorPalette: ["#3d2b1a", "#1a1a1a"], description: "Tortoiseshell aviators that complement a summer face without effort." },
        { category: "accessories", name: "Braided Leather Belt", brand: "Anderson's", estimatedPrice: "$180-$280", aestheticTag: "Classic", colorPalette: ["#8b6040", "#5c3d20"], description: "Hand-plaited belt in cognac leather — the final detail that ties everything together." },
        { category: "bags", name: "Slim Canvas Tote", brand: "L.L.Bean", estimatedPrice: "$60-$120", aestheticTag: "Prep", colorPalette: ["#2d4a6a", "#f5f0e8"], description: "A relaxed canvas tote for casual old money moments at the club or market." },
      ],
    },
    "old-money-f": {
      overallAesthetic: "Old Money Femme",
      styleNarrative: "Quiet luxury embodied — silk, cashmere, and structured leather in an understated palette that announces good taste through restraint, not volume.",
      chatResponse: quizAnswers.chatMessage ? "Here's a curated old money look." : null,
      items: [
        { category: "tops", name: "Silk Crepe Blouse", brand: budget === "ultra-luxury" ? "The Row" : "Toteme", estimatedPrice: price, aestheticTag: "Quiet Luxury", colorPalette: ["#f5f0e8", "#e0d8cc"], description: "A weightless silk blouse in ivory — the foundation of understated femininity." },
        { category: "pants", name: "Wide-Leg Tailored Trousers", brand: budget === "ultra-luxury" ? "Brunello Cucinelli" : "Cos", estimatedPrice: price, aestheticTag: "Old Money", colorPalette: ["#c9b89a", "#b8a080"], description: "Camel wide-leg trousers with impeccable drape — polish without effort." },
        { category: "shoes", name: "Pointed-Toe Kitten Heel Mule", brand: "Manolo Blahnik", estimatedPrice: "$680-$950", aestheticTag: "Heritage", colorPalette: ["#c9a87a", "#b89060"], description: "The kitten heel mule in nude leather — timelessly feminine and intentional." },
        { category: "bags", name: "Structured Mini Tote", brand: budget === "ultra-luxury" ? "Hermès" : "Polène", estimatedPrice: budget === "ultra-luxury" ? "$3,800-$6,000" : "$380-$580", aestheticTag: "Investment Piece", colorPalette: ["#c9a070", "#8b6540"], description: "A structured leather tote that functions as much as it elevates the look." },
        { category: "watches", name: watchData.name, brand: watchData.brand, estimatedPrice: watchData.price, aestheticTag: "Horological", colorPalette: ["#d4c090", "#1a1a1a"], description: "A slim gold-toned watch — the most subtle signal of taste." },
        { category: "glasses", name: "Gold-Frame Oval Sunglasses", brand: "Celine", estimatedPrice: "$340-$480", aestheticTag: "Parisian", colorPalette: ["#c8a040", "#1a1a1a"], description: "Thin metal oval frames that let the face do the talking." },
        { category: "jewelry", name: "Gold Chain Necklace", brand: "Mejuri", estimatedPrice: "$180-$320", aestheticTag: "Demi-Fine", colorPalette: ["#d4af37", "#c8a030"], description: "A fine gold chain in 14k — worn alone, never stacked." },
      ],
    },
    "streetwear-m": {
      overallAesthetic: "Streetwear Elite",
      styleNarrative: "The heat-check fit — a co-ordinated streetwear look that moves from the drop queue to the dinner reservation without a second thought. Every piece has a reason to exist.",
      chatResponse: quizAnswers.chatMessage ? "Here's a fire streetwear fit." : null,
      items: [
        { category: "tops", name: "Box Logo Hoodie", brand: budget === "budget" ? "Champion" : budget === "mid-range" ? "Carhartt WIP" : "Supreme", estimatedPrice: price, aestheticTag: "Streetwear", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "The iconic box logo hoodie in black — a streetwear essential with collector status." },
        { category: "pants", name: "Double-Knee Canvas Work Pant", brand: "Carhartt WIP", estimatedPrice: "$120-$180", aestheticTag: "Workwear Streetwear", colorPalette: ["#3d3428", "#2c2820"], description: "Carhartt WIP Double Knee in stone — structured, durable, effortlessly cool." },
        { category: "shoes", name: "Air Jordan 1 High OG", brand: "Nike", estimatedPrice: "$180-$250", aestheticTag: "Sneaker Culture", colorPalette: ["#1a1a1a", "#f5f0e8", "#8b1a1a"], description: "The OG Jordan 1 — the cornerstone of any serious sneaker wardrobe." },
        { category: "accessories", name: "Fitted Wool Cap", brand: "New Era", estimatedPrice: "$40-$65", aestheticTag: "Street", colorPalette: ["#1a1a1a"], description: "A black fitted 59FIFTY — completes the look without overthinking it." },
        { category: "accessories", name: "Cuban Link Chain", brand: "Maple", estimatedPrice: "$180-$400", aestheticTag: "Street Jewels", colorPalette: ["#d4af37", "#c8a030"], description: "A 14k gold-plated Cuban link — the street jewel that elevates any fit." },
        { category: "bags", name: "Logo-Patch Backpack", brand: budget === "mid-range" ? "Carhartt WIP" : budget === "luxury" ? "Côte&Ciel" : "Herschel", estimatedPrice: "$80-$200", aestheticTag: "Street Carry", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "A clean backpack that carries everything without compromising the silhouette." },
        { category: "watches", name: watchData.name, brand: watchData.brand, estimatedPrice: watchData.price, aestheticTag: "Street Time", colorPalette: ["#1a1a1a", "#22c55e"], description: "The G-Shock is street's definitive watch — functional, bold, indestructible." },
        { category: "glasses", name: "Sport Shield Sunglasses", brand: "Oakley", estimatedPrice: "$180-$280", aestheticTag: "Tech Sport", colorPalette: ["#1a1a1a"], description: "Oakley sport shields — the must-have eyewear in streetwear right now." },
      ],
    },
    "streetwear-f": {
      overallAesthetic: "Street Femme",
      styleNarrative: "Effortlessly cool with an intentional edge — this look commands a room without raising its voice, pulling from streetwear's finest while staying unmistakably feminine.",
      chatResponse: quizAnswers.chatMessage ? "Here's a curated street femme fit." : null,
      items: [
        { category: "tops", name: "Oversized Graphic Crop Tee", brand: budget === "budget" ? "H&M" : "Stussy", estimatedPrice: "$60-$120", aestheticTag: "Street Femme", colorPalette: ["#f5f0e8", "#1a1a1a"], description: "An oversized crop tee with a downtown energy." },
        { category: "pants", name: "Baggy Fit Jeans", brand: "Agolde", estimatedPrice: "$220-$320", aestheticTag: "Street", colorPalette: ["#4a6080", "#3d5070"], description: "90s-inspired baggy denim — the silhouette of the moment." },
        { category: "shoes", name: "New Balance 550", brand: "New Balance", estimatedPrice: "$110-$160", aestheticTag: "Sneaker", colorPalette: ["#f5f0e8", "#e0d8cc", "#1a1a1a"], description: "The 550 — the sneaker that replaced everything else in the rotation." },
        { category: "bags", name: "Mini Flap Crossbody", brand: budget === "luxury" ? "Marc Jacobs" : "Zara", estimatedPrice: "$120-$380", aestheticTag: "Street Carry", colorPalette: ["#1a1a1a"], description: "A structured mini crossbody that keeps it minimal and moves with you." },
        { category: "accessories", name: "Bucket Hat", brand: "Kangol", estimatedPrice: "$60-$90", aestheticTag: "Street", colorPalette: ["#1a1a1a"], description: "The bucket hat — a street essential that finishes the look." },
        { category: "watches", name: "G-Shock Baby-G", brand: "Casio", estimatedPrice: "$80-$130", aestheticTag: "Street Time", colorPalette: ["#1a1a1a", "#f5f0e8"], description: "Baby-G — functional, bold, and unapologetically street." },
        { category: "glasses", name: "Tiny Rectangle Sunglasses", brand: "Miu Miu", estimatedPrice: "$280-$420", aestheticTag: "Y2K Street", colorPalette: ["#1a1a1a", "#c8c0b8"], description: "Tiny rectangles are back and commanding the streets." },
        { category: "jewelry", name: "Layered Gold Chains", brand: "Mejuri", estimatedPrice: "$120-$280", aestheticTag: "Street Jewels", colorPalette: ["#d4af37"], description: "Stacked fine gold chains — the street jewel formula." },
      ],
    },
    "minimalist-m": {
      overallAesthetic: "Modern Minimalist",
      styleNarrative: "Form follows function — a precisely edited wardrobe where every piece earns its place through quality and restraint. Nothing unnecessary, nothing missing.",
      chatResponse: quizAnswers.chatMessage ? "Here's a minimal, precise look." : null,
      items: [
        { category: "tops", name: "Heavyweight Cotton Crew-Neck Tee", brand: budget === "budget" ? "Uniqlo" : budget === "mid-range" ? "COS" : "Jil Sander", estimatedPrice: price, aestheticTag: "Minimalist", colorPalette: ["#f5f0e8", "#e8e4dc"], description: "A perfectly weighted white tee — the minimalist's most essential investment." },
        { category: "pants", name: "Straight-Leg Wool-Blend Trousers", brand: budget === "budget" ? "COS" : "Acne Studios", estimatedPrice: price, aestheticTag: "Minimalist", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "Black straight-leg trousers with a clean silhouette — the minimalist essential." },
        { category: "shoes", name: "Achilles Low Sneaker", brand: "Common Projects", estimatedPrice: "$480-$580", aestheticTag: "Minimal Footwear", colorPalette: ["#f5f0e8", "#e8e4dc"], description: "The Common Projects Achilles — minimalism's definitive sneaker. Gold number stamp, nothing else." },
        { category: "jackets", name: "Single-Breasted Wool Overcoat", brand: budget === "ultra-luxury" ? "The Row" : "COS", estimatedPrice: price, aestheticTag: "Minimalist", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "A long black overcoat that turns any combination into a statement." },
        { category: "watches", name: watchData.name, brand: watchData.brand, estimatedPrice: watchData.price, aestheticTag: "Minimal Time", colorPalette: ["#f5f0e8", "#1a1a1a"], description: "A clean dial watch — the only accessory a minimalist needs." },
        { category: "glasses", name: "Rectangular Metal-Frame Sunglasses", brand: "Celine", estimatedPrice: "$380-$480", aestheticTag: "Minimal", colorPalette: ["#1a1a1a", "#888888"], description: "Thin black metal frames — precise, clean, architectural." },
        { category: "accessories", name: "Smooth Leather Belt", brand: "The Row", estimatedPrice: "$280-$420", aestheticTag: "Minimalist", colorPalette: ["#1a1a1a"], description: "A clean pull-through belt in black — no buckle decoration, just quality leather." },
        { category: "bags", name: "Structured Leather Messenger", brand: budget === "ultra-luxury" ? "Valextra" : "Aesther Ekme", estimatedPrice: budget === "ultra-luxury" ? "$2,800-$4,500" : "$480-$680", aestheticTag: "Minimal Carry", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "A flat structured messenger in black — the minimalist's carry solution." },
      ],
    },
    "techwear-m": {
      overallAesthetic: "Techwear Operative",
      styleNarrative: "Function elevated to aesthetic — this is the intersection of performance engineering and urban fashion. Every panel, zipper, and fabric serves a purpose beyond mere style.",
      chatResponse: quizAnswers.chatMessage ? "Here's a technical performance fit." : null,
      items: [
        { category: "jackets", name: "Alpha SV Jacket", brand: "Arc'teryx", estimatedPrice: "$800-$1,200", aestheticTag: "Technical Shell", colorPalette: ["#1a1a1a", "#0d0d0d"], description: "The Arc'teryx Alpha SV — peak technical outerwear, built to perform at altitude." },
        { category: "pants", name: "Nylon Cargo Trousers", brand: budget === "budget" ? "Uniqlo" : "Acronym", estimatedPrice: price, aestheticTag: "Techwear", colorPalette: ["#1a1a1a", "#0d0d0d"], description: "Technical nylon cargos with articulated knees and modular pockets." },
        { category: "tops", name: "Merino Base Layer Top", brand: "Outlier", estimatedPrice: "$180-$280", aestheticTag: "Technical Base", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "A premium merino base layer — temperature-regulating and odor-resistant." },
        { category: "shoes", name: "Speedcross 6 Trail Runner", brand: "Salomon", estimatedPrice: "$140-$180", aestheticTag: "Technical Footwear", colorPalette: ["#1a1a1a", "#0d0d0d", "#222222"], description: "Salomon Speedcross — the techwear sneaker that actually performs outdoors." },
        { category: "bags", name: "3Way Backpack", brand: "Acronym", estimatedPrice: "$580-$980", aestheticTag: "Technical Carry", colorPalette: ["#1a1a1a", "#0d0d0d"], description: "A modular technical backpack with MOLLE attachment points and waterproof zips." },
        { category: "watches", name: "Rangeman GW-9400", brand: "Casio G-Shock", estimatedPrice: "$280-$380", aestheticTag: "Technical Time", colorPalette: ["#1a1a1a", "#2a2a2a"], description: "G-Shock Rangeman — solar-powered, multi-band, tough enough for any operation." },
        { category: "glasses", name: "Visionary Shield Goggle Glasses", brand: "Oakley", estimatedPrice: "$220-$380", aestheticTag: "Technical Eyewear", colorPalette: ["#1a1a1a", "#0d0d0d"], description: "Oakley shield glasses — the tactical eyewear that defines techwear." },
        { category: "accessories", name: "Utility Belt with Modular Pouches", brand: "Acronym", estimatedPrice: "$280-$480", aestheticTag: "Tactical", colorPalette: ["#1a1a1a"], description: "A technical utility belt with magnetic buckle and detachable pouches." },
      ],
    },
    "dark-academia-m": {
      overallAesthetic: "Dark Academia Scholar",
      styleNarrative: "The wardrobe of someone who reads Dostoevsky in a wood-panelled library and debates philosophy over black coffee. Every piece suggests intellect and considered tradition.",
      chatResponse: quizAnswers.chatMessage ? "Here's a dark academia look." : null,
      items: [
        { category: "tops", name: "Ribbed Turtleneck Sweater", brand: budget === "budget" ? "Uniqlo" : "Acne Studios", estimatedPrice: price, aestheticTag: "Dark Academia", colorPalette: ["#2c2010", "#1a1a0a"], description: "A dark brown ribbed turtleneck — the scholar's choice for a literary mood." },
        { category: "pants", name: "Tailored Wool Tweed Trousers", brand: budget === "luxury" ? "De Bonne Facture" : "COS", estimatedPrice: price, aestheticTag: "Academic", colorPalette: ["#3a2a1a", "#4a3020"], description: "Earthy brown tweed trousers — structured and considered." },
        { category: "shoes", name: "Double Monk-Strap Oxford", brand: "Tricker's", estimatedPrice: "$480-$680", aestheticTag: "Heritage", colorPalette: ["#2c1810", "#1a0e08"], description: "Dark burgundy monk-straps that walk into every room with intention." },
        { category: "jackets", name: "Wool Herringbone Blazer", brand: budget === "ultra-luxury" ? "Cifonelli" : "Drake's", estimatedPrice: price, aestheticTag: "Academic", colorPalette: ["#2a2010", "#1a1810"], description: "A dark herringbone blazer — the crest of dark academia's wardrobe." },
        { category: "watches", name: watchData.name, brand: watchData.brand, estimatedPrice: watchData.price, aestheticTag: "Vintage Scholar", colorPalette: ["#c8b060", "#1a1a1a", "#f5e8d0"], description: "A vintage-inspired watch face on a dark leather strap — worn to read in candlelight." },
        { category: "glasses", name: "Tortoiseshell Round Glasses", brand: "Eyevan 7285", estimatedPrice: "$380-$580", aestheticTag: "Literary", colorPalette: ["#4a2c10", "#2c1a08"], description: "Tortoiseshell round frames — the scholar's lens through which the world is interpreted." },
        { category: "bags", name: "Leather Satchel Briefcase", brand: "Saddleback Leather", estimatedPrice: "$280-$580", aestheticTag: "Scholar's Carry", colorPalette: ["#2c1810", "#4a2c1a"], description: "A dark leather satchel that carries manuscripts, keys, and quiet authority." },
        { category: "accessories", name: "Wool Scarf in Plaid", brand: "Drake's", estimatedPrice: "$180-$320", aestheticTag: "Academic", colorPalette: ["#2a1a10", "#4a3020", "#f5e8d0"], description: "A dark plaid wool scarf — worn loosely, never too neat." },
      ],
    },
  };

  const preset =
    presets[styleKey] ||
    presets[`${style}-m`] ||
    presets["minimalist-m"];

  return {
    ...preset,
    chatResponse: quizAnswers.chatMessage
      ? "I've curated an outfit tailored to your specific request. Here's a look that captures exactly the essence of what you had in mind."
      : null,
  };
}

async function callAI(
  openai: OpenAI,
  prompt: string,
  photo: string | null,
): Promise<ReturnType<typeof AnalyzeStyleResponse.parse> | null> {
  const MODEL = "gpt-4o-mini";

  if (photo) {
    try {
      const imageUrl = photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content ?? null;
      if (raw) {
        const result = parseAIResponse(raw);
        if (result) return result;
      }
    } catch (visionErr: unknown) {
      const msg = visionErr instanceof Error ? visionErr.message : String(visionErr);
      console.error("[stylist] Vision attempt failed:", msg);
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? null;
    if (raw) return parseAIResponse(raw);
  } catch (textErr: unknown) {
    const msg = textErr instanceof Error ? textErr.message : String(textErr);
    console.error("[stylist] Text-only attempt failed:", msg);
  }

  return null;
}

function parseAIResponse(raw: string): ReturnType<typeof AnalyzeStyleResponse.parse> | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const validated = AnalyzeStyleResponse.safeParse(parsed);
    if (validated.success) return validated.data;
    console.error("[stylist] Schema validation failed:", validated.error.message);
  } catch (err) {
    console.error("[stylist] JSON parse failed:", err);
  }
  return null;
}

router.post("/stylist/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStyleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { photo, quizAnswers } = parsed.data;
  const prompt = buildStylePrompt(quizAnswers, !!photo);

  let openai: OpenAI | null = null;
  try {
    openai = getOpenAI();
  } catch (err) {
    console.error("[stylist] OpenAI not configured:", err);
  }

  if (openai) {
    const result = await callAI(openai, prompt, photo ?? null);
    if (result) {
      res.json(result);
      return;
    }
  }

  console.log("[stylist] All AI attempts exhausted — returning curated demo outfit");
  res.json(buildDemoOutfit(quizAnswers));
});

router.get("/stylist/outfits", async (_req, res): Promise<void> => {
  const outfits = await db
    .select()
    .from(savedOutfitsTable)
    .orderBy(desc(savedOutfitsTable.createdAt));
  res.json(
    ListOutfitsResponse.parse(
      outfits.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        quizAnswers: o.quizAnswers,
        outfitResult: o.outfitResult,
        label: o.label,
      })),
    ),
  );
});

router.post("/stylist/outfits", async (req, res): Promise<void> => {
  const parsed = SaveOutfitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [outfit] = await db
    .insert(savedOutfitsTable)
    .values({
      quizAnswers: parsed.data.quizAnswers,
      outfitResult: parsed.data.outfitResult,
      label: parsed.data.label ?? null,
    })
    .returning();

  const responsePayload = {
    id: outfit.id,
    createdAt: outfit.createdAt,
    quizAnswers: outfit.quizAnswers,
    outfitResult: outfit.outfitResult,
    label: outfit.label,
  };

  const validatedResponse = ListOutfitsResponse.element.safeParse(responsePayload);
  if (!validatedResponse.success) {
    req.log.error({ errors: validatedResponse.error.message }, "Saved outfit response failed schema validation");
    res.status(500).json({ error: "Failed to validate saved outfit response." });
    return;
  }

  res.status(201).json(validatedResponse.data);
});

export default router;
