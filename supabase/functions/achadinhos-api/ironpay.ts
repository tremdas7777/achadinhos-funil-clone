const BASE_URL = 'https://api.ironpayapp.com.br/api/public/v1';

export const IRONPAY_TICKETS = {
  base: { amount: 57.5, cents: 5750, label: 'Espelho (R$ 57,50)' },
  combo: { amount: 77.4, cents: 7740, label: 'Espelho + Bump (R$ 77,40)' },
};

function getConfig() {
  const apiToken = Deno.env.get('IRONPAY_API_TOKEN');
  const offerHash = Deno.env.get('IRONPAY_OFFER_HASH');
  const bumpOfferHash = Deno.env.get('IRONPAY_BUMP_OFFER_HASH');
  const productHash = Deno.env.get('IRONPAY_PRODUCT_HASH');

  if (!apiToken) throw new Error('IRONPAY_API_TOKEN não configurado');
  if (!offerHash) throw new Error('IRONPAY_OFFER_HASH não configurado');
  if (!bumpOfferHash) throw new Error('IRONPAY_BUMP_OFFER_HASH não configurado');
  if (!productHash) throw new Error('IRONPAY_PRODUCT_HASH não configurado');

  return { apiToken, offerHash, bumpOfferHash, productHash };
}

export function resolveIronpayTicket({
  hasBump,
  amountCents,
}: {
  hasBump: boolean;
  amountCents: number;
}) {
  getConfig();

  if (hasBump) {
    return {
      ticket: 'combo',
      offerHash: Deno.env.get('IRONPAY_BUMP_OFFER_HASH')!,
      ...IRONPAY_TICKETS.combo,
    };
  }

  return {
    ticket: 'base',
    offerHash: Deno.env.get('IRONPAY_OFFER_HASH')!,
    ...IRONPAY_TICKETS.base,
  };
}

function toCents(value: number | string) {
  return Math.round(Number(value) * 100);
}

function stripDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function buildQrImage(pixCode: string | null) {
  if (!pixCode) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;
}

function mapPixPayload(transaction: Record<string, unknown>) {
  const pix = transaction?.pix as Record<string, string> | undefined;
  const pixCode = pix?.pix_qr_code || pix?.qr_code || null;

  return {
    qrcode: pixCode,
    code: pixCode,
    emv: pixCode,
    qrcode_image: buildQrImage(pixCode),
    qrcode_url: buildQrImage(pixCode),
  };
}

async function ironpayRequest(path: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}) {
  const { apiToken } = getConfig();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_token', apiToken);

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: Record<string, unknown>;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`IronPay retornou resposta inválida (${response.status})`);
  }

  if (!response.ok) {
    const message =
      (data?.message as string) ||
      (data?.error as string) ||
      (Array.isArray(data?.errors) ? (data.errors as string[]).join(', ') : null) ||
      `Erro IronPay (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function buildIronpayCustomer(
  customer: Record<string, string>,
  address: Record<string, string>,
) {
  return {
    name: customer.name,
    email: customer.email || `${stripDigits(customer.phone)}@checkout.local`,
    phone_number: stripDigits(customer.phone),
    document: stripDigits(customer.cpf),
    street_name: address.street,
    number: address.number,
    complement: address.complement || '',
    neighborhood: address.neighborhood || '',
    city: address.city,
    state: address.state,
    zip_code: stripDigits(address.zip),
  };
}

export function buildIronpayCart(
  items: Array<Record<string, unknown>>,
  defaultProductHash: string,
  bumpProductHash: string,
) {
  return items.map((item) => ({
    product_hash: item.is_bump && bumpProductHash ? bumpProductHash : defaultProductHash,
    title: String(item.name || 'Produto').trim(),
    cover: (item.image_url as string) || null,
    price: toCents(item.price as number),
    quantity: (item.quantity as number) || 1,
    operation_type: 1,
    tangible: true,
  }));
}

export async function createPixTransaction({
  amount,
  customer,
  address,
  items,
  tracking = {},
  postbackUrl,
  offerHash,
  hasBump = false,
}: {
  amount: number;
  customer: Record<string, string>;
  address: Record<string, string>;
  items: Array<Record<string, unknown>>;
  tracking?: Record<string, string>;
  postbackUrl?: string;
  offerHash?: string;
  hasBump?: boolean;
}) {
  const config = getConfig();
  const amountCents = toCents(amount);
  const ticket = resolveIronpayTicket({ hasBump, amountCents });

  const payload: Record<string, unknown> = {
    amount: amountCents,
    offer_hash: offerHash || ticket.offerHash,
    payment_method: 'pix',
    installments: 1,
    expire_in_days: 1,
    transaction_origin: 'api',
    customer: buildIronpayCustomer(customer, address),
    cart: buildIronpayCart(
      items,
      config.productHash,
      Deno.env.get('IRONPAY_BUMP_PRODUCT_HASH') || config.productHash,
    ),
    tracking: {
      src: tracking.src || '',
      utm_source: tracking.utm_source || '',
      utm_medium: tracking.utm_medium || '',
      utm_campaign: tracking.utm_campaign || '',
      utm_term: tracking.utm_term || '',
      utm_content: tracking.utm_content || '',
    },
  };

  if (postbackUrl) payload.postback_url = postbackUrl;

  const data = await ironpayRequest('/transactions', { method: 'POST', body: payload });
  const transaction = (data?.data || data) as Record<string, unknown>;

  return {
    transaction,
    hash: (transaction?.hash as string) || (data?.hash as string),
    payment_status: (transaction?.payment_status as string) || (transaction?.status as string) || 'pending',
    pix: mapPixPayload(transaction),
    ticket: ticket.ticket,
    ticket_label: ticket.label,
  };
}

export async function getTransaction(hash: string) {
  const data = await ironpayRequest(`/transactions/${hash}`);
  const transaction = (data?.data || data) as Record<string, unknown>;

  return {
    transaction,
    hash: (transaction?.hash as string) || hash,
    payment_status: (transaction?.payment_status as string) || (transaction?.status as string) || 'pending',
    pix: mapPixPayload(transaction),
  };
}

export function isPaidStatus(status: unknown) {
  return ['paid', 'approved', 'completed'].includes(String(status || '').toLowerCase());
}
