/* Bangladesh reference data + phone rules (Phase 7).
   Divisions and their districts — the standard 8 divisions / 64 districts. */

export const divisions: Record<string, string[]> = {
  Dhaka: [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Kishoreganj", "Manikganj",
    "Munshiganj", "Narsingdi", "Rajbari", "Faridpur", "Gopalganj", "Madaripur",
    "Shariatpur",
  ],
  Chattogram: [
    "Chattogram", "Cox's Bazar", "Cumilla", "Brahmanbaria", "Chandpur", "Feni",
    "Lakshmipur", "Noakhali", "Rangamati", "Khagrachhari", "Bandarban",
  ],
  Khulna: [
    "Khulna", "Jashore", "Satkhira", "Bagerhat", "Kushtia", "Chuadanga",
    "Jhenaidah", "Magura", "Meherpur", "Narail",
  ],
  Rajshahi: [
    "Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Naogaon",
    "Chapainawabganj", "Joypurhat",
  ],
  Barishal: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Jhalokati", "Barguna"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: [
    "Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Thakurgaon",
  ],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

export const divisionNames = Object.keys(divisions);

export type DeliveryZone = "inside" | "outside";

/* Normalise a Bangladeshi mobile number to canonical +8801XXXXXXXXX.
   Accepts 01XXXXXXXXX, 8801XXXXXXXXX and +8801XXXXXXXXX (spaces/dashes
   ignored). Valid operator prefixes are 013–019. Returns null when invalid. */
export function normalizeBDPhone(raw: string): string | null {
  const d = raw.replace(/[\s\-()]/g, "");
  const m = d.match(/^(?:\+?880|0)(1[3-9]\d{8})$/);
  return m ? `+880${m[1]}` : null;
}

export const PHONE_ERROR =
  "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";
