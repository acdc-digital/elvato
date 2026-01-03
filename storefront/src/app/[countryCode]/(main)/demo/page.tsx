"use client"

import React, { useState } from 'react';

// Product data
const products = [
  {
    id: '7085522386993',
    handle: 'olamais-brandable-domain',
    title: 'Olamais (olamais.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/1-sYXTPDnzMqRzAJvlXq0SNesj_p1Nf2L.jpg?v=1764436695&width=1080'
  },
  {
    id: '7085522354225',
    handle: 'luxamy-brandable-domain',
    title: 'Luxamy (luxamy.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/luxamy-brandable-domain.jpg?v=1764436695&width=1080'
  },
  {
    id: '7085522321457',
    handle: 'laremie-brandable-domain',
    title: 'Laremie (laremie.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/laremie-brandable-domain.jpg?v=1764436695&width=1080'
  },
  {
    id: '7085522157617',
    handle: 'bibliou-brandable-domain',
    title: 'Bibliou (bibliou.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/bibliou-brandable-domain.jpg?v=1764436695&width=1080'
  },
  {
    id: '7082966777905',
    handle: 'zingapore-brandable-domain',
    title: 'Zingapore (zingapore.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/1aq088kDUnPxKYJBuMkfPnxrH6eQ8CJyM.jpg?v=1763532980&width=1080'
  },
  {
    id: '7082950656049',
    handle: 'animationed-brandable-domain',
    title: 'Animationed (animationed.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/1eRqKS9dNZZNZ16eeQqEkX0rLALU1x97.jpg?v=1763518332&width=1080'
  },
  {
    id: '7085522649137',
    handle: 'zendley-brandable-domain',
    title: 'Zendley (zendley.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/1F4hJ8c8UHxOxNLxM0hWvWljq8XuEnXVw.jpg?v=1764436715&width=1080'
  },
  {
    id: '7083080482865',
    handle: 'gaasm-brandable-domain',
    title: 'Gaasm (gaasm.com)',
    price: '$2,995.00',
    image: '//brandlesse.com/cdn/shop/files/gaasm-brandable-domain.jpg?v=1763590593&width=1080'
  },
];

export default function DemoPage() {
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount] = useState(0);
  const [cartSubtotal] = useState('$0.00');
  const [searchQuery, setSearchQuery] = useState('');

  const cartEmpty = cartCount === 0;

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .visually-hidden {
          position: absolute !important;
          overflow: hidden;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          border: 0;
          clip: rect(0 0 0 0);
          word-wrap: normal !important;
        }

        .page-width {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .site-nav__link,
        .site-nav__dropdown-link:not(.site-nav__dropdown-link--top-level) {
          font-size: 14px;
        }

        .site-nav__link, .mobile-nav__link--top-level {
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        .mobile-nav__link--top-level {
          font-size: 1.1em;
        }

        .site-header {
          box-shadow: 0 0 1px rgba(0,0,0,0.2);
          border-bottom: 1px solid #000;
          border-top: 1px solid #000;
        }

        .toolbar + .header-sticky-wrapper .site-header {
          border-top: 0;
        }

        .site-header__logo a {
          width: 60px;
        }

        .is-light .site-header__logo .logo--inverted {
          width: 60px;
        }

        @media only screen and (min-width: 769px) {
          .site-header__logo a {
            width: 100px;
          }

          .is-light .site-header__logo .logo--inverted {
            width: 100px;
          }
        }

        .header-item--logo,
        .header-layout--left-center .header-item--logo,
        .header-layout--left-center .header-item--icons {
          flex: 0 1 60px;
        }

        @media only screen and (min-width: 769px) {
          .header-item--logo,
          .header-layout--left-center .header-item--logo,
          .header-layout--left-center .header-item--icons {
            flex: 0 0 100px;
          }
        }

        .header-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 0;
        }

        .header-item--navigation {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .site-nav {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 30px;
        }

        .site-nav__item {
          list-style: none;
        }

        .site-nav__link {
          text-decoration: none;
          color: #000;
          font-weight: 400;
        }

        .site-nav__link:hover {
          opacity: 0.7;
        }

        .site-nav__icons {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .site-nav__link--icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
        }

        .site-nav__link--icon .icon {
          width: 22px;
          height: 22px;
        }

        .small--hide {
          display: none;
        }

        @media (min-width: 769px) {
          .small--hide {
            display: flex;
          }
          .medium-up--hide {
            display: none !important;
          }
        }

        /* Drawer Styles */
        .drawer {
          position: fixed;
          top: 0;
          right: -400px;
          width: 400px;
          max-width: 100%;
          height: 100%;
          background: #fff;
          z-index: 1000;
          transition: right 0.3s ease;
          box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        }

        .drawer.is-open {
          right: 0;
        }

        .drawer__contents {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .drawer__fixed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .drawer__title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .drawer__close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
        }

        .drawer__close-button .icon {
          width: 20px;
          height: 20px;
        }

        .drawer__scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .drawer__footer {
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .drawer__cart-empty {
          display: none;
        }

        .drawer.is-empty .drawer__cart-empty {
          display: block;
        }

        .drawer.is-empty .drawer__inner {
          display: none;
        }

        .mobile-nav {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mobile-nav__item {
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }

        .mobile-nav__link {
          text-decoration: none;
          color: #000;
          font-size: 16px;
        }

        .cart__checkout {
          width: 100%;
          padding: 15px;
          background: #000;
          color: #fff;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }

        .cart__item-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }

        .text-center {
          text-align: center;
        }

        /* Overlay */
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease;
        }

        .drawer-overlay.is-visible {
          opacity: 1;
          visibility: visible;
        }

        /* Hero Section - 3 Column Layout */
        .section-hero {
          border-bottom: 1px solid #000;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr 80px 1fr;
          }
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 24px;
          background: #fff;
          order: 1;
        }

        @media (min-width: 1024px) {
          .hero-content {
            padding: 40px 32px 40px 48px;
          }
        }

        .hero-ticker {
          display: none;
          order: 2;
          background: #fff;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          overflow: hidden;
          position: relative;
        }

        @media (min-width: 1024px) {
          .hero-ticker {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .hero-image {
          order: 3;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        @media (min-width: 1024px) {
          .hero-image {
            min-height: auto;
          }
        }

        .hero-image img {
          width: 70%;
          max-width: 400px;
          height: auto;
          object-fit: contain;
        }

        .hero-heading {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          line-height: 110%;
          font-family: Helvetica, Arial, sans-serif;
        }

        @media (min-width: 1024px) {
          .hero-heading {
            font-size: 56px;
          }
        }

        .hero-text {
          margin-top: 20px;
          font-size: 14px;
          line-height: 1.7;
          font-family: "Anonymous Pro", monospace;
          color: #000;
        }

        @media (min-width: 1024px) {
          .hero-text {
            margin-top: 28px;
            font-size: 16px;
          }
        }

        .hero-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 32px;
          padding: 16px 36px;
          background: #000;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          font-family: Helvetica, Arial, sans-serif;
          border-radius: 50px;
          border: none;
          transition: all 0.25s ease;
          max-width: fit-content;
        }

        @media (min-width: 1024px) {
          .hero-button {
            margin-top: 40px;
            padding: 18px 40px;
            font-size: 15px;
          }
        }

        .hero-button:hover {
          background: #333;
        }

        /* Vertical Scrolling Ticker */
        .ticker-vertical {
          display: flex;
          flex-direction: column;
          animation: ticker-vertical 20s infinite linear;
        }

        .ticker-vertical-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
        }

        .ticker-vertical-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;
        }

        .ticker-vertical-icon img {
          width: 100%;
          height: auto;
        }

        .ticker-vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-size: 24px;
          font-weight: 700;
          font-family: Helvetica, Arial, sans-serif;
          color: #000;
          transform: rotate(180deg);
        }

        @keyframes ticker-vertical {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        /* Mobile Ticker (horizontal) */
        .ticker-mobile {
          display: block;
          border-top: 1px solid #000;
          overflow: hidden;
          padding: 12px 0;
        }

        @media (min-width: 1024px) {
          .ticker-mobile {
            display: none;
          }
        }

        .ticker-list {
          display: flex;
          white-space: nowrap;
          animation: ticker 32s infinite linear;
          flex-shrink: 0;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .ticker-text {
          display: inline-block;
          margin: 0;
          font-size: 24px;
          color: #000;
          line-height: 130%;
          margin-right: 12px;
          font-weight: 700;
          font-family: Helvetica, Arial, sans-serif;
        }

        .ticker-icon {
          width: 28px;
        }

        .ticker-icon img {
          width: 100%;
          height: auto;
        }

        @keyframes ticker {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Product Grid */
        .grid--uniform {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 40px 0;
        }

        @media (min-width: 769px) {
          .grid--uniform {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .grid-product__content {
          padding: 10px 0;
        }

        .grid-product__image-mask {
          overflow: hidden;
          background: #f5f5f5;
          aspect-ratio: 1;
          position: relative;
        }

        .grid-product__image-mask img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .grid-product__link {
          text-decoration: none;
          color: inherit;
        }

        .grid-product__title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          margin-top: 10px;
        }

        .grid-product__price {
          font-size: 14px;
          color: #666;
        }

        /* Rich Text Sections */
        .rich-text-section {
          margin-top: 100px;
          margin-bottom: 40px;
          text-align: center;
        }

        .rich-text-section h2 {
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 20px;
        }

        .rich-text-section p {
          font-size: 1.2em;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Featured Product */
        .featured-product {
          padding: 40px 0;
        }

        .product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }

        @media (min-width: 769px) {
          .product-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .product-image-wrap {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: #f5f5f5;
        }

        .product-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-meta {
          padding: 20px 0;
        }

        .product-title {
          font-size: 1.8rem;
          font-weight: 400;
          margin: 0 0 20px;
        }

        .product-price {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .product-description {
          margin-bottom: 20px;
          line-height: 1.7;
        }

        .product-description p {
          margin-bottom: 15px;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 15px 30px;
          background: #000;
          color: #fff;
          border: none;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .add-to-cart-btn:hover {
          background: #333;
        }

        /* CTA Button */
        .cta-section {
          display: flex;
          justify-content: center;
          margin: 60px 0 120px;
        }

        .cta-button {
          display: inline-block;
          padding: 15px 40px;
          background: #000;
          color: #fff;
          text-decoration: none;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          background: #fff;
          color: #000;
          box-shadow: inset 0 0 0 1px #000;
        }

        /* Footer */
        .site-footer {
          padding: 40px 0;
          background: #f5f5f5;
          margin-top: 60px;
          border-top: 1px solid #000;
        }

        /* Icon styles */
        .icon {
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }

        .icon-close path {
          stroke: #000;
        }

        /* Search */
        .search-container {
          padding: 20px;
          background: #fff;
          border-bottom: 1px solid #000;
          display: none;
        }

        .search-container.is-open {
          display: block;
        }

        .search-input {
          width: 100%;
          padding: 15px;
          border: 1px solid #000;
          font-size: 16px;
        }

        /* Logo */
        .site-header__logo-link {
          display: block;
        }

        .site-header__logo-link img {
          width: 60px;
          height: auto;
        }

        @media (min-width: 769px) {
          .site-header__logo-link img {
            width: 100px;
          }
        }
      `}</style>

      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${navDrawerOpen || cartDrawerOpen ? 'is-visible' : ''}`}
        onClick={() => {
          setNavDrawerOpen(false);
          setCartDrawerOpen(false);
        }}
      />

      {/* Skip to content link */}
      <a className="visually-hidden" href="#MainContent">
        Skip to content
      </a>

      {/* Navigation Drawer */}
      <div className={`drawer ${navDrawerOpen ? 'is-open' : ''}`}>
        <div className="drawer__contents">
          <div className="drawer__fixed-header">
            <h2 className="drawer__title">Menu</h2>
            <button 
              className="drawer__close-button"
              onClick={() => setNavDrawerOpen(false)}
            >
              <svg className="icon icon-close" viewBox="0 0 64 64">
                <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" stroke="#000" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <div className="drawer__scrollable">
            <ul className="mobile-nav">
              <li className="mobile-nav__item">
                <a href="/" className="mobile-nav__link mobile-nav__link--top-level">Home</a>
              </li>
              <li className="mobile-nav__item">
                <a href="/collections/all-products" className="mobile-nav__link mobile-nav__link--top-level">Browse Domains</a>
              </li>
              <li className="mobile-nav__item">
                <a href="/pages/about-us" className="mobile-nav__link mobile-nav__link--top-level">About Us</a>
              </li>
              <li className="mobile-nav__item">
                <a href="/pages/how-it-works" className="mobile-nav__link mobile-nav__link--top-level">How it Works</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div className={`drawer ${cartEmpty ? 'is-empty' : ''} ${cartDrawerOpen ? 'is-open' : ''}`}>
        <div className="drawer__contents">
          <div className="drawer__fixed-header">
            <h2 className="drawer__title">Cart</h2>
            <button 
              className="drawer__close-button"
              onClick={() => setCartDrawerOpen(false)}
            >
              <svg className="icon icon-close" viewBox="0 0 64 64">
                <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" stroke="#000" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <div className="drawer__inner">
            <div className="drawer__scrollable">
              {/* Cart items would go here */}
            </div>
            <div className="drawer__footer">
              <div className="cart__item-row">
                <div>Subtotal</div>
                <div>{cartSubtotal}</div>
              </div>
              <div className="cart__item-row text-center">
                <small>Taxes and discount codes calculated at checkout.</small>
              </div>
              <button className="cart__checkout">Check out</button>
            </div>
          </div>
          <div className="drawer__cart-empty">
            <div className="drawer__scrollable">
              Your cart is currently empty.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="MainContent">
        {/* Hero Section - 3 Column Layout */}
        <section className="section-hero">
          <div className="hero-grid">
            {/* Left: Content */}
            <div className="hero-content">
              <h1 className="hero-heading">Brandable domains for your next project.</h1>
              <p className="hero-text">
                Brandlesse is a curated collection of premium .coms – handpicked, brand-ready, and available to be transferred to you today.
              </p>
              <a href="/collections/all-products" className="hero-button">
                GET A DOMAIN
              </a>

              {/* Mobile Ticker (horizontal) */}
              <div className="ticker-mobile">
                <div style={{ display: 'flex' }}>
                  <div className="ticker-list">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="ticker-item">
                        <div className="ticker-icon">
                          <img 
                            src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                            alt=""
                          />
                        </div>
                        <p className="ticker-text">com</p>
                      </div>
                    ))}
                  </div>
                  <div className="ticker-list">
                    {[...Array(12)].map((_, i) => (
                      <div key={`dup-${i}`} className="ticker-item">
                        <div className="ticker-icon">
                          <img 
                            src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                            alt=""
                          />
                        </div>
                        <p className="ticker-text">com</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Vertical Ticker */}
            <div className="hero-ticker">
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                <div className="ticker-vertical">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="ticker-vertical-item">
                      <div className="ticker-vertical-icon">
                        <img 
                          src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                          alt=""
                        />
                      </div>
                      <span className="ticker-vertical-text">com</span>
                    </div>
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div key={`dup-${i}`} className="ticker-vertical-item">
                      <div className="ticker-vertical-icon">
                        <img 
                          src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                          alt=""
                        />
                      </div>
                      <span className="ticker-vertical-text">com</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="hero-image">
              <img 
                src="//brandlesse.com/cdn/shop/files/Square_Logo.png?v=1763595913" 
                alt="BRANDLESSE"
              />
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="page-width">
          <div className="grid--uniform">
            {products.map((product) => (
              <div key={product.id} className="grid-product">
                <div className="grid-product__content">
                  <div className="grid-product__image-mask">
                    <img src={product.image} alt={product.title} />
                  </div>
                  <a href={`/products/${product.handle}`} className="grid-product__link">
                    <div className="grid-product__title">{product.title}</div>
                    <div className="grid-product__price">{product.price}</div>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Buy a Brand Section */}
        <section className="rich-text-section">
          <div className="page-width">
            <h2>Buy a Brand</h2>
            <p>These brandable domains are available for you to snap up.</p>
          </div>
        </section>

        {/* Featured Product - Debutee */}
        <section className="featured-product">
          <div className="page-width">
            <div className="product-grid">
              <div className="product-image-wrap">
                <img 
                  src="//brandlesse.com/cdn/shop/files/19kw9UAPc5teEt3b_LgexYdUHSyJ8tyWQ.jpg?v=1763532812&width=1080"
                  alt="Debutee (debutee.com)"
                />
              </div>
              <div className="product-meta">
                <h2 className="product-title">Debutee (debutee.com)</h2>
                <div className="product-price">$995.00</div>
                <div className="product-description">
                  <p>
                    debutee.com is an eight-character domain featuring the popular .com TLD, helping establish credibility. The name combines three syllables – "de-but-ee," which makes it catchy and memorable.
                  </p>
                  <p>
                    This could work for businesses in event planning, fashion, tech startups, talent management, and creative services. The domain&apos;s phonetic appeal, combined with its association with new beginnings, supports brand storytelling.
                  </p>
                </div>
                <button className="add-to-cart-btn">Add to cart</button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Button */}
        <div className="cta-section">
          <a href="/collections/all-products" className="cta-button">
            Browse All Domains
          </a>
        </div>

        {/* Snapshots Section */}
        <section className="rich-text-section">
          <div className="page-width">
            <h2>Snapshots</h2>
            <p>Here are some hot domains to check out. Each one is available and will be transferred to you after checkout.</p>
          </div>
        </section>

        {/* Featured Product - Glaussy */}
        <section className="featured-product">
          <div className="page-width">
            <div className="product-grid">
              <div className="product-image-wrap">
                <img 
                  src="//brandlesse.com/cdn/shop/files/1JHMI4inIpACrjhU7EllMedEg9VhNFGFM.jpg?v=1763532841&width=1080"
                  alt="Glaussy (glaussy.com)"
                />
              </div>
              <div className="product-meta">
                <h2 className="product-title">Glaussy (glaussy.com)</h2>
                <div className="product-price">$995.00</div>
                <div className="product-description">
                  <p>
                    glaussy.com is a 7-character domain featuring the .com TLD, known for global recognition. The name combines three syllables, promoting easy pronunciation and memorability.
                  </p>
                  <p>
                    This is an invented word, allowing for unique brand identity creation. It could work for businesses in beauty, wellness, tech startups, fashion, and creative agencies.
                  </p>
                </div>
                <button className="add-to-cart-btn">Add to cart</button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Button */}
        <div className="cta-section">
          <a href="/collections/all-products" className="cta-button">
            Browse All Domains
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="page-width">
          <p style={{ textAlign: 'center', margin: 0 }}>© 2026 brandlesse. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
