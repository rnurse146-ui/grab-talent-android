// Display label for a talent category value. Keeps existing records working:
// 'photographer' now reads as the combined Photography / Filmmaker option.
export function categoryLabel(category) {
  if (!category) return '';
  if (category === 'photographer') return 'photography / filmmaker';
  return category.replace(/_/g, ' ');
}