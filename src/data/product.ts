export const BRAND_COLOR = '#ee4d2d';
export const CART_BAR_COLOR = '#00bfa5';
export const PRODUCT_ID = '851678b1-db4b-4c4e-989a-7097c17f6e3b';

export interface ProductVariant {
  id: string;
  color_name: string;
  image_url: string;
}

export interface Review {
  id: string;
  username: string;
  rating: number;
  comment: string;
  images: string[];
  helpful_count: number;
}

export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  sold_count: number;
  rating: number;
  badge?: string;
}

export interface BumpOffer {
  id: string;
  offered_product_id: string;
  promo_price: number;
  description: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

export interface UpsellOffer {
  id: string;
  title: string;
  product_name: string;
  product_image: string;
  button_text: string;
  shipping_price: number;
  scarcity_text: string;
  social_proof_text: string;
  variant: string;
}

export const product = {
  id: PRODUCT_ID,
  name: 'Espelho Oval Moldura Led Quarto Salão Loja 170x70 Grande ',
  description: 'Espelho Oval Corpo Inteiro Moldura Led Quarto Salão Loja 170x70 Grande ',
  price: 57.5,
  original_price: 129.0,
  image_url:
    'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158433175_8aytqt8syaq.webp',
  images: [
    'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158433175_8aytqt8syaq.webp',
    'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158453691_ekxgd49frub.webp',
    'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158479912_6xrdaf5f3id.webp',
  ],
  stock: 100,
  sold_count: 824,
  rating: 5.0,
  rating_count: 10,
  is_official: true,
  sizes: ['170x70cm'],
  insurance_enabled: true,
};

export const variants: ProductVariant[] = [
  {
    id: 'a6416116-bb75-4502-a0b1-5f5caea472f2',
    color_name: 'Moldura Bronze',
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158433175_8aytqt8syaq.webp',
  },
  {
    id: '394afc15-f270-4809-9751-b3996557c0e5',
    color_name: 'Moldura Dourado',
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158453691_ekxgd49frub.webp',
  },
  {
    id: 'bcc902fd-1604-42f3-a0f0-f32da17cd1ff',
    color_name: 'Moldura Preto',
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/variants/1781158479912_6xrdaf5f3id.webp',
  },
];

export const reviews: Review[] = [
  {
    id: '71504ee1-ad22-44dc-af3b-9c517f9918f1',
    username: 'Rafaela marinho',
    rating: 5,
    comment: 'Ficou lindo, chegou rapidinho',
    images: [
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/reviews/1781159060004-cdgr9tsskkw.webp',
    ],
    helpful_count: 7,
  },
  {
    id: '75bbcc50-5e9d-4882-9b51-b9d2ca7540cc',
    username: 'Eryca mendes',
    rating: 5,
    comment: 'Chegou bem rapido e veio muito bem embalado recomendo. ficou lindo amei',
    images: [
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/reviews/1781159022485-t94uk2a0kui.webp',
    ],
    helpful_count: 2,
  },
  {
    id: '734a8fe4-6b8b-4277-90ae-981776b3e215',
    username: 'Amandinha62',
    rating: 5,
    comment: 'Maravilhosooooo ameiii 💗',
    images: [
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/reviews/1781158971094-pjo9vazeujj.webp',
    ],
    helpful_count: 18,
  },
  {
    id: '6486ac8c-5fd7-433a-9d5b-bb7909935f2e',
    username: 'Debora Garcia',
    rating: 5,
    comment: 'Bem embalado material excelente além de lindo é bonito e chique chique mesmo amei.',
    images: [
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/reviews/1781158912178-uokjp28ngpa.webp',
    ],
    helpful_count: 18,
  },
  {
    id: '6032be88-0b85-4d6e-8f46-0b4fd7464678',
    username: 'ana_oficial',
    rating: 4,
    comment: 'Amei! Muito bonito e de ótima qualidade. Comprarei novamente.',
    images: [],
    helpful_count: 1,
  },
];

export const relatedProducts: RelatedProduct[] = [
  {
    id: '53f5f298-3d56-42a2-a47b-7c8761adcacc',
    name: 'Maleta Maquiagem Profissional',
    price: 39.0,
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/1777610165243-61zm2qovmfl.webp',
    sold_count: 6511,
    rating: 5.0,
  },
  {
    id: '6e827f17-8319-4743-a5a1-ca36d5f35e47',
    name: 'Espelho Retangular com LED',
    price: 59.9,
    image_url:
      'http://bea918-2.myshopify.com/cdn/shop/files/br-11134207-7r98o-m9q7a3sgskl592.webp?v=1781202118',
    sold_count: 887,
    rating: 5.0,
  },
  {
    id: 'd48ba02f-35ed-479b-b0d2-4e1165f7c938',
    name: 'Cadeira Dobravel compacta Camping',
    price: 39.0,
    image_url:
      'http://xperts4x4.com/cdn/shop/files/xperts4x4-chaises-de-camping-chaise-de-camping-expander-front-runner-pliable-compacte-chai007-1184748662.jpg?v=1755366473',
    sold_count: 854,
    rating: 5.0,
  },
  {
    id: 'd0fcb71d-f49e-4a8d-b9cb-e705b27beeb6',
    name: 'Vestido Macaquinho',
    price: 39.9,
    image_url:
      'http://www.valennaloja.com/cdn/shop/files/71f462df34b84ceda09afaebec8813c4_tplv-aphluv4xwc-crop-webp_900_1200-Photoroom.png?v=1775623967&width=2048',
    sold_count: 758,
    rating: 5.0,
  },
  {
    id: '5cbc84bf-ac0c-4656-a885-7a712db1af17',
    name: 'Conjunto Short Duplo+Top',
    price: 37.0,
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/1775711892650-ymve0r6a7fe.png',
    sold_count: 752,
    rating: 4.9,
    badge: '-64%',
  },
  {
    id: '7d436f8e-a89b-43cc-b644-95a0408c7927',
    name: 'Carrinho de Compras Dobrável e Portátil',
    price: 79.0,
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/1778647122627-xt2o9674skc.webp',
    sold_count: 655,
    rating: 5.0,
  },
];

export const bumpOffer: BumpOffer = {
  id: 'ac0266ac-a82f-4d6e-a6ea-36c854996d71',
  offered_product_id: '53f5f298-3d56-42a2-a47b-7c8761adcacc',
  promo_price: 19.9,
  description: 'Oferta valida para essa Compra',
  product: {
    id: '53f5f298-3d56-42a2-a47b-7c8761adcacc',
    name: 'Maleta Maquiagem Profissional',
    price: 39.0,
    image_url:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/1777610165243-61zm2qovmfl.webp',
  },
};

export const upsellOffers: UpsellOffer[] = [
  {
    id: '140e4ef9-fe30-4e32-8bba-c26e68aa11b0',
    title: 'Parabéns! Você ganhou um presente!',
    product_name: 'Kit Chapa Gloss e Escova Gloss Blue Bivolt',
    product_image:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/upsell/140e4ef9-fe30-4e32-8bba-c26e68aa11b0-1786499062612.png',
    button_text: 'RESGATAR PRÊMIO',
    shipping_price: 19.9,
    scarcity_text: 'Restam apenas 3 unidades!',
    social_proof_text: '147 pessoas resgataram hoje',
    variant: 'A',
  },
  {
    id: 'f713f17f-ab65-4fe8-ade1-020f9bd55090',
    title: 'Parabéns! Você ganhou um presente!',
    product_name: 'Máquina de Depilação a Laser',
    product_image:
      'https://gvkkdzkvrfgzbszkycpi.supabase.co/storage/v1/object/public/product-images/upsell/f713f17f-ab65-4fe8-ade1-020f9bd55090-1786500535429.jpg',
    button_text: 'RESGATAR PRÊMIO',
    shipping_price: 19.9,
    scarcity_text: 'Restam apenas 3 unidades!',
    social_proof_text: '147 pessoas resgataram hoje',
    variant: 'B',
  },
];

export const settings = {
  shipping: { price: 16.91, delivery_days_min: 2, delivery_days_max: 3, free_with_coupon: true },
  insurance: {
    name: 'Seguro de Envio',
    price: 10.21,
    description: 'Proteja seu pedido contra danos e Ganhe 90 dias de Garantia extra',
    is_active: true,
  },
  pix_discount: { is_active: false, discount_type: 'percentage', discount_value: 10 },
};
