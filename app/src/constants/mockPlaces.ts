export interface MockPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  types: string[];
  addressComponents?: {
    route?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

// Base location: São Paulo, Brazil (approximate user location)
const BASE_LAT = -23.5505;
const BASE_LNG = -46.6333;

export const MOCK_PLACES: MockPlace[] = [
  {
    id: "mock_1",
    name: "Padaria Pão Quente",
    address: "Rua das Flores, 100 - Centro, São Paulo/SP",
    lat: BASE_LAT + 0.002,
    lng: BASE_LNG + 0.003,
    phone: "(11) 3456-7890",
    types: ["bakery", "food"],
    addressComponents: {
      route: "Rua das Flores",
      streetNumber: "100",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01010-000",
    },
  },
  {
    id: "mock_2",
    name: "Farmácia Popular",
    address: "Av. Brasil, 200 - Centro, São Paulo/SP",
    lat: BASE_LAT - 0.001,
    lng: BASE_LNG + 0.002,
    phone: "(11) 3456-7891",
    types: ["pharmacy", "health"],
    addressComponents: {
      route: "Av. Brasil",
      streetNumber: "200",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01020-000",
    },
  },
  {
    id: "mock_3",
    name: "Restaurante Sabor Caseiro",
    address: "Rua do Comércio, 300 - Vila Nova, São Paulo/SP",
    lat: BASE_LAT + 0.003,
    lng: BASE_LNG - 0.001,
    phone: "(11) 3456-7892",
    types: ["restaurant", "food"],
    addressComponents: {
      route: "Rua do Comércio",
      streetNumber: "300",
      neighborhood: "Vila Nova",
      city: "São Paulo",
      state: "SP",
      postalCode: "01030-000",
    },
  },
  {
    id: "mock_4",
    name: "Mercado Bom Preço",
    address: "Av. Paulista, 400 - Bela Vista, São Paulo/SP",
    lat: BASE_LAT - 0.002,
    lng: BASE_LNG - 0.002,
    phone: "(11) 3456-7893",
    types: ["supermarket", "grocery"],
    addressComponents: {
      route: "Av. Paulista",
      streetNumber: "400",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      postalCode: "01310-100",
    },
  },
  {
    id: "mock_5",
    name: "Loja de Roupas Fashion",
    address: "Rua Augusta, 500 - Consolação, São Paulo/SP",
    lat: BASE_LAT + 0.001,
    lng: BASE_LNG + 0.004,
    phone: "(11) 3456-7894",
    types: ["clothing_store", "retail"],
    addressComponents: {
      route: "Rua Augusta",
      streetNumber: "500",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      postalCode: "01304-001",
    },
  },
  {
    id: "mock_6",
    name: "Pet Shop Animal Feliz",
    address: "Rua dos Animais, 150 - Pinheiros, São Paulo/SP",
    lat: BASE_LAT - 0.003,
    lng: BASE_LNG + 0.001,
    phone: "(11) 3456-7895",
    types: ["pet_store", "retail"],
    addressComponents: {
      route: "Rua dos Animais",
      streetNumber: "150",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      postalCode: "05422-000",
    },
  },
  {
    id: "mock_7",
    name: "Academia Fit Life",
    address: "Av. Rebouças, 250 - Pinheiros, São Paulo/SP",
    lat: BASE_LAT + 0.004,
    lng: BASE_LNG + 0.002,
    phone: "(11) 3456-7896",
    types: ["gym", "health"],
    addressComponents: {
      route: "Av. Rebouças",
      streetNumber: "250",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      postalCode: "05401-300",
    },
  },
  {
    id: "mock_8",
    name: "Salão de Beleza Glamour",
    address: "Rua Oscar Freire, 350 - Jardins, São Paulo/SP",
    lat: BASE_LAT - 0.001,
    lng: BASE_LNG - 0.003,
    phone: "(11) 3456-7897",
    types: ["beauty_salon", "service"],
    addressComponents: {
      route: "Rua Oscar Freire",
      streetNumber: "350",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      postalCode: "01426-001",
    },
  },
  {
    id: "mock_9",
    name: "Livraria Cultura",
    address: "Av. Paulista, 450 - Bela Vista, São Paulo/SP",
    lat: BASE_LAT + 0.002,
    lng: BASE_LNG - 0.002,
    phone: "(11) 3456-7898",
    types: ["book_store", "retail"],
    addressComponents: {
      route: "Av. Paulista",
      streetNumber: "450",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      postalCode: "01310-100",
    },
  },
  {
    id: "mock_10",
    name: "Oficina Mecânica Auto Tech",
    address: "Rua dos Mecânicos, 550 - Mooca, São Paulo/SP",
    lat: BASE_LAT - 0.004,
    lng: BASE_LNG + 0.003,
    phone: "(11) 3456-7899",
    types: ["car_repair", "service"],
    addressComponents: {
      route: "Rua dos Mecânicos",
      streetNumber: "550",
      neighborhood: "Mooca",
      city: "São Paulo",
      state: "SP",
      postalCode: "03104-000",
    },
  },
  {
    id: "mock_11",
    name: "Clínica Odontológica Sorriso",
    address: "Rua da Saúde, 120 - Liberdade, São Paulo/SP",
    lat: BASE_LAT + 0.001,
    lng: BASE_LNG - 0.004,
    phone: "(11) 3456-7800",
    types: ["dentist", "health"],
    addressComponents: {
      route: "Rua da Saúde",
      streetNumber: "120",
      neighborhood: "Liberdade",
      city: "São Paulo",
      state: "SP",
      postalCode: "01503-000",
    },
  },
  {
    id: "mock_12",
    name: "Lanchonete Fast Food",
    address: "Av. Santo Amaro, 220 - Brooklin, São Paulo/SP",
    lat: BASE_LAT - 0.002,
    lng: BASE_LNG + 0.004,
    phone: "(11) 3456-7801",
    types: ["restaurant", "fast_food"],
    addressComponents: {
      route: "Av. Santo Amaro",
      streetNumber: "220",
      neighborhood: "Brooklin",
      city: "São Paulo",
      state: "SP",
      postalCode: "04556-000",
    },
  },
  {
    id: "mock_13",
    name: "Ótica Visual",
    address: "Rua 25 de Março, 320 - Centro, São Paulo/SP",
    lat: BASE_LAT + 0.003,
    lng: BASE_LNG + 0.001,
    phone: "(11) 3456-7802",
    types: ["optician", "health"],
    addressComponents: {
      route: "Rua 25 de Março",
      streetNumber: "320",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01021-000",
    },
  },
  {
    id: "mock_14",
    name: "Papelaria Escolar",
    address: "Rua dos Estudantes, 420 - Moema, São Paulo/SP",
    lat: BASE_LAT - 0.003,
    lng: BASE_LNG - 0.001,
    phone: "(11) 3456-7803",
    types: ["stationery", "retail"],
    addressComponents: {
      route: "Rua dos Estudantes",
      streetNumber: "420",
      neighborhood: "Moema",
      city: "São Paulo",
      state: "SP",
      postalCode: "04077-000",
    },
  },
  {
    id: "mock_15",
    name: "Barbearia Corte Fino",
    address: "Rua dos Barbeiros, 180 - Vila Mariana, São Paulo/SP",
    lat: BASE_LAT + 0.002,
    lng: BASE_LNG + 0.002,
    phone: "(11) 3456-7804",
    types: ["barber", "service"],
    addressComponents: {
      route: "Rua dos Barbeiros",
      streetNumber: "180",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      state: "SP",
      postalCode: "04101-000",
    },
  },
];

export function searchMockPlaces(query: string): MockPlace[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return MOCK_PLACES.filter((place) => {
    const normalizedName = place.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedAddress = place.address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return normalizedName.includes(normalizedQuery) || normalizedAddress.includes(normalizedQuery);
  }).slice(0, 5);
}
