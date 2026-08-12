import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_COLOR, bumpOffer, settings } from '../data/product';
import { formatPrice, maskCep, maskCpf, maskPhone, fetchCep } from '../utils/format';
import { seedDefaultCart, useCart, useCartTotals } from '../context/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    customer,
    setCustomer,
    bumpSelected,
    setBumpSelected,
    insuranceSelected,
    setInsuranceSelected,
    addItem,
  } = useCart();
  const { subtotal, bumpPrice, shipping, insurance, total } = useCartTotals();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length === 0) seedDefaultCart(addItem);
  }, [items.length, addItem]);

  const item = items[0];
  if (!item) return null;

  const onCepBlur = async () => {
    const data = await fetchCep(customer.zip);
    if (data) {
      setCustomer({
        street: data.street || customer.street,
        neighborhood: data.neighborhood || customer.neighborhood,
        city: data.city || customer.city,
        state: data.state || customer.state,
      });
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!customer.name.trim()) return setError('Informe seu nome completo');
    if (!customer.phone.replace(/\D/g, '').match(/^\d{10,11}$/)) return setError('Informe um telefone válido');
    if (!customer.cpf.replace(/\D/g, '').match(/^\d{11}$/)) return setError('Informe um CPF válido');
    if (!customer.zip.replace(/\D/g, '').match(/^\d{8}$/)) return setError('Informe um CEP válido');
    if (!customer.street.trim() || !customer.number.trim() || !customer.city.trim() || !customer.state.trim()) {
      return setError('Complete o endereço de entrega');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          address: {
            zip: customer.zip,
            street: customer.street,
            number: customer.number,
            complement: customer.complement,
            neighborhood: customer.neighborhood,
            city: customer.city,
            state: customer.state,
          },
          items,
          bump_items: bumpSelected
            ? [
                {
                  product_id: bumpOffer.product.id,
                  name: bumpOffer.product.name,
                  price: bumpOffer.promo_price,
                },
              ]
            : [],
          payment_method: paymentMethod,
          insurance: insuranceSelected,
          subtotal: subtotal + bumpPrice,
          shipping,
          total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar pedido');

      navigate('/shop/payment-confirmation', {
        state: {
          order: data.order,
          paymentMethod,
          paymentData: data.payment,
          total,
          subtotal: subtotal + bumpPrice,
          shipping,
          insurance: insuranceSelected ? settings.insurance.price : 0,
          items: [
            ...items,
            ...(bumpSelected
              ? [
                  {
                    product_id: bumpOffer.product.id,
                    name: `🎁 ${bumpOffer.product.name}`,
                    price: bumpOffer.promo_price,
                    image_url: bumpOffer.product.image_url,
                    quantity: 1,
                  },
                ]
              : []),
          ],
          customer,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const deliveryMin = new Date();
  deliveryMin.setDate(deliveryMin.getDate() + settings.shipping.delivery_days_min);
  const deliveryMax = new Date();
  deliveryMax.setDate(deliveryMax.getDate() + settings.shipping.delivery_days_max);
  const fmtDate = (d: Date) =>
    `${d.getDate()}/${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-28 max-w-lg mx-auto">
      <div className="bg-white sticky top-0 z-30 px-4 py-3 flex items-center gap-3 border-b">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          ←
        </button>
        <h1 className="text-[16px] font-bold">Checkout</h1>
      </div>

      <div className="bg-white mt-2 px-4 py-4">
        <div className="flex gap-3">
          <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded" />
          <div className="flex-1">
            <p className="text-[14px] font-medium line-clamp-2">{item.name.trim()}</p>
            <p className="text-[12px] text-gray-500 mt-1">
              {item.selected_color} · {item.selected_size}
            </p>
            <p className="text-[15px] font-bold mt-1" style={{ color: BRAND_COLOR }}>
              R${formatPrice(item.price)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white mt-2 px-4 py-4 space-y-3">
        <h2 className="text-[15px] font-bold">Dados pessoais</h2>
        <input
          placeholder="Nome completo"
          value={customer.name}
          onChange={(e) => setCustomer({ name: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <input
          placeholder="E-mail (opcional)"
          value={customer.email}
          onChange={(e) => setCustomer({ email: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <input
          placeholder="Telefone / WhatsApp"
          value={customer.phone}
          onChange={(e) => setCustomer({ phone: maskPhone(e.target.value) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <input
          placeholder="CPF"
          value={customer.cpf}
          onChange={(e) => setCustomer({ cpf: maskCpf(e.target.value) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
      </div>

      <div className="bg-white mt-2 px-4 py-4 space-y-3">
        <h2 className="text-[15px] font-bold">Endereço de entrega</h2>
        <input
          placeholder="CEP"
          value={customer.zip}
          onChange={(e) => setCustomer({ zip: maskCep(e.target.value) })}
          onBlur={onCepBlur}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <input
          placeholder="Rua"
          value={customer.street}
          onChange={(e) => setCustomer({ street: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Número"
            value={customer.number}
            onChange={(e) => setCustomer({ number: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
          />
          <input
            placeholder="Complemento"
            value={customer.complement}
            onChange={(e) => setCustomer({ complement: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
        <input
          placeholder="Bairro"
          value={customer.neighborhood}
          onChange={(e) => setCustomer({ neighborhood: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Cidade"
            value={customer.city}
            onChange={(e) => setCustomer({ city: e.target.value })}
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
          />
          <input
            placeholder="UF"
            value={customer.state}
            onChange={(e) => setCustomer({ state: e.target.value.toUpperCase().slice(0, 2) })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
        <p className="text-[12px] text-green-600">
          Entrega estimada: {fmtDate(deliveryMin)} - {fmtDate(deliveryMax)} · Frete grátis
        </p>
      </div>

      <div className="bg-white mt-2 px-4 py-4">
        <h2 className="text-[15px] font-bold mb-3">Oferta especial 🎁</h2>
        <label className="flex gap-3 items-start border-2 border-orange-100 rounded-lg p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bumpSelected}
            onChange={(e) => setBumpSelected(e.target.checked)}
            className="mt-1"
          />
          <img src={bumpOffer.product.image_url} alt="" className="w-14 h-14 object-cover rounded" />
          <div className="flex-1">
            <p className="text-[13px] font-medium">{bumpOffer.product.name}</p>
            <p className="text-[11px] text-gray-500">{bumpOffer.description}</p>
            <p className="text-[14px] font-bold mt-1" style={{ color: BRAND_COLOR }}>
              R${formatPrice(bumpOffer.promo_price)}
            </p>
          </div>
        </label>
      </div>

      {settings.insurance.is_active && (
        <div className="bg-white mt-2 px-4 py-4">
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={insuranceSelected}
              onChange={(e) => setInsuranceSelected(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="text-[14px] font-medium">{settings.insurance.name}</p>
              <p className="text-[12px] text-gray-500">{settings.insurance.description}</p>
              <p className="text-[13px] font-bold mt-1">+ R${formatPrice(settings.insurance.price)}</p>
            </div>
          </label>
        </div>
      )}

      <div className="bg-white mt-2 px-4 py-4">
        <h2 className="text-[15px] font-bold mb-3">Forma de pagamento</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod('pix')}
            className={`border-2 rounded-lg p-3 text-left ${paymentMethod === 'pix' ? 'border-brand bg-orange-50' : 'border-gray-200'}`}
          >
            <p className="text-[14px] font-bold">Pix</p>
            <p className="text-[11px] text-gray-500">Aprovação imediata</p>
          </button>
          <button
            onClick={() => setPaymentMethod('credit_card')}
            className={`border-2 rounded-lg p-3 text-left ${paymentMethod === 'credit_card' ? 'border-brand bg-orange-50' : 'border-gray-200'}`}
          >
            <p className="text-[14px] font-bold">Cartão</p>
            <p className="text-[11px] text-gray-500">Até 12x</p>
          </button>
        </div>
      </div>

      <div className="bg-white mt-2 px-4 py-4 text-[14px] space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>R${formatPrice(subtotal + bumpPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Frete</span>
          <span className="text-green-600">Grátis</span>
        </div>
        {insuranceSelected && (
          <div className="flex justify-between">
            <span className="text-gray-600">Seguro</span>
            <span>R${formatPrice(insurance)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[16px] pt-2 border-t">
          <span>Total</span>
          <span style={{ color: BRAND_COLOR }}>R${formatPrice(total)}</span>
        </div>
      </div>

      {error && <p className="mx-4 mt-3 text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-lg mx-auto">
        <button
          data-cta="finalizar"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-lg text-white font-bold text-[16px] disabled:opacity-60"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          {loading ? 'Gerando pedido...' : paymentMethod === 'pix' ? 'Finalizar com Pix' : 'Finalizar com Cartão'}
        </button>
      </div>
    </div>
  );
}
