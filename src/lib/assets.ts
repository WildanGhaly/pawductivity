/**
 * Static asset registry. React Native's `require` needs literal paths, so we map the
 * DB's stable asset KEYS to bundled requires here. Lottie JSON + PNG art copied from the
 * legacy app into /assets.
 */
import type { Species } from '../db/types';

// Pet Lottie by species → [default, stage1..stage5]
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

export function petLottieSource(species: Species, stage: number): any {
  const stages = PET_LOTTIE[species] ?? PET_LOTTIE.cat;
  const idx = Math.max(0, Math.min(stages.length - 1, stage));
  return stages[idx];
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
