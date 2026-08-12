import { Routes, Route, Navigate } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import UpsellPage from './pages/UpsellPage';
import ThankYouPage from './pages/ThankYouPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop/product/851678b1-db4b-4c4e-989a-7097c17f6e3b" replace />} />
      <Route path="/shop/product/:id" element={<ProductPage />} />
      <Route path="/shop/checkout" element={<CheckoutPage />} />
      <Route path="/shop/payment-confirmation" element={<PaymentConfirmationPage />} />
      <Route path="/shop/upsell" element={<UpsellPage />} />
      <Route path="/obrigado-pela-compra" element={<ThankYouPage />} />
    </Routes>
  );
}
