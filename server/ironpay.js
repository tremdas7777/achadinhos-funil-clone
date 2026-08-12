const BASE_URL = 'https://api.ironpayapp.com.br/api/public/v1';

/** Ticket 1: só espelho R$ 57,50 | Ticket 2: espelho + bump R$ 77,40 */
export const IRONPAY_TICKETS = {
  base: { amount: 57.5, cents: 5750, label: 'Espelho (R$ 57,50)' },
  combo: { amount: 77.4, cents: 7740, label: 'Espelho + Bump (R$ 77,40)' },
};

function getConfig() {
  const apiToken = process.env.IRONPAY_API_TOKEN;
  const offerHash = process.env.IRONPAY_OFFER_HASH;
  const bumpOfferHash = process.env.IRONPAY_BUMP_OFFER_HASH;
  const productHash = process.env.IRONPAY_PRODUCT_HASH;

  if (!apiToken) {
    throw new Error('IRONPAY_API_TOKEN não configurado. Defina no arquivo .env');
  }
  if (!offerHash) {
    throw new Error('IRONPAY_OFFER_HASH não configurado (ticket R$ 57,50). Defina no .env');
  }
  if (!bumpOfferHash) {
    throw new Error('IRONPAY_BUMP_OFFER_HASH não configurado (ticket R$ 77,40). Defina no .env');
  }
  if (!productHash) {
    throw new Error('IRONPAY_PRODUCT_HASH não configurado. Defina no arquivo .env');
  }

  return { apiToken, offerHash, bumpOfferHash, productHash };
}

/** Escolhe a oferta IronPay conforme o ticket (com ou sem bump). */
export function resolveIronpayTicket({ hasBump, amountCents }) {
  getConfig();

  if (hasBump) {
    if (amountCents !== IRONPAY_TICKETS.combo.cents && amountCents !== IRONPAY_TICKETS.combo.cents + 1021) {
      // 1021 = seguro R$ 10,21 opcional
      console.warn(`Total ${amountCents} centavos — ticket combo esperado ${IRONPAY_TICKETS.combo.cents}`);
    }
    return {
      ticket: 'combo',
      offerHash: process.env.IRONPAY_BUMP_OFFER_HASH,
      ...IRONPAY_TICKETS.combo,
    };
  }

  if (amountCents !== IRONPAY_TICKETS.base.cents && amountCents !== IRONPAY_TICKETS.base.cents + 1021) {
    console.warn(`Total ${amountCents} centavos — ticket base esperado ${IRONPAY_TICKETS.base.cents}`);
  }

  return {
    ticket: 'base',
    offerHash: process.env.IRONPAY_OFFER_HASH,
    ...IRONPAY_TICKETS.base,
  };
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function stripDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function buildQrImage(pixCode) {
  if (!pixCode) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;
}

function mapPixPayload(transaction) {
  const pixCode = transaction?.pix?.pix_qr_code || transaction?.pix?.qr_code || null;
  const qrImage = buildQrImage(pixCode);

  return {
    qrcode: pixCode,
    code: pixCode,
    emv: pixCode,
    qrcode_image: qrImage,
    qrcode_url: qrImage,
  };
}

async function ironpayRequest(path, { method = 'GET', body } = {}) {
  const { apiToken } = getConfig();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_token', apiToken);

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`IronPay retornou resposta inválida (${response.status})`);
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
      `Erro IronPay (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function buildIronpayCustomer(customer, address) {
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

export function buildIronpayCart(items, defaultProductHash, bumpProductHash) {
  return items.map((item) => ({
    product_hash: item.is_bump && bumpProductHash ? bumpProductHash : defaultProductHash,
    title: item.name?.trim() || 'Produto',
    cover: item.image_url || null,
    price: toCents(item.price),
    quantity: item.quantity || 1,
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
}) {
  const config = getConfig();
  const amountCents = toCents(amount);
  const ticket = resolveIronpayTicket({ hasBump, amountCents });

  const payload = {
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
      process.env.IRONPAY_BUMP_PRODUCT_HASH || config.productHash,
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

  if (postbackUrl) {
    payload.postback_url = postbackUrl;
  }

  const data = await ironpayRequest('/transactions', { method: 'POST', body: payload });
  const transaction = data?.data || data;

  return {
    transaction,
    hash: transaction?.hash || data?.hash,
    payment_status: transaction?.payment_status || transaction?.status || 'pending',
    pix: mapPixPayload(transaction),
    ticket: ticket.ticket,
    ticket_label: ticket.label,
  };
}

export async function getTransaction(hash) {
  const data = await ironpayRequest(`/transactions/${hash}`);
  const transaction = data?.data || data;

  return {
    transaction,
    hash: transaction?.hash || hash,
    payment_status: transaction?.payment_status || transaction?.status || 'pending',
    pix: mapPixPayload(transaction),
  };
}

export function isPaidStatus(status) {
  return ['paid', 'approved', 'completed'].includes(String(status || '').toLowerCase());
}
