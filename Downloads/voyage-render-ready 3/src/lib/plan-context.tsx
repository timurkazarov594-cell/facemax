import React, { createContext, useContext, useState, ReactNode } from 'react';

// Inlined from @workspace/api-client-react so this file has no workspace dependencies
export interface VoyageHotel {
  name: string; rating: number; pricePerNight: string; description: string;
  whyItFits: string; amenities: string[]; imagePrompt: string; location: string;
  hotelUrl: string; imageUrl: string; photosUrl: string; roomType?: string;
  roomsNeeded?: number; nightsCount?: number; hotelTotal?: string;
}
export interface VoyageRestaurant {
  name: string; style: string; averageCheck: string;
  whyItFits: string; location: string; imagePrompt: string;
}
export interface VoyageActivity {
  name: string; duration: string; price: string;
  included: boolean; whyItFits: string; imagePrompt: string;
}
export interface VoyageDayEntry {
  day: number; title: string; morning: string; afternoon: string; evening: string;
}
export interface VoyageBudgetBreakdown {
  hotel: string; food: string; activities: string; transport: string;
  airportTransfer?: string; cityTax?: string; insurance?: string;
  visa?: string; shopping?: string; total: string;
}
export interface VoyagePlanResult {
  destination: string; hotel: VoyageHotel; restaurants: VoyageRestaurant[];
  activities: VoyageActivity[]; dayPlan: VoyageDayEntry[];
  budgetBreakdown: VoyageBudgetBreakdown; explanation: string; costNote?: string;
}

export type Language = "en" | "ru";

interface PlanState {
  language: Language | null;
  destination: string;
  city: string;
  travelLevel: string;
  tripTypes: string[];
  hotelPrefs: string[];
  restaurantPrefs: string[];
  duration: string;
  budget: string;
  guests: string;
  rooms: string;
  roomType: string;
  result: VoyagePlanResult | null;
}

interface PlanContextType extends PlanState {
  setLanguage: (lang: Language) => void;
  setDestination: (dest: string) => void;
  setCity: (city: string) => void;
  setTravelLevel: (level: string) => void;
  setTripTypes: (types: string[]) => void;
  setHotelPrefs: (prefs: string[]) => void;
  setRestaurantPrefs: (prefs: string[]) => void;
  setDuration: (duration: string) => void;
  setBudget: (budget: string) => void;
  setGuests: (guests: string) => void;
  setRooms: (rooms: string) => void;
  setRoomType: (roomType: string) => void;
  setResult: (result: VoyagePlanResult | null) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [destination, setDestination] = useState("");
  const [city, setCity] = useState("");
  const [travelLevel, setTravelLevel] = useState("");
  const [tripTypes, setTripTypes] = useState<string[]>([]);
  const [hotelPrefs, setHotelPrefs] = useState<string[]>([]);
  const [restaurantPrefs, setRestaurantPrefs] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("2");
  const [rooms, setRooms] = useState("1");
  const [roomType, setRoomType] = useState("standard");
  const [result, setResult] = useState<VoyagePlanResult | null>(null);

  return (
    <PlanContext.Provider
      value={{
        language, setLanguage,
        destination, setDestination,
        city, setCity,
        travelLevel, setTravelLevel,
        tripTypes, setTripTypes,
        hotelPrefs, setHotelPrefs,
        restaurantPrefs, setRestaurantPrefs,
        duration, setDuration,
        budget, setBudget,
        guests, setGuests,
        rooms, setRooms,
        roomType, setRoomType,
        result, setResult,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error("usePlanContext must be used within a PlanProvider");
  }
  return context;
}
