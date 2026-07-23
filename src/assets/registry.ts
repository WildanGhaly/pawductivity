// Static asset registry. RN requires literal require() calls, so every asset is
// enumerated here and referenced by logical name elsewhere. Maps the prototype's
// logical names (ASSETS in the HTML) onto the repo's actual (legacy) filenames.

export const img = {
  // currency / ui
  coin: require('../../assets/coin.png'),
  lock: require('../../assets/lock.png'),
  potion: require('../../assets/potion.png'),
  shop: require('../../assets/shop-icon.png'),
  food: require('../../assets/food.png'),
  wardrobe: require('../../assets/wardrobe.png'),
  petIcon: require('../../assets/pet.png'),
  // brand
  logo: require('../../assets/icon/logo-paw.png'),
  logoGlow: require('../../assets/images/logo-glow.png'),
  // food (legacy indonesian filenames)
  apple: require('../../assets/food/apel.png'),
  chicken: require('../../assets/food/ayam.png'),
  pizza: require('../../assets/food/pizza.png'),
  watermelon: require('../../assets/food/semangka.png'),
  carrot: require('../../assets/food/wortel.png'),
  // clothes (id order = catalog order; legacy filenames)
  c1: require('../../assets/clothes/shirt.png'), // Cyan T-shirt
  c2: require('../../assets/clothes/polo_shirt.png'), // Green Shirt
  c3: require('../../assets/clothes/suit.png'), // Tuxedo
  c4: require('../../assets/clothes/emo_shirt.png'), // Star Shirt
  c5: require('../../assets/clothes/dress.png'), // Pink Dress
  // pet thumbnails
  catThumb: require('../../assets/pet/cat.png'),
  dogThumb: require('../../assets/pet/dog.png'),
  rabbitThumb: require('../../assets/pet/rabbit.png'),
  // backgrounds / rooms
  room1: require('../../assets/pet/pet_home.png'), // Cozy room
  room2: require('../../assets/background.png'), // Meadow
  referralBg: require('../../assets/referral_background.png'),
  // nav icons
  navHome: require('../../assets/nav/home.png'),
  navQuests: require('../../assets/nav/todo.png'),
  navPet: require('../../assets/nav/paw.png'),
  navCal: require('../../assets/nav/calender.png'),
  navProfile: require('../../assets/nav/profil.png'),
  navLine: require('../../assets/nav/line.png'),
} as const;

// profile avatars 0..6
export const avatars = [
  require('../../assets/profile/0.png'),
  require('../../assets/profile/1.png'),
  require('../../assets/profile/2.png'),
  require('../../assets/profile/3.png'),
  require('../../assets/profile/4.png'),
  require('../../assets/profile/5.png'),
  require('../../assets/profile/6.png'),
];

// food images by catalog id
export const foodImg: Record<number, any> = {
  1: img.apple,
  2: img.chicken,
  3: img.pizza,
  4: img.watermelon,
  5: img.carrot,
};

// clothes images by catalog id
export const clothesImg: Record<number, any> = {
  1: img.c1,
  2: img.c2,
  3: img.c3,
  4: img.c4,
  5: img.c5,
};

export const speciesThumb: Record<string, any> = {
  dog: img.dogThumb,
  cat: img.catThumb,
  rabbit: img.rabbitThumb,
};

// Lottie pet animations: [species][key] where key = 'default' | '1'..'5' (worn clothes)
export const lottiePet: Record<string, Record<string, any>> = {
  cat: {
    default: require('../../assets/pet/cat/cat_default.json'),
    '1': require('../../assets/pet/cat/cat_1.json'),
    '2': require('../../assets/pet/cat/cat_2.json'),
    '3': require('../../assets/pet/cat/cat_3.json'),
    '4': require('../../assets/pet/cat/cat_4.json'),
    '5': require('../../assets/pet/cat/cat_5.json'),
  },
  dog: {
    default: require('../../assets/pet/dog/dog_default.json'),
    '1': require('../../assets/pet/dog/dog_1.json'),
    '2': require('../../assets/pet/dog/dog_2.json'),
    '3': require('../../assets/pet/dog/dog_3.json'),
    '4': require('../../assets/pet/dog/dog_4.json'),
    '5': require('../../assets/pet/dog/dog_5.json'),
  },
  rabbit: {
    default: require('../../assets/pet/rabbit/rabbit_default.json'),
    '1': require('../../assets/pet/rabbit/rabbit_1.json'),
    '2': require('../../assets/pet/rabbit/rabbit_2.json'),
    '3': require('../../assets/pet/rabbit/rabbit_3.json'),
    '4': require('../../assets/pet/rabbit/rabbit_4.json'),
    '5': require('../../assets/pet/rabbit/rabbit_5.json'),
  },
};

export const fonts = {
  'Poppins-Regular': require('../../assets/Poppins-Regular.ttf'),
  'Poppins-Bold': require('../../assets/Poppins-Bold.ttf'),
};
