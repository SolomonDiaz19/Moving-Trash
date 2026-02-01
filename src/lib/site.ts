export const site = {
  name: "BBA Waste Hauling Services",
  phoneDisplay: "(469) 716-3877",
  phoneHref: "tel:+14697163877",
  serviceArea: "Dallas–Fort Worth Metroplex",
  promo: "Veterans, Seniors & Teacher Discounts",

  rental: {
    includedDays: 7,
    extraDayFee: 10,
    hours: { earliest: "7:00 AM", latest: "4:30 PM" },
    sameDayCutoff: "8:00 AM",
  },

  inventory: {
    "20 Yard": 1,
    "30 Yard": 2,
    "40 Yard": 2,
  },

  dimensions: {
    "20 Yard": `22' x 8' x 4'5"`,
    "30 Yard": `22' x 8' x 6'`,
    "40 Yard": `22' x 8' x 8'`,
  },

  featuredSizes: ["20 Yard", "30 Yard", "40 Yard"] as const,
};
