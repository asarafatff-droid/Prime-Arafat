export type ColorFamily =
  | 'Red'
  | 'Pink'
  | 'Orange'
  | 'Yellow'
  | 'Green'
  | 'Teal'
  | 'Blue'
  | 'Purple'
  | 'Brown'
  | 'Metallic'
  | 'Neutral';

export interface WorldColor {
  name: string;
  hex: string;
  family: ColorFamily;
}

export const COLOR_FAMILIES: readonly ColorFamily[] = [
  'Red',
  'Pink',
  'Orange',
  'Yellow',
  'Green',
  'Teal',
  'Blue',
  'Purple',
  'Brown',
  'Metallic',
  'Neutral',
] as const;

/**
 * Comprehensive global palette covering W3C standard named colors
 * plus popular fashion, textile, cosmetic, and electronics finishes.
 */
export const WORLD_COLORS: readonly WorldColor[] = [
  // Reds
  { name: 'Red', hex: '#FF0000', family: 'Red' },
  { name: 'Crimson', hex: '#DC143C', family: 'Red' },
  { name: 'Scarlet', hex: '#FF2400', family: 'Red' },
  { name: 'Ruby', hex: '#E0115F', family: 'Red' },
  { name: 'Cherry Red', hex: '#DE3163', family: 'Red' },
  { name: 'FireBrick', hex: '#B22222', family: 'Red' },
  { name: 'DarkRed', hex: '#8B0000', family: 'Red' },
  { name: 'Maroon', hex: '#800000', family: 'Red' },
  { name: 'Burgundy', hex: '#800020', family: 'Red' },
  { name: 'Wine', hex: '#722F37', family: 'Red' },
  { name: 'IndianRed', hex: '#CD5C5C', family: 'Red' },
  { name: 'Vermilion', hex: '#E34234', family: 'Red' },
  { name: 'Carmine', hex: '#960018', family: 'Red' },
  { name: 'Garnet', hex: '#733635', family: 'Red' },

  // Pinks
  { name: 'Pink', hex: '#FFC0CB', family: 'Pink' },
  { name: 'LightPink', hex: '#FFB6C1', family: 'Pink' },
  { name: 'Baby Pink', hex: '#F4C2C2', family: 'Pink' },
  { name: 'HotPink', hex: '#FF69B4', family: 'Pink' },
  { name: 'DeepPink', hex: '#FF1493', family: 'Pink' },
  { name: 'MediumVioletRed', hex: '#C71585', family: 'Pink' },
  { name: 'PaleVioletRed', hex: '#DB7093', family: 'Pink' },
  { name: 'Dusty Rose', hex: '#DCAE96', family: 'Pink' },
  { name: 'Blush', hex: '#DE5D83', family: 'Pink' },
  { name: 'Magenta', hex: '#FF00FF', family: 'Pink' },
  { name: 'Fuchsia', hex: '#FF00FF', family: 'Pink' },
  { name: 'Rose', hex: '#FF007F', family: 'Pink' },
  { name: 'Flamingo Pink', hex: '#FC8EAC', family: 'Pink' },
  { name: 'Neon Pink', hex: '#FF10F0', family: 'Pink' },
  { name: 'Mauve', hex: '#E0B0FF', family: 'Pink' },

  // Oranges
  { name: 'Orange', hex: '#FFA500', family: 'Orange' },
  { name: 'Daraz Orange', hex: '#F85606', family: 'Orange' },
  { name: 'DarkOrange', hex: '#FF8C00', family: 'Orange' },
  { name: 'OrangeRed', hex: '#FF4500', family: 'Orange' },
  { name: 'Tomato', hex: '#FF6347', family: 'Orange' },
  { name: 'Coral', hex: '#FF7F50', family: 'Orange' },
  { name: 'LightCoral', hex: '#F08080', family: 'Orange' },
  { name: 'Salmon', hex: '#FA8072', family: 'Orange' },
  { name: 'DarkSalmon', hex: '#E9967A', family: 'Orange' },
  { name: 'LightSalmon', hex: '#FFA07A', family: 'Orange' },
  { name: 'Tangerine', hex: '#F28500', family: 'Orange' },
  { name: 'Peach', hex: '#FFE5B4', family: 'Orange' },
  { name: 'PeachPuff', hex: '#FFDAB9', family: 'Orange' },
  { name: 'Apricot', hex: '#FBCEB1', family: 'Orange' },
  { name: 'Terracotta', hex: '#E2725B', family: 'Orange' },
  { name: 'Rust', hex: '#B7410E', family: 'Orange' },
  { name: 'Burnt Orange', hex: '#CC5500', family: 'Orange' },
  { name: 'Amber', hex: '#FFBF00', family: 'Orange' },

  // Yellows
  { name: 'Yellow', hex: '#FFFF00', family: 'Yellow' },
  { name: 'LightYellow', hex: '#FFFFE0', family: 'Yellow' },
  { name: 'LemonChiffon', hex: '#FFFACD', family: 'Yellow' },
  { name: 'Lemon', hex: '#FFF700', family: 'Yellow' },
  { name: 'LightGoldenRodYellow', hex: '#FAFAD2', family: 'Yellow' },
  { name: 'PapayaWhip', hex: '#FFEFD5', family: 'Yellow' },
  { name: 'Moccasin', hex: '#FFE4B5', family: 'Yellow' },
  { name: 'PaleGoldenRod', hex: '#EEE8AA', family: 'Yellow' },
  { name: 'Khaki', hex: '#F0E68C', family: 'Yellow' },
  { name: 'DarkKhaki', hex: '#BDB76B', family: 'Yellow' },
  { name: 'Mustard', hex: '#FFDB58', family: 'Yellow' },
  { name: 'Saffron', hex: '#F4C430', family: 'Yellow' },
  { name: 'Canary', hex: '#FFFF99', family: 'Yellow' },
  { name: 'Neon Yellow', hex: '#E9FF32', family: 'Yellow' },
  { name: 'Ochre', hex: '#CC7722', family: 'Yellow' },

  // Greens
  { name: 'Green', hex: '#008000', family: 'Green' },
  { name: 'Lime', hex: '#00FF00', family: 'Green' },
  { name: 'LimeGreen', hex: '#32CD32', family: 'Green' },
  { name: 'LightGreen', hex: '#90EE90', family: 'Green' },
  { name: 'PaleGreen', hex: '#98FB98', family: 'Green' },
  { name: 'DarkGreen', hex: '#006400', family: 'Green' },
  { name: 'ForestGreen', hex: '#228B22', family: 'Green' },
  { name: 'Emerald', hex: '#50C878', family: 'Green' },
  { name: 'Jade', hex: '#00A86B', family: 'Green' },
  { name: 'Mint Green', hex: '#98FF98', family: 'Green' },
  { name: 'Sage Green', hex: '#9CAF88', family: 'Green' },
  { name: 'SeaGreen', hex: '#2E8B57', family: 'Green' },
  { name: 'MediumSeaGreen', hex: '#3CB371', family: 'Green' },
  { name: 'DarkSeaGreen', hex: '#8FBC8F', family: 'Green' },
  { name: 'SpringGreen', hex: '#00FF7F', family: 'Green' },
  { name: 'MediumSpringGreen', hex: '#00FA9A', family: 'Green' },
  { name: 'LawnGreen', hex: '#7CFC00', family: 'Green' },
  { name: 'Chartreuse', hex: '#7FFF00', family: 'Green' },
  { name: 'GreenYellow', hex: '#ADFF2F', family: 'Green' },
  { name: 'YellowGreen', hex: '#9ACD32', family: 'Green' },
  { name: 'Olive', hex: '#808000', family: 'Green' },
  { name: 'OliveDrab', hex: '#6B8E23', family: 'Green' },
  { name: 'DarkOliveGreen', hex: '#556B2F', family: 'Green' },
  { name: 'Army Green', hex: '#4B5320', family: 'Green' },
  { name: 'Bottle Green', hex: '#006A4E', family: 'Green' },
  { name: 'Pistachio', hex: '#93C572', family: 'Green' },
  { name: 'Neon Green', hex: '#39FF14', family: 'Green' },

  // Teals & Cyans
  { name: 'Aqua', hex: '#00FFFF', family: 'Teal' },
  { name: 'Cyan', hex: '#00FFFF', family: 'Teal' },
  { name: 'LightCyan', hex: '#E0FFFF', family: 'Teal' },
  { name: 'PaleTurquoise', hex: '#AFEEEE', family: 'Teal' },
  { name: 'Aquamarine', hex: '#7FFFD4', family: 'Teal' },
  { name: 'MediumAquaMarine', hex: '#66CDAA', family: 'Teal' },
  { name: 'Turquoise', hex: '#40E0D0', family: 'Teal' },
  { name: 'MediumTurquoise', hex: '#48D1CC', family: 'Teal' },
  { name: 'DarkTurquoise', hex: '#00CED1', family: 'Teal' },
  { name: 'LightSeaGreen', hex: '#20B2AA', family: 'Teal' },
  { name: 'CadetBlue', hex: '#5F9EA0', family: 'Teal' },
  { name: 'Teal', hex: '#008080', family: 'Teal' },
  { name: 'DarkCyan', hex: '#008B8B', family: 'Teal' },
  { name: 'Peacock Blue', hex: '#005F69', family: 'Teal' },

  // Blues
  { name: 'Blue', hex: '#0000FF', family: 'Blue' },
  { name: 'LightBlue', hex: '#ADD8E6', family: 'Blue' },
  { name: 'PowderBlue', hex: '#B0E0E6', family: 'Blue' },
  { name: 'SkyBlue', hex: '#87CEEB', family: 'Blue' },
  { name: 'LightSkyBlue', hex: '#87CEFA', family: 'Blue' },
  { name: 'DeepSkyBlue', hex: '#00BFFF', family: 'Blue' },
  { name: 'Baby Blue', hex: '#89CFF0', family: 'Blue' },
  { name: 'Ice Blue', hex: '#D6ECEF', family: 'Blue' },
  { name: 'DodgerBlue', hex: '#1E90FF', family: 'Blue' },
  { name: 'CornflowerBlue', hex: '#6495ED', family: 'Blue' },
  { name: 'SteelBlue', hex: '#4682B4', family: 'Blue' },
  { name: 'LightSteelBlue', hex: '#B0C4DE', family: 'Blue' },
  { name: 'RoyalBlue', hex: '#4169E1', family: 'Blue' },
  { name: 'Cobalt Blue', hex: '#0047AB', family: 'Blue' },
  { name: 'Sapphire', hex: '#0F52BA', family: 'Blue' },
  { name: 'Denim Blue', hex: '#1560BD', family: 'Blue' },
  { name: 'MediumBlue', hex: '#0000CD', family: 'Blue' },
  { name: 'DarkBlue', hex: '#00008B', family: 'Blue' },
  { name: 'Navy', hex: '#000080', family: 'Blue' },
  { name: 'MidnightBlue', hex: '#191970', family: 'Blue' },
  { name: 'MediumSlateBlue', hex: '#7B68EE', family: 'Blue' },
  { name: 'SlateBlue', hex: '#6A5ACD', family: 'Blue' },
  { name: 'DarkSlateBlue', hex: '#483D8B', family: 'Blue' },

  // Purples & Violets
  { name: 'Purple', hex: '#800080', family: 'Purple' },
  { name: 'Lavender', hex: '#E6E6FA', family: 'Purple' },
  { name: 'Lilac', hex: '#C8A2C8', family: 'Purple' },
  { name: 'Thistle', hex: '#D8BFD8', family: 'Purple' },
  { name: 'Plum', hex: '#DDA0DD', family: 'Purple' },
  { name: 'Violet', hex: '#EE82EE', family: 'Purple' },
  { name: 'Orchid', hex: '#DA70D6', family: 'Purple' },
  { name: 'MediumOrchid', hex: '#BA55D3', family: 'Purple' },
  { name: 'DarkOrchid', hex: '#9932CC', family: 'Purple' },
  { name: 'MediumPurple', hex: '#9370DB', family: 'Purple' },
  { name: 'BlueViolet', hex: '#8A2BE2', family: 'Purple' },
  { name: 'DarkViolet', hex: '#9400D3', family: 'Purple' },
  { name: 'DarkMagenta', hex: '#8B008B', family: 'Purple' },
  { name: 'RebeccaPurple', hex: '#663399', family: 'Purple' },
  { name: 'Indigo', hex: '#4B0082', family: 'Purple' },
  { name: 'Royal Purple', hex: '#7851A9', family: 'Purple' },
  { name: 'Eggplant', hex: '#614051', family: 'Purple' },
  { name: 'Grape', hex: '#6F2DA8', family: 'Purple' },

  // Browns, Tans & Earth Tones
  { name: 'Brown', hex: '#A52A2A', family: 'Brown' },
  { name: 'SaddleBrown', hex: '#8B4513', family: 'Brown' },
  { name: 'Sienna', hex: '#A0522D', family: 'Brown' },
  { name: 'Chocolate', hex: '#D2691E', family: 'Brown' },
  { name: 'Peru', hex: '#CD853F', family: 'Brown' },
  { name: 'SandyBrown', hex: '#F4A460', family: 'Brown' },
  { name: 'BurlyWood', hex: '#DEB887', family: 'Brown' },
  { name: 'Tan', hex: '#D2B48C', family: 'Brown' },
  { name: 'RosyBrown', hex: '#BC8F8F', family: 'Brown' },
  { name: 'Camel', hex: '#C19A6B', family: 'Brown' },
  { name: 'Coffee', hex: '#6F4E37', family: 'Brown' },
  { name: 'Espresso', hex: '#4B3621', family: 'Brown' },
  { name: 'Mocha', hex: '#967969', family: 'Brown' },
  { name: 'Caramel', hex: '#AF6E4D', family: 'Brown' },
  { name: 'Wheat', hex: '#F5DEB3', family: 'Brown' },
  { name: 'NavajoWhite', hex: '#FFDEAD', family: 'Brown' },
  { name: 'Bisque', hex: '#FFE4C4', family: 'Brown' },
  { name: 'BlanchedAlmond', hex: '#FFEBCD', family: 'Brown' },
  { name: 'Beige', hex: '#F5F5DC', family: 'Brown' },
  { name: 'Taupe', hex: '#483C32', family: 'Brown' },

  // Metallics
  { name: 'Gold', hex: '#FFD700', family: 'Metallic' },
  { name: 'GoldenRod', hex: '#DAA520', family: 'Metallic' },
  { name: 'DarkGoldenRod', hex: '#B8860B', family: 'Metallic' },
  { name: 'Rose Gold', hex: '#B76E79', family: 'Metallic' },
  { name: 'Champagne', hex: '#F7E7CE', family: 'Metallic' },
  { name: 'Silver', hex: '#C0C0C0', family: 'Metallic' },
  { name: 'Bronze', hex: '#CD7F32', family: 'Metallic' },
  { name: 'Copper', hex: '#B87333', family: 'Metallic' },
  { name: 'Platinum', hex: '#E5E4E2', family: 'Metallic' },
  { name: 'Titanium', hex: '#878681', family: 'Metallic' },
  { name: 'Gunmetal', hex: '#2A3439', family: 'Metallic' },
  { name: 'Space Gray', hex: '#717378', family: 'Metallic' },

  // Neutrals: Whites, Creams, Greys & Blacks
  { name: 'White', hex: '#FFFFFF', family: 'Neutral' },
  { name: 'Off White', hex: '#FAF9F6', family: 'Neutral' },
  { name: 'Snow', hex: '#FFFAFA', family: 'Neutral' },
  { name: 'Ivory', hex: '#FFFFF0', family: 'Neutral' },
  { name: 'Pearl White', hex: '#EAE0C8', family: 'Neutral' },
  { name: 'Cream', hex: '#FFFDD0', family: 'Neutral' },
  { name: 'Cornsilk', hex: '#FFF8DC', family: 'Neutral' },
  { name: 'HoneyDew', hex: '#F0FFF0', family: 'Neutral' },
  { name: 'MintCream', hex: '#F5FFFA', family: 'Neutral' },
  { name: 'Azure', hex: '#F0FFFF', family: 'Neutral' },
  { name: 'AliceBlue', hex: '#F0F8FF', family: 'Neutral' },
  { name: 'GhostWhite', hex: '#F8F8FF', family: 'Neutral' },
  { name: 'WhiteSmoke', hex: '#F5F5F5', family: 'Neutral' },
  { name: 'SeaShell', hex: '#FFF5EE', family: 'Neutral' },
  { name: 'OldLace', hex: '#FDF5E6', family: 'Neutral' },
  { name: 'FloralWhite', hex: '#FFFAF0', family: 'Neutral' },
  { name: 'Linen', hex: '#FAF0E6', family: 'Neutral' },
  { name: 'AntiqueWhite', hex: '#FAEBD7', family: 'Neutral' },
  { name: 'LavenderBlush', hex: '#FFF0F5', family: 'Neutral' },
  { name: 'MistyRose', hex: '#FFE4E1', family: 'Neutral' },
  { name: 'Gainsboro', hex: '#DCDCDC', family: 'Neutral' },
  { name: 'LightGray', hex: '#D3D3D3', family: 'Neutral' },
  { name: 'Ash', hex: '#B2BEB5', family: 'Neutral' },
  { name: 'DarkGray', hex: '#A9A9A9', family: 'Neutral' },
  { name: 'Gray', hex: '#808080', family: 'Neutral' },
  { name: 'DimGray', hex: '#696969', family: 'Neutral' },
  { name: 'LightSlateGray', hex: '#778899', family: 'Neutral' },
  { name: 'SlateGray', hex: '#708090', family: 'Neutral' },
  { name: 'Charcoal', hex: '#36454F', family: 'Neutral' },
  { name: 'DarkSlateGray', hex: '#2F4F4F', family: 'Neutral' },
  { name: 'Matte Black', hex: '#28282B', family: 'Neutral' },
  { name: 'Jet Black', hex: '#0A0A0A', family: 'Neutral' },
  { name: 'Black', hex: '#000000', family: 'Neutral' },
  { name: 'Multicolor', hex: '#F85606', family: 'Neutral' },
] as const;

const COLOR_HEX_MAP = new Map<string, string>(
  WORLD_COLORS.map((c) => [c.name.toLowerCase(), c.hex])
);

// Additional common aliases without spaces or hyphenated spellings
for (const c of WORLD_COLORS) {
  const compact = c.name.toLowerCase().replace(/[\s\-_]+/g, '');
  if (!COLOR_HEX_MAP.has(compact)) {
    COLOR_HEX_MAP.set(compact, c.hex);
  }
}
COLOR_HEX_MAP.set('grey', '#808080');
COLOR_HEX_MAP.set('lightgrey', '#D3D3D3');
COLOR_HEX_MAP.set('darkgrey', '#A9A9A9');
COLOR_HEX_MAP.set('spacegrey', '#717378');

export function getColorHex(colorName: string): string {
  const raw = (colorName || '').trim();
  if (!raw) return '#CBD5E1';
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return raw;
  }
  const direct = COLOR_HEX_MAP.get(raw.toLowerCase());
  if (direct) return direct;
  const compact = COLOR_HEX_MAP.get(raw.toLowerCase().replace(/[\s\-_]+/g, ''));
  if (compact) return compact;

  // Deterministic pleasant fallback hue if custom text is entered
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = raw.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 52%)`;
}

export function isLightColor(hex: string): boolean {
  if (!hex.startsWith('#')) return false;
  const clean = hex.slice(1);
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;
  if (full.length !== 6) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.78;
}
