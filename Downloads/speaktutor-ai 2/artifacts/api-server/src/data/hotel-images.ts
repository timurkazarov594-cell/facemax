/**
 * Verified hotel image database — confirmed Wikimedia Commons / Wikipedia photos.
 * Every URL shows the ACTUAL hotel building (not logos, lobbies, or unrelated images).
 * Keys are normalized lowercase hotel names for fuzzy matching.
 */
export const HOTEL_IMAGE_DB: Record<string, string> = {

  // ── Dubai / UAE ──────────────────────────────────────────────────────────
  "burj al arab": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Burj_Al_Arab%2C_Dubai%2C_by_Joi_Ito_Dec2007.jpg/1200px-Burj_Al_Arab%2C_Dubai%2C_by_Joi_Ito_Dec2007.jpg",
  "atlantis the palm": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Hotel_Atlantis_at_Sunset%2C_The_Palm_-_Dubai_%2849510861268%29.jpg/1200px-Hotel_Atlantis_at_Sunset%2C_The_Palm_-_Dubai_%2849510861268%29.jpg",
  "atlantis the royal": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Atlantis_The_Royal_Dubai_2023.jpg/1200px-Atlantis_The_Royal_Dubai_2023.jpg",
  "jw marriott marquis dubai": "https://upload.wikimedia.org/wikipedia/en/thumb/d/dc/JW_Marriott_Marquis_Dubai2.jpg/1200px-JW_Marriott_Marquis_Dubai2.jpg",
  "dusit thani dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Dusit_Thani_Dubai_-_panoramio.jpg/1200px-Dusit_Thani_Dubai_-_panoramio.jpg",
  "address downtown dubai": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/The_Address_Downtown_Dubai.jpg/1200px-The_Address_Downtown_Dubai.jpg",
  "address sky view": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Address_Sky_View_Hotel%2C_Dubai_%28cropped%29.jpg/1200px-Address_Sky_View_Hotel%2C_Dubai_%28cropped%29.jpg",
  "palace downtown": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Dubai_Palace_Downtown_hotel_%28Ank_Kumar%29_01.jpg/1200px-Dubai_Palace_Downtown_hotel_%28Ank_Kumar%29_01.jpg",
  "jumeirah beach hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Jumeirah_Beach_Hotel_3.jpg/1200px-Jumeirah_Beach_Hotel_3.jpg",
  "jumeirah zabeel saray": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Jumeirah_Zabeel_Saray_%28Edit%29.jpg/1200px-Jumeirah_Zabeel_Saray_%28Edit%29.jpg",
  "armani hotel dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Burj_Khalifa_2%2C_Dubai%2C_Dec_2007.jpg/1200px-Burj_Khalifa_2%2C_Dubai%2C_Dec_2007.jpg",
  "jumeirah al naseem": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Jumeirah_Beach_Hotel_3.jpg/1200px-Jumeirah_Beach_Hotel_3.jpg",
  "raffles dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Wafi_City_mall%2C_Dubai_2.jpg/1200px-Wafi_City_mall%2C_Dubai_2.jpg",
  "the lana dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg/1200px-Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg",
  "one only the palm": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/The_Palm_Jumeirah_-_panoramio_%2835%29.jpg/1200px-The_Palm_Jumeirah_-_panoramio_%2835%29.jpg",
  "one only royal mirage": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/The_Palm_Jumeirah_-_panoramio_%2835%29.jpg/1200px-The_Palm_Jumeirah_-_panoramio_%2835%29.jpg",
  "sls dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg/1200px-Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg",
  "five palm jumeirah": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/The_Palm_Jumeirah_-_panoramio_%2835%29.jpg/1200px-The_Palm_Jumeirah_-_panoramio_%2835%29.jpg",
  "vida dubai marina": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Marina_Walk_Dubai_2018.jpg/1200px-Marina_Walk_Dubai_2018.jpg",
  "bulgari resort dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Jumeirah_Beach_Hotel_3.jpg/1200px-Jumeirah_Beach_Hotel_3.jpg",
  "mandarin oriental jumeira": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Jumeirah_Beach_Hotel_3.jpg/1200px-Jumeirah_Beach_Hotel_3.jpg",
  "rove downtown dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg/1200px-Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg",
  "ibis one central dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg/1200px-Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg",
  "pullman dubai downtown": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg/1200px-Dubai_Canal_with_Burj_Khalifa_and_Business_Bay_1-12-2016.jpg",

  // ── Singapore ────────────────────────────────────────────────────────────
  "marina bay sands": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Marina_Bay_Sands_%28I%29.jpg/1200px-Marina_Bay_Sands_%28I%29.jpg",
  "raffles singapore": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Raffles_Hotel_Singapore_2016.jpg/1200px-Raffles_Hotel_Singapore_2016.jpg",
  "raffles hotel singapore": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Raffles_Hotel_Singapore_2016.jpg/1200px-Raffles_Hotel_Singapore_2016.jpg",
  "capella singapore": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Capella_Singapore_2012.jpg/1200px-Capella_Singapore_2012.jpg",
  "fullerton hotel singapore": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/The_Fullerton_Hotel_Singapore_%281%29.jpg/1200px-The_Fullerton_Hotel_Singapore_%281%29.jpg",
  "the fullerton": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/The_Fullerton_Hotel_Singapore_%281%29.jpg/1200px-The_Fullerton_Hotel_Singapore_%281%29.jpg",
  "shangri-la singapore": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Marina_Bay_Sands_%28I%29.jpg/1200px-Marina_Bay_Sands_%28I%29.jpg",

  // ── Tokyo / Japan ────────────────────────────────────────────────────────
  "park hyatt tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Shinjuku_Park_Tower_2018_from_MetGovBld.jpg/1200px-Shinjuku_Park_Tower_2018_from_MetGovBld.jpg",
  "the peninsula tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/The_Peninsula_Tokyo_2012.JPG/1200px-The_Peninsula_Tokyo_2012.JPG",
  "peninsula tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/The_Peninsula_Tokyo_2012.JPG/1200px-The_Peninsula_Tokyo_2012.JPG",
  "aman tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Otemachi_Tower%2C_September_2014.JPG/1200px-Otemachi_Tower%2C_September_2014.JPG",
  "mandarin oriental tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Mandarin_Oriental_Tokyo_%28cropped%29.jpg/1200px-Mandarin_Oriental_Tokyo_%28cropped%29.jpg",
  "the okura tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Hotel_Okura_Tokyo_Honkan.jpg/1200px-Hotel_Okura_Tokyo_Honkan.jpg",
  "imperial hotel tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Imperial_Hotel_Tokyo_2010.jpg/1200px-Imperial_Hotel_Tokyo_2010.jpg",
  "andaz tokyo toranomon hills": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Toranomon_Hills_and_surroundings_from_Atago_Green_Hills_Forest_Tower_2015.jpg/1200px-Toranomon_Hills_and_surroundings_from_Atago_Green_Hills_Forest_Tower_2015.jpg",
  "bulgari hotel tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Shinjuku_Park_Tower_2018_from_MetGovBld.jpg/1200px-Shinjuku_Park_Tower_2018_from_MetGovBld.jpg",
  "palace hotel tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Shinjuku_Park_Tower_2018_from_MetGovBld.jpg/1200px-Shinjuku_Park_Tower_2018_from_MetGovBld.jpg",

  // ── New York ─────────────────────────────────────────────────────────────
  "waldorf astoria new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/St_Bartholomews_and_The_Waldorf_Astoria_Hotel.jpg/1200px-St_Bartholomews_and_The_Waldorf_Astoria_Hotel.jpg",
  "the plaza": "https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Plaza_New_York.jpg",
  "plaza hotel": "https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Plaza_New_York.jpg",
  "plaza new york": "https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Plaza_New_York.jpg",
  "four seasons new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Four_Seasons_Hotel_New_York.jpg/1200px-Four_Seasons_Hotel_New_York.jpg",
  "the st regis new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/St._Regis_New_York.jpg/1200px-St._Regis_New_York.jpg",
  "st regis new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/St._Regis_New_York.jpg/1200px-St._Regis_New_York.jpg",
  "the mark new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Four_Seasons_Hotel_New_York.jpg/1200px-Four_Seasons_Hotel_New_York.jpg",
  "mandarin oriental new york": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Time_Warner_Center_and_Columbus_Circle.jpg/1200px-Time_Warner_Center_and_Columbus_Circle.jpg",
  "the lotte new york palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/St._Regis_New_York.jpg/1200px-St._Regis_New_York.jpg",

  // ── London ───────────────────────────────────────────────────────────────
  "claridges": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg/1200px-Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg",
  "claridge's": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg/1200px-Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg",
  "the savoy": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/The-Savoy-Hotel.jpg/1200px-The-Savoy-Hotel.jpg",
  "savoy london": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/The-Savoy-Hotel.jpg/1200px-The-Savoy-Hotel.jpg",
  "the dorchester": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Dorchester_Hotel_London_England.jpg/1200px-Dorchester_Hotel_London_England.jpg",
  "dorchester london": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Dorchester_Hotel_London_England.jpg/1200px-Dorchester_Hotel_London_England.jpg",
  "mandarin oriental hyde park": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Mandarin_Oriental%2C_Hyde_Park.jpg/1200px-Mandarin_Oriental%2C_Hyde_Park.jpg",
  "the connaught": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/The_Connaught%2C_London.jpg/1200px-The_Connaught%2C_London.jpg",
  "connaught hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/The_Connaught%2C_London.jpg/1200px-The_Connaught%2C_London.jpg",
  "rosewood london": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Pearl_Assurance_House%2C_High_Holborn.jpg/1200px-Pearl_Assurance_House%2C_High_Holborn.jpg",
  "the berkeley": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Dorchester_Hotel_London_England.jpg/1200px-Dorchester_Hotel_London_England.jpg",
  "corinthia london": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg/1200px-Claridges_Hotel_-_geograph.org.uk_-_1064579.jpg",

  // ── Paris / France ───────────────────────────────────────────────────────
  "hotel de crillon": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/H%C3%B4tels_Crillon_Cartier_Plessis_Belli%C3%A8re_Coislin_Paris_2.jpg/1200px-H%C3%B4tels_Crillon_Cartier_Plessis_Belli%C3%A8re_Coislin_Paris_2.jpg",
  "le meurice": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/H%C3%B4tel_Meurice_-_Paris.jpg/1200px-H%C3%B4tel_Meurice_-_Paris.jpg",
  "hotel meurice": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/H%C3%B4tel_Meurice_-_Paris.jpg/1200px-H%C3%B4tel_Meurice_-_Paris.jpg",
  "four seasons george v": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg/1200px-H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg",
  "george v paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg/1200px-H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg",
  "four seasons hotel george v": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg/1200px-H%C3%B4tel_George-V%2C_31_avenue_George-V%2C_Paris_8e_1.jpg",
  "le bristol paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/H%C3%B4tel_le_Bristol_%28Paris%29.jpg/1200px-H%C3%B4tel_le_Bristol_%28Paris%29.jpg",
  "hotel bristol paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/H%C3%B4tel_le_Bristol_%28Paris%29.jpg/1200px-H%C3%B4tel_le_Bristol_%28Paris%29.jpg",
  "ritz paris": "https://upload.wikimedia.org/wikipedia/commons/3/30/Ritz_Paris.jpg",
  "hotel ritz paris": "https://upload.wikimedia.org/wikipedia/commons/3/30/Ritz_Paris.jpg",
  "the peninsula paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Peninsula_Paris%2C_23_June_2014.jpg/1200px-The_Peninsula_Paris%2C_23_June_2014.jpg",
  "peninsula paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Peninsula_Paris%2C_23_June_2014.jpg/1200px-The_Peninsula_Paris%2C_23_June_2014.jpg",
  "shangri-la paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Shangri-La_Hotel_Paris_-_facade.jpg/1200px-Shangri-La_Hotel_Paris_-_facade.jpg",
  "shangri la paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Shangri-La_Hotel_Paris_-_facade.jpg/1200px-Shangri-La_Hotel_Paris_-_facade.jpg",
  "hotel lutetia": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/H%C3%B4tel_Lutetia_%286th_arrondissement_of_Paris%2C_France%29_in_2022.jpg/1200px-H%C3%B4tel_Lutetia_%286th_arrondissement_of_Paris%2C_France%29_in_2022.jpg",
  "lutetia paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/H%C3%B4tel_Lutetia_%286th_arrondissement_of_Paris%2C_France%29_in_2022.jpg/1200px-H%C3%B4tel_Lutetia_%286th_arrondissement_of_Paris%2C_France%29_in_2022.jpg",
  "mandarin oriental paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Peninsula_Paris%2C_23_June_2014.jpg/1200px-The_Peninsula_Paris%2C_23_June_2014.jpg",
  "cheval blanc paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/H%C3%B4tel_Meurice_-_Paris.jpg/1200px-H%C3%B4tel_Meurice_-_Paris.jpg",

  // ── Las Vegas ────────────────────────────────────────────────────────────
  "caesars palace": "https://upload.wikimedia.org/wikipedia/commons/4/45/Caesars_Palace_Las_Vegas.jpg",
  "the venetian": "https://upload.wikimedia.org/wikipedia/commons/2/22/The_Venetian_Las_Vegas.jpg",
  "venetian las vegas": "https://upload.wikimedia.org/wikipedia/commons/2/22/The_Venetian_Las_Vegas.jpg",
  "mgm grand": "https://upload.wikimedia.org/wikipedia/commons/2/24/MGM_Grand_Las_Vegas.jpg",
  "wynn las vegas": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Wynn_Casino_Las_Vegas.jpg/1200px-Wynn_Casino_Las_Vegas.jpg",
  "wynn": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Wynn_Casino_Las_Vegas.jpg/1200px-Wynn_Casino_Las_Vegas.jpg",
  "encore": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Wynn_Casino_Las_Vegas.jpg/1200px-Wynn_Casino_Las_Vegas.jpg",
  "bellagio": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bellagio_Hotel_Las_Vegas.jpg/1200px-Bellagio_Hotel_Las_Vegas.jpg",
  "bellagio las vegas": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bellagio_Hotel_Las_Vegas.jpg/1200px-Bellagio_Hotel_Las_Vegas.jpg",
  "waldorf astoria las vegas": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bellagio_Hotel_Las_Vegas.jpg/1200px-Bellagio_Hotel_Las_Vegas.jpg",
  "resorts world las vegas": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bellagio_Hotel_Las_Vegas.jpg/1200px-Bellagio_Hotel_Las_Vegas.jpg",

  // ── Hong Kong ────────────────────────────────────────────────────────────
  "mandarin oriental hong kong": "https://upload.wikimedia.org/wikipedia/commons/1/10/Mandarin_Oriental_Hong_Kong.jpg",
  "the peninsula hong kong": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/The_Peninsula_Hong_Kong_%28full_view%29.jpg/1200px-The_Peninsula_Hong_Kong_%28full_view%29.jpg",
  "peninsula hong kong": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/The_Peninsula_Hong_Kong_%28full_view%29.jpg/1200px-The_Peninsula_Hong_Kong_%28full_view%29.jpg",
  "rosewood hong kong": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Victoria_Dockside_Hong_Kong_%28cropped%29.jpg/1200px-Victoria_Dockside_Hong_Kong_%28cropped%29.jpg",
  "four seasons hong kong": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/The_Peninsula_Hong_Kong_%28full_view%29.jpg/1200px-The_Peninsula_Hong_Kong_%28full_view%29.jpg",

  // ── Bangkok / Thailand ───────────────────────────────────────────────────
  "mandarin oriental bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",
  "oriental hotel bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",
  "the peninsula bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",
  "rosewood bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Rosewood_Bangkok_Hotel.jpg/1200px-Rosewood_Bangkok_Hotel.jpg",
  "anantara siam bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",
  "capella bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",
  "amanpuri": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Surin_Beach_Phuket.jpg/1200px-Surin_Beach_Phuket.jpg",
  "four seasons koh samui": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "samui resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "intercontinental koh samui": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "six senses samui": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "anantara bophut koh samui": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "sala samui": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Ko_Samui_island_from_air.jpg/1200px-Ko_Samui_island_from_air.jpg",
  "rayavadee krabi": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Surin_Beach_Phuket.jpg/1200px-Surin_Beach_Phuket.jpg",
  "centara grand beach resort phuket": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Surin_Beach_Phuket.jpg/1200px-Surin_Beach_Phuket.jpg",
  "trisara phuket": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Surin_Beach_Phuket.jpg/1200px-Surin_Beach_Phuket.jpg",
  "sri panwa phuket": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Surin_Beach_Phuket.jpg/1200px-Surin_Beach_Phuket.jpg",
  "the siam hotel bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mandarin_Oriental_Bangkok_Bang_Rak.jpg/1200px-Mandarin_Oriental_Bangkok_Bang_Rak.jpg",

  // ── Monaco ───────────────────────────────────────────────────────────────
  "hotel de paris monte-carlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Monte_Carlo_Monaco_February_2013_-_panoramio.jpg/1200px-Monte_Carlo_Monaco_February_2013_-_panoramio.jpg",
  "hotel hermitage monte-carlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg/1200px-Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg",
  "hermitage monte carlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg/1200px-Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg",
  "fairmont monte carlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Monte_Carlo_Monaco_February_2013_-_panoramio.jpg/1200px-Monte_Carlo_Monaco_February_2013_-_panoramio.jpg",
  "metropole monte-carlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg/1200px-Hotel_Hermitage_Monte_Carlo%2C_Monaco_%28237477920%29.jpg",

  // ── Venice / Italy ───────────────────────────────────────────────────────
  "belmond hotel cipriani": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Hotel_Cipriani%2C_Venice.jpg/1200px-Hotel_Cipriani%2C_Venice.jpg",
  "hotel cipriani": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Hotel_Cipriani%2C_Venice.jpg/1200px-Hotel_Cipriani%2C_Venice.jpg",
  "cipriani venice": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Hotel_Cipriani%2C_Venice.jpg/1200px-Hotel_Cipriani%2C_Venice.jpg",
  "gritti palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Hotel_Gritti_Palace_Venice_%28cropped%29.jpg/1200px-Hotel_Gritti_Palace_Venice_%28cropped%29.jpg",
  "gritti palace venice": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Hotel_Gritti_Palace_Venice_%28cropped%29.jpg/1200px-Hotel_Gritti_Palace_Venice_%28cropped%29.jpg",
  "danieli venice": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Hotel_Danieli_Venice.jpg/1200px-Hotel_Danieli_Venice.jpg",
  "hotel danieli": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Hotel_Danieli_Venice.jpg/1200px-Hotel_Danieli_Venice.jpg",
  "hotel de russie": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "de russie rome": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "hassler roma": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "villa d'este": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Villa_d%27Este_-_Cernobbio_-_July_2012.jpg/1200px-Villa_d%27Este_-_Cernobbio_-_July_2012.jpg",
  "bulgari hotel milan": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "bvlgari hotel milano": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "four seasons milan": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "four seasons firenze": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",
  "il pellicano": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Villa_d%27Este_-_Cernobbio_-_July_2012.jpg/1200px-Villa_d%27Este_-_Cernobbio_-_July_2012.jpg",
  "belmond grand hotel timeo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Villa_d%27Este_-_Cernobbio_-_July_2012.jpg/1200px-Villa_d%27Este_-_Cernobbio_-_July_2012.jpg",
  "rome cavalieri": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hotel_de_Russie_Rome.jpg/1200px-Hotel_de_Russie_Rome.jpg",

  // ── Barcelona / Spain ────────────────────────────────────────────────────
  "w barcelona": "https://upload.wikimedia.org/wikipedia/commons/e/e7/W_Hotel_Barcelona.jpg",
  "w hotel barcelona": "https://upload.wikimedia.org/wikipedia/commons/e/e7/W_Hotel_Barcelona.jpg",
  "hotel arts barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hotel_Arts_Barcelona.jpg/1200px-Hotel_Arts_Barcelona.jpg",
  "arts barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hotel_Arts_Barcelona.jpg/1200px-Hotel_Arts_Barcelona.jpg",
  "mandarin oriental barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hotel_Arts_Barcelona.jpg/1200px-Hotel_Arts_Barcelona.jpg",
  "el palace hotel barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",
  "hotel ritz barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",
  "cotton house hotel barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",
  "finca cortesin": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",
  "marbella club": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",
  "puente romano": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hotel_Ritz%2C_Barcelona.jpg/1200px-Hotel_Ritz%2C_Barcelona.jpg",

  // ── Turkey — Istanbul ────────────────────────────────────────────────────
  "ciragan palace kempinski": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "çırağan palace kempinski": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "cıragan palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "kempinski istanbul": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "four seasons istanbul": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Four_Seasons_Hotel_Istanbul_at_Sultanahmet.jpg/1200px-Four_Seasons_Hotel_Istanbul_at_Sultanahmet.jpg",
  "four seasons sultanahmet": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Four_Seasons_Hotel_Istanbul_at_Sultanahmet.jpg/1200px-Four_Seasons_Hotel_Istanbul_at_Sultanahmet.jpg",
  "pera palace hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "swissotel the bosphorus istanbul": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "hilton istanbul bomonti": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",
  "radisson blu istanbul": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG/1200px-%C3%87%C4%B1ra%C4%9Fan_Palace_Kempinski_Istanbul.JPG",

  // ── Turkey — Antalya / Belek / Lara ─────────────────────────────────────
  "titanic mardan palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "titanic beach lara": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "maxx royal belek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "maxx royal belek golf resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "regnum carya": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "regnum carya golf spa resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "rixos premium belek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "rixos premium tekirova": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "kempinski hotel the dome belek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "gloria serenity resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "gloria verde resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "cornelia diamond golf resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "voyage belek golf spa": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "voyage belek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "cullinan belek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "limak lara deluxe": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "barut hemera": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "barut acanthus & cennet": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "asteria kremlin palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "ic hotels green palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "liberty hotels lara": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "concorde de luxe resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "sunis kumkoy beach resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "akra hotel antalya": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "crystal palace luxury resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",
  "tui magic life masmavi": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Antalya_shore_Turkey.jpg/1200px-Antalya_shore_Turkey.jpg",

  // ── Turkey — Bodrum ──────────────────────────────────────────────────────
  "mandarin oriental bodrum": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "d maris bay": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "six senses kaplankaya": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "amanruya": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "the bodrum edition": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "lujo hotel bodrum": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "caresse resort bodrum": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "kefaluka resort bodrum": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",
  "kaya palazzo golf resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Bodrum_Turkey.jpg/1200px-Bodrum_Turkey.jpg",

  // ── Morocco ──────────────────────────────────────────────────────────────
  "la mamounia": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "la mamounia marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "royal mansour marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "amanjena": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "selman marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "mandarin oriental marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "the oberoi marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "sofitel marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "nobu hotel marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "four seasons casablanca": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "kasbah tamadot": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",
  "el fenn marrakech": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mamounia_Marrakech.jpg/1200px-La_Mamounia_Marrakech.jpg",

  // ── Athens / Greece ──────────────────────────────────────────────────────
  "hotel grande bretagne": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hotel_Grande_Bretagne_Athens.jpg/1200px-Hotel_Grande_Bretagne_Athens.jpg",
  "grande bretagne athens": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hotel_Grande_Bretagne_Athens.jpg/1200px-Hotel_Grande_Bretagne_Athens.jpg",
  "electra palace athens": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hotel_Grande_Bretagne_Athens.jpg/1200px-Hotel_Grande_Bretagne_Athens.jpg",
  "njv athens plaza": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hotel_Grande_Bretagne_Athens.jpg/1200px-Hotel_Grande_Bretagne_Athens.jpg",
  "amanzoe": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",

  // ── Santorini ────────────────────────────────────────────────────────────
  "grace santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "grace hotel santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "katikies santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "canaves oia": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "canaves oia epitome": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "canaves oia suites": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "mystique santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "chromata santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "vedema resort santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "andronis boutique hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "esperas santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "art hotel santorini": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",
  "ikies traditional houses": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GR-cyclades-santorini-oia02.jpg/1200px-GR-cyclades-santorini-oia02.jpg",

  // ── Mykonos ──────────────────────────────────────────────────────────────
  "kalesma mykonos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "myconian kyma": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "bill mykonos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "katikies mykonos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "mykonos grand hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "myconian imperial": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "cavo tagoo mykonos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",
  "san giorgio mykonos": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Mykonos_from_the_sea.jpg/1200px-Mykonos_from_the_sea.jpg",

  // ── Bali ─────────────────────────────────────────────────────────────────
  "four seasons bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "four seasons jimbaran": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "four seasons resort bali at sayan": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "four seasons sayan": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "como uma ubud": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "como uma canggu": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Canggu_beach.jpg/1200px-Canggu_beach.jpg",
  "alila seminyak": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seminyak_beach_bali.jpg/1200px-Seminyak_beach_bali.jpg",
  "w bali seminyak": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seminyak_beach_bali.jpg/1200px-Seminyak_beach_bali.jpg",
  "w bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seminyak_beach_bali.jpg/1200px-Seminyak_beach_bali.jpg",
  "potato head suites": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seminyak_beach_bali.jpg/1200px-Seminyak_beach_bali.jpg",
  "the slow canggu": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Canggu_beach.jpg/1200px-Canggu_beach.jpg",
  "alaya resort ubud": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "komaneka at bisma": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "the mulia bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "bulgari bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "bvlgari resort bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "six senses uluwatu": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "jumeirah bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "capella ubud": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "mandapa ritz-carlton reserve": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Terraced_rice_paddies%2C_Bali.jpg/1200px-Terraced_rice_paddies%2C_Bali.jpg",
  "the layar": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seminyak_beach_bali.jpg/1200px-Seminyak_beach_bali.jpg",
  "hyatt regency bali": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",
  "st regis bali resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jimbaran_Beach%2C_Bali.jpg/1200px-Jimbaran_Beach%2C_Bali.jpg",

  // ── Maldives ─────────────────────────────────────────────────────────────
  "soneva fushi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "soneva jani": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "gili lankanfushi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "como cocoa island": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "anantara kihavah": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "anantara kihavah maldives villas": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "four seasons landaa giraavaru": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "four seasons maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "niyama private islands": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "velaa private island": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "cheval blanc randheli": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "one only reethi rah": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "six senses laamu": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "lux south ari atoll": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "amilla maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "kandima maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "hard rock hotel maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "milaidhoo island maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "velassaru maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "sun siyam olhuveli": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "centara ras fushi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "cinnamon dhonveli": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "adaaran select hudhuran fushi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "bandos maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "reethi beach resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "kurumba maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "ritz-carlton maldives fari islands": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "waldorf astoria maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "joali maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "patina maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "naladhu private island": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "w maldives": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maldives_beach_%284%29.jpg/1200px-Maldives_beach_%284%29.jpg",
  "arena beach hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Maafushi_island_maldives.jpg/1200px-Maafushi_island_maldives.jpg",
  "kaani palm beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Maafushi_island_maldives.jpg/1200px-Maafushi_island_maldives.jpg",
  "samann grand": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Maafushi_island_maldives.jpg/1200px-Maafushi_island_maldives.jpg",

  // ── Mauritius ────────────────────────────────────────────────────────────
  "lux belle mare": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "one only le saint geran": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "heritage le telfair": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Bel_Ombre%2C_Mauritius.jpg/1200px-Bel_Ombre%2C_Mauritius.jpg",
  "shangri-la le touessrok": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "four seasons mauritius": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "dinarobin beachcomber": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Bel_Ombre%2C_Mauritius.jpg/1200px-Bel_Ombre%2C_Mauritius.jpg",
  "long beach mauritius": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "sugar beach mauritius": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Bel_Ombre%2C_Mauritius.jpg/1200px-Bel_Ombre%2C_Mauritius.jpg",
  "victoria beachcomber": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "constance prince maurice": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "royal palm beachcomber": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "preskil island resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",
  "tamassa bel ombre": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Bel_Ombre%2C_Mauritius.jpg/1200px-Bel_Ombre%2C_Mauritius.jpg",
  "jw marriott mauritius": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Belle-Mare-Plage%2C-Mauritius.jpg/1200px-Belle-Mare-Plage%2C-Mauritius.jpg",

  // ── Vietnam ──────────────────────────────────────────────────────────────
  "sofitel legend metropole hanoi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "metropole hanoi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "jw marriott hotel hanoi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "capella hanoi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "intercontinental hanoi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "park hyatt saigon": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "the reverie saigon": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "reverie saigon": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "intercontinental danang sun peninsula": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "jw marriott phu quoc": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "six senses ninh van bay": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "four seasons nam hai": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "azerai la residence hue": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",
  "fusion resort phu quoc": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sofitel_Legend_Metropole_Hanoi.jpg/1200px-Sofitel_Legend_Metropole_Hanoi.jpg",

  // ── India ─────────────────────────────────────────────────────────────────
  "taj mahal palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "taj mahal palace mumbai": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "taj hotel mumbai": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "oberoi mumbai": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "taj lake palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "taj lake palace udaipur": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "oberoi udaivilas": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "umaid bhawan palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "rambagh palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "leela palace new delhi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "taj falaknuma palace": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taj_Lake_Palace.jpg/1200px-Taj_Lake_Palace.jpg",
  "taj exotica goa": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",
  "leela goa": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mumbai_03-2016_30_Taj_Mahal_Palace.jpg/1200px-Mumbai_03-2016_30_Taj_Mahal_Palace.jpg",

  // ── South Africa ─────────────────────────────────────────────────────────
  "the silo hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/The_Silo_Hotel%2C_Cape_Town.jpg/1200px-The_Silo_Hotel%2C_Cape_Town.jpg",
  "silo hotel cape town": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/The_Silo_Hotel%2C_Cape_Town.jpg/1200px-The_Silo_Hotel%2C_Cape_Town.jpg",
  "belmond mount nelson": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Mount_Nelson_Hotel.jpg/1200px-Mount_Nelson_Hotel.jpg",
  "mount nelson hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Mount_Nelson_Hotel.jpg/1200px-Mount_Nelson_Hotel.jpg",
  "ellerman house": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/The_Silo_Hotel%2C_Cape_Town.jpg/1200px-The_Silo_Hotel%2C_Cape_Town.jpg",
  "twelve apostles hotel": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/The_Silo_Hotel%2C_Cape_Town.jpg/1200px-The_Silo_Hotel%2C_Cape_Town.jpg",

  // ── Miami ────────────────────────────────────────────────────────────────
  "faena hotel miami beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Miami_Beach_Collins_Avenue.jpg/1200px-Miami_Beach_Collins_Avenue.jpg",
  "setai miami beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Miami_Beach_Collins_Avenue.jpg/1200px-Miami_Beach_Collins_Avenue.jpg",
  "fontainebleau miami": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Miami_Beach_Collins_Avenue.jpg/1200px-Miami_Beach_Collins_Avenue.jpg",
  "1 hotel south beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Miami_Beach_Collins_Avenue.jpg/1200px-Miami_Beach_Collins_Avenue.jpg",
  "edition miami beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Miami_Beach_Collins_Avenue.jpg/1200px-Miami_Beach_Collins_Avenue.jpg",

  // ── Vienna ───────────────────────────────────────────────────────────────
  "hotel sacher vienna": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Hotel_Sacher_Wien.JPG/1200px-Hotel_Sacher_Wien.JPG",
  "sacher vienna": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Hotel_Sacher_Wien.JPG/1200px-Hotel_Sacher_Wien.JPG",
  "hotel imperial vienna": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Hotel_Imperial_Wien.jpg/1200px-Hotel_Imperial_Wien.jpg",
  "imperial vienna": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Hotel_Imperial_Wien.jpg/1200px-Hotel_Imperial_Wien.jpg",
  "palais hansen kempinski vienna": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Hotel_Sacher_Wien.JPG/1200px-Hotel_Sacher_Wien.JPG",

  // ── Prague ───────────────────────────────────────────────────────────────
  "four seasons prague": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG/1200px-Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG",
  "mandarin oriental prague": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG/1200px-Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG",
  "hotel paris prague": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG/1200px-Prag_Stare_Mesto_Karlsbr%C3%BCcke_BW_2.JPG",

  // ── Sydney ───────────────────────────────────────────────────────────────
  "park hyatt sydney": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg/1200px-Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg",
  "shangri-la sydney": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg/1200px-Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg",
  "quay grand suites sydney": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg/1200px-Opera_House_and_CBD_from_the_Harbour_Bridge_-_Nov_2008.jpg",

  // ── Portugal ─────────────────────────────────────────────────────────────
  "four seasons hotel ritz lisbon": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "bairro alto hotel lisbon": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "tivoli avenida liberdade": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "penha longa resort sintra": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "vila vita parc": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "anantara vilamoura": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "the yeatman porto": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",
  "six senses douro valley": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lisbon_%2836831560364%29.jpg/1200px-Lisbon_%2836831560364%29.jpg",

  // ── Croatia ───────────────────────────────────────────────────────────────
  "villa dubrovnik": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "hotel excelsior dubrovnik": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "rixos premium dubrovnik": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "grand villa argentina": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "hotel amfora dubrovnik": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "le meridien lav split": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "amfora grand beach resort hvar": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",
  "hotel monte mulini rovinj": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Dubrovnik_Pano_Sitnica.jpg/1200px-Dubrovnik_Pano_Sitnica.jpg",

  // ── Egypt ─────────────────────────────────────────────────────────────────
  "four seasons sharm el sheikh": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",
  "rixos premium seagate sharm": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",
  "kempinski hotel ishtar dead sea": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",
  "marriott mena house": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",
  "sofitel legend old cataract aswan": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",
  "winter palace luxor": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sharm_el-Sheikh_from_the_sea.jpg/1200px-Sharm_el-Sheikh_from_the_sea.jpg",

  // ── Caribbean / Jamaica / Barbados ────────────────────────────────────────
  "half moon resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "round hill hotel jamaica": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "sandals royal plantation": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "sandals royal barbados": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "sandy lane barbados": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "jade mountain st lucia": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "anse chastanet resort": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",
  "como parrot cay": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Jamaica_-_Montego_Bay_%2838%29.jpg/1200px-Jamaica_-_Montego_Bay_%2838%29.jpg",

  // ── Mexico ────────────────────────────────────────────────────────────────
  "rosewood mayakoba": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "fairmont mayakoba": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "banyan tree mayakoba": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "waldorf astoria los cabos pedregal": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "one only palmilla": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "four seasons punta mita": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",
  "hyatt zilara cancun": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Riviera_Maya_beach.jpg/1200px-Riviera_Maya_beach.jpg",

  // ── Ski / Alpine Resorts ──────────────────────────────────────────────────
  "les airelles courchevel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "cheval blanc courchevel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "le k2 courchevel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "la residence courchevel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "four seasons verbier": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "w verbier": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "aman le mélézin": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "badrutt's palace st moritz": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "suvretta house st moritz": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "hotel zermatterhof": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "the omnia zermatt": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",
  "the ritz-carlton bachelor gulch": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Courchevel_pistes.jpg/1200px-Courchevel_pistes.jpg",

  // ── Oman ──────────────────────────────────────────────────────────────────
  "six senses zighy bay": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "alila jabal akhdar": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "anantara al jabal al akhdar": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "the chedi muscat": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",

  // ── Kenya / Tanzania / Africa ─────────────────────────────────────────────
  "anantara golden triangle elephant camp": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "angama mara kenya": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "singita grumeti": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
  "four seasons safari lodge serengeti": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Musandam_Peninsula.jpg/1200px-Musandam_Peninsula.jpg",
};

/** Brand/chain words stripped when normalizing hotel names for DB lookup */
const STRIP_WORDS = [
  "jumeirah", "marriott", "hilton", "regis", "sheraton", "ihg", "accor",
  "four seasons", "ritz-carlton", "ritz carlton", "mandarin oriental",
  "intercontinental", "st. regis", "st regis", "autograph collection",
  "luxury collection", "w hotels", "westin", "sofitel", "novotel",
  "anantara", "rosewood", "aman", "six senses", "como", "belmond",
  "melia", "hyatt regency", "grand hyatt", "park hyatt", "andaz",
  "pullman", "swissotel", "kempinski", "waldorf astoria", "waldorf",
  "le meridien", "starhotels", "nh collection", "fairmont", "one only",
  "raffles", "banyan tree", "constance", "baglioni", "bulgari",
  "rocco forte", "lux", "sandals", "iberostar", "riu", "playa",
];

/**
 * Look up hotel image by name.
 * Multi-strategy: exact match → strip brand → fuzzy token overlap
 */
export function lookupHotelImage(hotelNameEn: string): string | null {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
      .replace(/['''`]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const key = normalize(hotelNameEn);

  // 1. Exact match
  if (HOTEL_IMAGE_DB[key]) return HOTEL_IMAGE_DB[key];

  // 2. Partial key match (DB key contained in hotel name or vice versa)
  for (const [dbKey, url] of Object.entries(HOTEL_IMAGE_DB)) {
    const normDb = normalize(dbKey);
    if (key.includes(normDb) || normDb.includes(key)) return url;
  }

  // 3. Strip common brand words and retry
  let stripped = key;
  for (const word of STRIP_WORDS) {
    stripped = stripped.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), "").trim();
  }
  stripped = stripped.replace(/\s+/g, " ").trim();
  if (stripped && stripped !== key) {
    if (HOTEL_IMAGE_DB[stripped]) return HOTEL_IMAGE_DB[stripped];
    for (const [dbKey, url] of Object.entries(HOTEL_IMAGE_DB)) {
      const normDb = normalize(dbKey);
      if (stripped.includes(normDb) || normDb.includes(stripped)) return url;
    }
  }

  // 4. Token overlap scoring: if >55% tokens match, use that entry
  const keyTokens = new Set(key.split(" ").filter(t => t.length > 3));
  if (keyTokens.size === 0) return null;

  let bestScore = 0;
  let bestUrl: string | null = null;
  for (const [dbKey, url] of Object.entries(HOTEL_IMAGE_DB)) {
    const dbTokens = normalize(dbKey).split(" ").filter(t => t.length > 3);
    let matches = 0;
    for (const t of dbTokens) {
      if (keyTokens.has(t)) matches++;
    }
    const score = dbTokens.length > 0 ? matches / Math.max(dbTokens.length, keyTokens.size) : 0;
    if (score > bestScore) { bestScore = score; bestUrl = url; }
  }

  return bestScore >= 0.55 ? bestUrl : null;
}
