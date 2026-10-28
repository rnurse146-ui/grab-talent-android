// Display label for a talent category value. Keeps existing records working:
// 'photographer' now reads as the combined Photography / Filmmaker option.
export function categoryLabel(category) {
  if (!category) return '';
  if (category === 'photographer') return 'photography / filmmaker';
  if (category === 'dancer') return 'dancer / fire dancer';
  if (category === 'fortune_teller') return 'fortune teller / psychic';
  if (category === 'mixing_mastering_engineer') return 'mixing & mastering engineer';
  if (category === 'bagpiper') return 'bagpiper';
  return category.replace(/_/g, ' ');
}