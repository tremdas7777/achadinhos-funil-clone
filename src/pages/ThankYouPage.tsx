import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND_COLOR } from '../data/product';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../lib/api';

interface Order {
  id: string;
  status: string;
  customer_name: string;
  total: number;
  items: Array<{ product_name: string; price: number; quantity: number }>;
  created_at: string;
}

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    clearCart();
    if (!orderId) return;
    apiFetch(`/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => setOrder(data.order))
      .catch(() => null);
  }, [orderId, clearCart]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] max-w-lg mx-auto">
      <div className="bg-white px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto mb-4">
          ✓
        </div>
        <h1 className="text-[22px] font-bold">Obrigado pela compra!</h1>
        <p className="text-[14px] text-gray-600 mt-2">
          Seu pedido foi registrado com sucesso.
        </p>
        {orderId && (
          <p className="text-[13px] text-gray-500 mt-3">
            Nº do pedido: <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>
          </p>
        )}
      </div>

      {order && (
        <div className="bg-white mt-2 mx-4 rounded-xl p-4 mb-4">
          <h2 className="text-[15px] font-bold mb-3">Detalhes do pedido</h2>
          <p className="text-[13px] text-gray-600 mb-2">Cliente: {order.customer_name}</p>
          <p className="text-[13px] text-gray-600 mb-3">
            Status:{' '}
            <span className={order.status === 'paid' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
              {order.status === 'paid' ? 'Pago' : 'Aguardando pagamento'}
            </span>
          </p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-[13px] py-2 border-b border-gray-50">
              <span className="line-clamp-1 flex-1 pr-2">{item.product_name.trim()}</span>
              <span>R${formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-[16px] mt-3 pt-3 border-t">
            <span>Total</span>
            <span style={{ color: BRAND_COLOR }}>R${formatPrice(order.total)}</span>
          </div>
        </div>
      )}

      <div className="px-4 pb-8">
        <button
          onClick={() => navigate('/shop/product/851678b1-db4b-4c4e-989a-7097c17f6e3b')}
          className="w-full py-3.5 rounded-lg text-white font-bold"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          Continuar comprando
        </button>
      </div>
    </div>
  );
}
