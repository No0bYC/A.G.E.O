// Coordonnées approximatives des principales villes/villages de Maurice,
// utilisées pour estimer la distance entre le logement et une activité
// quand le logement n'a pas encore de coordonnées précises enregistrées.
// (Île Maurice fait ~65km x 45km : une estimation à vol d'oiseau + une
// vitesse moyenne routière donne une distance/durée réaliste pour un guide.)
export const MAURITIUS_TOWNS = {
  "port louis": { lat: -20.1609, lng: 57.5012 },
  "beau bassin": { lat: -20.2371, lng: 57.4675 },
  "rose hill": { lat: -20.2371, lng: 57.4675 },
  "quatre bornes": { lat: -20.2650, lng: 57.4791 },
  "vacoas": { lat: -20.2986, lng: 57.4783 },
  "phoenix": { lat: -20.2986, lng: 57.5030 },
  "curepipe": { lat: -20.3155, lng: 57.5261 },
  "floreal": { lat: -20.2833, lng: 57.4917 },
  "moka": { lat: -20.2144, lng: 57.4917 },
  "ebene": { lat: -20.2450, lng: 57.4890 },
  "pamplemousses": { lat: -20.1050, lng: 57.5700 },
  "grand baie": { lat: -20.0182, lng: 57.5802 },
  "pereybere": { lat: -20.0060, lng: 57.5850 },
  "trou aux biches": { lat: -20.0333, lng: 57.5500 },
  "mont choisy": { lat: -20.0333, lng: 57.5583 },
  "cap malheureux": { lat: -19.9833, lng: 57.6133 },
  "grand gaube": { lat: -20.0060, lng: 57.6600 },
  "goodlands": { lat: -20.0333, lng: 57.6500 },
  "riviere du rempart": { lat: -20.0980, lng: 57.6560 },
  "triolet": { lat: -20.0500, lng: 57.5570 },
  "pointe aux piments": { lat: -20.0680, lng: 57.5480 },
  "albion": { lat: -20.1900, lng: 57.4033 },
  "flic en flac": { lat: -20.2760, lng: 57.3630 },
  "wolmar": { lat: -20.2900, lng: 57.3540 },
  "tamarin": { lat: -20.3300, lng: 57.3730 },
  "riviere noire": { lat: -20.3630, lng: 57.3720 },
  "black river": { lat: -20.3630, lng: 57.3720 },
  "le morne": { lat: -20.4560, lng: 57.3160 },
  "bambous": { lat: -20.2500, lng: 57.4000 },
  "chamarel": { lat: -20.4360, lng: 57.3810 },
  "chemin grenier": { lat: -20.4980, lng: 57.4590 },
  "souillac": { lat: -20.5170, lng: 57.5220 },
  "surinam": { lat: -20.4920, lng: 57.4990 },
  "bel ombre": { lat: -20.5060, lng: 57.4110 },
  "mahebourg": { lat: -20.4081, lng: 57.7000 },
  "vieux grand port": { lat: -20.3900, lng: 57.7280 },
  "plaine magnien": { lat: -20.4300, lng: 57.6830 },
  "rose belle": { lat: -20.4020, lng: 57.6110 },
  "riviere des anguilles": { lat: -20.4930, lng: 57.5220 },
  "bois cheri": { lat: -20.4200, lng: 57.5420 },
  "belle mare": { lat: -20.2170, lng: 57.7810 },
  "trou d'eau douce": { lat: -20.2380, lng: 57.7930 },
  "poste de flacq": { lat: -20.1750, lng: 57.7280 },
  "centre de flacq": { lat: -20.1930, lng: 57.7170 },
  "flacq": { lat: -20.1930, lng: 57.7170 },
  "quatre cocos": { lat: -20.2530, lng: 57.7960 },
  "roches noires": { lat: -20.1330, lng: 57.7370 },
  "beau champ": { lat: -20.2260, lng: 57.7460 },
};

// Compare une chaîne libre ("Grand Baie", "Grand Baie, Maurice"...) aux clés
// connues et renvoie les coordonnées les plus proches, ou null si rien ne
// correspond raisonnablement.
export function resolveTownCoords(text) {
  if (!text) return null;
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  if (MAURITIUS_TOWNS[normalized]) return MAURITIUS_TOWNS[normalized];
  const firstPart = normalized.split(",")[0].trim();
  if (MAURITIUS_TOWNS[firstPart]) return MAURITIUS_TOWNS[firstPart];
  const match = Object.keys(MAURITIUS_TOWNS).find(
    (key) => normalized.includes(key) || key.includes(firstPart)
  );
  return match ? MAURITIUS_TOWNS[match] : null;
}

// Distance à vol d'oiseau (km) entre deux points.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Coordonnées d'un logement : priorité aux coordonnées précises si elles
// existent, sinon on retombe sur la ville renseignée (météo ou adresse).
export function propertyCoords(property) {
  if (!property) return null;
  if (property.latitude != null && property.longitude != null) {
    return { lat: property.latitude, lng: property.longitude };
  }
  return resolveTownCoords(property.weather_location) || resolveTownCoords(property.address);
}

// Estimation lisible pour l'utilisateur : distance à vol d'oiseau majorée
// de ~30% (routes non-directes) + une vitesse moyenne routière mauricienne
// prudente (~38 km/h, embouteillages et routes sinueuses inclus).
export function estimateDistanceLabel(propertyCoordsObj, activity) {
  if (!propertyCoordsObj || activity.latitude == null || activity.longitude == null) return null;
  const straightKm = haversineKm(propertyCoordsObj.lat, propertyCoordsObj.lng, activity.latitude, activity.longitude);
  const roadKm = straightKm * 1.3;
  const minutes = Math.round((roadKm / 38) * 60);
  const kmLabel = roadKm < 10 ? roadKm.toFixed(1) : Math.round(roadKm).toString();
  const timeLabel = minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`;
  return `~${kmLabel} km du logement (${timeLabel} en voiture env.)`;
}
