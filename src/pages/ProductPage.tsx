import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BRAND_COLOR,
  CART_BAR_COLOR,
  product,
  variants,
  reviews,
  relatedProducts,
} from '../data/product';
import {
  formatPrice,
  formatSoldCount,
  splitPrice,
  installmentPrice,
  getInitial,
} from '../utils/format';
import { seedDefaultCart, useCart } from '../context/CartContext';

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [showSheet, setShowSheet] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const gallery = variants.map((v) => v.image_url);
  const selectedVariant = variants[selectedColorIndex];
  const pixParts = splitPrice(product.price);
  const installment = installmentPrice(product.original_price);
  const originalFormatted = formatPrice(product.original_price);

  const scrollToImage = (index: number) => {
    setImageIndex(index);
    setSelectedColorIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.clientWidth * index,
        behavior: 'smooth',
      });
    }
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setImageIndex(idx);
    setSelectedColorIndex(idx);
  };

  const goCheckout = () => {
    seedDefaultCart(addItem, selectedVariant.color_name, selectedSize);
    navigate('/shop/checkout');
  };

  const shareProduct = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name.trim(), url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-14 max-w-lg mx-auto">
      <div className="relative bg-white">
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center relative">
              <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <span className="text-white text-lg leading-none font-bold">⋮</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {gallery.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={product.name}
                className="w-full aspect-square object-cover flex-shrink-0 snap-center"
              />
            ))}
          </div>
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {imageIndex + 1}/{gallery.length}
          </span>
        </div>
      </div>

      <div className="bg-white">
        <div className="px-4 pt-3 pb-1 flex items-start justify-between">
          <div>
            <div className="flex items-baseline">
              <span className="text-sm font-semibold" style={{ color: BRAND_COLOR }}>
                R$
              </span>
              <span className="text-[32px] font-bold leading-none" style={{ color: BRAND_COLOR }}>
                {pixParts.reais}
              </span>
              <span className="text-lg font-bold" style={{ color: BRAND_COLOR }}>
                ,{pixParts.centavos}
              </span>
              <span className="text-sm ml-1" style={{ color: BRAND_COLOR }}>
                no Pix &gt;
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Ou R${originalFormatted} em até 12x R${installment} &gt;
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-2">
            <span className="text-[13px] text-gray-500">{formatSoldCount(product.sold_count)} Vendido(s)</span>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>
        </div>

        <div className="px-4 pt-2 pb-3 flex items-start gap-2">
          <h1 className="text-[15px] leading-snug text-gray-800 flex-1">{product.name.trim()}</h1>
          <button
            type="button"
            onClick={shareProduct}
            className="shrink-0 text-[12px] px-2 py-1 rounded border border-gray-200 text-gray-600"
          >
            Compartilhar
          </button>
        </div>

        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <p className="text-[15px] font-bold mb-3">Cor: {selectedVariant.color_name}</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {variants.map((v, i) => (
              <div key={v.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => scrollToImage(i)}
                  className="w-[60px] h-[60px] rounded overflow-hidden border-2 transition-colors"
                  style={{ borderColor: selectedColorIndex === i ? BRAND_COLOR : '#e8e8e8' }}
                >
                  <img src={v.image_url} alt={v.color_name} className="w-full h-full object-cover" />
                </button>
                <span className="text-[10px] text-gray-500 max-w-[60px] truncate text-center">{v.color_name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-[15px] font-bold mb-3">Tamanho</p>
          <div className="flex gap-2.5 flex-wrap">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className="px-5 py-2 rounded text-[14px] border transition-colors"
                style={{
                  borderColor: selectedSize === size ? BRAND_COLOR : '#e0e0e0',
                  color: selectedSize === size ? BRAND_COLOR : '#333',
                  backgroundColor: selectedSize === size ? '#fff5f0' : '#f5f5f5',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white mt-2">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-[14px]">
            <svg className="h-5 w-5 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>
              <span className="text-green-600 font-semibold">Frete grátis</span>{' '}
              <span className="line-through text-gray-400 text-[13px]">R$16,91</span>{' '}
              <span>R$0,00 com cupom</span>
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5 text-[14px]">
            <span className="text-lg">🎁</span>
            <span>SParcelado: Parcele em até 12x</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white mt-2">
        <div className="flex border-b border-gray-100">
          <div
            className="flex-1 py-3 text-center text-[14px] font-medium text-gray-800 border-b-2"
            style={{ borderBottomColor: BRAND_COLOR }}
          >
            Especificação
          </div>
          <div className="flex-1 py-3 text-center text-[14px] text-gray-400 flex items-center justify-center gap-1">
            Estoque, País de Orig...
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
        <div className="px-4 py-4">
          <p className="text-[15px] font-bold mb-3">Descrição</p>
          <div className={`text-[14px] text-gray-600 leading-relaxed ${showDesc ? '' : 'max-h-[120px] overflow-hidden'}`}>
            <p className="mb-1">🔥 {product.description.trim()}</p>
          </div>
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="w-full py-3 flex items-center justify-center gap-1 text-[14px] text-gray-500 border-t border-gray-100 mt-2"
          >
            {showDesc ? 'Ver Menos' : 'Ver Mais'}
            <svg
              className={`h-4 w-4 transition-transform ${showDesc ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white mt-2 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold">{product.rating}</span>
            <StarRating rating={product.rating} />
            <span className="text-[13px] text-gray-500">Avaliações do produto ({product.rating_count})</span>
          </div>
          <div className="flex items-center text-[13px] text-gray-500">
            Ver mais <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="border-t border-gray-100 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  {getInitial(review.username)}
                </div>
                <span className="text-[13px] font-medium">{review.username}</span>
              </div>
              <span className="text-[11px] text-gray-400">Útil ({review.helpful_count}) 👍</span>
            </div>
            <p className="text-[13px] text-gray-700">{review.comment}</p>
            {review.images.length > 0 && (
              <img src={review.images[0]} alt="" className="w-20 h-20 object-cover rounded mt-2" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white mt-2 px-4 py-4">
        <div className="flex items-center mb-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-4 text-[14px] font-medium text-gray-600">Você Também Pode Gostar</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {relatedProducts.map((item) => {
            const parts = splitPrice(item.price);
            return (
              <div key={item.id} className="bg-white rounded-sm overflow-hidden border border-gray-100">
                <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover" loading="lazy" />
                <div className="p-2">
                  {item.badge && <span className="text-[10px] text-brand font-bold">{item.badge} </span>}
                  <p className="text-xs line-clamp-2 leading-tight text-gray-800">{item.name}</p>
                  <StarRating rating={item.rating} />
                  <div className="flex items-end gap-0.5 mt-1" style={{ color: BRAND_COLOR }}>
                    <span className="text-[10px] font-bold">R$</span>
                    <span className="font-bold text-[22px] leading-none">{parts.reais}</span>
                    <span className="font-bold text-[12px] leading-none">,{parts.centavos}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-[11px]" style={{ color: BRAND_COLOR }}>
                      no Pix
                    </span>
                    <span className="text-[10px] text-gray-400">{formatSoldCount(item.sold_count)} Vendido(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex z-50 h-[50px] max-w-lg mx-auto">
        <button
          className="flex items-center justify-center px-6"
          style={{ backgroundColor: CART_BAR_COLOR }}
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <div className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <button
          className="flex items-center justify-center px-6 relative"
          style={{ backgroundColor: CART_BAR_COLOR }}
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </button>
        <button
          onClick={() => setShowSheet(true)}
          className="flex-1 text-white text-[16px] font-medium"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          Compre agora
        </button>
      </div>

      {showSheet && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 animate-slide-up max-w-lg mx-auto">
            <button onClick={() => setShowSheet(false)} className="absolute top-4 right-4 text-gray-400 text-xl">
              ✕
            </button>
            <div className="flex gap-3 mb-4">
              <img src={selectedVariant.image_url} alt="" className="w-20 h-20 object-cover rounded" />
              <div>
                <div className="flex items-baseline">
                  <span className="text-sm font-bold" style={{ color: BRAND_COLOR }}>
                    R$
                  </span>
                  <span className="text-xl font-bold" style={{ color: BRAND_COLOR }}>
                    {pixParts.reais},{pixParts.centavos}
                  </span>
                  <span className="text-xs ml-1" style={{ color: BRAND_COLOR }}>
                    no Pix
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">
                  {selectedVariant.color_name} · {selectedSize}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowSheet(false);
                goCheckout();
              }}
              className="w-full py-3 rounded-lg text-white font-medium text-[15px]"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Compre agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
