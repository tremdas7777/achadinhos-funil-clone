import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  createPixTransaction,
  getTransaction,
  isPaidStatus,
} from './ironpay.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase não configurado');
  return createClient(url, key);
}

function getPostbackUrl() {
  if (Deno.env.get('IRONPAY_POSTBACK_URL')) return Deno.env.get('IRONPAY_POSTBACK_URL')!;
  const base = Deno.env.get('PUBLIC_BASE_URL') || Deno.env.get('SUPABASE_URL') || '';
  return `${base.replace(/\/$/, '')}/functions/v1/achadinhos-api/webhooks/ironpay`;
}

function markOrderPaid(order: Record<string, unknown>, payload: Record<string, unknown> = {}) {
  order.status = 'paid';
  order.paid_at = payload.paid_at || new Date().toISOString();
  order.ironpay_status = payload.status || 'paid';
}

function buildOrderRecord({
  orderId,
  customer,
  address,
  items,
  bump_items,
  total,
  subtotal,
  shipping,
  insurance,
  ironpay,
}: {
  orderId: string;
  customer: Record<string, string>;
  address: Record<string, string>;
  items: Array<Record<string, unknown>>;
  bump_items: Array<Record<string, unknown>>;
  total: number;
  subtotal: number;
  shipping: number;
  insurance: boolean;
  ironpay: Record<string, unknown>;
}) {
  return {
    id: orderId,
    status: isPaidStatus(ironpay.payment_status) ? 'paid' : 'pending',
    payment_method: 'pix',
    ironpay_transaction_hash: ironpay.hash,
    ironpay_status: ironpay.payment_status,
    ironpay_ticket: ironpay.ticket || (ironpay.hash ? 'base' : null),
    customer_name: customer.name,
    customer_email: customer.email || `${customer.phone.replace(/\D/g, '')}@checkout.local`,
    customer_phone: customer.phone,
    customer_cpf: customer.cpf,
    address_street: `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`,
    address_city: address.city,
    address_state: address.state,
    address_zip: address.zip,
    address_neighborhood: address.neighborhood,
    subtotal: Number(subtotal),
    shipping: Number(shipping),
    insurance: insurance ? 10.21 : 0,
    total: Number(total),
    items: [
      ...items.map((i) => ({
        product_id: i.product_id,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
        selected_color: i.selected_color || null,
        selected_size: i.selected_size || null,
      })),
      ...bump_items.map((i) => ({
        product_id: i.product_id,
        product_name: `[Bump] ${i.name}`,
        price: i.price,
        quantity: 1,
        selected_color: null,
        selected_size: null,
      })),
    ],
    pix: ironpay.pix,
    created_at: new Date().toISOString(),
    paid_at: isPaidStatus(ironpay.payment_status) ? new Date().toISOString() : null,
  };
}

async function loadOrder(supabase: ReturnType<typeof createClient>, id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...(data.payload as Record<string, unknown>),
    id: data.id,
    status: data.status,
    ironpay_transaction_hash: data.ironpay_transaction_hash,
    paid_at: data.paid_at,
  };
}

async function saveOrder(
  supabase: ReturnType<typeof createClient>,
  order: Record<string, unknown>,
) {
  const { error } = await supabase.from('orders').upsert({
    id: order.id,
    status: order.status,
    ironpay_transaction_hash: order.ironpay_transaction_hash,
    payload: order,
    paid_at: order.paid_at || null,
  });

  if (error) throw error;
}

function routePath(req: Request) {
  const url = new URL(req.url);
  const prefix = '/achadinhos-api';
  const path = url.pathname.includes(prefix)
    ? url.pathname.slice(url.pathname.indexOf(prefix) + prefix.length)
    : url.pathname;
  return path || '/';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const path = routePath(req);
  const supabase = getSupabase();

  try {
    if (req.method === 'POST' && path === '/orders') {
      const body = await req.json();
      const {
        customer,
        address,
        items,
        bump_items = [],
        insurance = false,
        total,
        subtotal,
        shipping = 0,
        tracking = {},
      } = body;

      if (!customer?.name || !customer?.phone || !customer?.cpf) {
        return json({ error: 'Dados do cliente incompletos' }, 400);
      }

      const email = String(customer.email || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json({ error: 'Informe um e-mail válido' }, 400);
      }
      if (!items?.length) return json({ error: 'Carrinho vazio' }, 400);

      const allItems = [
        ...items.map((i: Record<string, unknown>) => ({ ...i, is_bump: false })),
        ...bump_items.map((i: Record<string, unknown>) => ({ ...i, quantity: 1, is_bump: true })),
      ];

      const insuranceValue = insurance ? 10.21 : 0;
      const computedTotal =
        allItems.reduce(
          (sum: number, i: Record<string, unknown>) =>
            sum + Number(i.price) * (Number(i.quantity) || 1),
          0,
        ) +
        Number(shipping || 0) +
        insuranceValue;

      const hasBump = bump_items.length > 0;
      const ironpay = await createPixTransaction({
        amount: computedTotal,
        customer,
        address,
        items: allItems,
        tracking,
        postbackUrl: getPostbackUrl(),
        hasBump,
      });

      const orderId = crypto.randomUUID();
      const order = buildOrderRecord({
        orderId,
        customer,
        address,
        items,
        bump_items,
        total: computedTotal,
        subtotal: allItems.reduce(
          (sum: number, i: Record<string, unknown>) =>
            sum + Number(i.price) * (Number(i.quantity) || 1),
          0,
        ),
        shipping,
        insurance,
        ironpay,
      });

      await saveOrder(supabase, order);

      return json({
        order,
        payment: {
          pix: ironpay.pix,
          transaction_id: ironpay.hash,
          transaction_hash: ironpay.hash,
          payment_status: ironpay.payment_status,
        },
      });
    }

    if (req.method === 'GET' && path.match(/^\/orders\/[^/]+\/payment-status$/)) {
      const id = path.split('/')[2];
      const order = await loadOrder(supabase, id);
      if (!order) return json({ error: 'Pedido não encontrado' }, 404);

      if (order.status === 'paid') {
        return json({ order, paid: true, payment_status: 'paid' });
      }

      if (!order.ironpay_transaction_hash) {
        return json({ error: 'Pedido sem transação IronPay' }, 400);
      }

      const ironpay = await getTransaction(String(order.ironpay_transaction_hash));
      if (isPaidStatus(ironpay.payment_status)) {
        markOrderPaid(order, { status: ironpay.payment_status });
        order.pix = ironpay.pix?.qrcode ? ironpay.pix : order.pix;
        await saveOrder(supabase, order);
      }

      return json({
        order,
        paid: order.status === 'paid',
        payment_status: ironpay.payment_status,
      });
    }

    if (req.method === 'GET' && path.match(/^\/orders\/[^/]+$/)) {
      const id = path.split('/')[2];
      const order = await loadOrder(supabase, id);
      if (!order) return json({ error: 'Pedido não encontrado' }, 404);
      return json({ order });
    }

    if (req.method === 'POST' && path === '/webhooks/ironpay') {
      const payload = await req.json();
      const transactionHash = payload.transaction_hash || payload.hash;
      const status = payload.status || payload.payment_status;

      if (!transactionHash) return json({ error: 'transaction_hash ausente' }, 400);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ironpay_transaction_hash', transactionHash)
        .maybeSingle();

      if (error) throw error;

      if (data && isPaidStatus(status)) {
        const order = {
          ...(data.payload as Record<string, unknown>),
          id: data.id,
          status: data.status,
          ironpay_transaction_hash: data.ironpay_transaction_hash,
        };
        markOrderPaid(order, payload);
        await saveOrder(supabase, order);
      }

      return json({ received: true });
    }

    if (req.method === 'POST' && path === '/upsell-payment') {
      const { order_id, offer_id, product_name, shipping_price, customer, address } =
        await req.json();

      if (!customer || !address) {
        return json({ error: 'Dados do cliente necessários para o upsell' }, 400);
      }

      const ironpay = await createPixTransaction({
        amount: shipping_price,
        customer,
        address,
        items: [{ name: product_name, price: shipping_price, quantity: 1 }],
        postbackUrl: getPostbackUrl(),
        offerHash: Deno.env.get('IRONPAY_UPSELL_OFFER_HASH') || undefined,
      });

      return json({
        upsell_payment_id: crypto.randomUUID(),
        order_id,
        offer_id,
        product_name,
        amount: Number(shipping_price),
        status: ironpay.payment_status,
        transaction_hash: ironpay.hash,
        pix: ironpay.pix,
      });
    }

    return json({ error: 'Rota não encontrada' }, 404);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return json({ error: message }, 500);
  }
});
