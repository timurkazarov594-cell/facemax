import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { PlanVoyageBody } from "@workspace/api-zod";
import { lookupHotelImage } from "../data/hotel-images.js";
import { buildCacheKey, getFromCache, saveToCache } from "../lib/route-cache.js";
import { findByToken, findById, addTrip, deleteTrip, getUserTrips, type SavedTrip } from "../lib/user-store.js";

// ── Async job store (avoids 60s production proxy timeout) ────────────────────
type PlanJobState =
  | { status: "pending"; createdAt: number }
  | { status: "done"; result: Record<string, unknown>; createdAt: number }
  | { status: "error"; message: string; createdAt: number };

const planJobs = new Map<string, PlanJobState>();

// Prune jobs older than 30 minutes every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of planJobs) {
    if (job.createdAt < cutoff) planJobs.delete(id);
  }
}, 10 * 60 * 1000).unref();

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

function getSeason(): { month: string; season: string; hemisphereNote: string } {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const m = new Date().getMonth();
  const month = months[m];
  let season: string;
  if (m === 11 || m <= 1) season = "Winter";
  else if (m <= 4) season = "Spring";
  else if (m <= 7) season = "Summer";
  else season = "Autumn";
  const hemisphereNote = `In the Northern Hemisphere it is currently ${season}. Tropical/equatorial destinations (Maldives, Bali, Dubai, Thailand, Zanzibar) are good year-round. Southern Hemisphere seasons are reversed.`;
  return { month, season, hemisphereNote };
}

function buildAreaSelectionGuide(destination: string, city: string, tripTypes: string[], hotelPrefs: string[]): string {
  const loc = (city || destination).toLowerCase().trim();
  const t = (v: string) => tripTypes.map(x => x.toLowerCase()).includes(v);
  const p = (v: string) => hotelPrefs.map(x => x.toLowerCase()).includes(v);

  const hasNightlife  = t("nightlife") || t("party");
  const hasBeach      = t("beach") || p("near_beach") || p("private_beach") || p("water_sports");
  const hasLuxury     = t("luxury_exp");
  const hasBusiness   = t("business_trip");
  const hasFamily     = t("family");
  const hasRomantic   = t("romantic") || t("honeymoon");
  const hasBudget     = t("budget_trip");
  const hasSki        = t("ski");
  const hasWellness   = t("wellness") || t("spa") || p("spa");
  const hasQuiet      = p("quiet");
  const hasShopping   = t("shopping");
  const hasNearCenter = p("near_center");

  // ── Per-city area matrices ───────────────────────────────────────────────
  const matrices: Record<string, string> = {
    dubai: `
DUBAI AREA SELECTION — match user preferences to these districts:
• Nightlife / party / social scene     → Dubai Marina, JBR (Jumeirah Beach Residence), Downtown (Soho Garden, Drai's)
• Luxury / high-end shopping / VVIP   → Downtown Dubai (Burj Khalifa), DIFC, City Walk, Dubai Mall area
• Beach / swimming / water sports      → JBR Beach, La Mer, Jumeirah Beach, Palm Jumeirah (Atlantis side)
• Budget / value / backpacker          → Deira, Bur Dubai, Al Barsha, Al Rigga — NEVER Palm or Marina for budget
• Family / kids / theme parks          → JBR, Palm Jumeirah (Atlantis Aquaventure), Festival City, Dubai Creek
• Business / corporate / meetings      → DIFC, Business Bay, Downtown, Sheikh Zayed Road
• Romantic / honeymoon / couples       → Downtown (Burj Khalifa view), Palm Jumeirah (villa hotels), Dubai Marina at night
• Quiet / peaceful / residential       → Jumeirah, Al Sufouh, Palm Jumeirah residential side
• Shopping focused                     → Downtown (Dubai Mall), Mall of the Emirates (Al Barsha), City Walk, Gold Souk (Deira)
⚠ CRITICAL: Do NOT default to Palm Jumeirah unless the trip is luxury, romantic, family, or explicit beach. For nightlife → Marina/JBR. For business → DIFC/Business Bay. For budget → Deira/Bur Dubai.`,

    paris: `
PARIS AREA SELECTION — match user preferences to these arrondissements:
• Nightlife / clubs / bars             → Pigalle (18th), Oberkampf (11th), Le Marais (4th, gay scene), République area
• Luxury / haute couture / iconic      → 8th arrondissement (Champs-Élysées, Triangle d'Or), 1st (Louvre, Place Vendôme), 6th (Saint-Germain)
• Romantic / couples / honeymoon       → Montmartre (18th), Île Saint-Louis (4th), Saint-Germain-des-Prés (6th), Eiffel Tower (7th)
• Family / museums / sightseeing       → 7th (Eiffel Tower), 4th (Notre-Dame, Marais), 1st (Louvre)
• Budget / local / authentic           → 10th, 11th, 18th (Montmartre), 20th — avoid 1st/8th for budget
• Business / corporate                 → La Défense, 8th, 9th (Opéra), 15th (Expo/conference area)
• Quiet / residential                  → 7th, 16th (Passy), 5th (Latin Quarter)`,

    bali: `
BALI AREA SELECTION — very distinct zones, match carefully:
• Nightlife / party / clubs            → Seminyak (Ku De Ta, Potato Head), Kuta (party hub), Legian, Canggu (beach clubs)
• Beach / swimming / surf              → Kuta (surf), Seminyak (beach clubs), Canggu (surf), Nusa Dua (calm luxury beach), Sanur (calm)
• Romantic / honeymoon / couples       → Ubud (rice terrace, jungle), Uluwatu (cliff villas, sunset), Nusa Dua (private villa resorts)
• Wellness / yoga / spiritual          → Ubud (healing, yoga, temples, retreats)
• Luxury / ultra-luxury / privacy      → Nusa Dua (5-star resort enclave), Jimbaran (private villas), Uluwatu (cliff villas)
• Family / kids                        → Nusa Dua (calm beach, safe), Sanur (calm), Seminyak (beach + activities)
• Budget / backpacker                  → Kuta, Legian, Ubud (guesthouses), Canggu (budget hostels)
• Culture / temples / sightseeing      → Ubud (Monkey Forest, rice terraces, temples)`,

    tokyo: `
TOKYO AREA SELECTION:
• Nightlife / clubs / entertainment    → Shinjuku (Golden Gai, Kabukicho), Shibuya (clubs), Roppongi (expat nightlife)
• Luxury / high-end / designer         → Ginza, Marunouchi, Omotesando, Nishi-Azabu
• Romantic / couples                   → Shinjuku (lights), Odaiba (waterfront), Shibuya (views), Harajuku
• Family / sightseeing                 → Asakusa (Senso-ji), Shibuya, Akihabara (tech), Odaiba
• Business / corporate                 → Marunouchi, Shinjuku, Shinagawa, Tokyo Station area
• Quiet / residential                  → Yanaka, Shimokitazawa, Daikanyama
• Budget                               → Asakusa, Ueno, Ikebukuro`,

    barcelona: `
BARCELONA AREA SELECTION:
• Nightlife / clubs / beach parties    → Barceloneta beach area, El Born, Vila Olímpica, Eixample (Gayxample)
• Luxury / design / upscale            → Passeig de Gràcia (Eixample), Diagonal, Sarrià-Sant Gervasi
• Romantic / couples                   → Gothic Quarter, El Born, Gràcia, Barceloneta sunset
• Family / sightseeing                 → Gothic Quarter (Las Ramblas), Eixample (Gaudí), Barceloneta
• Budget / local                       → Gràcia, Poble Sec, Raval (budget hotels, local vibe)
• Business                             → Eixample, Diagonal, Port Olímpic`,

    phuket: `
PHUKET AREA SELECTION:
• Nightlife / party                    → Patong Beach (Bangla Road nightlife strip)
• Beach / relaxation / couples         → Kata Beach, Karon Beach, Kamala (quieter), Surin (luxury)
• Luxury / ultra-luxury                → Surin Beach, Bang Tao (Laguna), Cape Yamu (private), Natai
• Family / calm                        → Kata Beach, Karon Beach, Bang Tao (Laguna Resort area)
• Budget                               → Patong (budget guesthouses), Phuket Town (cheapest)
• Quiet / peaceful                     → Kamala, Surin, Cape Panwa, Rawai`,

    maldives: `
MALDIVES AREA SELECTION — atoll and island type matters:
• Ultra luxury / overwater villas      → North Malé Atoll (Velaa, Cheval Blanc, Soneva Jani), South Malé (Four Seasons, W), Baa Atoll (UNESCO biosphere)
• Premium / luxury                     → Malé Atoll (Conrad, Sheraton, Anantara), Ari Atoll (many 5-star options)
• Mid-range / comfort                  → Faafu Atoll, Ari Atoll (mid-range resorts), Lhaviyani
• Budget / local island experience     → Maafushi island (local guesthouses, cheapest), Guraidhoo, Thulusdhoo (surf)
• Best diving / snorkeling             → Baa Atoll (UNESCO), Ari Atoll (whale sharks), South Malé Atoll
• Romantic / honeymoon                 → Overwater bungalow resorts in North/South Malé or Baa Atoll`,

    santorini: `
SANTORINI AREA SELECTION:
• Iconic views / photos / honeymoon    → Oia (famous blue domes, sunset views) — most sought-after
• Nightlife / bars / parties           → Fira (capital, most lively), Firostefani
• Romantic / quieter luxury            → Imerovigli (highest point, quietest of the caldera villages)
• Budget                               → Kamari or Perissa (beach villages, far cheaper than caldera)
• Beach                                → Perissa (black sand), Kamari, Perivolos
⚠ Oia = most expensive and most iconic. Fira = nightlife + central. Imerovigli = quiet luxury.`,

    mykonos: `
MYKONOS AREA SELECTION:
• Nightlife / party / clubs            → Mykonos Town (Hora) — Paradise Beach, Super Paradise Beach, Cavo Paradiso
• Romantic / couples / quiet           → Ornos, Agios Stefanos, Kalafatis (quieter beaches)
• Luxury / ultra-luxury                → Psarou Beach (celebrity hangout), Ornos, private villa areas
• Family / calm                        → Ornos, Platis Gialos, Agios Ioannis`,

    new_york: `
NEW YORK AREA SELECTION:
• Nightlife / clubs / music            → Lower East Side, Meatpacking District, Brooklyn (Williamsburg, Bushwick)
• Luxury / iconic / business           → Midtown (5th Ave, Park Ave), Upper East Side
• Romantic / boutique                  → West Village, SoHo, Tribeca, Brooklyn Heights
• Budget / value                       → Long Island City (Queens), Harlem, Brooklyn
• Family / sightseeing                 → Midtown (Times Square, Central Park), Upper West Side
• Trendy / creative                    → SoHo, Brooklyn, Williamsburg`,

    london: `
LONDON AREA SELECTION:
• Nightlife / clubs / music            → Shoreditch, Dalston, Soho, Brixton
• Luxury / upscale                     → Mayfair, Knightsbridge, Chelsea, Belgravia
• Romantic / boutique                  → Notting Hill, Covent Garden, South Bank
• Family / sightseeing                 → South Kensington (museums), Westminster (Big Ben, Parliament), Southwark
• Business / corporate                 → City of London, Canary Wharf, Paddington
• Budget                               → Stratford, Hackney, Earls Court, Dalston`,

    antalya: `
ANTALYA / BELEK / TURKISH RIVIERA AREA SELECTION:
• Ultra-luxury mega resorts / golf     → Belek (Titanic Mardan Palace, Maxx Royal, Kempinski, Regnum Carya, Gloria Serenity, Rixos Premium, Cornelia Diamond, Voyage Belek, Cullinan)
• Mid-range all-inclusive beach        → Lara Beach (Limak Lara Deluxe, Barut Hemera, Asteria Kremlin Palace, IC Hotels Green Palace, Liberty Hotels Lara, Concorde De Luxe)
• Budget beach packages                → Alanya, Side, Kundu, Konakli — very affordable all-inclusive chains, Sunis Kumkoy
• Romantic / boutique / historic       → Kaleiçi Old Town (cave hotels, restored Ottoman houses, Hadrian's Gate, Antalya harbor)
• Nightlife / bars / young crowd       → Kemer (Moonlight Beach, clubs), Alanya (active bar scene, Cleopatra Beach), Antalya city
• Family / water parks / kids clubs    → Lara Beach (Land of Legends Theme Park adjacent), Belek (mega resort kids clubs)
• Wellness / golf / adults-only        → Belek (6+ world-class PGA golf courses, spa hotels, adults-only wings, thalassotherapy)
⚠ CRITICAL: Belek = ultra-luxury 5-star mega resorts with golf. Lara = mid-range all-inclusive. Alanya/Side = budget. Kaleiçi = boutique. NEVER put a budget user in Belek or vice versa.`,

    bodrum: `
BODRUM / AEGEAN TURKEY AREA SELECTION:
• Ultra-luxury / yacht / exclusive     → Yalıkavak (Mandarin Oriental Bodrum, Palmarina yacht harbor), Türkbükü ("Turkish St Tropez", D Maris Bay, LVNLY Club), Göltürkbükü
• Premium spa / boutique               → Six Senses Kaplankaya (Akyarlar), Amanruya (Göltürkbükü), Maçakızı (Türkbükü)
• Nightlife / beach clubs / party      → Gümbet (Halikarnassos club, beach parties), Bodrum Town harbor (bars, marina)
• Romantic / peaceful / couples        → Akyarlar, Turgutreis, Bağla, Ortakent (quieter coves, sunset panoramas)
• Budget / backpacker                  → Gümbet budget guesthouses, Bodrum Town center pensions
• Family                               → Torba (calm bay, safe), Yalıkavak (modern facilities, shops), Bitez (windsurfing)`,

    istanbul: `
ISTANBUL AREA SELECTION:
• Luxury / Bosphorus / iconic          → Beşiktaş shore (Çırağan Palace Kempinski), Ortaköy, Bebek, Nişantaşı, Sirkeci (Four Seasons at Sultanahmet)
• Heritage / history / sightseeing     → Sultanahmet (Blue Mosque, Hagia Sophia, Topkapi Palace) — most tourist zone
• Business / corporate / modern        → Şişli (Hilton Bomonti, Conrad), Levent, Maslak, Taksim Square area
• Nightlife / trendy / creative        → Beyoğlu (İstiklal Caddesi, Karaköy), Cihangir (bohemian artists), Nişantaşı (designer boutiques)
• Romantic / Bosphorus views           → Ortaköy, Arnavutköy, Bebek (café by the water), Üsküdar (Asian side, authentic)
• Budget / authentic                   → Fatih, Balat (colorful street art Instagram district), Eminönü (Grand Bazaar area)
• Family / sightseeing                 → Sultanahmet (museums), Grand Bazaar (Kapalıçarşı), Spice Bazaar, Galata Tower, Eminönü`,

    vietnam: `
VIETNAM CITY / AREA SELECTION:
• Hanoi (capital, culture):            → Old Quarter/Hoan Kiem for tourism & boutique; Tay Ho (West Lake) for expat luxury; Ba Dinh for business
• Ho Chi Minh City / Saigon:           → District 1 (Dong Khoi, luxury & business, Park Hyatt, Reverie Saigon); District 3 boutique; Thao Dien (expat)
• Da Nang + Hoi An:                    → My Khe Beach (InterContinental Sun Peninsula, resort strip); Non Nuoc Beach; Hoi An Old Town (lantern streets, boutique)
• Phu Quoc Island:                     → North (JW Marriott, Club Med, Nam Nghi — ultra-luxury); Long Beach (Bãi Trường, mid-range); South (Sao Beach, quieter)
• Nha Trang:                           → Beachfront Tran Phu strip (most resorts); Vinpearl Island (self-contained mega resort)
• Sapa mountain:                       → Town center (fog, trekking base); tophill (Topas Eco Lodge, views)`,

    thailand: `
THAILAND AREA/CITY SELECTION:
• Bangkok luxury / business            → Riverside/Silom (Mandarin Oriental, Capella, Peninsula — riverside iconic); Sukhumvit (business + shopping)
• Bangkok nightlife                    → Sukhumvit Soi 11 (rooftop bars), Thong Lo/Ekkamai (upscale), Silom Soi 4, Khao San Road (backpacker)
• Bangkok sightseeing / culture        → Rattanakosin (Grand Palace, Wat Pho, Wat Arun), Ari (local cafés), Chatuchak
• Ko Samui beach                       → Chaweng (most lively, nightlife + beach clubs); Bophut Fisherman's Village (boutique); Maenam (quiet, budget); Choeng Mon (luxury private)
• Koh Phi Phi / Krabi                  → Ton Sai Bay (backpacker), Loh Dalum Bay (party), Long Beach (quieter), Railay (cliffs, no cars)
• Chiang Mai culture                   → Old City moat area (night bazaar, temples, boutique); Nimman Road (hipster cafes, design hotels); Doi Suthep mountain resorts`,

    portugal: `
PORTUGAL AREA SELECTION:
• Lisbon luxury / design               → Chiado/Príncipe Real (boutique 5-star, hilltop views); Avenida da Liberdade (luxury chain hotels); Bairro Alto
• Lisbon historic                      → Alfama (Fado music, São Jorge Castle, narrow cobblestone streets); Mouraria; Belém (Tower, Jerónimos monastery)
• Lisbon budget / trendy               → Intendente, Anjos, Arroios (up-and-coming); Mouraria (multicultural)
• Algarve luxury beach                 → Quinta do Lago / Vale do Lobo (private estates, golf); Vilamoura (marina, luxury resorts); Carvoeiro (cliffs)
• Algarve mid-range beach              → Lagos (Old Town + beach), Albufeira (busy, nightlife), Portimão, Alvor
• Porto heritage / wine country        → Ribeira riverfront (UNESCO World Heritage); Boavista (luxury); Foz do Douro (beach, upscale)
• Sintra / palaces                     → Royal hillside retreat — Penha Longa (golf resort), Tivoli Palácio de Seteais`,

    croatia: `
CROATIA AREA SELECTION:
• Dubrovnik ultra-luxury               → Old Town adjacent (Hotel Excelsior, Villa Dubrovnik, Rixos Premium) — Adriatic cliff views
• Dubrovnik mid-range                  → Lapad Peninsula (more affordable, pools, shuttle to Old Town)
• Split                                → Diocletian's Palace (boutique within UNESCO walls, Le Méridien Lav); Bačvice Beach
• Hvar island party / luxury           → Hvar Town (marina, Carpe Diem beach club, celebrity nightlife, Amfora Grand Beach Resort)
• Hvar quiet / romantic                → Stari Grad, Jelsa (no cars, olive groves)
• Istria / Rovinj                      → Adriatic coast, truffle cuisine, Hotel Monte Mulini, Maistra Collection
• Brač island                          → Bol village (Zlatni Rat golden horn beach, world-famous), Supetar (ferry hub)`,

    india: `
INDIA AREA SELECTION:
• Mumbai luxury / business             → Nariman Point (Taj Mahal Palace & Tower, Oberoi Mumbai); Bandra-Kurla Complex (business); Juhu (beach, Bollywood)
• Goa north beach / nightlife          → Candolim/Calangute (mid-range popular); Baga (nightlife, bars); Anjuna/Vagator (bohemian parties, psytrance)
• Goa south beach / luxury             → Cavelossim/Benaulim (Leela Goa, Taj Exotica — luxury, quiet); Palolem (backpacker paradise)
• Rajasthan palace hotels              → Udaipur (Taj Lake Palace, Oberoi Udaivilas — lake islands); Jodhpur (Umaid Bhawan Palace); Jaipur (Rambagh Palace, Jai Mahal)
• Delhi / Agra                         → New Delhi Lutyens Zone (Leela Palace, ITC Maurya, Imperial); Aerocity (airport, business); Agra for Taj Mahal views
• Kerala / backwaters                  → Kumarakom (houseboats + CGH Earth); Kovalam Beach; Munnar (tea estate bungalows); Kochi Fort (heritage)`,

    egypt: `
EGYPT / RED SEA AREA SELECTION:
• Sharm el-Sheikh diving/luxury        → Naama Bay (most hotels, diving, nightlife); Sharks Bay (quieter, reef); Nabq Bay (newer luxury, shallow reefs)
• Hurghada beach packages              → Sahl Hasheesh (ultra-luxury self-contained enclave, RIXOS Premium); El Gouna (self-contained resort town, watersports)
• Cairo culture / business             → Zamalek island (boutique, diplomatic); Nile Corniche (Four Seasons, Kempinski); Giza (pyramid views, Marriott Mena House)
• Luxor / Aswan heritage               → Nile cruises + Winter Palace Luxor; Sofitel Legend Old Cataract Aswan`,

    mexico: `
MEXICO AREA SELECTION:
• Cancún                               → Hotel Zone (Zona Hotelera) — all-inclusive resorts strip, Hyatt Zilara; Downtown (budget, local)
• Riviera Maya / Playa del Carmen      → Playa del Carmen 5th Ave (boutique, lively); Tulum (eco-luxury, cenotes, Azulik, Papaya Playa); Akumal (turtles, calm)
• Los Cabos                            → Cabo San Lucas (marina, nightlife, party, Waldorf Astoria); San José del Cabo (arts, Chileno Bay, quiet luxury)
• Puerto Vallarta                      → Hotel Zone (resorts); Romantic Zone Old Town (boutique, LGBTQ+-friendly); Punta de Mita (ultra-luxury, Four Seasons)`,

    caribbean: `
CARIBBEAN ISLAND AREA SELECTION:
• Jamaica                              → Montego Bay (resorts, Sandals, Half Moon); Negril (sunset beach, 7-mile beach, cliff diving); Ocho Rios (Dunn's Falls, family)
• Barbados                             → Platinum Coast West (Sandy Lane, Cobblers Cove, luxury); South Coast (budget, nightlife); Bridgetown (historic, accessible)
• St Lucia                             → Rodney Bay (mid-range, marina, nightlife); Soufrière (Pitons UNESCO views, Jade Mountain, Anse Chastanet luxury)
• Turks & Caicos                       → Grace Bay Beach, Providenciales (COMO Parrot Cay, The Palms — turquoise clarity world-famous)
• Maldives-style alternatives          → Bora Bora (French Polynesia, overwater bungalows); Seychelles (La Digue island, Fregate private island)`,
  };

  // Match destination to a matrix
  let areaGuide = "";
  for (const [key, guide] of Object.entries(matrices)) {
    const matchKey = key.replace(/_/g, " ");
    if (loc.includes(matchKey) || matchKey.includes(loc)) {
      areaGuide = guide;
      break;
    }
  }

  // Build preference summary for the AI
  const activePrefsSummary: string[] = [];
  if (hasNightlife)  activePrefsSummary.push("nightlife/party");
  if (hasBeach)      activePrefsSummary.push("beach/sea");
  if (hasLuxury)     activePrefsSummary.push("luxury experience");
  if (hasBusiness)   activePrefsSummary.push("business");
  if (hasFamily)     activePrefsSummary.push("family with kids");
  if (hasRomantic)   activePrefsSummary.push("romantic/honeymoon");
  if (hasBudget)     activePrefsSummary.push("budget/value");
  if (hasSki)        activePrefsSummary.push("ski/mountain");
  if (hasWellness)   activePrefsSummary.push("wellness/spa");
  if (hasQuiet)      activePrefsSummary.push("quiet/peaceful");
  if (hasShopping)   activePrefsSummary.push("shopping");
  if (hasNearCenter) activePrefsSummary.push("near city center");

  return `
HOTEL SELECTION INTELLIGENCE — READ CAREFULLY:

User profile summary: ${activePrefsSummary.length > 0 ? activePrefsSummary.join(", ") : "general traveler"}
Hotel preferences selected: ${hotelPrefs.length > 0 ? hotelPrefs.join(", ") : "none specified"}

STEP 1 — CHOOSE THE RIGHT AREA FIRST:
Do NOT pick the hotel first and then justify it. Pick the area that best matches user preferences, THEN find the right hotel in that area.
Never default to the most famous/touristic district unless it genuinely fits the user's preferences.
${areaGuide}

STEP 2 — CHOOSE THE HOTEL WITHIN THAT AREA:
Within the chosen area, select a hotel that:
- Matches the travel level tier (price range)
- Has amenities matching the selected hotel preferences: ${hotelPrefs.join(", ") || "no specific preferences"}
- Is appropriate for ${activePrefsSummary.join(", ") || "a general trip"}

STEP 3 — EXPLAIN THE MATCH IN DETAIL:
The "whyItFits" field MUST:
- List which specific user preferences this hotel satisfies (e.g., "Beachfront location matches beach preference; rooftop bar serves nightlife preference; spa facility covers spa preference")
- State why this AREA was chosen over other areas in the city
- Explain who this hotel is best suited for
- Be 3-4 sentences minimum

The "whyThisArea" field MUST explain:
- Which area/neighborhood was chosen
- Why this area matches the user's specific trip type and preferences over other districts
- What makes this location uniquely suitable for this user`;
}

function buildVoyagePrompt(req: {
  destination: string;
  city?: string;
  travelLevel: string;
  tripTypes: string[];
  hotelPrefs: string[];
  restaurantPrefs: string[];
  duration: string;
  budget: string;
  language: string;
  guests?: string;
  rooms?: string;
  roomType?: string;
}): string {
  const lang = req.language === "ru" ? "Russian" : "English";
  const levelLabels: Record<string, string> = {
    budget: "Budget",
    cheap_perfect: "Cheap But Perfect",
    comfort: "Comfort",
    business: "Business",
    premium: "Premium",
    luxury: "Luxury",
    ultra_luxury: "Ultra Luxury",
  };
  const level = levelLabels[req.travelLevel] ?? req.travelLevel;
  const { month, season, hemisphereNote } = getSeason();
  const roomsCount = req.rooms ?? "1";
  const guestsCount = req.guests ?? "2";
  const isAllInclusive = req.hotelPrefs.includes("all_inclusive");

  // ── Hotel level guidance ────────────────────────────────────────────────
  const hotelLevelGuide = (() => {
    const guides: Record<string, { priceRange: string; description: string; examples: string }> = {
      budget: {
        priceRange: "$20–80/night",
        description: "Clean, safe, well-located budget hotels. Best value for minimum spend. Acceptable cleanliness and service. Often hostel-style or basic 2–3 star hotels.",
        examples: `
Dubai/UAE: Rove Downtown, Premier Inn Dubai International Airport, Citymax Hotel Bur Dubai, Ibis One Central Dubai, Hampton by Hilton Dubai Al Seef
Turkey (Antalya/Istanbul): Cender Hotel Antalya, Atalla Hotel Antalya, Ramada Resort Lara, Sunis Kumkoy Beach Resort
Maldives: Arena Beach Hotel, Kaani Palm Beach, Samann Grand, Plumeria Maldives (stay on local islands like Maafushi)
Bali: Cara Cara Inn, Grandmas Plus Hotel Seminyak, Frii Bali Echo Beach, Lokal Bali Hostel, The Akmani Legian
Paris/France: Ibis Paris Tour Eiffel Cambronne, HotelF1 Paris Porte de Châtillon, The People Paris Marais, Generator Paris, Hotel Darcet
Japan (Tokyo): Tokyu Stay Shinjuku, Hotel Gracery Shinjuku, APA Hotel Shinjuku Kabukicho Tower, Nohga Hotel Ueno
Vietnam: Hanoi La Siesta Hotel, Central Palace Hotel Saigon, Little Riverside Hoi An, Hoi An Odyssey Hotel
Mauritius: Voile Bleue Boutique Hotel, Seapoint Boutique Hotel, Aanari Hotel & Spa, Le Palmiste Resort
Morocco: Riad Dia Marrakech, Hotel Central Casablanca, Moroccan House Marrakech, Hotel Cecil Marrakech
Monaco/French Riviera: Hotel Ambassador Monaco, Hôtel de France Monaco, Hotel Normandy Cap d'Ail
Greece (Santorini/Athens): budget guesthouses, Studios, Hostel Inn Athens, budget cave hotels in Oia
Spain (Barcelona): Hostal Grau, Hotel Peninsular, Generator Barcelona, Equity Point Gothic
Italy: Hotel Tre Archi Venice, Hotel Basilea Rome, budget B&Bs, Generator Venice
Thailand (Bangkok/Phuket): lub d Bangkok, ibis Bangkok, Lub d Koh Samui, Nap Park Hostel Bangkok`,
      },
      cheap_perfect: {
        priceRange: "$60–150/night",
        description: "Stylish boutique hotels that look more expensive than they are. Great design, underrated gems, best value for money. Suitable for stylish travel on a moderate budget.",
        examples: `
Dubai/UAE: Zabeel House The Greens, TRYP by Wyndham Dubai, Vida Dubai Marina, Studio One Hotel, FORM Hotel Dubai
Turkey: Akra Hotel Antalya, Liberty Hotels Lara, TUI Magic Life Masmavi, Crystal Palace Luxury Resort, Delphin Imperial Lara
Maldives: Reethi Beach Resort, Bandos Maldives, Meeru Maldives Resort, Vilamendhoo Island Resort, Kurumba Maldives
Bali: Lloyd's Inn Bali, The Colony Hotel Bali, Eastin Ashta Resort Canggu, Tijili Seminyak
Paris/France: Hôtel Paradis Paris, Hôtel Bienvenue, Mama Shelter Paris East, Hôtel des Grands Boulevards, Le Pigalle Paris
Japan (Tokyo): The Millennials Shibuya, sequence Miyashita Park, Hotel Resol Trinity Kyoto, Candeo Hotels Tokyo Roppongi
Vietnam: Fusion Suites Saigon, Lasenta Boutique Hotel Hoi An, Mai House Saigon Hotel, Wink Hotel Saigon Centre
Mauritius: Friday Attitude, Tropical Attitude, Lagoon Attitude, Veranda Grand Baie, Solana Beach
Morocco: Riad BE Marrakech, Riad Yasmine, Riad Jardin Secret, El Fenn Marrakech, Riad Kniza
Monaco/French Riviera: Columbus Hotel Monte-Carlo, Port Palace Hotel, Riviera Marriott La Porte de Monaco
Greece: boutique cave hotels Santorini, Art Hotel Santorini, small cycladic hotels
Spain: Hotel Praktik Rambla, Cotton House Barcelona, Hotel Pulitzer Barcelona
Italy: Boscolo Hotel Venice, Hotel Giulietta e Romeo Verona, Foresteria Valdese Venice
Thailand: The Siam Bangkok, boutique beach resorts Koh Samui, Pak-up Hostel Krabi`,
      },
      comfort: {
        priceRange: "$120–250/night",
        description: "Good 3–4 star hotels. Comfortable rooms, good location, decent breakfast. Reliable service. Standard for mid-range travelers.",
        examples: `
Dubai/UAE: Hilton Dubai Al Habtoor City, Hyatt Regency Dubai Creek Heights, Millennium Place Marina, JA Ocean View Hotel, DoubleTree by Hilton Dubai Jumeirah Beach
Turkey: Concorde De Luxe Resort, Limak Lara Deluxe Hotel, Barut Hemera, Asteria Kremlin Palace, IC Hotels Green Palace
Maldives: Sun Siyam Olhuveli, Adaaran Select Hudhuran Fushi, Cinnamon Dhonveli Maldives, Centara Ras Fushi
Bali: Courtyard by Marriott Bali Seminyak, The Haven Suites Bali Berawa, U Paasha Seminyak, Hyatt Regency Bali
Paris/France: citizenM Paris Champs-Élysées, Novotel Paris Centre Tour Eiffel, Mercure Paris Centre Eiffel Tower, Hôtel La Comtesse
Japan (Tokyo): Mitsui Garden Hotel Ginza Premier, Hotel Metropolitan Tokyo Marunouchi, Cross Hotel Kyoto
Vietnam: Novotel Danang Premier Han River, Pullman Danang Beach Resort, Liberty Central Saigon Citypoint, Hotel Nikko Saigon
Mauritius: Tamassa Bel Ombre, Radisson Blu Poste Lafayette, Preskil Island Resort, Victoria Beachcomber Resort
Morocco: Movenpick Hotel Mansour Eddahbi Marrakech, Kenzi Menara Palace, Hyatt Regency Casablanca
Monaco: Novotel Monte-Carlo, Le Méridien Beach Plaza, Monte-Carlo Bay Hotel
Greece: Naxian Collection, Astir Odysseus Kos, Esperas Santorini
Spain: Hotel Majestic Barcelona, Gran Hotel la Florida, Meliá Barcelona Sky
Italy: Hotel Excelsior Venice, NH Collection Grand Hotel Convento, Starhotels Michelangelo Florence
Thailand: Anantara Chiang Mai Resort, SALA Rattanakosin, Rayavadee Krabi`,
      },
      business: {
        priceRange: "$180–400/night",
        description: "Professional business hotels. Fast Wi-Fi, business center, conference rooms, executive lounge. City center locations, efficient transport links.",
        examples: `
Dubai/UAE: JW Marriott Marquis Dubai, Conrad Dubai, Dusit Thani Dubai, Pullman Dubai Downtown, Sheraton Grand Hotel Dubai
Turkey (Istanbul): Swissôtel The Bosphorus Istanbul, Hilton Istanbul Bomonti, Divan Istanbul, Radisson Blu Hotel Istanbul Sisli, Wyndham Grand Istanbul Levent
Maldives (business not typical): Conrad Maldives Rangali Island, Sheraton Maldives Full Moon Resort
Bali: The Stones Hotel Legian, Pullman Bali Legian Beach, Fairfield by Marriott Bali, Hilton Garden Inn Bali
Paris/France: Pullman Paris Tour Eiffel, Hyatt Regency Paris Etoile, Sofitel Paris Baltimore, Le Méridien Etoile
Japan (Tokyo): Shinagawa Prince Hotel, Cerulean Tower Tokyu Hotel, The Capitol Hotel Tokyu, Tokyo Marriott Hotel, Hilton Tokyo
Vietnam: InterContinental Saigon, JW Marriott Hotel Hanoi, Sheraton Saigon Grand Opera Hotel, Lotte Hotel Hanoi
Morocco: Four Seasons Hotel Casablanca, Radisson Blu Hotel Casablanca, Sofitel Rabat Jardin des Roses
Monaco: Fairmont Monte Carlo, Le Méridien Beach Plaza
Greece (Athens): NJV Athens Plaza, Electra Palace Athens, Hotel Grande Bretagne
Spain: Eurostars Grand Marina Barcelona, Hotel Arts Barcelona, Ohla Barcelona
Italy: Hilton Milan, Starhotels Rosa Grand Milan, NH Collection Palazzo Cinquecento Rome
Thailand: Anantara Siam Bangkok, Centara Grand at CentralWorld, Conrad Bangkok`,
      },
      premium: {
        priceRange: "$350–750/night",
        description: "Stylish premium hotels. Rooftop bars, spas, beautiful interiors, trending locations. Great service, Instagram-worthy design.",
        examples: `
Dubai/UAE: FIVE Palm Jumeirah, Address Sky View, SLS Dubai, Palace Downtown, The Lana Dubai
Turkey: Voyage Belek Golf & Spa, Rixos Premium Belek, Kaya Palazzo Golf Resort, Gloria Serenity Resort, Lujo Hotel Bodrum
Maldives: Hard Rock Hotel Maldives, Kandima Maldives, SAii Lagoon Maldives, Amilla Maldives, The Westin Maldives Miriandhoo
Bali: Potato Head Suites, The Slow Canggu, Alila Seminyak, W Bali Seminyak, Como Uma Canggu
Paris/France: Maison Albar Hotels Le Vendome, Hôtel National Des Arts et Métiers, Brach Paris, SO/ Paris Hotel, Kimpton St Honoré
Japan (Tokyo): Hotel The Mitsui Kyoto, The Tokyo Edition Toranomon, Andaz Tokyo Toranomon Hills, Trunk Hotel, Park Hotel Tokyo
Vietnam: Capella Hanoi, The Reverie Saigon, Hotel de la Coupole Sapa, Azerai La Residence Hue
Mauritius: LUX Belle Mare, Heritage Le Telfair, Long Beach Mauritius, Sugar Beach Mauritius
Morocco: Selman Marrakech, Sofitel Marrakech Lounge & Spa, Nobu Hotel Marrakech, Fairmont Royal Palm Marrakech
Monaco: Hotel Metropole Monte-Carlo, Monte-Carlo Beach, Hôtel Hermitage Monte-Carlo, The Maybourne Riviera
Greece: Katikies Hotel Santorini, Canaves Oia Epitome, Vedema Resort, Mykonos Grand
Spain: W Barcelona, Mandarin Oriental Barcelona, Cotton House Hotel Barcelona, Monument Hotel Barcelona
Italy: Hotel Danieli Venice, Bulgari Hotel Milano, The St. Regis Florence, Villa Cora Florence
Thailand: Capella Bangkok, The Peninsula Bangkok, Avani+ Samui Resort`,
      },
      luxury: {
        priceRange: "$700–2000/night",
        description: "Top 5-star luxury hotels. Iconic properties with world-class service, fine dining, spa, beach access, and beautiful rooms.",
        examples: `
Dubai/UAE: Atlantis The Palm, Jumeirah Beach Hotel, Mandarin Oriental Jumeira Dubai, Bulgari Resort Dubai, One&Only Royal Mirage
Turkey: Cullinan Belek, Titanic Mardan Palace, Maxx Royal Belek Golf Resort, Regnum Carya, Mandarin Oriental Bodrum
Maldives: Soneva Fushi, One&Only Reethi Rah, Anantara Kihavah Maldives Villas, Joali Maldives, Waldorf Astoria Maldives Ithaafushi
Bali: Four Seasons Resort Bali at Sayan, The Mulia Bali, Mandapa Ritz-Carlton Reserve, Bulgari Resort Bali, Six Senses Uluwatu
Paris/France: Hôtel Plaza Athénée, Le Meurice, Four Seasons Hotel George V, Shangri-La Paris, The Peninsula Paris
Japan (Tokyo): Park Hyatt Tokyo, Aman Tokyo, Four Seasons Hotel Tokyo at Otemachi, The Ritz-Carlton Tokyo, Mandarin Oriental Tokyo
Vietnam: InterContinental Danang Sun Peninsula Resort, Regent Phu Quoc, JW Marriott Phu Quoc Emerald Bay, Six Senses Ninh Van Bay
Mauritius: One&Only Le Saint Géran, Shangri-La Le Touessrok, Four Seasons Resort Mauritius at Anahita, Constance Prince Maurice
Morocco: Royal Mansour Marrakech, La Mamounia, Mandarin Oriental Marrakech, Amanjena, The Oberoi Marrakech
Monaco: Hôtel de Paris Monte-Carlo, Hôtel Hermitage Monte-Carlo, Hotel Metropole Monte-Carlo, Grand-Hôtel du Cap-Ferrat
Greece: Grace Hotel Santorini, Canaves Oia Santorini, Mystique Santorini, Amanzoe, Myconian Imperial
Spain: Hotel Arts Barcelona, W Barcelona, Gran Hotel Son Net, Finca Cortesin Marbella
Italy: Belmond Hotel Cipriani Venice, Gritti Palace Venice, Four Seasons Hotel Firenze, Bulgari Hotel Milano
Thailand: Rosewood Bangkok, Mandarin Oriental Bangkok, Amanpuri Phuket, Six Senses Samui`,
      },
      ultra_luxury: {
        priceRange: "$2000+/night",
        description: "The absolute pinnacle of hospitality. Private villas, presidential suites, butler service, private beaches, celebrity-level experiences.",
        examples: `
Dubai/UAE: Burj Al Arab Jumeirah, Atlantis The Royal, Armani Hotel Dubai, Jumeirah Al Naseem, Jumeirah Zabeel Saray
Turkey: The Bodrum Edition, D Maris Bay, Six Senses Kaplankaya, Amanruya Bodrum, Kempinski Hotel The Dome Belek
Maldives: The Ritz-Carlton Maldives Fari Islands, Cheval Blanc Randheli, Velaa Private Island, Patina Maldives, Soneva Jani
Bali: Aman Villas at Nusa Dua, Capella Ubud, The St. Regis Bali Resort, Jumeirah Bali, Soori Bali
Paris/France: Ritz Paris, Cheval Blanc Paris, Le Bristol Paris, Hôtel de Crillon, Mandarin Oriental Paris
Japan (Tokyo): Bulgari Hotel Tokyo, Janu Tokyo, Hoshinoya Tokyo, The Peninsula Tokyo, Palace Hotel Tokyo
Vietnam: Amanoi, Zannier Hotels Bai San Ho, Six Senses Con Dao, Banyan Tree Lang Co, The Anam Cam Ranh
Mauritius: Royal Palm Beachcomber Luxury, JW Marriott Mauritius Resort, Maradiva Villas Resort & Spa, The St. Regis Le Morne
Morocco: Kasbah Tamadot, Banyan Tree Tamouda Bay, Royal Mansour Tamuda Bay, Palais Namaskar
Monaco: Hôtel de Paris Monte-Carlo, The Maybourne Riviera, Grand-Hôtel du Cap-Ferrat, Cap Estel, Château Saint-Martin & Spa
Greece: Amanzoe Porto Heli, Mystique Santorini (private villa wing), Canaves Oia Epitome private villa
Spain: Marbella Club Hotel, Puente Romano Beach Resort, Son Brull Hotel & Spa Mallorca
Italy: Il Pellicano Porto Ercole, Belmond Grand Hotel Timeo Sicily, Adler Thermae Tuscany
Thailand: Amanpuri Phuket, The Sarojin Khao Lak, Soneva Kiri Koh Kood`,
      },
    };
    const g = guides[req.travelLevel] ?? guides["comfort"];
    return `
HOTEL SELECTION — ABSOLUTE REQUIREMENT:
The user selected Travel Level: "${level}"
Price range for this level: ${g.priceRange}
${g.description}

You MUST select a hotel that genuinely belongs to the "${level}" tier at this price range.
NEVER suggest a hotel from a different tier. Examples:
- Budget user → NEVER suggest Burj Al Arab, Atlantis, Four Seasons, Aman, Ritz, Bulgari
- Ultra Luxury user → NEVER suggest Ibis, Premier Inn, Rove, APA Hotel, hostels
- The hotel price per night (pricePerNight) MUST be in the ${g.priceRange} range

Real example hotels for "${level}" level at common destinations:
${g.examples}

Pick ONE specific real hotel from the destination that fits the "${level}" tier. If the exact destination is unusual, choose the most appropriate hotel for that level in that region.`;
  })();

  const cityLabel = req.city ? req.city : req.destination;

  const seasonalGuidance = (() => {
    const types = req.tripTypes;
    const isSkiTrip    = types.includes("ski");
    const isBeachTrip  = types.includes("beach");
    const isWellness   = types.includes("wellness");
    const isRomantic   = types.includes("romantic") || types.includes("honeymoon");
    const isLuxuryExp  = types.includes("luxury_exp");
    const isBusiness   = types.includes("business_trip");
    const isBudgetTrip = types.includes("budget_trip");
    const isNightlife  = types.includes("nightlife") || types.includes("party");
    if (isSkiTrip) return `SKI / MOUNTAIN TRIP: Recommend world-class ski resorts and alpine hotels in or near ${cityLabel} (Courchevel 1850, Verbier, Zermatt, Aspen, Val d'Isère, Méribel, Niseko, St. Moritz, etc.). Focus on ski-in/ski-out hotels, fireplace suites, mountain panorama views, après-ski bars, alpine fine dining, ski pass bundles, equipment rental, and snow experiences.`;
    if (isNightlife) return `NIGHTLIFE TRIP in ${cityLabel}: Recommend hotels close to the nightlife district. Include top nightclubs, rooftop bars, cocktail lounges, late-night restaurants, DJ venues, and nightlife-friendly activities. Schedule evening and night programming in the day plan.`;
    if (isLuxuryExp) return `LUXURY EXPERIENCE TRIP in ${cityLabel}: Focus on VIP and exclusive experiences — private tours, Michelin-starred restaurants, luxury spa days, helicopter rides, yacht charters, private beach clubs, butler service. Prioritize the most exclusive hotels and most coveted experiences available.`;
    if (isBusiness) return `BUSINESS TRIP to ${cityLabel}: Prioritize hotels with executive lounge, fast Wi-Fi, business center, meeting rooms, and central city location. Include business lunches, client dinner venues, co-working spaces. Keep the itinerary efficient with minimal downtime.`;
    if (isBudgetTrip) return `BUDGET TRIP to ${cityLabel}: Maximize value for money. Focus on free attractions, cheap local food, affordable transport, budget accommodation with great reviews. Show how to experience the best of ${cityLabel} on a tight budget.`;
    if (season === "Winter" && isBeachTrip) return `WINTER BEACH ESCAPE: User wants beach in winter (${month}). Recommend warm tropical destinations — Maldives, Bali, Zanzibar, Mauritius, Dubai, Thailand, Caribbean — regardless of the typed destination if it's cold.`;
    if (season === "Winter" && isRomantic) return `ROMANTIC WINTER in ${cityLabel}: Recommend cozy luxury mountain lodges with fireplaces, private hot tubs, spa, and snow scenery — or warm romantic islands. Candlelit dinners, couples spa, private experiences.`;
    if (season === "Summer" && isBeachTrip) return `SUMMER BEACH at ${cityLabel}: Recommend top beach hotels with direct beach access, beach clubs, water sports, sunset bars.`;
    if (isWellness) return `WELLNESS RETREAT at ${cityLabel}: Recommend luxury wellness hotels and spas — Six Senses, Anantara, Como Shambhala. Focus on detox programs, yoga, meditation, thermal baths, longevity programs.`;
    if (season === "Spring") return `SPRING TRAVEL (${month}) to ${cityLabel}: Cherry blossoms, mild weather, outdoor dining. Recommend seasonal highlights specific to this city.`;
    if (season === "Autumn") return `AUTUMN TRAVEL (${month}) to ${cityLabel}: Foliage, harvest season, comfortable weather. Recommend seasonal highlights.`;
    return `Current season: ${season} (${month}). Recommend hotels and activities that are ideal for this time of year in ${cityLabel}.`;
  })();

  const allInclusiveHotelFields = isAllInclusive ? `
    "allInclusivePerNight": "string — all-inclusive package add-on cost per room per night e.g. '+$120/person' — required when all-inclusive selected",
    "allInclusiveTotalPerNight": "string — base room rate + all-inclusive per room per night e.g. '$470/night' — required when all-inclusive selected",
    "allInclusiveHotelTotal": "string — allInclusiveTotalPerNight × ${roomsCount} rooms × nightsCount e.g. '$3,290' — required when all-inclusive selected",` : "";

  const areaGuide = buildAreaSelectionGuide(
    req.destination,
    req.city ?? "",
    req.tripTypes,
    req.hotelPrefs,
  );

  return `You are a world-class personal travel concierge. You select hotels the way an expert human concierge would: based on the traveler's actual preferences, trip type, and personality — not by defaulting to the most famous or popular property. Your hotel recommendation must feel hand-picked, not generic.

CURRENT DATE CONTEXT:
- Month: ${month}
- Northern Hemisphere Season: ${season}
- ${hemisphereNote}

SEASONAL GUIDANCE: ${seasonalGuidance}

${hotelLevelGuide}

${areaGuide}

USER PROFILE:
- Destination: ${req.destination}${req.city ? ` → Specific city: ${req.city}` : ""}
- Travel Level: ${level}
- Trip Categories: ${req.tripTypes.length > 0 ? req.tripTypes.join(", ") : "general travel"}
- Hotel Preferences: ${req.hotelPrefs.length > 0 ? req.hotelPrefs.join(", ") : "no specific preferences"}
- Restaurant Preferences: ${req.restaurantPrefs.length > 0 ? req.restaurantPrefs.join(", ") : "no specific preferences"}
- Duration: ${req.duration}
- Budget: ${req.budget}
- Number of Guests: ${guestsCount}
- Number of Rooms: ${roomsCount}
- Preferred Room Type: ${req.roomType ?? "standard"}
${isAllInclusive ? "- Package Type: ALL INCLUSIVE\n" : ""}${req.city ? `\nCRITICAL: All hotels, restaurants, and activities MUST be located IN ${req.city} specifically. Do not suggest venues from other cities or neighborhoods outside ${req.city}.` : ""}

IMPORTANT: All text content in the response MUST be written in ${lang}.

Generate a realistic, specific, deeply personalized trip plan. Use real hotel names and real restaurant names. Every recommendation must clearly connect back to the user's stated preferences.

Return ONLY valid JSON with this exact structure:
{
  "destination": "string — the destination name",
  "hotel": {
    "name": "string — real hotel name",
    "nameEn": "string — hotel name in English ALWAYS (even when responding in Russian — used for image lookup)",
    "rating": number (1-5),
    "pricePerNight": "string — base room rate for ONE room per night, e.g. '$450/night'",
    "roomType": "string — exact room category matching the '${req.roomType ?? "standard"}' preference",
    "roomsNeeded": ${roomsCount},
    "nightsCount": number — total nights from duration '${req.duration}' (use upper end for ranges: 2-3→3, 4-5→5),
    "hotelTotal": "string — pricePerNight × ${roomsCount} rooms × nightsCount, e.g. '$6,300'",${allInclusiveHotelFields}
    "description": "string — 2-3 sentences about the hotel, its style, and standout features",
    "whyItFits": "string — REQUIRED 3-4 sentences: explicitly name which user preferences this hotel satisfies (e.g. 'The rooftop pool bar directly serves the nightlife preference; the JBR beachfront location satisfies the beach and water sports preferences; the open-plan suites suit couples looking for a romantic atmosphere'). Reference the actual trip categories and hotel preferences the user selected.",
    "whyThisArea": "string — REQUIRED: explain which area/neighborhood was chosen, why it was chosen over other parts of the city, and how it specifically matches this user's trip type and preferences",
    "bestFor": "string — one sentence describing the ideal traveler profile for this hotel (e.g. 'Best for couples seeking beach access with vibrant nightlife within walking distance')",
    "tags": ["array of 3-5 short feature tags, e.g. 'Beachfront', 'Infinity Pool', 'Adults Only', 'Rooftop Bar', 'Private Beach', 'Overwater Villas', 'Ski-in/Ski-out', 'City View', 'Family Resort', 'Business Class', 'Boutique', 'Design Hotel', 'Historic Palace'"],
    "amenities": ["array", "of", "amenity", "strings"],
    "imagePrompt": "string — vivid description for generating a luxury hotel photo: describe the building exterior, surroundings, architectural style, lighting. Be specific to this hotel.",
    "location": "string — specific neighborhood or district",
    "isClosestMatch": boolean — true if no single hotel perfectly satisfies ALL selected preferences (use the closest real available option); false if the hotel fully meets all requirements,
    "matchedFeatures": ["array of user preference labels that ARE satisfied by this recommendation — e.g. 'Destination', 'Budget', 'Hotel Level', 'Beach Access', 'Family Friendly', 'Spa', 'Pool', 'Sea View', 'All Inclusive'"],
    "missingFeatures": ["array of user preference labels that could NOT be satisfied — e.g. 'Private Villa', 'All Inclusive', 'Ski Access', 'Beachfront', 'Adults Only', 'Nightlife Nearby' — EMPTY ARRAY if isClosestMatch is false"],
    "closestMatchNote": "string — written in ${lang}: if isClosestMatch is true, 1-2 sentences explaining what couldn't be found and why this option was chosen instead; empty string if isClosestMatch is false"
  },
  "restaurants": [
    {
      "name": "string — real restaurant name",
      "style": "string — e.g. Fine Dining, Rooftop Bar, Street Food",
      "averageCheck": "string — e.g. '$80 per person'",
      "whyItFits": "string",
      "location": "string — neighborhood or landmark",
      "imagePrompt": "string — description for restaurant photo"
    }
  ],
  "activities": [
    {
      "name": "string",
      "duration": "string — e.g. '3 hours'",
      "price": "string — e.g. '$120 per person' — if included in hotel package, write 'Included'",
      "included": boolean — true ONLY if this activity is part of the hotel stay or all-inclusive package,
      "whyItFits": "string",
      "imagePrompt": "string — description for activity photo"
    }
  ],
  "dayPlan": [
    {
      "day": 1,
      "title": "string — day theme",
      "morning": "string — morning activity/plan",
      "afternoon": "string — afternoon activity/plan",
      "evening": "string — evening activity/plan"
    }
  ],
  "budgetBreakdown": {
    "hotel": "string — hotel total cost (same as hotel.hotelTotal)",
    "flightEstimate": "string — estimated TOTAL round-trip flights for ALL guests, e.g. '$3,200 total (2 × $1,600 economy round-trip)'. Base on destination distance and travel tier.",
    "food": "string — total food/dining for all guests for all nights",
    "activities": "string — external excursions/activities cost",
    "transport": "string — local transport cost",
    "airportTransfer": "string — airport transfer cost both ways",
    "cityTax": "string — city/resort tax estimate",
    "travelInsurance": "string — travel insurance estimate, or 'Estimated $XX'",
    "visa": "string — visa cost if required, or 'Not required'",
    "shopping": "string — shopping/personal spending estimate",
    "total": "string — GRAND TOTAL: sum of all above",
    "guests": "${guestsCount}"
  },
  "explanation": "string — 2-3 sentences explaining your AI choices based on their preferences",
  "costNote": "string — e.g. 'Calculated for ${guestsCount} guests, ${roomsCount} room(s), [X] nights, [Room Type]. All costs are estimates.' in ${lang}"
}

Requirements:
- roomsNeeded MUST be exactly ${roomsCount} (user explicitly selected this — do not change it)
- Number of guests: ${guestsCount} — factor this into all per-person costs (food, activities, transport)
- Room type preference: ${req.roomType ?? "standard"} — select the appropriate room category
- Include 3-4 restaurants matching their restaurant preferences
- Include 4-6 activities matching their trip type and hotel preferences
- Day plan should match the duration (${req.duration})
- All monetary values should be realistic for the ${level} tier and ${req.budget} budget
- Be specific: use real place names, real hotel names from ${req.destination}
- ALL text must be in ${lang}
- CRITICAL ITINERARY RULE: Every single dayPlan entry MUST have a non-empty, specific "morning", "afternoon", and "evening" — minimum 2-3 sentences each. Name real places, restaurants, timings, and activities. NEVER write "-", "N/A", "Free time", "At leisure", or any empty/placeholder text. Each time-slot must read like it was personally crafted by a luxury concierge.
${isAllInclusive ? `- ALL INCLUSIVE: Mark any activity/service included in the hotel package with "included": true and price "Included". The hotelTotal should be the BASE room rate total; allInclusiveHotelTotal should add the all-inclusive package on top. For budgetBreakdown.hotel, use the allInclusiveHotelTotal if applicable.` : `- Set "included": false for all activities and show their individual price.`}
- CLOSEST MATCH RULE — CRITICAL: NEVER return an error or empty response because a perfect hotel match doesn't exist. Always recommend the CLOSEST REAL AVAILABLE hotel/villa/resort. If the user asked for a private villa but only resort hotels are available, recommend the best resort and set isClosestMatch: true. If the user wants all-inclusive but the destination doesn't offer it, pick the best hotel with meals and set isClosestMatch: true. Build matchedFeatures and missingFeatures arrays honestly — list every user preference by name, marking it matched or missing. Write closestMatchNote explaining the trade-off in the user's language (${lang}). If all preferences are met, set isClosestMatch: false and both arrays empty.
- Return ONLY the JSON, no markdown, no explanation outside the JSON`;
}

/** Attempt to repair and parse potentially-malformed JSON from AI */
function repairAndParseJSON(content: string): Record<string, unknown> | null {
  // Strip markdown fences
  let cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Extract from first { to last }
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) return null;
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace === -1 || lastBrace <= firstBrace) return null;
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // Direct parse
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch { /* fall through to repair */ }

  // Repair: trailing commas, JS comments, NaN/undefined
  const fixed = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\bNaN\b/g, "null")
    .replace(/\bundefined\b/g, "null");

  try {
    return JSON.parse(fixed) as Record<string, unknown>;
  } catch { /* fall through to truncation repair */ }

  // If JSON is truncated (common when token limit hit): close all open brackets
  try {
    const stack: string[] = [];
    for (const ch of cleaned) {
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    const suffix = stack.reverse().join("");
    const recovering = cleaned.replace(/,\s*$/, "") + suffix;
    return JSON.parse(recovering) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Fill in safe defaults for any missing required fields */
function ensurePlanDefaults(plan: Record<string, unknown>, guests: string, rooms: string): void {
  if (!Array.isArray(plan.restaurants)) plan.restaurants = [];
  if (!Array.isArray(plan.activities)) plan.activities = [];
  if (!Array.isArray(plan.dayPlan)) plan.dayPlan = [];
  if (!plan.explanation) plan.explanation = "";
  if (!plan.costNote) plan.costNote = `Calculated for ${guests} guest(s), ${rooms} room(s). All costs are estimates.`;

  // Fix empty/placeholder itinerary day fields
  const isEmpty = (v: unknown): boolean =>
    !v || typeof v !== "string" || v.trim() === "" || v.trim() === "-" || v.trim().toLowerCase() === "n/a" || v.trim().toLowerCase() === "free time";
  for (const day of plan.dayPlan as Record<string, unknown>[]) {
    if (isEmpty(day.morning))
      day.morning = "Begin the morning with a relaxed breakfast at the hotel, then set out to explore the surrounding neighbourhood on foot — discover local cafés, street markets, and hidden viewpoints.";
    if (isEmpty(day.afternoon))
      day.afternoon = "Spend the afternoon visiting the destination's iconic landmarks and cultural sites. Stop for a leisurely lunch at a well-reviewed local restaurant before continuing your exploration.";
    if (isEmpty(day.evening))
      day.evening = "As evening falls, dress for dinner at one of the recommended restaurants nearby. Finish the night with a walk along the main promenade or a drink at a rooftop bar before returning to the hotel.";
    if (!day.title) day.title = `Day ${String(day.day)}`;
  }

  if (!plan.budgetBreakdown || typeof plan.budgetBreakdown !== "object") {
    plan.budgetBreakdown = {};
  }
  const bd = plan.budgetBreakdown as Record<string, unknown>;

  // ── Realistic pricing fallbacks — never show "—" ──────────────────────────
  const h = (plan.hotel ?? {}) as Record<string, unknown>;
  const nightsNum = typeof h.nightsCount === "number" ? h.nightsCount : 3;
  const guestsNum = Math.max(1, parseInt(guests, 10) || 2);
  const roomsNum = Math.max(1, parseInt(rooms, 10) || 1);

  const isBlank = (v: unknown) =>
    !v || v === "—" || v === "" || (typeof v === "string" && v.trim() === "");

  if (isBlank(bd.hotel)) {
    bd.hotel = h.hotelTotal ?? (h.allInclusiveHotelTotal as string | undefined) ?? `~$${(200 * roomsNum * nightsNum).toLocaleString()}`;
  }
  if (isBlank(bd.flightEstimate)) {
    bd.flightEstimate = `~$${(650 * guestsNum).toLocaleString()} total`;
  }
  if (isBlank(bd.food)) {
    bd.food = `~$${(70 * guestsNum * nightsNum).toLocaleString()} total`;
  }
  if (isBlank(bd.activities)) {
    bd.activities = `~$${(100 * guestsNum).toLocaleString()}`;
  }
  if (isBlank(bd.transport)) {
    bd.transport = `~$${(30 * nightsNum).toLocaleString()} total`;
  }
  if (isBlank(bd.airportTransfer)) {
    bd.airportTransfer = `~$${(45 * 2).toLocaleString()} (both ways)`;
  }
  if (isBlank(bd.cityTax)) {
    bd.cityTax = `~$${(7 * guestsNum * nightsNum).toLocaleString()} total`;
  }
  if (isBlank(bd.travelInsurance)) {
    bd.travelInsurance = `~$${(35 * guestsNum).toLocaleString()} total`;
  }
  if (!bd.visa) bd.visa = "Not required";
  if (isBlank(bd.shopping)) {
    bd.shopping = `~$${(60 * guestsNum).toLocaleString()}`;
  }
  if (!bd.guests) bd.guests = guests;

  // Calculate grand total from individual parts if missing or blank
  if (isBlank(bd.total)) {
    const parts = [
      bd.hotel, bd.flightEstimate, bd.food, bd.activities,
      bd.transport, bd.airportTransfer, bd.cityTax, bd.travelInsurance, bd.shopping,
    ];
    const sum = parts.reduce<number>((acc, v: unknown) => {
      if (typeof v !== "string") return acc;
      const m = v.match(/[\d,]+/);
      return acc + (m ? parseInt(m[0].replace(/,/g, ""), 10) || 0 : 0);
    }, 0);
    bd.total = sum > 0 ? `~$${sum.toLocaleString()}` : "Estimated — contact us";
  }

  // Ensure hotel object always exists with safe defaults
  if (!plan.hotel || typeof plan.hotel !== "object") {
    plan.hotel = {
      name: String(plan.destination ?? "Hotel"),
      nameEn: String(plan.destination ?? "Hotel"),
      rating: 4,
      pricePerNight: "—",
      roomType: "Standard Room",
      roomsNeeded: parseInt(rooms, 10) || 1,
      nightsCount: 3,
      hotelTotal: "—",
      description: "Your AI concierge is preparing hotel details. Please try regenerating your trip for full details.",
      whyItFits: "",
      whyThisArea: "",
      bestFor: "",
      amenities: [],
      tags: [],
      location: String(plan.destination ?? ""),
      imageUrl: null,
      imageIsReal: false,
      imageSource: "none",
    };
  }
  const hotel = plan.hotel as Record<string, unknown>;
  if (!Array.isArray(hotel.amenities)) hotel.amenities = [];
  if (!Array.isArray(hotel.tags)) hotel.tags = [];
  if (!hotel.rating) hotel.rating = 4;
  if (!hotel.name) hotel.name = String(plan.destination ?? "TBD") + " Hotel";
  if (hotel.nameEn === undefined) hotel.nameEn = hotel.name;
  if (hotel.isClosestMatch === undefined) hotel.isClosestMatch = false;
  if (!Array.isArray(hotel.matchedFeatures)) hotel.matchedFeatures = [];
  if (!Array.isArray(hotel.missingFeatures)) hotel.missingFeatures = [];
  if (!hotel.closestMatchNote) hotel.closestMatchNote = "";
}

// Common hotel brand/chain words stripped for Wikipedia matching
const HOTEL_BRAND_SUFFIXES = [
  "jumeirah", "marriott", "hilton", "hyatt", "sheraton", "ihg", "accor",
  "four seasons", "ritz-carlton", "ritz carlton", "mandarin oriental",
  "intercontinental", "st. regis", "st regis", "autograph collection",
  "luxury collection", "w hotels", "westin", "sofitel", "novotel",
  "anantara", "rosewood", "aman", "six senses", "como", "belmond",
];

function normalizeHotelName(name: string): string {
  let n = name.trim();
  for (const brand of HOTEL_BRAND_SUFFIXES) {
    const re = new RegExp(`\\s+${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    n = n.replace(re, '').trim();
  }
  n = n.replace(/\s+(hotel|resort|palace|suites?|lodge|spa|beach|golf|villas?|towers?|collection)\s*$/i, '').trim();
  return n;
}

async function fetchWikipediaHotelImage(hotelNameEn: string, destEn: string): Promise<string | null> {
  const normalized = normalizeHotelName(hotelNameEn);

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const term of [hotelNameEn, normalized, `${normalized} ${destEn}`, `${hotelNameEn} ${destEn}`]) {
    const t = term.trim();
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); candidates.push(t); }
  }

  for (const term of candidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "VoyageApp/1.0 (travel concierge)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) continue;
      const data = await resp.json() as { thumbnail?: { source: string }; type?: string };
      if (data.type === "disambiguation") continue;
      if (!data.thumbnail?.source) continue;

      const src = data.thumbnail.source;
      if (src.toLowerCase().endsWith(".svg") || src.toLowerCase().includes(".svg/")) continue;
      if (/logo|icon|coat.of.arms|flag|emblem/i.test(src)) continue;

      return src.replace(/\/\d+px-/, "/1200px-");
    } catch {
      // try next candidate
    }
  }
  return null;
}

// ── Shared plan generation logic ─────────────────────────────────────────────
type PlanBody = {
  destination: string; city?: string; travelLevel: string;
  tripTypes: string[]; hotelPrefs: string[]; restaurantPrefs: string[];
  duration: string; budget: string; language: string;
  guests?: string; rooms?: string; roomType?: string;
};
type PlanLogger = { warn: (obj: object, msg: string) => void; error: (obj: object | string, msg?: string) => void };

async function runVoyagePlan(body: PlanBody, log: PlanLogger): Promise<Record<string, unknown>> {
  const openai = getOpenAI();
  const prompt = buildVoyagePrompt({
    ...body,
    guests: body.guests ?? "2",
    rooms: body.rooms ?? "1",
    roomType: body.roomType ?? "standard",
  });

  const systemMsg = "You are an expert AI travel concierge serving ALL budget levels. Always respond with valid JSON only, no markdown or additional text. Never truncate — always complete the full JSON object.";

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 8000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      if (attempt < 2) continue;
      throw new Error("No response from AI");
    }

    parsed = repairAndParseJSON(content);
    if (parsed) break;

    log.warn({ attempt, snippet: content.slice(0, 200) }, "AI returned invalid JSON, retrying");
  }

  if (!parsed) {
    log.error("Failed to parse AI JSON response after retries");
    throw new Error("AI returned invalid JSON after retries");
  }

  ensurePlanDefaults(parsed, body.guests ?? "2", body.rooms ?? "1");

  if (parsed.hotel && typeof parsed.hotel === "object") {
    const hotel = parsed.hotel as Record<string, unknown>;
    const hotelName = String(hotel.name ?? "");
    const dest = String(parsed.destination ?? body.destination);

    hotel.hotelUrl = `https://www.google.com/travel/hotels?q=${encodeURIComponent(`${hotelName} ${dest}`)}`;
    hotel.photosUrl = `https://www.google.com/search?q=${encodeURIComponent(`${hotelName} ${dest} hotel`)}&tbm=isch`;
    hotel.hotellookSearchUrl = `https://search.hotellook.com/?query=${encodeURIComponent(`${hotelName} ${dest}`)}&lang=${body.language === "ru" ? "ru" : "en"}&marker=529629`;

    const explicitRooms = parseInt(body.rooms ?? "1", 10);
    if (!isNaN(explicitRooms) && explicitRooms >= 1) hotel.roomsNeeded = explicitRooms;

    const hotelNameEn = String(hotel.nameEn ?? hotelName);
    const dbImage = lookupHotelImage(hotelNameEn);

    if (dbImage) {
      hotel.imageUrl = dbImage;
      hotel.imageIsReal = true;
      hotel.imageSource = "database";
    } else {
      const wikiImage = await fetchWikipediaHotelImage(hotelNameEn, body.destination);
      if (wikiImage) {
        hotel.imageUrl = wikiImage;
        hotel.imageIsReal = true;
        hotel.imageSource = "wikipedia";
      } else {
        hotel.imageUrl = null;
        hotel.imageIsReal = false;
        hotel.imageSource = "none";
      }
    }
  }

  return parsed;
}

// ── Synchronous plan endpoint (kept for backwards-compat / dev) ───────────────
router.post("/voyage/plan", async (req, res) => {
  const parseResult = PlanVoyageBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body", details: parseResult.error.issues });
    return;
  }
  try {
    const result = await runVoyagePlan(parseResult.data as PlanBody, req.log);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Voyage plan generation failed");
    res.status(500).json({ error: "Failed to generate travel plan" });
  }
});

// ── Resolve authenticated user from Bearer token or session ──────────────────
function getAuthUser(req: import("express").Request) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return findByToken(token);
  }
  const sess = req.session as unknown as Record<string, unknown> | undefined;
  if (sess?.userId && typeof sess.userId === "string") {
    return findById(sess.userId);
  }
  return null;
}

// ── Mock plan fallback — served when AI is unavailable ───────────────────────
function generateMockPlan(body: PlanBody): Record<string, unknown> {
  const dest = body.city || body.destination || "Your Destination";
  const daysMatch = (body.duration || "7 days").match(/\d+/);
  const days = daysMatch ? parseInt(daysMatch[0]) : 7;
  const isLuxury = ["luxury", "ultra_luxury", "premium", "business"].includes(body.travelLevel || "");
  const isRu = (body.language || "en") === "ru";

  const pricePer = isLuxury ? 450 : 150;
  const totalHotel = pricePer * days;

  const hotel: Record<string, unknown> = {
    name: isLuxury ? `${dest} Grand Palace Hotel` : `${dest} Premier Suites`,
    rating: isLuxury ? 5 : 4,
    pricePerNight: `$${pricePer}`,
    description: isRu
      ? `Изысканный отель в самом сердце ${dest}, предлагающий исключительный сервис и панорамные виды.`
      : `An exquisite property in the heart of ${dest}, offering exceptional service and stunning city views.`,
    whyItFits: isRu
      ? `Отель идеально подходит под ваши предпочтения и стиль путешествия.`
      : `This hotel matches your travel style and preferences perfectly.`,
    amenities: ["Pool", "Spa", "Restaurant", "Bar", "Gym", "Concierge", "Room Service"],
    imagePrompt: `luxury hotel ${dest} exterior architecture`,
    location: isRu ? `Центр города, ${dest}` : `City Centre, ${dest}`,
    hotelUrl: `https://www.google.com/search?q=${encodeURIComponent(dest + " best hotel booking")}`,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
    photosUrl: `https://www.google.com/search?q=${encodeURIComponent(dest + " hotel photos")}&tbm=isch`,
    roomType: isLuxury ? "Deluxe Suite" : "Superior Double Room",
    roomsNeeded: 1,
    nightsCount: days,
    hotelTotal: `$${totalHotel}`,
  };

  const restaurants = [
    {
      name: isRu ? `Ресторан высокой кухни ${dest}` : `${dest} Fine Dining`,
      style: isRu ? "Высокая кухня" : "Fine Dining",
      averageCheck: isLuxury ? "$120" : "$55",
      whyItFits: isRu ? "Идеально для романтического ужина" : "Perfect for an elegant dinner",
      location: isRu ? `Центр ${dest}` : `Downtown ${dest}`,
      imagePrompt: `fine dining restaurant ${dest} interior`,
    },
    {
      name: isRu ? `Городской гастрорынок` : `${dest} Food Market`,
      style: isRu ? "Уличная еда" : "Street Food & Local",
      averageCheck: "$25",
      whyItFits: isRu ? "Аутентичная местная кухня" : "Authentic local food experience",
      location: isRu ? `Исторический квартал, ${dest}` : `Historic Quarter, ${dest}`,
      imagePrompt: `food market ${dest} street food`,
    },
    {
      name: isRu ? `Панорамный ресторан-бар` : `${dest} Rooftop Lounge`,
      style: isRu ? "Панорамный бар" : "Rooftop Bar & Restaurant",
      averageCheck: "$80",
      whyItFits: isRu ? "Потрясающий вид на город" : "Stunning skyline views",
      location: isRu ? `Крыша в центре ${dest}` : `Rooftop, Central ${dest}`,
      imagePrompt: `rooftop restaurant ${dest} skyline view night`,
    },
  ];

  const activities = [
    {
      name: isRu ? `Обзорная экскурсия по ${dest}` : `${dest} City Discovery Tour`,
      duration: isRu ? "4 часа" : "4 hours",
      price: "$45",
      included: false,
      whyItFits: isRu ? "Лучший старт для знакомства с городом" : "Perfect introduction to the city",
      imagePrompt: `city tour ${dest} sightseeing landmarks`,
    },
    {
      name: isRu ? "Спа и велнес" : "Spa & Wellness Experience",
      duration: isRu ? "3 часа" : "3 hours",
      price: isLuxury ? "$180" : "$90",
      included: isLuxury,
      whyItFits: isRu ? "Расслабление и восстановление" : "Ultimate relaxation",
      imagePrompt: `luxury spa wellness treatment`,
    },
    {
      name: isRu ? "Кулинарный мастер-класс" : "Local Cooking Masterclass",
      duration: isRu ? "3 часа" : "3 hours",
      price: "$85",
      included: false,
      whyItFits: isRu ? "Погружение в местную культуру через еду" : "Immerse in culture through food",
      imagePrompt: `cooking class local cuisine ${dest}`,
    },
  ];

  const dayPlan = Array.from({ length: Math.min(days, 14) }, (_, i) => ({
    day: i + 1,
    title: isRu
      ? `День ${i + 1}: ${i === 0 ? "Прибытие и первые впечатления" : i === days - 1 ? "Прощальный день" : `Открываем ${dest}`}`
      : `Day ${i + 1}: ${i === 0 ? "Arrival & First Impressions" : i === days - 1 ? "Farewell Day" : `Exploring ${dest}`}`,
    morning: isRu
      ? `Завтрак в отеле. ${i === 0 ? "Заселение и прогулка по ближайшим улицам." : "Утренняя прогулка и посещение достопримечательностей."}`
      : `Breakfast at the hotel. ${i === 0 ? "Check-in and an orientation walk nearby." : "Morning walk and local sightseeing."}`,
    afternoon: isRu
      ? `Обед в местном кафе. ${i % 2 === 0 ? "Посещение музеев и культурных мест." : "Шопинг и прогулка по рынкам."}`
      : `Lunch at a local café. ${i % 2 === 0 ? "Museum visits and cultural spots." : "Shopping and market strolls."}`,
    evening: isRu
      ? `Ужин в ресторане ${dest}. Вечерняя прогулка по освещённому городу.`
      : `Dinner at one of ${dest}'s finest. Evening walk through the illuminated city.`,
  }));

  const foodDaily = isLuxury ? 150 : 60;
  const actDaily = isLuxury ? 100 : 40;
  const transDaily = isLuxury ? 80 : 30;

  const budgetBreakdown = {
    hotel: `$${totalHotel}`,
    food: `$${days * foodDaily}`,
    activities: `$${days * actDaily}`,
    transport: `$${days * transDaily}`,
    airportTransfer: isLuxury ? "$120" : "$40",
    cityTax: `$${days * 5}`,
    insurance: "$50",
    visa: isRu ? "Уточните на сайте посольства" : "Check official embassy website",
    shopping: isLuxury ? `$${days * 200}` : `$${days * 50}`,
    total: `$${totalHotel + days * foodDaily + days * actDaily + days * transDaily + (isLuxury ? 120 : 40) + days * 5 + 50 + (isLuxury ? days * 200 : days * 50)}`,
  };

  return {
    fromMock: true,
    destination: dest,
    hotel,
    restaurants,
    activities,
    dayPlan,
    budgetBreakdown,
    explanation: isRu
      ? `Это примерный маршрут для ${dest}. AI-генерация временно недоступна — показан шаблонный план. Все данные приблизительные; самостоятельно проверьте цены, наличие отелей и визовые требования перед бронированием.`
      : `This is a sample itinerary for ${dest}. AI generation is temporarily unavailable — a template plan is shown. All details are approximate; please verify prices, hotel availability, and visa requirements before booking.`,
    costNote: isRu
      ? `Примерный расчёт для ${body.guests ?? "2"} гостей, ${days} ночей`
      : `Approximate estimate for ${body.guests ?? "2"} guests, ${days} nights`,
  };
}

// ── Auto-save a completed trip to the user's history ─────────────────────────
function autoSaveTripForUser(
  userId: string,
  body: PlanBody,
  result: Record<string, unknown>
): void {
  try {
    const hotel = result.hotel as Record<string, unknown> | undefined;
    const hotelName = hotel ? String(hotel.name ?? hotel.nameEn ?? "") : undefined;
    const dayPlanLen = Array.isArray(result.dayPlan) ? result.dayPlan.length : 0;
    addTrip(userId, {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      destination: body.destination,
      city: body.city,
      duration: body.duration || `${dayPlanLen} days`,
      hotelName,
      data: result,
    });
  } catch (_) { /* non-fatal */ }
}

// ── Async plan endpoint — avoids 60s production proxy timeout ────────────────
router.post("/voyage/plan-async", (req, res) => {
  // Require authentication
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }

  const parseResult = PlanVoyageBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const jobId = randomUUID();
  const body = parseResult.data as PlanBody;
  const log = req.log;
  const userId = authUser.id;

  planJobs.set(jobId, { status: "pending", createdAt: Date.now() });

  // Check global cache first
  const cacheKey = buildCacheKey(body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    log.info({ cacheKey, destination: body.destination }, "Cache hit — skipping AI call");
    const result = { ...cached.result, fromCache: true };
    planJobs.set(jobId, { status: "done", result, createdAt: Date.now() });
    autoSaveTripForUser(userId, body, result);
    res.json({ jobId });
    return;
  }

  // Fire-and-forget AI generation — do NOT await before responding
  runVoyagePlan(body, log)
    .then((result) => {
      // Save to global shared cache
      saveToCache(cacheKey, {
        destination: body.destination,
        city: body.city,
        duration: body.duration,
        guests: body.guests ?? "2",
        budget: body.budget,
        travelLevel: body.travelLevel,
        roomType: body.roomType ?? "standard",
        tripTypes: body.tripTypes ?? [],
        hotelPrefs: body.hotelPrefs ?? [],
        language: body.language ?? "en",
      }, result);
      // Auto-save to user's personal history
      autoSaveTripForUser(userId, body, result);
      planJobs.set(jobId, { status: "done", result, createdAt: Date.now() });
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Generation failed";
      log.error({ err }, "Async voyage plan failed");
      // Try to serve a mock plan instead of failing — ensures users always get a result
      try {
        const mockResult = generateMockPlan(body);
        log.info({ destination: body.destination }, "Serving mock plan due to AI error");
        autoSaveTripForUser(userId, body, mockResult);
        planJobs.set(jobId, { status: "done", result: mockResult, createdAt: Date.now() });
      } catch (_mockErr) {
        planJobs.set(jobId, { status: "error", message, createdAt: Date.now() });
      }
    });

  // Respond immediately with the job ID — client will poll
  res.json({ jobId });
});

// ── Job status polling endpoint ───────────────────────────────────────────────
router.get("/voyage/job/:jobId", (req, res) => {
  const job = planJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found or expired" });
    return;
  }
  res.json(job);
});

// ── AI Hotel Image Generation ──────────────────────────────────────────────
router.post("/voyage/hotel-image", async (req, res) => {
  const { hotelName, destination, imagePrompt } = req.body as {
    hotelName?: string;
    destination?: string;
    imagePrompt?: string;
  };

  if (!hotelName && !imagePrompt) {
    res.status(400).json({ error: "hotelName or imagePrompt required" });
    return;
  }

  const prompt = imagePrompt
    ? `Photorealistic luxury hotel exterior photograph. ${imagePrompt}. Beautiful professional architectural photography, natural lighting, no text, no logos, no watermarks, high resolution.`
    : `Photorealistic luxury hotel exterior photograph of ${hotelName} in ${destination ?? ""}. Beautiful professional architectural photography, natural lighting, no text, no logos, no watermarks.`;

  try {
    const openai = getOpenAI();
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      n: 1,
    });

    const b64 = (result.data?.[0] as Record<string, unknown> | undefined)?.b64_json as string | undefined;
    if (!b64) {
      res.status(500).json({ error: "No image generated" });
      return;
    }

    res.json({ imageUrl: `data:image/png;base64,${b64}`, imageSource: "ai-generated" });
  } catch (err) {
    req.log.warn({ err }, "AI hotel image generation failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

// ── GET /voyage/my-trips — fetch all saved trips for the authenticated user ───
router.get("/voyage/my-trips", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json({ trips: getUserTrips(authUser.id) });
});

// ── POST /voyage/save-trip — manually save / upsert a trip ───────────────────
router.post("/voyage/save-trip", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const { destination, city, duration, hotelName, data } = body;
  if (!destination || !data) {
    res.status(400).json({ error: "destination and data are required" });
    return;
  }
  const trip: SavedTrip = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    destination: String(destination),
    city: city ? String(city) : undefined,
    duration: duration ? String(duration) : "custom",
    hotelName: hotelName ? String(hotelName) : undefined,
    data: data as Record<string, unknown>,
  };
  const saved = addTrip(authUser.id, trip);
  res.json({ trip: saved });
});

// ── DELETE /voyage/trips/:tripId — remove a saved trip ────────────────────────
router.delete("/voyage/trips/:tripId", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  deleteTrip(authUser.id, req.params.tripId);
  res.json({ ok: true });
});

export default router;
