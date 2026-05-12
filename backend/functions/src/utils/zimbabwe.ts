export const ZIMBABWE_PROVINCES = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
] as const;

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  'Bulawayo': ['Bulawayo'],
  'Harare': ['Harare', 'Chitungwiza'],
  'Manicaland': ['Mutare', 'Chipinge', 'Makoni', 'Nyanga', 'Mutasa', 'Buhera'],
  'Mashonaland Central': ['Bindura', 'Guruve', 'Mazowe', 'Rushinga', 'Shamva', 'Mbire'],
  'Mashonaland East': ['Marondera', 'Chikomba', 'Goromonzi', 'Murehwa', 'Mudzi', 'Mutoko', 'Seke', 'Uzumba-Maramba-Pfungwe', 'Hwedza'],
  'Mashonaland West': ['Chinhoyi', 'Chegutu', 'Hurungwe', 'Kadoma', 'Kariba', 'Makonde', 'Zvimba'],
  'Masvingo': ['Masvingo', 'Bikita', 'Chiredzi', 'Chivi', 'Gutu', 'Mwenezi', 'Zaka'],
  'Matabeleland North': ['Lupane', 'Binga', 'Bubi', 'Hwange', 'Nkayi', 'Tsholotsho', 'Umguza'],
  'Matabeleland South': ['Gwanda', 'Beitbridge', 'Bullilima', 'Mangwe', 'Matobo', 'Insiza', 'Umzingwane'],
  'Midlands': ['Gweru', 'Chirumhanzu', 'Gokwe North', 'Gokwe South', 'Kwekwe', 'Mberengwa', 'Shurugwi', 'Zvishavane'],
};

export const SEED_VARIETIES = [
  'SC513',
  'SC529',
  'SC637',
  'SC649',
  'SC719',
  'SC727',
  'SC403',
  'SC415',
  'Panther',
  'Bird',
] as const;

export function validateZimbabwePhone(phone: string): boolean {
  const regex = /^\+?263(7[1378]\d{7}|2[0-9]\d{6})$/;
  return regex.test(phone);
}

export function formatZimbabwePhone(phone: string): string {
  if (phone.startsWith('0')) {
    return '+263' + phone.slice(1);
  }
  if (phone.startsWith('263') && !phone.startsWith('+')) {
    return '+' + phone;
  }
  return phone;
}
