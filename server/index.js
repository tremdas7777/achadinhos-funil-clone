import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createPixTransaction,
  getTransaction,
  isPaidStatus,
} from './ironpay.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const app = express();
app.use(cors());
app.use(express.json());

function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function findOrder(orders, id) {
  return orders.find((o) => o.id === id);
}

function getPostbackUrl() {
  if (process.env.IRONPAY_POSTBACK_URL) return process.env.IRONPAY_POSTBACK_URL;
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${base.replace(/\/$/, '')}/api/webhooks/ironpay`;
}

function markOrderPaid(order, payload = {}) {
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

app.post('/api/orders', async (req, res) => {
  try {
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
    } = req.body;

    if (!customer?.name || !customer?.phone || !customer?.cpf) {
      return res.status(400).json({ error: 'Dados do cliente incompletos' });
    }

    const email = String(customer.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'Informe um e-mail válido' });
    }

    if (!items?.length) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    const allItems = [
      ...items.map((i) => ({ ...i, name: i.name, image_url: i.image_url, is_bump: false })),
      ...bump_items.map((i) => ({
        ...i,
        name: i.name,
        image_url: i.image_url,
        quantity: 1,
        is_bump: true,
      })),
    ];

    const insuranceValue = insurance ? 10.21 : 0;
    const computedTotal =
      allItems.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0) +
      Number(shipping || 0) +
      insuranceValue;

    const finalTotal = computedTotal;

    const hasBump = bump_items.length > 0;

    const ironpay = await createPixTransaction({
      amount: finalTotal,
      customer,
      address,
      items: allItems,
      tracking,
      postbackUrl: getPostbackUrl(),
      hasBump,
    });

    const orderId = uuidv4();
    const order = buildOrderRecord({
      orderId,
      customer,
      address,
      items,
      bump_items,
      total: finalTotal,
      subtotal: allItems.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0),
      shipping,
      insurance,
      ironpay,
    });

    const orders = readOrders();
    orders.unshift(order);
    writeOrders(orders);

    res.json({
      order,
      payment: {
        pix: ironpay.pix,
        transaction_id: ironpay.hash,
        transaction_hash: ironpay.hash,
        payment_status: ironpay.payment_status,
      },
    });
  } catch (error) {
    console.error('Erro ao criar pedido IronPay:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar Pix na IronPay' });
  }
});

app.get('/api/orders/:id/payment-status', async (req, res) => {
  try {
    const orders = readOrders();
    const order = findOrder(orders, req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    if (order.status === 'paid') {
      return res.json({ order, paid: true, payment_status: 'paid' });
    }

    if (!order.ironpay_transaction_hash) {
      return res.status(400).json({ error: 'Pedido sem transação IronPay' });
    }

    const ironpay = await getTransaction(order.ironpay_transaction_hash);
    if (isPaidStatus(ironpay.payment_status)) {
      markOrderPaid(order, { status: ironpay.payment_status });
      order.pix = ironpay.pix?.qrcode ? ironpay.pix : order.pix;
      writeOrders(orders);
    }

    res.json({
      order,
      paid: order.status === 'paid',
      payment_status: ironpay.payment_status,
    });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar pagamento' });
  }
});

app.post('/api/webhooks/ironpay', (req, res) => {
  const payload = req.body || {};
  const transactionHash = payload.transaction_hash || payload.hash;
  const status = payload.status || payload.payment_status;

  if (!transactionHash) {
    return res.status(400).json({ error: 'transaction_hash ausente' });
  }

  const orders = readOrders();
  const order = orders.find((o) => o.ironpay_transaction_hash === transactionHash);

  if (order && isPaidStatus(status)) {
    markOrderPaid(order, payload);
    writeOrders(orders);
  }

  res.json({ received: true });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = findOrder(orders, req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ order });
});

app.get('/api/orders', (_req, res) => {
  res.json({ orders: readOrders() });
});

app.post('/api/upsell-payment', async (req, res) => {
  try {
    const { order_id, offer_id, product_name, shipping_price, customer, address } = req.body;

    if (!customer || !address) {
      return res.status(400).json({ error: 'Dados do cliente necessários para o upsell' });
    }

    const ironpay = await createPixTransaction({
      amount: shipping_price,
      customer,
      address,
      items: [{ name: product_name, price: shipping_price, quantity: 1 }],
      postbackUrl: getPostbackUrl(),
      offerHash: process.env.IRONPAY_UPSELL_OFFER_HASH || undefined,
    });

    res.json({
      upsell_payment_id: uuidv4(),
      order_id,
      offer_id,
      product_name,
      amount: Number(shipping_price),
      status: ironpay.payment_status,
      transaction_hash: ironpay.hash,
      pix: ironpay.pix,
    });
  } catch (error) {
    console.error('Erro upsell IronPay:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar Pix do upsell' });
  }
});

const PORT = process.env.PORT || 3001;

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Webhook IronPay: ${getPostbackUrl()}`);
});
