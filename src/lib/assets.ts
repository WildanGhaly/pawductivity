/**
 * Static asset registry. React Native's `require` needs literal paths, so we map the
 * DB's stable asset KEYS to bundled requires here. Lottie JSON + PNG art copied from the
 * legacy app into /assets.
 */
import type { Species } from '../db/types';

// Pet Lottie by species → [default, clothes1..clothes5]. The numbered files are the pet
// wearing clothes item N (outfit animated ON the pet), NOT evolution stages.
const PET_LOTTIE: Record<Species, any[]> = {
  cat: [
    require('../../assets/pet/cat/cat_default.json'),
    require('../../assets/pet/cat/cat_1.json'),
    require('../../assets/pet/cat/cat_2.json'),
    require('../../assets/pet/cat/cat_3.json'),
    require('../../assets/pet/cat/cat_4.json'),
    require('../../assets/pet/cat/cat_5.json'),
  ],
  dog: [
    require('../../assets/pet/dog/dog_default.json'),
    require('../../assets/pet/dog/dog_1.json'),
    require('../../assets/pet/dog/dog_2.json'),
    require('../../assets/pet/dog/dog_3.json'),
    require('../../assets/pet/dog/dog_4.json'),
    require('../../assets/pet/dog/dog_5.json'),
  ],
  rabbit: [
    require('../../assets/pet/rabbit/rabbit_default.json'),
    require('../../assets/pet/rabbit/rabbit_1.json'),
    require('../../assets/pet/rabbit/rabbit_2.json'),
    require('../../assets/pet/rabbit/rabbit_3.json'),
    require('../../assets/pet/rabbit/rabbit_4.json'),
    require('../../assets/pet/rabbit/rabbit_5.json'),
  ],
};

/** `clothesId` 0 = no clothes (default animation); 1..5 = pet wearing that clothes item. */
export function petLottieSource(species: Species, clothesId: number): any {
  const variants = PET_LOTTIE[species] ?? PET_LOTTIE.cat;
  const idx = Math.max(0, Math.min(variants.length - 1, clothesId));
  return variants[idx];
}

// Food art (legacy Indonesian filenames)
const FOOD_IMAGE: Record<string, any> = {
  apple: require('../../assets/food/apel.png'),
  chicken: require('../../assets/food/ayam.png'),
  pizza: require('../../assets/food/pizza.png'),
  watermelon: require('../../assets/food/semangka.png'),
  carrot: require('../../assets/food/wortel.png'),
};

export function foodImage(key: string): any {
  return FOOD_IMAGE[key];
}

// Clothes art
const CLOTHES_IMAGE: Record<string, any> = {
  shirt_cyan: require('../../assets/clothes/shirt.png'),
  shirt_green: require('../../assets/clothes/polo_shirt.png'),
  tuxedo: require('../../assets/clothes/suit.png'),
  shirt_star: require('../../assets/clothes/emo_shirt.png'),
  dress_pink: require('../../assets/clothes/dress.png'),
};

export function clothesImage(key: string): any {
  return CLOTHES_IMAGE[key];
}

// Bottom-nav tab icons (legacy nav art)
const NAV_ICON: Record<string, any> = {
  home: require('../../assets/nav/home.png'),
  todo: require('../../assets/nav/todo.png'),
  calendar: require('../../assets/nav/calender.png'),
  paw: require('../../assets/nav/paw.png'),
  profile: require('../../assets/nav/profil.png'),
  line: require('../../assets/nav/line.png'),
};

export function navIcon(key: string): any {
  return NAV_ICON[key];
}

// Species PNGs for the shop / lists (not the animated Lottie)
const PET_IMAGE: Record<Species, any> = {
  cat: require('../../assets/pet/cat.png'),
  dog: require('../../assets/pet/dog.png'),
  rabbit: require('../../assets/pet/rabbit.png'),
};

export function petImage(species: Species): any {
  return PET_IMAGE[species];
}

// Scenery
export const MEADOW_BG = require('../../assets/background.png');
export const PET_HOME_BG = require('../../assets/pet/pet_home.png');

// Profile avatars (legacy assets/profile/0..6.png)
const PROFILE_AVATAR: Record<number, any> = {
  0: require('../../assets/profile/0.png'),
  1: require('../../assets/profile/1.png'),
  2: require('../../assets/profile/2.png'),
  3: require('../../assets/profile/3.png'),
  4: require('../../assets/profile/4.png'),
  5: require('../../assets/profile/5.png'),
  6: require('../../assets/profile/6.png'),
};
export const PROFILE_AVATAR_COUNT = 7;
export function profileAvatar(index: number): any {
  return PROFILE_AVATAR[index] ?? PROFILE_AVATAR[0];
}

// Misc UI icons
const UI_ICON: Record<string, any> = {
  coin: require('../../assets/ui/coin.png'),
  shop: require('../../assets/ui/shop-icon.png'),
  wardrobe: require('../../assets/ui/wardrobe.png'),
  food: require('../../assets/ui/food.png'),
  potion: require('../../assets/ui/potion.png'),
  lock: require('../../assets/ui/lock.png'),
};

export function uiIcon(key: string): any {
  return UI_ICON[key];
}

