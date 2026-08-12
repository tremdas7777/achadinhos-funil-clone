import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BRAND_COLOR } from '../data/product';
import { formatPrice } from '../utils/format';

interface LocationState {
  order: { id: string; status: string };
  paymentMethod: string;
  paymentData: { pix?: { qrcode?: string; qrcode_image?: string; code?: string } };
  total: number;
  items: Array<{ name: string; price: number; quantity: number; image_url?: string }>;
  customer: { name: string };
}

export default function PaymentConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!state?.order?.id) navigate('/shop/checkout', { replace: true });
  }, [state, navigate]);

  if (!state?.order) return null;

  const pixCode =
    state.paymentData?.pix?.qrcode ||
    state.paymentData?.pix?.code ||
    '';
  const qrImage = state.paymentData?.pix?.qrcode_image || '';

  const copyCode = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePayment = async () => {
    setChecking(true);
    await fetch(`/api/orders/${state.order.id}/confirm-payment`, { method: 'POST' });
    navigate(`/shop/upsell?order=${state.order.id}`, {
      state: { order: state.order, paid: true },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-8 max-w-lg mx-auto">
      <div className="bg-white px-4 py-4 border-b">
        <h1 className="text-[18px] font-bold text-center">Pagamento via Pix</h1>
        <p className="text-[13px] text-gray-500 text-center mt-1">Pedido #{state.order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="bg-white mt-2 mx-4 rounded-xl p-4 text-center">
        <p className="text-[14px] text-gray-600 mb-1">Valor a pagar</p>
        <p className="text-[28px] font-bold" style={{ color: BRAND_COLOR }}>
          R${formatPrice(state.total)}
        </p>
        <p className="text-[12px] text-gray-400 mt-2">Copie o código ou escaneie o QR Code abaixo</p>

        {qrImage && (
          <img src={qrImage} alt="QR Code Pix" className="w-[220px] h-[220px] mx-auto my-4 border rounded-lg" />
        )}

        <div className="bg-gray-50 rounded-lg p-3 text-left">
          <p className="text-[11px] text-gray-500 mb-1">Código Pix Copia e Cola</p>
          <p className="text-[11px] break-all text-gray-700 leading-relaxed">{pixCode}</p>
        </div>

        <button
          onClick={copyCode}
          className="w-full mt-3 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          {copied ? 'Copiado!' : 'Copiar código Pix'}
        </button>
      </div>

      <div className="bg-white mt-2 mx-4 rounded-xl p-4">
        <h2 className="text-[15px] font-bold mb-3">Resumo do pedido</h2>
        {state.items.map((item, i) => (
          <div key={i} className="flex justify-between text-[13px] py-2 border-b border-gray-50 last:border-0">
            <span className="line-clamp-1 flex-1 pr-2">{item.name.trim()}</span>
            <span className="font-medium shrink-0">R${formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-[15px] font-bold mt-3 pt-3 border-t">
          <span>Total</span>
          <span style={{ color: BRAND_COLOR }}>R${formatPrice(state.total)}</span>
        </div>
      </div>

      <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-[13px] text-yellow-800">
        <p className="font-medium mb-1">Aguardando pagamento</p>
        <p>O pedido será confirmado automaticamente após a compensação do Pix.</p>
      </div>

      <div className="mx-4 mt-4">
        <button
          onClick={simulatePayment}
          disabled={checking}
          className="w-full py-3 rounded-lg border-2 font-medium text-[14px] disabled:opacity-60"
          style={{ borderColor: BRAND_COLOR, color: BRAND_COLOR }}
        >
          {checking ? 'Confirmando...' : 'Simular pagamento confirmado (demo)'}
        </button>
      </div>
    </div>
  );
}
