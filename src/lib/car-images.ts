// Car image URL generation and mapping service
// Comprehensive car image mapping for popular Indian car models
const carImageMapping: Record<string, Record<string, string[]>> = {
  "maruti suzuki": {
    "alto k10": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/127563/alto-k10-exterior-right-front-three-quarter-58.jpeg",
      "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Alto-K10/8707/1677818358815/front-left-side-47.jpg"
    ],
    "swift": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/134287/swift-exterior-right-front-three-quarter-45.jpeg",
      "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Swift/10671/1697698244103/front-left-side-47.jpg"
    ],
    "baleno": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/baleno-exterior-right-front-three-quarter-5.jpeg"
    ],
    "vitara brezza": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/107543/vitara-brezza-exterior-right-front-three-quarter-7.jpeg"
    ],
    "ertiga": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/ertiga-exterior-right-front-three-quarter-2.jpeg"
    ]
  },
  "hyundai": {
    "creta": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/106815/creta-exterior-right-front-three-quarter-4.jpeg",
      "https://stimg.cardekho.com/images/carexteriorimages/630x420/Hyundai/Creta/10643/1676360321558/front-left-side-47.jpg"
    ],
    "i20": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/134287/i20-exterior-right-front-three-quarter-45.jpeg"
    ],
    "venue": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/102663/venue-exterior-right-front-three-quarter-2.jpeg"
    ],
    "verna": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/141563/verna-exterior-right-front-three-quarter-7.jpeg"
    ]
  },
  "tata": {
    "nexon": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/141867/nexon-exterior-right-front-three-quarter-32.jpeg"
    ],
    "harrier": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/139665/harrier-exterior-right-front-three-quarter-11.jpeg"
    ],
    "safari": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/safari-exterior-right-front-three-quarter-2.jpeg"
    ],
    "punch": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/130583/punch-exterior-right-front-three-quarter-109.jpeg"
    ]
  },
  "mahindra": {
    "xuv700": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/xuv700-exterior-right-front-three-quarter-2.jpeg"
    ],
    "scorpio": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/130583/scorpio-n-exterior-right-front-three-quarter-109.jpeg"
    ],
    "xuv300": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/106815/xuv300-exterior-right-front-three-quarter-4.jpeg"
    ]
  },
  "kia": {
    "seltos": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/134287/seltos-exterior-right-front-three-quarter-45.jpeg"
    ],
    "sonet": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/sonet-exterior-right-front-three-quarter-2.jpeg"
    ],
    "carens": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/134287/carens-exterior-right-front-three-quarter-45.jpeg"
    ]
  },
  "toyota": {
    "fortuner": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/fortuner-exterior-right-front-three-quarter-2.jpeg"
    ],
    "innova crysta": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/innova-crysta-exterior-right-front-three-quarter-2.jpeg"
    ],
    "glanza": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/glanza-exterior-right-front-three-quarter-2.jpeg"
    ]
  },
  "honda": {
    "city": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/134287/city-exterior-right-front-three-quarter-45.jpeg"
    ],
    "amaze": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/amaze-exterior-right-front-three-quarter-2.jpeg"
    ],
    "wr-v": [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115777/wr-v-exterior-right-front-three-quarter-2.jpeg"
    ]
  }
};

export function generateCarImageUrls(brand?: string, model?: string): string[] {
  if (!brand || !model) {
    return ["/api/placeholder/400/300"];
  }

  const normalizedBrand = brand.toLowerCase().trim();
  const normalizedModel = model.toLowerCase().trim();

  // Try exact match first
  const brandImages = carImageMapping[normalizedBrand];
  if (brandImages && brandImages[normalizedModel]) {
    return brandImages[normalizedModel];
  }

  // Try partial model match (for variants)
  if (brandImages) {
    for (const [mappedModel, images] of Object.entries(brandImages)) {
      if (normalizedModel.includes(mappedModel) || mappedModel.includes(normalizedModel)) {
        return images;
      }
    }
  }

  // Generic CDN URL generation as fallback
  const brandModelSlug = `${normalizedBrand}-${normalizedModel}`.replace(/\s+/g, '-');
  
  return [
    `https://imgd.aeplcdn.com/1920x1080/n/cw/ec/130583/${brandModelSlug}-exterior-right-front-three-quarter.jpeg`,
    `https://stimg.cardekho.com/images/carexteriorimages/630x420/${brand}/${model}/front-left-side-47.jpg`,
    "/api/placeholder/400/300"
  ];
}

export function getCarImageWithFallback(brand: string, model: string, index: number = 0): string {
  const images = generateCarImageUrls(brand, model);
  return images[index] || images[0] || "/api/placeholder/400/300";
}

// Preload critical car images for better performance
export function preloadCarImages(cars: Array<{ brand: string; model: string }>) {
  if (typeof window !== 'undefined') {
    cars.slice(0, 4).forEach(car => {
      const imageUrl = getCarImageWithFallback(car.brand, car.model);
      if (imageUrl && !imageUrl.includes('placeholder')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        document.head.appendChild(link);
      }
    });
  }
}
