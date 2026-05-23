export type DestType =
  | 'city'
  | 'country'
  | 'island'
  | 'ski_resort'
  | 'beach'
  | 'region'
  | 'archipelago';

export interface Destination {
  label: string;
  labelRu: string;
  destination: string;
  city: string;
  type: DestType;
  emoji: string;
  popular?: boolean;
}

export const DESTINATIONS: Destination[] = [
  // ── CITIES ──────────────────────────────────────────────────────────────
  { label: 'Dubai',              labelRu: 'Дубай',                    destination: 'UAE',            city: 'Dubai',              type: 'city',       emoji: '🇦🇪', popular: true  },
  { label: 'Paris',              labelRu: 'Париж',                    destination: 'France',         city: 'Paris',              type: 'city',       emoji: '🇫🇷', popular: true  },
  { label: 'Tokyo',              labelRu: 'Токио',                    destination: 'Japan',          city: 'Tokyo',              type: 'city',       emoji: '🇯🇵', popular: true  },
  { label: 'Bali',               labelRu: 'Бали',                     destination: 'Indonesia',      city: 'Bali',               type: 'island',     emoji: '🇮🇩', popular: true  },
  { label: 'Phuket',             labelRu: 'Пхукет',                   destination: 'Thailand',       city: 'Phuket',             type: 'city',       emoji: '🇹🇭', popular: true  },
  { label: 'Santorini',          labelRu: 'Санторини',                destination: 'Greece',         city: 'Santorini',          type: 'island',     emoji: '🇬🇷', popular: true  },
  { label: 'Barcelona',          labelRu: 'Барселона',                destination: 'Spain',          city: 'Barcelona',          type: 'city',       emoji: '🇪🇸', popular: true  },
  { label: 'Rome',               labelRu: 'Рим',                      destination: 'Italy',          city: 'Rome',               type: 'city',       emoji: '🇮🇹', popular: true  },
  { label: 'New York',           labelRu: 'Нью-Йорк',                 destination: 'USA',            city: 'New York',           type: 'city',       emoji: '🇺🇸', popular: true  },
  { label: 'London',             labelRu: 'Лондон',                   destination: 'UK',             city: 'London',             type: 'city',       emoji: '🇬🇧', popular: true  },
  { label: 'Singapore',          labelRu: 'Сингапур',                 destination: 'Singapore',      city: 'Singapore',          type: 'city',       emoji: '🇸🇬', popular: true  },
  { label: 'Dubrovnik',          labelRu: 'Дубровник',                destination: 'Croatia',        city: 'Dubrovnik',          type: 'city',       emoji: '🇭🇷', popular: true  },
  { label: 'Amsterdam',          labelRu: 'Амстердам',                destination: 'Netherlands',    city: 'Amsterdam',          type: 'city',       emoji: '🇳🇱'               },
  { label: 'Vienna',             labelRu: 'Вена',                     destination: 'Austria',        city: 'Vienna',             type: 'city',       emoji: '🇦🇹'               },
  { label: 'Prague',             labelRu: 'Прага',                    destination: 'Czech Republic', city: 'Prague',             type: 'city',       emoji: '🇨🇿'               },
  { label: 'Istanbul',           labelRu: 'Стамбул',                  destination: 'Turkey',         city: 'Istanbul',           type: 'city',       emoji: '🇹🇷'               },
  { label: 'Bangkok',            labelRu: 'Бангкок',                  destination: 'Thailand',       city: 'Bangkok',            type: 'city',       emoji: '🇹🇭'               },
  { label: 'Lisbon',             labelRu: 'Лиссабон',                 destination: 'Portugal',       city: 'Lisbon',             type: 'city',       emoji: '🇵🇹'               },
  { label: 'Madrid',             labelRu: 'Мадрид',                   destination: 'Spain',          city: 'Madrid',             type: 'city',       emoji: '🇪🇸'               },
  { label: 'Milan',              labelRu: 'Милан',                    destination: 'Italy',          city: 'Milan',              type: 'city',       emoji: '🇮🇹'               },
  { label: 'Florence',           labelRu: 'Флоренция',                destination: 'Italy',          city: 'Florence',           type: 'city',       emoji: '🇮🇹'               },
  { label: 'Venice',             labelRu: 'Венеция',                  destination: 'Italy',          city: 'Venice',             type: 'city',       emoji: '🇮🇹'               },
  { label: 'Kyoto',              labelRu: 'Киото',                    destination: 'Japan',          city: 'Kyoto',              type: 'city',       emoji: '🇯🇵'               },
  { label: 'Osaka',              labelRu: 'Осака',                    destination: 'Japan',          city: 'Osaka',              type: 'city',       emoji: '🇯🇵'               },
  { label: 'Sydney',             labelRu: 'Сидней',                   destination: 'Australia',      city: 'Sydney',             type: 'city',       emoji: '🇦🇺'               },
  { label: 'Melbourne',          labelRu: 'Мельбурн',                 destination: 'Australia',      city: 'Melbourne',          type: 'city',       emoji: '🇦🇺'               },
  { label: 'Marrakech',          labelRu: 'Марракеш',                 destination: 'Morocco',        city: 'Marrakech',          type: 'city',       emoji: '🇲🇦'               },
  { label: 'Cairo',              labelRu: 'Каир',                     destination: 'Egypt',          city: 'Cairo',              type: 'city',       emoji: '🇪🇬'               },
  { label: 'Cape Town',          labelRu: 'Кейптаун',                 destination: 'South Africa',   city: 'Cape Town',          type: 'city',       emoji: '🇿🇦'               },
  { label: 'Miami',              labelRu: 'Майами',                   destination: 'USA',            city: 'Miami',              type: 'city',       emoji: '🇺🇸'               },
  { label: 'Los Angeles',        labelRu: 'Лос-Анджелес',             destination: 'USA',            city: 'Los Angeles',        type: 'city',       emoji: '🇺🇸'               },
  { label: 'Las Vegas',          labelRu: 'Лас-Вегас',                destination: 'USA',            city: 'Las Vegas',          type: 'city',       emoji: '🇺🇸'               },
  { label: 'Cancún',             labelRu: 'Канкун',                   destination: 'Mexico',         city: 'Cancún',             type: 'city',       emoji: '🇲🇽'               },
  { label: 'Mexico City',        labelRu: 'Мехико',                   destination: 'Mexico',         city: 'Mexico City',        type: 'city',       emoji: '🇲🇽'               },
  { label: 'Buenos Aires',       labelRu: 'Буэнос-Айрес',             destination: 'Argentina',      city: 'Buenos Aires',       type: 'city',       emoji: '🇦🇷'               },
  { label: 'Rio de Janeiro',     labelRu: 'Рио-де-Жанейро',           destination: 'Brazil',         city: 'Rio de Janeiro',     type: 'city',       emoji: '🇧🇷'               },
  { label: 'Sao Paulo',          labelRu: 'Сан-Паулу',                destination: 'Brazil',         city: 'Sao Paulo',          type: 'city',       emoji: '🇧🇷'               },
  { label: 'Hong Kong',          labelRu: 'Гонконг',                  destination: 'Hong Kong',      city: 'Hong Kong',          type: 'city',       emoji: '🇭🇰'               },
  { label: 'Seoul',              labelRu: 'Сеул',                     destination: 'South Korea',    city: 'Seoul',              type: 'city',       emoji: '🇰🇷'               },
  { label: 'Hanoi',              labelRu: 'Ханой',                    destination: 'Vietnam',        city: 'Hanoi',              type: 'city',       emoji: '🇻🇳'               },
  { label: 'Ho Chi Minh City',   labelRu: 'Хошимин',                  destination: 'Vietnam',        city: 'Ho Chi Minh City',   type: 'city',       emoji: '🇻🇳'               },
  { label: 'Hoi An',             labelRu: 'Хой Ан',                   destination: 'Vietnam',        city: 'Hoi An',             type: 'city',       emoji: '🇻🇳'               },
  { label: 'Chiang Mai',         labelRu: 'Чиангмай',                 destination: 'Thailand',       city: 'Chiang Mai',         type: 'city',       emoji: '🇹🇭'               },
  { label: 'Koh Samui',          labelRu: 'Ко Самуи',                 destination: 'Thailand',       city: 'Koh Samui',          type: 'island',     emoji: '🇹🇭'               },
  { label: 'Antalya',            labelRu: 'Анталья',                  destination: 'Turkey',         city: 'Antalya',            type: 'city',       emoji: '🇹🇷'               },
  { label: 'Bodrum',             labelRu: 'Бодрум',                   destination: 'Turkey',         city: 'Bodrum',             type: 'city',       emoji: '🇹🇷'               },
  { label: 'Monaco',             labelRu: 'Монако',                   destination: 'Monaco',         city: 'Monaco',             type: 'city',       emoji: '🇲🇨'               },
  { label: 'Cannes',             labelRu: 'Канны',                    destination: 'France',         city: 'Cannes',             type: 'city',       emoji: '🇫🇷'               },
  { label: 'Nice',               labelRu: 'Ницца',                    destination: 'France',         city: 'Nice',               type: 'city',       emoji: '🇫🇷'               },
  { label: 'St. Petersburg',     labelRu: 'Санкт-Петербург',          destination: 'Russia',         city: 'St. Petersburg',     type: 'city',       emoji: '🇷🇺'               },
  { label: 'Moscow',             labelRu: 'Москва',                   destination: 'Russia',         city: 'Moscow',             type: 'city',       emoji: '🇷🇺'               },
  { label: 'Tulum',              labelRu: 'Тулум',                    destination: 'Mexico',         city: 'Tulum',              type: 'beach',      emoji: '🇲🇽'               },
  { label: 'Mykonos',            labelRu: 'Миконос',                  destination: 'Greece',         city: 'Mykonos',            type: 'island',     emoji: '🇬🇷'               },
  { label: 'Athens',             labelRu: 'Афины',                    destination: 'Greece',         city: 'Athens',             type: 'city',       emoji: '🇬🇷'               },
  { label: 'Abu Dhabi',          labelRu: 'Абу-Даби',                 destination: 'UAE',            city: 'Abu Dhabi',          type: 'city',       emoji: '🇦🇪'               },
  { label: 'Doha',               labelRu: 'Доха',                     destination: 'Qatar',          city: 'Doha',               type: 'city',       emoji: '🇶🇦'               },
  { label: 'Colombo',            labelRu: 'Коломбо',                  destination: 'Sri Lanka',      city: 'Colombo',            type: 'city',       emoji: '🇱🇰'               },
  { label: 'Kathmandu',          labelRu: 'Катманду',                 destination: 'Nepal',          city: 'Kathmandu',          type: 'city',       emoji: '🇳🇵'               },
  { label: 'Reykjavik',          labelRu: 'Рейкьявик',                destination: 'Iceland',        city: 'Reykjavik',          type: 'city',       emoji: '🇮🇸'               },
  { label: 'Copenhagen',         labelRu: 'Копенгаген',               destination: 'Denmark',        city: 'Copenhagen',         type: 'city',       emoji: '🇩🇰'               },
  { label: 'Stockholm',          labelRu: 'Стокгольм',                destination: 'Sweden',         city: 'Stockholm',          type: 'city',       emoji: '🇸🇪'               },
  { label: 'Oslo',               labelRu: 'Осло',                     destination: 'Norway',         city: 'Oslo',               type: 'city',       emoji: '🇳🇴'               },
  { label: 'Helsinki',           labelRu: 'Хельсинки',                destination: 'Finland',        city: 'Helsinki',           type: 'city',       emoji: '🇫🇮'               },
  { label: 'Zurich',             labelRu: 'Цюрих',                    destination: 'Switzerland',    city: 'Zurich',             type: 'city',       emoji: '🇨🇭'               },
  { label: 'Geneva',             labelRu: 'Женева',                   destination: 'Switzerland',    city: 'Geneva',             type: 'city',       emoji: '🇨🇭'               },
  { label: 'Brussels',           labelRu: 'Брюссель',                 destination: 'Belgium',        city: 'Brussels',           type: 'city',       emoji: '🇧🇪'               },
  { label: 'Porto',              labelRu: 'Порту',                    destination: 'Portugal',       city: 'Porto',              type: 'city',       emoji: '🇵🇹'               },
  { label: 'Seville',            labelRu: 'Севилья',                  destination: 'Spain',          city: 'Seville',            type: 'city',       emoji: '🇪🇸'               },
  { label: 'Marbella',           labelRu: 'Марбелья',                 destination: 'Spain',          city: 'Marbella',           type: 'beach',      emoji: '🇪🇸'               },
  { label: 'Ibiza',              labelRu: 'Ибица',                    destination: 'Spain',          city: 'Ibiza',              type: 'island',     emoji: '🇪🇸'               },
  { label: 'Positano',           labelRu: 'Позитано',                 destination: 'Italy',          city: 'Positano',           type: 'city',       emoji: '🇮🇹'               },
  { label: 'Amalfi',             labelRu: 'Амальфи',                  destination: 'Italy',          city: 'Amalfi',             type: 'city',       emoji: '🇮🇹'               },
  { label: 'Capri',              labelRu: 'Капри',                    destination: 'Italy',          city: 'Capri',              type: 'island',     emoji: '🇮🇹'               },
  { label: 'Nairobi',            labelRu: 'Найроби',                  destination: 'Kenya',          city: 'Nairobi',            type: 'city',       emoji: '🇰🇪'               },
  { label: 'Zanzibar',           labelRu: 'Занзибар',                 destination: 'Tanzania',       city: 'Zanzibar',           type: 'island',     emoji: '🇹🇿'               },

  // ── SKI RESORTS ──────────────────────────────────────────────────────────
  { label: 'Courchevel',         labelRu: 'Куршевель',                destination: 'France',         city: 'Courchevel',         type: 'ski_resort', emoji: '⛷️', popular: true  },
  { label: 'Aspen',              labelRu: 'Аспен',                    destination: 'USA',            city: 'Aspen',              type: 'ski_resort', emoji: '⛷️', popular: true  },
  { label: 'Zermatt',            labelRu: 'Цермат',                   destination: 'Switzerland',    city: 'Zermatt',            type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Verbier',            labelRu: 'Вербье',                   destination: 'Switzerland',    city: 'Verbier',            type: 'ski_resort', emoji: '⛷️'               },
  { label: "Val d'Isère",        labelRu: "Валь-д'Изер",              destination: 'France',         city: "Val d'Isère",        type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Méribel',            labelRu: 'Мерибель',                 destination: 'France',         city: 'Méribel',            type: 'ski_resort', emoji: '⛷️'               },
  { label: 'St. Moritz',         labelRu: 'Санкт-Мориц',              destination: 'Switzerland',    city: 'St. Moritz',         type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Chamonix',           labelRu: 'Шамони',                   destination: 'France',         city: 'Chamonix',           type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Niseko',             labelRu: 'Нисэко',                   destination: 'Japan',          city: 'Niseko',             type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Whistler',           labelRu: 'Уистлер',                  destination: 'Canada',         city: 'Whistler',           type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Vail',               labelRu: 'Вэйл',                     destination: 'USA',            city: 'Vail',               type: 'ski_resort', emoji: '⛷️'               },
  { label: "Cortina d'Ampezzo",  labelRu: "Кортина-д'Ампеццо",        destination: 'Italy',          city: "Cortina d'Ampezzo",  type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Kitzbühel',          labelRu: 'Кицбюэль',                 destination: 'Austria',        city: 'Kitzbühel',          type: 'ski_resort', emoji: '⛷️'               },
  { label: 'Innsbruck',          labelRu: 'Инсбрук',                  destination: 'Austria',        city: 'Innsbruck',          type: 'ski_resort', emoji: '⛷️'               },

  // ── ISLANDS & ARCHIPELAGOS ───────────────────────────────────────────────
  { label: 'Maldives',           labelRu: 'Мальдивы',                 destination: 'Maldives',       city: '',                   type: 'archipelago',emoji: '🇲🇻', popular: true  },
  { label: 'Mauritius',          labelRu: 'Маврикий',                 destination: 'Mauritius',      city: '',                   type: 'island',     emoji: '🇲🇺', popular: true  },
  { label: 'Seychelles',         labelRu: 'Сейшелы',                  destination: 'Seychelles',     city: '',                   type: 'archipelago',emoji: '🇸🇨'               },
  { label: 'Bora Bora',          labelRu: 'Бора-Бора',                destination: 'French Polynesia', city: 'Bora Bora',        type: 'island',     emoji: '🇵🇫'               },
  { label: 'Tahiti',             labelRu: 'Таити',                    destination: 'French Polynesia', city: 'Tahiti',           type: 'island',     emoji: '🇵🇫'               },
  { label: 'Fiji',               labelRu: 'Фиджи',                    destination: 'Fiji',           city: '',                   type: 'archipelago',emoji: '🇫🇯'               },
  { label: 'Hawaii',             labelRu: 'Гавайи',                   destination: 'USA',            city: 'Hawaii',             type: 'island',     emoji: '🏝️'               },
  { label: 'Maui',               labelRu: 'Мауи',                     destination: 'USA',            city: 'Maui',               type: 'island',     emoji: '🏝️'               },
  { label: 'Lanzarote',          labelRu: 'Лансароте',                destination: 'Spain',          city: 'Lanzarote',          type: 'island',     emoji: '🇪🇸'               },
  { label: 'Tenerife',           labelRu: 'Тенерифе',                 destination: 'Spain',          city: 'Tenerife',           type: 'island',     emoji: '🇪🇸'               },
  { label: 'Mallorca',           labelRu: 'Майорка',                  destination: 'Spain',          city: 'Mallorca',           type: 'island',     emoji: '🇪🇸'               },
  { label: 'Corfu',              labelRu: 'Корфу',                    destination: 'Greece',         city: 'Corfu',              type: 'island',     emoji: '🇬🇷'               },
  { label: 'Crete',              labelRu: 'Крит',                     destination: 'Greece',         city: 'Crete',              type: 'island',     emoji: '🇬🇷'               },
  { label: 'Rhodes',             labelRu: 'Родос',                    destination: 'Greece',         city: 'Rhodes',             type: 'island',     emoji: '🇬🇷'               },
  { label: 'Sri Lanka',          labelRu: 'Шри-Ланка',                destination: 'Sri Lanka',      city: '',                   type: 'island',     emoji: '🇱🇰'               },
  { label: 'Lombok',             labelRu: 'Ломбок',                   destination: 'Indonesia',      city: 'Lombok',             type: 'island',     emoji: '🇮🇩'               },
  { label: 'Komodo',             labelRu: 'Комодо',                   destination: 'Indonesia',      city: 'Komodo',             type: 'island',     emoji: '🇮🇩'               },
  { label: 'Koh Phi Phi',        labelRu: 'Ко Пхи-Пхи',              destination: 'Thailand',       city: 'Koh Phi Phi',        type: 'island',     emoji: '🇹🇭'               },

  // ── REGIONS ──────────────────────────────────────────────────────────────
  { label: 'Tuscany',            labelRu: 'Тоскана',                  destination: 'Italy',          city: 'Tuscany',            type: 'region',     emoji: '🇮🇹'               },
  { label: 'Amalfi Coast',       labelRu: 'Амальфийское побережье',   destination: 'Italy',          city: 'Amalfi Coast',       type: 'region',     emoji: '🇮🇹'               },
  { label: 'French Riviera',     labelRu: 'Лазурный берег',           destination: 'France',         city: 'French Riviera',     type: 'region',     emoji: '🇫🇷'               },
  { label: 'Algarve',            labelRu: 'Алгарве',                  destination: 'Portugal',       city: 'Algarve',            type: 'region',     emoji: '🇵🇹'               },
  { label: 'Provence',           labelRu: 'Прованс',                  destination: 'France',         city: 'Provence',           type: 'region',     emoji: '🇫🇷'               },
  { label: 'Normandy',           labelRu: 'Нормандия',                destination: 'France',         city: 'Normandy',           type: 'region',     emoji: '🇫🇷'               },
  { label: 'Scottish Highlands', labelRu: 'Шотландское нагорье',      destination: 'UK',             city: 'Scottish Highlands', type: 'region',     emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'               },
  { label: 'Patagonia',          labelRu: 'Патагония',                destination: 'Argentina',      city: 'Patagonia',          type: 'region',     emoji: '🇦🇷'               },
  { label: 'Napa Valley',        labelRu: 'Напа Вэлли',               destination: 'USA',            city: 'Napa Valley',        type: 'region',     emoji: '🇺🇸'               },
  { label: 'Sahara Desert',      labelRu: 'Сахара',                   destination: 'Morocco',        city: 'Sahara Desert',      type: 'region',     emoji: '🇲🇦'               },
  { label: 'Dalmatian Coast',    labelRu: 'Далматинское побережье',   destination: 'Croatia',        city: 'Dalmatian Coast',    type: 'region',     emoji: '🇭🇷'               },

  // ── COUNTRIES ────────────────────────────────────────────────────────────
  { label: 'Japan',              labelRu: 'Япония',                   destination: 'Japan',          city: '',                   type: 'country',    emoji: '🇯🇵'               },
  { label: 'France',             labelRu: 'Франция',                  destination: 'France',         city: '',                   type: 'country',    emoji: '🇫🇷'               },
  { label: 'Italy',              labelRu: 'Италия',                   destination: 'Italy',          city: '',                   type: 'country',    emoji: '🇮🇹'               },
  { label: 'Spain',              labelRu: 'Испания',                  destination: 'Spain',          city: '',                   type: 'country',    emoji: '🇪🇸'               },
  { label: 'Greece',             labelRu: 'Греция',                   destination: 'Greece',         city: '',                   type: 'country',    emoji: '🇬🇷'               },
  { label: 'Croatia',            labelRu: 'Хорватия',                 destination: 'Croatia',        city: '',                   type: 'country',    emoji: '🇭🇷'               },
  { label: 'Turkey',             labelRu: 'Турция',                   destination: 'Turkey',         city: '',                   type: 'country',    emoji: '🇹🇷'               },
  { label: 'Thailand',           labelRu: 'Таиланд',                  destination: 'Thailand',       city: '',                   type: 'country',    emoji: '🇹🇭'               },
  { label: 'Indonesia',          labelRu: 'Индонезия',                destination: 'Indonesia',      city: '',                   type: 'country',    emoji: '🇮🇩'               },
  { label: 'Vietnam',            labelRu: 'Вьетнам',                  destination: 'Vietnam',        city: '',                   type: 'country',    emoji: '🇻🇳'               },
  { label: 'Morocco',            labelRu: 'Марокко',                  destination: 'Morocco',        city: '',                   type: 'country',    emoji: '🇲🇦'               },
  { label: 'Portugal',           labelRu: 'Португалия',               destination: 'Portugal',       city: '',                   type: 'country',    emoji: '🇵🇹'               },
  { label: 'Switzerland',        labelRu: 'Швейцария',                destination: 'Switzerland',    city: '',                   type: 'country',    emoji: '🇨🇭'               },
  { label: 'Iceland',            labelRu: 'Исландия',                 destination: 'Iceland',        city: '',                   type: 'country',    emoji: '🇮🇸'               },
  { label: 'Norway',             labelRu: 'Норвегия',                 destination: 'Norway',         city: '',                   type: 'country',    emoji: '🇳🇴'               },
  { label: 'UAE',                labelRu: 'ОАЭ',                      destination: 'UAE',            city: '',                   type: 'country',    emoji: '🇦🇪'               },
  { label: 'Egypt',              labelRu: 'Египет',                   destination: 'Egypt',          city: '',                   type: 'country',    emoji: '🇪🇬'               },
  { label: 'Kenya',              labelRu: 'Кения',                    destination: 'Kenya',          city: '',                   type: 'country',    emoji: '🇰🇪'               },
  { label: 'Tanzania',           labelRu: 'Танзания',                 destination: 'Tanzania',       city: '',                   type: 'country',    emoji: '🇹🇿'               },
  { label: 'South Africa',       labelRu: 'ЮАР',                      destination: 'South Africa',   city: '',                   type: 'country',    emoji: '🇿🇦'               },
];

const TYPE_LABELS: Record<DestType, { en: string; ru: string }> = {
  city:        { en: 'City',       ru: 'Город'    },
  country:     { en: 'Country',    ru: 'Страна'   },
  island:      { en: 'Island',     ru: 'Остров'   },
  ski_resort:  { en: 'Ski Resort', ru: 'Курорт'   },
  beach:       { en: 'Beach',      ru: 'Пляж'     },
  region:      { en: 'Region',     ru: 'Регион'   },
  archipelago: { en: 'Islands',    ru: 'Острова'  },
};

export function getTypeLabel(type: DestType, lang: 'en' | 'ru'): string {
  return TYPE_LABELS[type][lang];
}

export function getDestLabel(dest: Destination, lang: 'en' | 'ru'): string {
  return lang === 'ru' ? dest.labelRu : dest.label;
}

export function searchDestinations(query: string, lang: 'en' | 'ru' = 'en', limit = 9): Destination[] {
  if (!query.trim()) {
    return DESTINATIONS.filter(d => d.popular).slice(0, limit);
  }
  const q = query.toLowerCase().trim();
  const exact: Destination[] = [];
  const starts: Destination[] = [];
  const contains: Destination[] = [];

  for (const d of DESTINATIONS) {
    const en = d.label.toLowerCase();
    const ru = d.labelRu.toLowerCase();
    const dest = d.destination.toLowerCase();
    const city = d.city.toLowerCase();
    const isExact   = en === q || ru === q || dest === q || city === q;
    const isStarts  = en.startsWith(q) || ru.startsWith(q) || dest.startsWith(q) || city.startsWith(q);
    const isContains = en.includes(q) || ru.includes(q) || dest.includes(q) || city.includes(q);
    if (isExact)        exact.push(d);
    else if (isStarts)  starts.push(d);
    else if (isContains) contains.push(d);
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}
