import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND_COLOR, upsellOffers } from '../data/product';
import { formatPrice } from '../utils/format';

export default function UpsellPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  const [loading, setLoading] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [pixData, setPixData] = useState<{ qrcode: string; qrcode_image: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const offer = useMemo(() => {
    const hash = orderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return upsellOffers[hash % upsellOffers.length];
  }, [orderId]);

  useEffect(() => {
    if (!orderId) navigate('/shop/checkout', { replace: true });
  }, [orderId, navigate]);

  const handleResgate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/upsell-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          offer_id: offer.id,
          product_name: offer.product_name,
          shipping_price: offer.shipping_price,
        }),
      });
      const data = await res.json();
      setPixData({
        qrcode: data.pix.qrcode,
        qrcode_image: data.pix.qrcode_image,
        amount: data.amount,
      });
      setShowPix(true);
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    navigate(`/obrigado-pela-compra?order=${orderId}`, { replace: true });
  };

  const copyCode = async () => {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.qrcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white max-w-lg mx-auto">
      <div className="px-4 py-6 text-center">
        <p className="text-[13px] text-brand font-medium mb-2">OFERTA EXCLUSIVA</p>
        <h1 className="text-[22px] font-bold leading-tight">{offer.title}</h1>
        <p className="text-[13px] text-red-600 font-medium mt-2">{offer.scarcity_text}</p>
        <p className="text-[12px] text-gray-500 mt-1">{offer.social_proof_text}</p>
      </div>

      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-100">
        <img src={offer.product_image} alt={offer.product_name} className="w-full aspect-square object-cover" />
        <div className="p-4">
          <h2 className="text-[18px] font-bold text-center">{offer.product_name}</h2>
          <p className="text-center text-[14px] text-gray-600 mt-2">
            Pague apenas o frete de{' '}
            <strong style={{ color: BRAND_COLOR }}>R${formatPrice(offer.shipping_price)}</strong>
          </p>
        </div>
      </div>

      {!showPix ? (
        <div className="px-4 mt-6 space-y-3">
          <button
            onClick={handleResgate}
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-bold text-[16px] shadow-lg disabled:opacity-60 animate-pulse"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {loading ? 'Gerando Pix...' : offer.button_text}
          </button>
          <button onClick={skip} className="w-full py-3 text-[14px] text-gray-500 underline">
            Não, obrigado. Quero finalizar meu pedido
          </button>
        </div>
      ) : (
        <div className="px-4 mt-6">
          <div className="bg-white rounded-xl p-4 text-center border">
            <p className="text-[14px] font-bold mb-2">Pix do frete — R${formatPrice(pixData!.amount)}</p>
            {pixData?.qrcode_image && (
              <img src={pixData.qrcode_image} alt="QR Pix" className="w-[200px] h-[200px] mx-auto my-3" />
            )}
            <button
              onClick={copyCode}
              className="w-full py-3 rounded-lg text-white font-bold mb-3"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              {copied ? 'Copiado!' : 'Copiar código Pix'}
            </button>
            <button onClick={skip} className="w-full py-3 text-[14px] text-gray-500">
              Continuar para confirmação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
