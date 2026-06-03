const base = import.meta.env.BASE_URL;

export const destinations = [
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Neon nights and ancient traditions.",
    image: `${base}images/tokyo.png`,
    bestSeason: "Spring & Autumn",
    vibeTags: ["Culinary", "Nightlife", "Culture"]
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    tagline: "The timeless city of light.",
    image: `${base}images/paris.png`,
    bestSeason: "Spring & Summer",
    vibeTags: ["Romance", "Art", "Gastronomy"]
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    tagline: "Spiritual awakening by the ocean.",
    image: `${base}images/bali.png`,
    bestSeason: "Dry Season (May–Oct)",
    vibeTags: ["Wellness", "Nature", "Beaches"]
  },
  {
    id: "maldives",
    name: "Maldives",
    country: "Maldives",
    tagline: "Absolute serenity in the Indian Ocean.",
    image: `${base}images/maldives.png`,
    bestSeason: "Nov to April",
    vibeTags: ["Luxury", "Relaxation", "Ocean"]
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    tagline: "Where the future meets the desert.",
    image: `${base}images/dubai.png`,
    bestSeason: "Winter (Nov–Mar)",
    vibeTags: ["Luxury", "Architecture", "Shopping"]
  },
  {
    id: "milan",
    name: "Milan",
    country: "Italy",
    tagline: "The capital of style and design.",
    image: `${base}images/milan.png`,
    bestSeason: "Spring & Autumn",
    vibeTags: ["Fashion", "Design", "Culinary"]
  },
  {
    id: "nyc",
    name: "New York City",
    country: "USA",
    tagline: "The city that never sleeps.",
    image: `${base}images/nyc.png`,
    bestSeason: "Autumn & Winter",
    vibeTags: ["Culture", "Nightlife", "Energy"]
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    tagline: "Dynamic pop culture and royal palaces.",
    image: `${base}images/seoul.png`,
    bestSeason: "Spring & Autumn",
    vibeTags: ["Pop Culture", "Culinary", "History"]
  }
];

export const travelModes = [
  { id: "budget", name: "Budget Smart", range: "$500–$1,500/person", description: "Clever choices, authentic local experiences, comfortable basics." },
  { id: "cheap_perfect", name: "Cheap But Perfect", range: "$1,500–$3,000/person", description: "Boutique stays, curated dining, no compromises on quality." },
  { id: "comfort", name: "Comfort", range: "$3,000–$6,000/person", description: "4-star luxury, premium transport, guided private tours." },
  { id: "premium", name: "Premium", range: "$6,000–$15,000/person", description: "5-star hotels, exclusive access, seamless transfers." },
  { id: "luxury", name: "Luxury", range: "$15,000–$50,000/person", description: "Iconic suites, Michelin dining, helicopter transfers." },
  { id: "billionaire", name: "Billionaire", range: "$50,000+/person", description: "Private jets, total buyouts, bespoke impossible experiences." }
];

type DayPlan = {
  day: number;
  title: string;
  morning: { activity: string; venue: string; cost: string };
  afternoon: { activity: string; venue: string; cost: string };
  evening: { activity: string; venue: string; cost: string };
};

const itineraryTemplates: Record<string, Record<string, { accommodation: string; mornings: string[][]; afternoons: string[][]; evenings: string[][] }>> = {
  tokyo: {
    budget: {
      accommodation: "Nishitetsu Inn Shinjuku",
      mornings: [
        ["Explore Senso-ji Temple at dawn", "Asakusa", "$0"],
        ["Walk Yanaka old town", "Yanaka", "$0"],
        ["Visit Ueno Park & museums", "Ueno", "$5"],
        ["Morning market at Tsukiji Outer Market", "Tsukiji", "$10"],
        ["Hike to Takao-san Summit", "Mt. Takao", "$5"]
      ],
      afternoons: [
        ["Ramen lunch & Akihabara tech wander", "Akihabara", "$15"],
        ["Harajuku Takeshita Street & Meiji Shrine", "Harajuku", "$5"],
        ["Team Lab Planets (budget day)", "Toyosu", "$30"],
        ["Shibuya crossing & record shopping", "Shibuya", "$20"],
        ["Shinjuku Golden Gai exploration", "Shinjuku", "$10"]
      ],
      evenings: [
        ["Izakaya dinner in Shinjuku", "Memory Lane", "$25"],
        ["Omoide Yokocho yakitori & Sapporo drafts", "Shinjuku", "$20"],
        ["Convenience store haul & rooftop", "FamilyMart Roof", "$8"],
        ["Standing sushi bar", "Ueno Ameyoko", "$30"],
        ["Night walk Shibuya to Roppongi", "Roppongi", "$0"]
      ]
    },
    billionaire: {
      accommodation: "Aman Tokyo — Forest Suite",
      mornings: [
        ["Private sunrise Meiji Shrine blessing ceremony", "Meiji Jingu", "$3,500"],
        ["Exclusive Tsukiji tuna auction VIP access + private sushi breakfast", "Tsukiji", "$5,000"],
        ["Helicopter to Hakone with ryokan day visit", "Hakone", "$8,000"],
        ["Tea ceremony with Living National Treasure master", "Ura Senke", "$6,000"],
        ["Private Nishiki garden and Zen painting class", "Kyoto day trip", "$4,500"]
      ],
      afternoons: [
        ["Private Ginza fashion house tour + personal stylist", "Ginza", "$12,000"],
        ["Closed-museum Ghibli Studio private tour", "Koganei", "$20,000"],
        ["Sumo grand champion private practice session", "Ryogoku", "$8,000"],
        ["Sake pairing with 3 Michelin-star chef Masayoshi Takayama", "Masa", "$15,000"],
        ["Akihabara anime collector rare haul with personal shopper", "Akihabara", "$10,000"]
      ],
      evenings: [
        ["Nobu Tokyo private kaiseki omakase for 2", "Nobu Tokyo", "$4,000"],
        ["Rooftop of Park Hyatt — Lost in Translation bar buyout", "Park Hyatt", "$18,000"],
        ["Private DJ set on Tokyo Bay megayacht", "Tokyo Bay", "$35,000"],
        ["Ryugin 3-Michelin omakase + sake pairing", "Nihonbashi", "$5,000"],
        ["Fireworks display arranged over your villa terrace", "Aman Tokyo", "$50,000"]
      ]
    }
  },
  paris: {
    budget: {
      accommodation: "Hotel Eldorado",
      mornings: [
        ["Free morning at Louvre (first Sunday of month)", "Louvre", "$0"],
        ["Picnic at Luxembourg Gardens", "6th Arr.", "$12"],
        ["Walk Canal Saint-Martin", "10th Arr.", "$0"],
        ["Montmartre hill & Sacré-Cœur", "18th Arr.", "$0"],
        ["Marché d'Aligre market finds", "12th Arr.", "$15"]
      ],
      afternoons: [
        ["Baguette & Camembert on Seine banks", "Île de la Cité", "$10"],
        ["Musée d'Orsay on discount day", "7th Arr.", "$15"],
        ["Père Lachaise Cemetery wander", "20th Arr.", "$0"],
        ["Free contemporary galleries in Marais", "Le Marais", "$0"],
        ["Shakespeare & Co + Notre Dame rebuild watch", "5th Arr.", "$5"]
      ],
      evenings: [
        ["Crêpes at a street stall in Montparnasse", "14th Arr.", "$8"],
        ["Cave à vins wine bar — house Bordeaux", "Saint-Germain", "$25"],
        ["Brass brasserie plat du jour", "Rue de Rivoli", "$20"],
        ["Jazz club entry: Le Caveau de la Huchette", "5th Arr.", "$15"],
        ["Final night Eiffel Tower light show — free", "Champ de Mars", "$0"]
      ]
    },
    billionaire: {
      accommodation: "Ritz Paris — Imperial Suite",
      mornings: [
        ["Private after-hours Louvre with curator — Mona Lisa alone", "Louvre", "$18,000"],
        ["Atelier Dior private morning fitting with head couturier", "Avenue Montaigne", "$30,000"],
        ["Sunrise hot-air balloon over Loire Valley + private château", "Loire Valley", "$22,000"],
        ["Private chef's market tour & cooking class — Joël Robuchon trained", "Rungis Market", "$8,000"],
        ["Versailles exclusive dawn visit before gates open", "Versailles", "$15,000"]
      ],
      afternoons: [
        ["Hermès private workshop visit — bespoke Birkin commission", "Faubourg Saint-Honoré", "$60,000"],
        ["Lunch at Le Grand Véfour with sommelier pairing", "Palais-Royal", "$4,500"],
        ["Private Seine cruise on vintage wooden yacht", "Paris", "$12,000"],
        ["Perfume creation with Guerlain master nose", "Guerlain Atelier", "$8,000"],
        ["Christies Paris private auction preview + buying consultation", "8th Arr.", "$5,000"]
      ],
      evenings: [
        ["Alain Ducasse au Plaza Athénée — full table buyout", "Plaza Athénée", "$40,000"],
        ["Moulin Rouge private box + backstage + champagne", "18th Arr.", "$25,000"],
        ["Eiffel Tower private dinner on the 2nd floor — champagne", "Eiffel Tower", "$35,000"],
        ["Tour d'Argent — pressed duck 1.1 million, private cellar tour", "5th Arr.", "$6,000"],
        ["Private after-party at Musée Rodin gardens — jazz quartet", "7th Arr.", "$45,000"]
      ]
    }
  }
};

export const generateMockItinerary = (destinationId: string, modeId: string, duration: number) => {
  const dest = destinations.find(d => d.id === destinationId) || destinations[0];
  const mode = travelModes.find(m => m.id === modeId) || travelModes[2];

  const budgetMap: Record<string, { cost: string; nightly: string; hotel: string }> = {
    budget:        { cost: `$${(duration * 180).toLocaleString()}`, nightly: "$80/night", hotel: "Boutique Guesthouse" },
    cheap_perfect: { cost: `$${(duration * 380).toLocaleString()}`, nightly: "$180/night", hotel: "Design Boutique Hotel" },
    comfort:       { cost: `$${(duration * 720).toLocaleString()}`, nightly: "$400/night", hotel: `4-Star Hotel in ${dest.name}` },
    premium:       { cost: `$${(duration * 1400).toLocaleString()}`, nightly: "$900/night", hotel: `W Hotel ${dest.name}` },
    luxury:        { cost: `$${(duration * 4500).toLocaleString()}`, nightly: "$2,500/night", hotel: `Four Seasons ${dest.name}` },
    billionaire:   { cost: `$${(duration * 18000).toLocaleString()}`, nightly: "$15,000/night", hotel: `Exclusive Private Residence / ${dest.name} Grand` },
  };

  const bd = budgetMap[modeId] ?? budgetMap.comfort;

  const template = itineraryTemplates[destinationId]?.[modeId]
    ?? itineraryTemplates[destinationId]?.["budget"]
    ?? null;

  const genericDayActivities = (i: number, tier: string) => {
    const intensity = tier === "billionaire" || tier === "luxury" ? "exclusive" : "curated";
    return {
      morning: { activity: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} cultural morning`, venue: `${dest.name} Historic Quarter`, cost: tier === "billionaire" ? "$4,000" : tier === "luxury" ? "$500" : "$50" },
      afternoon: { activity: "Gastronomic journey & local exploration", venue: "City Center", cost: tier === "billionaire" ? "$3,000" : tier === "luxury" ? "$400" : "$60" },
      evening: { activity: "Sunset cocktails and private dinner", venue: "Signature Rooftop", cost: tier === "billionaire" ? "$6,000" : tier === "luxury" ? "$800" : "$80" }
    };
  };

  const days: DayPlan[] = Array.from({ length: duration }).map((_, i) => {
    if (template) {
      const mIdx = i % template.mornings.length;
      const aIdx = i % template.afternoons.length;
      const eIdx = i % template.evenings.length;
      const m = template.mornings[mIdx];
      const a = template.afternoons[aIdx];
      const e = template.evenings[eIdx];
      return {
        day: i + 1,
        title: i === 0 ? `Arrival & First Impressions of ${dest.name}` : i === duration - 1 ? `Final Day — Farewell to ${dest.name}` : `Day ${i + 1} in ${dest.name}`,
        morning: { activity: m[0], venue: m[1], cost: m[2] },
        afternoon: { activity: a[0], venue: a[1], cost: a[2] },
        evening: { activity: e[0], venue: e[1], cost: e[2] }
      };
    }
    const generic = genericDayActivities(i, modeId);
    return {
      day: i + 1,
      title: i === 0 ? `Arrival & First Impressions of ${dest.name}` : i === duration - 1 ? `Final Day — Farewell to ${dest.name}` : `Day ${i + 1} in ${dest.name}`,
      ...generic
    };
  });

  return {
    destination: dest.name,
    destinationImage: dest.image,
    mode: mode.name,
    budgetEstimate: bd.cost,
    duration,
    moodTags: dest.vibeTags,
    accommodation: {
      name: template ? template.accommodation : bd.hotel,
      description: `Perfectly matched to your ${mode.name} experience. Every detail curated for your comfort and taste.`,
      estimatedCost: bd.nightly
    },
    days
  };
};
