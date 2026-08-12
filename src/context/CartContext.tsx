import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { product as mainProduct, bumpOffer } from '../data/product';

export const BUMP_COMBO_TOTAL = mainProduct.price + bumpOffer.promo_price;

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  selected_color?: string;
  selected_size?: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CartContextValue {
  items: CartItem[];
  bumpSelected: boolean;
  insuranceSelected: boolean;
  setBumpSelected: (v: boolean) => void;
  setInsuranceSelected: (v: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  clearCart: () => void;
  customer: CustomerData;
  setCustomer: (data: Partial<CustomerData>) => void;
}

const defaultCustomer: CustomerData = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [bumpSelected, setBumpSelected] = useState(true);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [customer, setCustomerState] = useState<CustomerData>(defaultCustomer);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      bumpSelected,
      insuranceSelected,
      setBumpSelected,
      setInsuranceSelected,
      addItem: (item, qty = 1) => {
        setItems([
          {
            ...item,
            quantity: qty,
          },
        ]);
      },
      clearCart: () => setItems([]),
      customer,
      setCustomer: (data) => setCustomerState((prev) => ({ ...prev, ...data })),
    }),
    [items, bumpSelected, insuranceSelected, customer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function useCartTotals() {
  const { items, bumpSelected, insuranceSelected } = useCart();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const bumpPrice = bumpSelected ? bumpOffer.promo_price : 0;
  const shipping = 0;
  const insurance = insuranceSelected ? 10.21 : 0;
  const total = subtotal + bumpPrice + shipping + insurance;
  return { subtotal, bumpPrice, shipping, insurance, total };
}

export function seedDefaultCart(
  addItem: CartContextValue['addItem'],
  color = 'Moldura Bronze',
  size = '170x70cm',
) {
  addItem(
    {
      product_id: mainProduct.id,
      name: mainProduct.name,
      price: mainProduct.price,
      image_url: mainProduct.image_url,
      selected_color: color,
      selected_size: size,
    },
    1,
  );
}
