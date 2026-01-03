import React, { useState } from 'react';

interface DemoProps {
  className?: string;
}

const Demo: React.FC<DemoProps> = ({ className }) => {
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState('$0.00');
  const [searchQuery, setSearchQuery] = useState('');

  const cartEmpty = cartCount === 0;

  return (
    <div className={className}>
      <style>{`
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
          -webkit-box-flex: 0 1 60px;
          -ms-flex: 0 1 60px;
          flex: 0 1 60px;
        }

        @media only screen and (min-width: 769px) {
          .header-item--logo,
          .header-layout--left-center .header-item--logo,
          .header-layout--left-center .header-item--icons {
            -webkit-box-flex: 0 0 100px;
            -ms-flex: 0 0 100px;
            flex: 0 0 100px;
          }
        }
      `}</style>

      {/* Skip to content link */}
      <a className="in-page-link visually-hidden skip-link" href="#MainContent">
        Skip to content
      </a>

      {/* Page Container */}
      <div id="PageContainer" className="page-container">
        <div className="transition-body">
          {/* BEGIN sections: header-group */}
          
          {/* Header Section */}
          <div 
            id="shopify-section-sections--15611117273137__header" 
            className="shopify-section shopify-section-group-header-group"
          >
            {/* Navigation Drawer */}
            <div 
              id="NavDrawer" 
              className={`drawer drawer--right ${navDrawerOpen ? 'is-open' : ''}`}
            >
              <div className="drawer__contents">
                <div className="drawer__fixed-header">
                  <div className="drawer__header appear-animation appear-delay-1">
                    <h2 className="drawer__title"></h2>
                  </div>
                  <div className="drawer__close">
                    <button 
                      type="button" 
                      className="drawer__close-button js-drawer-close"
                      onClick={() => setNavDrawerOpen(false)}
                    >
                      <svg 
                        aria-hidden="true" 
                        focusable="false" 
                        role="presentation" 
                        className="icon icon-close" 
                        viewBox="0 0 64 64"
                      >
                        <title>icon-X</title>
                        <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" />
                      </svg>
                      <span className="icon__fallback-text">Close menu</span>
                    </button>
                  </div>
                </div>

                <div className="drawer__scrollable">
                  {/* Mobile Navigation */}
                  <ul className="mobile-nav" role="navigation" aria-label="Primary">
                    <li className="mobile-nav__item appear-animation appear-delay-2">
                      <a href="/" className="mobile-nav__link mobile-nav__link--top-level">Home</a>
                    </li>
                    <li className="mobile-nav__item appear-animation appear-delay-3">
                      <a href="/collections/all-products" className="mobile-nav__link mobile-nav__link--top-level">Browse Domains</a>
                    </li>
                    <li className="mobile-nav__item appear-animation appear-delay-4">
                      <a href="/pages/about-us" className="mobile-nav__link mobile-nav__link--top-level">About Us</a>
                    </li>
                    <li className="mobile-nav__item appear-animation appear-delay-5">
                      <a href="/pages/how-it-works" className="mobile-nav__link mobile-nav__link--top-level">How it Works</a>
                    </li>
                    <li className="mobile-nav__item mobile-nav__item--secondary">
                      <a href="/account" className="mobile-nav__link">Account</a>
                    </li>
                  </ul>

                  {/* Social Links */}
                  <ul className="mobile-nav__social appear-animation appear-delay-7">
                    {/* Social icons would go here */}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cart Drawer */}
            <div 
              id="CartDrawer" 
              className={`drawer drawer--right ${cartEmpty ? 'is-empty' : ''} ${cartDrawerOpen ? 'is-open' : ''}`}
            >
              <form 
                id="CartDrawerForm" 
                action="/cart" 
                method="post" 
                noValidate 
                className="drawer__contents" 
                data-location="cart-drawer"
              >
                <div className="drawer__fixed-header">
                  <div className="drawer__header appear-animation appear-delay-1">
                    <h2 className="drawer__title">Cart</h2>
                  </div>
                  <div className="drawer__close">
                    <button 
                      type="button" 
                      className="drawer__close-button js-drawer-close"
                      onClick={() => setCartDrawerOpen(false)}
                    >
                      <svg 
                        aria-hidden="true" 
                        focusable="false" 
                        role="presentation" 
                        className="icon icon-close" 
                        viewBox="0 0 64 64"
                      >
                        <title>icon-X</title>
                        <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" />
                      </svg>
                      <span className="icon__fallback-text">Close cart</span>
                    </button>
                  </div>
                </div>

                <div className="drawer__inner">
                  <div className="drawer__scrollable">
                    <div data-products className="appear-animation appear-delay-2">
                      <div className="cart__items" data-count="0" data-cart-subtotal="0">
                        {/* Cart items would render here */}
                      </div>
                    </div>
                  </div>

                  <div className="drawer__footer appear-animation appear-delay-4">
                    <div data-discounts>
                      <div className="cart__discounts cart__item-sub cart__item-row hide">
                        <div>Discounts</div>
                        <div></div>
                      </div>
                    </div>

                    <div className="cart__item-sub cart__item-row">
                      <div className="ajaxcart__subtotal">Subtotal</div>
                      <div data-subtotal>{cartSubtotal}</div>
                    </div>

                    <div className="cart__item-row text-center">
                      <small>
                        {" Taxes, and discount codes calculated at checkout."}
                        <br />
                      </small>
                    </div>

                    <div className="cart__checkout-wrapper">
                      <button 
                        type="submit" 
                        name="checkout" 
                        data-terms-required="false" 
                        className="btn cart__checkout"
                      >
                        Check out
                      </button>
                    </div>
                  </div>
                </div>

                <div className="drawer__cart-empty appear-animation appear-delay-2">
                  <div className="drawer__scrollable">
                    Your cart is currently empty.
                  </div>
                </div>
              </form>
            </div>

            {/* Header Section with Toolbar */}
            <div data-section-id="sections--15611117273137__header" data-section-type="header">
              {/* Toolbar */}
              <div className="toolbar small--hide">
                <div className="page-width">
                  <div className="toolbar__content">
                    <div className="toolbar__item">
                      <ul className="no-bullets social-icons inline-list toolbar__social">
                        {/* Social icons */}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Sticky Wrapper */}
              <div className="header-sticky-wrapper">
                <div id="HeaderWrapper" className="header-wrapper">
                  <header 
                    id="SiteHeader" 
                    className="site-header" 
                    data-sticky="false" 
                    data-overlay="false"
                  >
                    <div className="page-width">
                      <div 
                        className="header-layout header-layout--left" 
                        data-logo-align="left"
                      >
                        {/* Logo */}
                        <div className="header-item header-item--logo">
                          <h1 
                            className="site-header__logo" 
                            itemScope 
                            itemType="http://schema.org/Organization"
                          >
                            <span className="visually-hidden">brandlesse</span>
                            <a 
                              href="/" 
                              itemProp="url" 
                              className="site-header__logo-link" 
                              style={{ paddingTop: '100.0%' }}
                            >
                              <div 
                                className="image-element" 
                                data-aos="image-fade-in" 
                                data-aos-offset="150"
                              >
                                <img 
                                  src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=200" 
                                  alt="" 
                                  srcSet="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=100 100w, //brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=200 200w"
                                  width="100"
                                  height="100.0"
                                  loading="eager"
                                  className="small--hide image-element"
                                  sizes="100px"
                                  itemProp="logo"
                                />
                              </div>
                              <div 
                                className="image-element" 
                                data-aos="image-fade-in" 
                                data-aos-offset="150"
                              >
                                <img 
                                  src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=120" 
                                  alt="" 
                                  srcSet="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=60 60w, //brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593&width=120 120w"
                                  width="60"
                                  height="60.0"
                                  loading="eager"
                                  className="medium-up--hide image-element"
                                  sizes="60px"
                                />
                              </div>
                            </a>
                          </h1>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="header-item header-item--navigation" role="navigation" aria-label="Primary">
                          <ul className="site-nav site-navigation small--hide">
                            <li className="site-nav__item site-nav__expanded-item">
                              <a href="/" className="site-nav__link site-nav__link--underline">
                                Home
                              </a>
                            </li>
                            <li className="site-nav__item site-nav__expanded-item">
                              <a href="/collections/all-products" className="site-nav__link site-nav__link--underline">
                                Browse Domains
                              </a>
                            </li>
                            <li className="site-nav__item site-nav__expanded-item">
                              <a href="/pages/about-us" className="site-nav__link site-nav__link--underline">
                                About Us
                              </a>
                            </li>
                            <li className="site-nav__item site-nav__expanded-item">
                              <a href="/pages/how-it-works" className="site-nav__link site-nav__link--underline">
                                How it Works
                              </a>
                            </li>
                          </ul>
                        </div>

                        {/* Header Icons */}
                        <div className="header-item header-item--icons">
                          <div className="site-nav">
                            <div className="site-nav__icons">
                              {/* Account Link */}
                              <a 
                                className="site-nav__link site-nav__link--icon small--hide" 
                                href="/account"
                              >
                                <svg 
                                  aria-hidden="true" 
                                  focusable="false" 
                                  role="presentation" 
                                  className="icon icon-account" 
                                  viewBox="0 0 64 64"
                                >
                                  <title>icon-account</title>
                                  <path d="M32 32c8.8 0 16-7.2 16-16S40.8 0 32 0 16 7.2 16 16s7.2 16 16 16zm0 8c-10.7 0-32 5.3-32 16v8h64v-8c0-10.7-21.3-16-32-16z"/>
                                </svg>
                                <span className="icon__fallback-text">Account</span>
                              </a>

                              {/* Search Link */}
                              <a 
                                href="/search" 
                                className="site-nav__link site-nav__link--icon js-search-header"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSearchOpen(!searchOpen);
                                }}
                              >
                                <svg 
                                  aria-hidden="true" 
                                  focusable="false" 
                                  role="presentation" 
                                  className="icon icon-search" 
                                  viewBox="0 0 64 64"
                                >
                                  <title>icon-search</title>
                                  <path d="M47.16 28.58A18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 41.94 42" />
                                </svg>
                                <span className="icon__fallback-text">Search</span>
                              </a>

                              {/* Mobile Menu Button */}
                              <button 
                                type="button" 
                                className="site-nav__link site-nav__link--icon js-drawer-open-nav medium-up--hide"
                                aria-controls="NavDrawer"
                                aria-expanded={navDrawerOpen}
                                onClick={() => setNavDrawerOpen(true)}
                              >
                                <svg 
                                  aria-hidden="true" 
                                  focusable="false" 
                                  role="presentation" 
                                  className="icon icon-hamburger" 
                                  viewBox="0 0 64 64"
                                >
                                  <title>icon-hamburger</title>
                                  <path d="M7 15h51M7 32h43M7 49h51" />
                                </svg>
                                <span className="icon__fallback-text">Site navigation</span>
                              </button>

                              {/* Cart Link */}
                              <a 
                                href="/cart" 
                                className="site-nav__link site-nav__link--icon js-drawer-open-cart"
                                aria-controls="CartDrawer"
                                data-icon="bag-minimal"
                                aria-expanded={cartDrawerOpen}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCartDrawerOpen(true);
                                }}
                              >
                                <span className="cart-link">
                                  <svg 
                                    aria-hidden="true" 
                                    focusable="false" 
                                    role="presentation" 
                                    className="icon icon-bag-minimal" 
                                    viewBox="0 0 64 64"
                                  >
                                    <title>icon-bag-minimal</title>
                                    <path 
                                      stroke="null" 
                                      fillOpacity="null" 
                                      strokeOpacity="null" 
                                      fill="null" 
                                      d="M11.375 17.863h41.25v36.75h-41.25z"
                                    />
                                    <path 
                                      stroke="null" 
                                      d="M22.25 18c0-7.105 4.35-9 9.75-9s9.75 1.895 9.75 9"
                                    />
                                  </svg>
                                  <span className="icon__fallback-text">Cart</span>
                                  <span className="cart-link__bubble"></span>
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </header>
                </div>
              </div>

              {/* Search Container */}
              <div className="site-header__search-container">
                <div className={`site-header__search ${searchOpen ? 'is-open' : ''}`}>
                  <div className="page-width">
                    <predictive-search 
                      data-context="header" 
                      data-enabled="true" 
                      data-dark="false"
                    >
                      <div className="predictive__screen" data-screen></div>
                      <form action="/search" method="get" role="search">
                        <label htmlFor="Search" className="hidden-label">Search</label>
                        <div className="search__input-wrap">
                          <input 
                            className="search__input" 
                            id="Search" 
                            type="search" 
                            name="q" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            role="combobox"
                            aria-expanded="false"
                            aria-owns="predictive-search-results"
                            aria-controls="predictive-search-results"
                            aria-haspopup="listbox"
                            aria-autocomplete="list"
                            autoCorrect="off"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            placeholder="Search"
                            tabIndex={0}
                          />
                          <button type="submit" className="search__submit">
                            <svg 
                              aria-hidden="true" 
                              focusable="false" 
                              role="presentation" 
                              className="icon icon-search" 
                              viewBox="0 0 64 64"
                            >
                              <title>icon-search</title>
                              <path d="M47.16 28.58A18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 41.94 42" />
                            </svg>
                            <span className="icon__fallback-text">Submit</span>
                          </button>
                          <button 
                            type="button" 
                            className="search__close js-search-close"
                            onClick={() => setSearchOpen(false)}
                          >
                            <svg 
                              aria-hidden="true" 
                              focusable="false" 
                              role="presentation" 
                              className="icon icon-close" 
                              viewBox="0 0 64 64"
                            >
                              <title>icon-X</title>
                              <path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" />
                            </svg>
                            <span className="icon__fallback-text">Close search</span>
                          </button>
                        </div>
                        <div id="predictive-search-results" role="listbox">
                          {/* Predictive search results would render here */}
                        </div>
                      </form>
                    </predictive-search>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="main-content" id="MainContent">
            {/* Image with Text Section */}
            <div 
              id="shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6" 
              className="shopify-section"
            >
              <style data-shopify>{`
                .section-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  border-top: solid #000000 0px;
                  border-bottom: solid #000000 0px;
                  margin-top: 0px;
                  margin-bottom: 0px;
                  margin-left: 0rem;
                  margin-right: 0rem;
                  border-radius: 0px;
                  overflow: hidden;
                }

                .section-template--15611116716081__ss_image_with_text_14_HmBMn6-settings {
                  margin: 0 auto;
                  padding-top: 0px;
                  padding-bottom: 0px;
                  padding-left: 0rem;
                  padding-right: 0rem;
                }

                .image-text-body-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: 0px;
                }

                .image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  padding: 32px 32px;
                  overflow: hidden;
                }

                .image-text-content-top-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  display: flex;
                  flex-direction: column;
                  align-items: start;
                }

                .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  order: 1;
                }

                .image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  order: 2;
                }

                @media (min-width: 1024px) {
                  .image-text-body-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    grid-template-columns: 1fr 1fr;
                    gap: 0px;
                  }

                  .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    order: 2;
                    aspect-ratio: 12/9;
                  }

                  .image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    order: 1;
                    padding-right: calc(68px + 32px);
                  }
                }

                .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 img,
                .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 svg {
                  display: block;
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 svg {
                  background-color: #AFAFAF;
                }

                @media (min-width: 1024px) {
                  .section-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    margin-top: 0px;
                    margin-bottom: 0px;
                    margin-left: 0rem;
                    margin-right: 0rem;
                    border-radius: 0px;
                  }

                  .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    aspect-ratio: 12/12;
                  }

                  .image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                    position: relative;
                    padding-right: calc(68px + 32px + 70px);
                  }

                  .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                    margin: 0px;
                    pointer-events: none;
                    transform: rotate(-90deg);
                    position: absolute;
                    top: 0;
                    width: 100%;
                    right: 0;
                    height: 100%;
                  }

                  .image-text-scrolling-list-scrolling_Kc7ea6 {
                    align-items: end;
                  }
                }

                .image-text-heading-heading_LRaVYB {
                  text-align: left;
                  margin-top: 0px;
                }

                .image-text-heading-heading_LRaVYB * {
                  margin: 0;
                  font-size: 26px;
                  color: #000000;
                  line-height: 110%;
                  text-transform: unset;
                }

                @media (min-width: 1024px) {
                  .image-text-heading-heading_LRaVYB {
                    text-align: left;
                    margin-top: 0px;
                  }

                  .image-text-heading-heading_LRaVYB * {
                    font-size: 74px;
                  }
                }

                .image-text-heading-heading_LRaVYB * {
                  font-family: Helvetica, Arial, sans-serif;
                  font-weight: 400;
                  font-style: normal;
                }

                .image-text-text-text_DQcDaw {
                  text-align: left;
                  margin-top: 16px;
                }

                .image-text-text-text_DQcDaw * {
                  margin: 0;
                  font-size: 14px;
                  color: #000000;
                  line-height: %;
                  text-transform: unset;
                }

                @media (min-width: 1024px) {
                  .image-text-text-text_DQcDaw {
                    text-align: left;
                    margin-top: 24px;
                  }

                  .image-text-text-text_DQcDaw * {
                    font-size: 20px;
                  }
                }

                .image-text-text-text_DQcDaw {
                  font-family: "Anonymous Pro", monospace;
                  font-weight: 400;
                  font-style: normal;
                }

                .image-text-button-button_CET8Tm {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 10px;
                  width: 100%;
                  max-width: fit-content;
                  margin: 0;
                  margin-top: 24px;
                  font-size: 19px;
                  color: #ffffff;
                  line-height: 120%;
                  text-align: center;
                  text-transform: unset;
                  text-decoration: none;
                  padding: 12px 30px;
                  z-index: 2;
                }

                .image-text-button-button_CET8Tm:hover {
                  color: #000000;
                  transition: all 0.25s ease 0s;
                }

                .image-text-button-button_CET8Tm svg {
                  width: 14px;
                  height: 14px;
                }

                .image-text-button-button_CET8Tm svg path {
                  fill: #ffffff;
                  transition: all 0.25s ease 0s;
                }

                .image-text-button-button_CET8Tm:hover svg path {
                  fill: #000000;
                  transition: all 0.25s ease 0s;
                }

                @media (min-width: 1024px) {
                  .image-text-button-button_CET8Tm {
                    margin-top: 46px;
                    padding: 12px 30px;
                    font-size: 19px;
                  }
                }

                .image-text-button-button_CET8Tm {
                  font-family: Helvetica, Arial, sans-serif;
                  font-weight: 400;
                  font-style: normal;
                }

                .image-text-button-button_CET8Tm {
                  background-color: #000000;
                  border: 1px solid #121212;
                }

                .image-text-button-button_CET8Tm:hover {
                  background-color: #ffffff;
                  border: 1px solid #000000;
                }

                /* Scrolling ticker styles */
                .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                  position: relative;
                  display: -webkit-box;
                  display: -ms-flexbox;
                  display: flex;
                  overflow: hidden;
                  -ms-flex-wrap: nowrap;
                  flex-wrap: nowrap;
                  background-attachment: scroll !important;
                  margin-left: -16px;
                  margin-right: -16px;
                }

                .image-text-scrolling-list-scrolling_Kc7ea6 {
                  display: -webkit-box;
                  display: -ms-flexbox;
                  display: flex;
                  white-space: nowrap;
                  background-attachment: scroll !important;
                  -webkit-animation: tickerscrolling_Kc7ea6 32s infinite linear;
                  animation: tickerscrolling_Kc7ea6 32s infinite linear;
                  flex-shrink: 0;
                }

                .image-text-scrolling-item-scrolling_Kc7ea6 {
                  display: flex;
                  align-items: center;
                  background-attachment: scroll !important;
                  margin-right: 16px;
                  flex-shrink: 0;
                }

                .image-text-scrolling-text-scrolling_Kc7ea6 {
                  display: inline-block;
                  margin: 0;
                  font-size: 32px;
                  color: #000000;
                  line-height: 130%;
                  text-transform: unset;
                  margin-right: 16px;
                  font-weight: 700;
                }

                .image-text-scrolling-icon-scrolling_Kc7ea6 {
                  display: inline-block;
                  width: 34px;
                }

                .image-text-scrolling-icon-scrolling_Kc7ea6 img,
                .image-text-scrolling-icon-scrolling_Kc7ea6 svg {
                  display: block;
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .image-text-scrolling-icon-scrolling_Kc7ea6 svg {
                  margin-top: 4px;
                }

                .image-text-scrolling-icon-scrolling_Kc7ea6 svg path {
                  fill: #121212;
                }

                @media (min-width: 1024px) {
                  .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                    margin-left: -100px;
                    margin-right: -100px;
                  }

                  .image-text-scrolling-list-scrolling_Kc7ea6 {
                    animation-duration: 20s;
                  }

                  .image-text-scrolling-item-scrolling_Kc7ea6 {
                    margin-right: 16px;
                    margin-bottom: 12px;
                  }

                  .image-text-scrolling-text-scrolling_Kc7ea6 {
                    font-size: 60px;
                    margin-right: 16px;
                  }

                  .image-text-scrolling-icon-scrolling_Kc7ea6 {
                    width: 58px;
                  }

                  .image-text-scrolling-icon-scrolling_Kc7ea6 svg {
                    margin-top: 8px;
                  }
                }

                .image-text-scrolling-text-scrolling_Kc7ea6 {
                  font-family: Helvetica, Arial, sans-serif;
                  font-weight: 400;
                  font-style: normal;
                }

                .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                  margin-top: 16px;
                }

                @keyframes tickerscrolling_Kc7ea6 {
                  0% {
                    transform: translateX(0%);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }

                #shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  border-bottom: 1.5px solid #000;
                }

                @media (min-width: 750px) {
                  #shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6 .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                    border-bottom: 1.5px solid #000;
                  }
                }

                #shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6 .image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  background: #ffffff;
                }

                @media (max-width: 749px) {
                  #shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6 .image-text-scrolling-wrap-scrolling_Kc7ea6 {
                    border-top: 1.5px solid #000;
                  }
                }

                #shopify-section-template--15611116716081__ss_image_with_text_14_HmBMn6 .image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6 {
                  background: #efefef;
                  border-bottom: 1.4px solid #000;
                }

                @font-face {
                  font-family: "Anonymous Pro";
                  font-weight: 400;
                  font-style: normal;
                  font-display: swap;
                  src: url("//brandlesse.com/cdn/fonts/anonymous_pro/anonymouspro_n4.f8892cc1cfa3d797af6172c8eeddce62cf610e33.woff2") format("woff2"),
                       url("//brandlesse.com/cdn/fonts/anonymous_pro/anonymouspro_n4.a707ca3ea5e6b6468ff0c29cf7e105dca1c09be4.woff") format("woff");
                }
              `}</style>

              <div 
                className="section-template--15611116716081__ss_image_with_text_14_HmBMn6 image-text-template--15611116716081__ss_image_with_text_14_HmBMn6" 
                style={{ backgroundColor: '#f5f5f5' }}
              >
                <div className="section-template--15611116716081__ss_image_with_text_14_HmBMn6-settings">
                  <div className="image-text-body-template--15611116716081__ss_image_with_text_14_HmBMn6">
                    <div className="image-text-content-template--15611116716081__ss_image_with_text_14_HmBMn6">
                      <div className="image-text-content-top-template--15611116716081__ss_image_with_text_14_HmBMn6">
                        <div className="image-text-heading-heading_LRaVYB">
                          <p>
                            <strong>Brandable domains for your next project.</strong>
                          </p>
                        </div>
                        <div className="image-text-text-text_DQcDaw">
                          <p>
                            "Brandlesse is a curated collection of premium .coms – handpicked, brand-ready, and available to be transferred to you today. "
                          </p>
                        </div>
                        <a href="/collections/all-products" className="image-text-button-button_CET8Tm">
                          GET A DOMAIN
                        </a>
                      </div>

                      {/* Scrolling Ticker */}
                      <div className="image-text-content-bottom-template--15611116716081__ss_image_with_text_14_HmBMn6">
                        <div className="image-text-scrolling-wrap-scrolling_Kc7ea6">
                          <div className="image-text-scrolling-list-scrolling_Kc7ea6">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="image-text-scrolling-item-scrolling_Kc7ea6">
                                <p className="image-text-scrolling-text-scrolling_Kc7ea6">com</p>
                                <div className="image-text-scrolling-icon-scrolling_Kc7ea6">
                                  <img 
                                    src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                                    alt="files/Favicon_HD_White.png"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="image-text-scrolling-list-scrolling_Kc7ea6">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="image-text-scrolling-item-scrolling_Kc7ea6">
                                <p className="image-text-scrolling-text-scrolling_Kc7ea6">com</p>
                                <div className="image-text-scrolling-icon-scrolling_Kc7ea6">
                                  <img 
                                    src="//brandlesse.com/cdn/shop/files/Favicon_HD_White.png?v=1763590593" 
                                    alt="files/Favicon_HD_White.png"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image Section */}
                    <div className="image-text-image-template--15611116716081__ss_image_with_text_14_HmBMn6">
                      <img 
                        src="//brandlesse.com/cdn/shop/files/Square_Logo.png?v=1763595913" 
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Collection Section */}
            <div 
              id="shopify-section-template--15611116716081__featured_collection_fEKner" 
              className="shopify-section index-section"
            >
              <style>{`
                #shopify-section-sections--15611117273137__header {
                  border-bottom: 1px solid #000;
                  border-top: 1px solid #000;
                }

                .grid-product__content {
                  padding: 10px 0;
                }

                .grid-product__title {
                  font-size: 14px;
                  font-weight: 600;
                  margin-bottom: 4px;
                }

                .grid-product__price {
                  font-size: 14px;
                  color: #666;
                }

                .grid__image-ratio--square {
                  padding-bottom: 100%;
                  position: relative;
                }

                .grid__image-ratio--square::before {
                  content: '';
                  display: block;
                }

                .grid-product__image-mask {
                  overflow: hidden;
                  background: #f5f5f5;
                }

                .image-style--image-element {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                #shopify-section-template--15611116716081__rich_text_BfBQqV {
                  margin-top: 100px;
                  margin-bottom: 0;
                }

                .enlarge-text p {
                  font-size: 1.2em;
                  line-height: 1.6;
                }

                .page-width--narrow {
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 0 20px;
                }

                .text-center {
                  text-align: center;
                }

                .theme-block h2 {
                  font-size: 2.5rem;
                  font-weight: 400;
                  margin-bottom: 20px;
                }

                /* Featured Product Styles */
                .product-section {
                  padding: 40px 0;
                }

                .grid--product-images--partial {
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: 30px;
                }

                @media (min-width: 769px) {
                  .grid--product-images--partial {
                    grid-template-columns: 1fr 1fr;
                  }
                }

                .product-single__sticky {
                  position: sticky;
                  top: 100px;
                }

                .product__photos--beside {
                  display: flex;
                  flex-direction: column;
                }

                .product-main-slide {
                  position: relative;
                }

                .image-wrap {
                  position: relative;
                  overflow: hidden;
                }

                .photoswipe__image {
                  width: 100%;
                  height: auto;
                }

                .product__photo-zoom {
                  position: absolute;
                  bottom: 10px;
                  right: 10px;
                  background: white;
                  border: 1px solid #000;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                }

                .product-single__meta {
                  padding: 20px 0;
                }

                .product-block--header {
                  margin-bottom: 20px;
                }

                .product-single__title {
                  font-size: 1.8rem;
                  font-weight: 400;
                  margin: 0;
                }

                .product-block--price {
                  margin-bottom: 20px;
                }

                .product__price {
                  font-size: 1.4rem;
                  font-weight: 600;
                }

                .product__price-savings {
                  color: #e00;
                  margin-left: 10px;
                }

                .product-block .rte {
                  margin-bottom: 20px;
                  line-height: 1.7;
                }

                .product-block .rte p {
                  margin-bottom: 15px;
                }

                .add-to-cart {
                  width: 100%;
                  padding: 15px 30px;
                  background: #000;
                  color: #fff;
                  border: none;
                  font-size: 16px;
                  cursor: pointer;
                  transition: background 0.3s ease;
                }

                .add-to-cart:hover {
                  background: #333;
                }

                .product__thumbs--beside {
                  display: none;
                }

                @media (min-width: 769px) {
                  .product__thumbs--beside {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                  }
                }

                /* Advanced Content / CTA Button */
                #shopify-section-template--15611116716081__advanced_content_B4Gg7z,
                #shopify-section-template--15611116716081__advanced_content_DBJDiw {
                  display: flex;
                  justify-content: center;
                  margin-bottom: 120px;
                }

                .center-button {
                  display: inline-block;
                  padding: 15px 40px;
                  background: #000;
                  color: #fff;
                  text-decoration: none;
                  font-size: 16px;
                  transition: all 0.3s ease;
                }

                .center-button:hover {
                  background: #fff;
                  color: #000;
                  border: 1px solid #000;
                }

                .custom-content {
                  width: 100%;
                }

                .custom__item {
                  width: 100%;
                }

                .custom__item-inner--liquid {
                  padding: 20px;
                }
              `}</style>

              <div 
                id="CollectionSection-template--15611116716081__featured_collection_fEKner"
                data-section-id="template--15611116716081__featured_collection_fEKner"
                data-section-type="collection-grid"
                data-context="featured-collection"
              >
                <div className="page-width">
                  <div className="grid grid--uniform">
                    {/* Product Grid Items */}
                    {products.map((product) => (
                      <div 
                        key={product.id}
                        className="grid__item grid-product small--one-half medium-up--one-quarter aos-init aos-animate"
                        data-aos="row-of-4"
                        data-product-handle={product.handle}
                        data-product-id={product.id}
                      >
                        <div className="grid-product__content">
                          <div className="grid__item-image-wrapper">
                            <div className="grid-product__image-mask">
                              <div className="grid__image-ratio grid__image-ratio--square">
                                <div 
                                  className="image-element" 
                                  data-aos="image-fade-in" 
                                  data-aos-offset="150"
                                >
                                  <img 
                                    src={product.image}
                                    alt={product.title}
                                    srcSet={`${product.image.replace('width=1080', 'width=360')} 360w, ${product.image.replace('width=1080', 'width=540')} 540w, ${product.image.replace('width=1080', 'width=720')} 720w, ${product.image.replace('width=1080', 'width=900')} 900w, ${product.image} 1080w`}
                                    width="1080"
                                    height="1080.0"
                                    loading="lazy"
                                    className="image-style--image-element"
                                    sizes="(min-width: 769px) 25vw, 50vw"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <a 
                            href={`/collections/all-products/products/${product.handle}`} 
                            className="grid-product__link"
                          >
                            <div className="grid-product__meta">
                              <div className="grid-product__title grid-product__title--body">
                                {product.title}
                              </div>
                              <div className="grid-product__price">
                                {product.price}
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rich Text Section - Buy a Brand */}
            <div 
              id="shopify-section-template--15611116716081__rich_text_BfBQqV" 
              className="shopify-section index-section"
            >
              <div className="text-center page-width page-width--narrow">
                <div className="theme-block">
                  <h2>Buy a Brand</h2>
                </div>
                <div className="theme-block">
                  <div className="rte">
                    <div className="enlarge-text">
                      <p>These bandable domains are available for you to snap up.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IRL Gallery Section */}
            <section 
              id="shopify-section-template--15611116716081__irl_gallery_iBwqtg" 
              className="shopify-section"
            >
              {/* Gallery content */}
            </section>

            {/* Featured Product 1 - Debutee */}
            <div 
              id="shopify-section-template--15611116716081__featured_product_YzABpG" 
              className="shopify-section index-section"
            >
              <div 
                id="ProductSection-template--15611116716081__featured_product_YzABpG-7082964615217"
                className="product-section"
                data-section-id="template--15611116716081__featured_product_YzABpG"
                data-product-id="7082964615217"
                data-section-type="product"
                data-product-handle="debutee-brandable-domain"
                data-product-title="Debutee (debutee.com)"
                data-product-url="/products/debutee-brandable-domain"
                data-aspect-ratio="100.0"
                data-img-url="//brandlesse.com/cdn/shop/files/19kw9UAPc5teEt3b_LgexYdUHSyJ8tyWQ.jpg?v=1763532812"
              >
                <div className="page-content page-content--product">
                  <div className="page-width">
                    <div className="grid grid--product-images--partial">
                      {/* Product Image */}
                      <div className="grid__item medium-up--one-half product-single__sticky">
                        <div 
                          data-product-images 
                          data-zoom="true" 
                          data-has-slideshow="false"
                        >
                          <div className="product__photos product__photos--beside">
                            <div className="product__main-photos aos-init aos-animate">
                              <div 
                                data-product-photos 
                                data-zoom="true" 
                                className="product-slideshow"
                              >
                                <div className="product-main-slide starting-slide is-selected">
                                  <div 
                                    data-product-image-main 
                                    className="product-image-main"
                                  >
                                    <div 
                                      className="image-wrap loaded" 
                                      style={{ height: 0, paddingBottom: '100.0%' }}
                                    >
                                      <div 
                                        className="image-element" 
                                        data-aos="image-fade-in" 
                                        data-aos-offset="150"
                                      >
                                        <img 
                                          src="//brandlesse.com/cdn/shop/files/19kw9UAPc5teEt3b_LgexYdUHSyJ8tyWQ.jpg?v=1763532812&width=1080"
                                          alt="Debutee (debutee.com)"
                                          loading="lazy"
                                          className="photoswipe__image image-element"
                                          width="1080"
                                          height="1080.0"
                                          sizes="(min-width: 769px) 50vw, 75vw"
                                        />
                                      </div>
                                      <button 
                                        type="button" 
                                        className="btn btn--body btn--circle js-photoswipe__zoom product__photo-zoom"
                                      >
                                        <svg 
                                          aria-hidden="true" 
                                          focusable="false" 
                                          role="presentation" 
                                          className="icon icon-search" 
                                          viewBox="0 0 64 64"
                                        >
                                          <title>icon-search</title>
                                          <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 41.94 42" />
                                        </svg>
                                        <span className="icon__fallback-text">Close (esc)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div 
                              data-product-thumbs 
                              className="product__thumbs product__thumbs--beside product__thumbs-placement--left medium-up--hide small--hide aos-init aos-animate"
                            >
                              <div className="product__thumbs--scroller"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="grid__item medium-up--one-half">
                        <div className="product-single__meta">
                          <div className="product-block product-block--header">
                            <h1 className="h2 product-single__title">Debutee (debutee.com)</h1>
                          </div>
                          <div data-product-blocks>
                            <div className="product-block product-block--price">
                              <span data-a11y-price className="visually-hidden">Regular price</span>
                              <span data-product-price className="product__price">$995.00</span>
                              <span data-save-price className="product__price-savings hide"></span>
                            </div>
                            <div className="product-block">
                              <div className="rte">
                                <p>
                                  "debutee.com is an eight-character domain featuring the popular .com TLD, helping establish credibility. The name combines three syllables – "de-but-ee," which makes it catchy and memorable. Spelling and pronunciation are straightforward, aiding easy recall and reducing typing errors. "
                                </p>
                                <p>
                                  "This could work for businesses in event planning, fashion, tech startups, talent management, and creative services. The domain's phonetic appeal, combined with its association with new beginnings, supports brand storytelling. Its simplicity also facilitates quick mobile typing and international recognition."
                                </p>
                              </div>
                            </div>
                            <div className="product-block" data-dynamic-variants-enabled></div>
                            <div className="product-block">
                              <div className="product-block">
                                <form 
                                  method="post" 
                                  action="/cart/add" 
                                  id="AddToCartForm-template--15611116716081__featured_product_YzABpG-7082964615217"
                                  className="product-single__form"
                                >
                                  <input type="hidden" name="form_type" value="product" />
                                  <input type="hidden" name="utf8" value="✓" />
                                  <button 
                                    type="submit" 
                                    name="add" 
                                    data-add-to-cart 
                                    className="btn btn--full add-to-cart"
                                  >
                                    <span data-add-to-cart-text data-default-text="Add to cart">Add to cart</span>
                                  </button>
                                  <input type="hidden" name="product-id" value="7082964615217" />
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Product 2 - Designing A */}
            <div 
              id="shopify-section-template--15611116716081__featured_product_feqDBf" 
              className="shopify-section index-section"
            >
              <div 
                id="ProductSection-template--15611116716081__featured_product_feqDBf-7082964680753"
                className="product-section"
                data-section-id="template--15611116716081__featured_product_feqDBf"
                data-product-id="7082964680753"
                data-section-type="product"
                data-product-handle="designing-a-brandable-domain"
                data-product-title="Designing A (designinga.com)"
                data-product-url="/products/designing-a-brandable-domain"
              >
                <div className="page-content page-content--product">
                  <div className="page-width">
                    <div className="grid grid--product-images--partial">
                      <div className="grid__item medium-up--one-half product-single__sticky">
                        <div data-product-images data-zoom="true" data-has-slideshow="false">
                          <div className="product__photos product__photos--beside">
                            <div className="product__main-photos aos-init aos-animate">
                              <div data-product-photos data-zoom="true" className="product-slideshow">
                                <div className="product-main-slide starting-slide is-selected">
                                  <div data-product-image-main className="product-image-main">
                                    <div className="image-wrap loaded" style={{ height: 0, paddingBottom: '100.0%' }}>
                                      <div className="image-element" data-aos="image-fade-in" data-aos-offset="150">
                                        <img 
                                          src="//brandlesse.com/cdn/shop/files/1H_TfbDKNHbjeP4vcrNuX6WfbzdT3-9-B.jpg?v=1763532817&width=1080"
                                          alt="Designing A (designinga.com)"
                                          loading="lazy"
                                          className="photoswipe__image image-element"
                                          width="1080"
                                          height="1080.0"
                                          sizes="(min-width: 769px) 50vw, 75vw"
                                        />
                                      </div>
                                      <button type="button" className="btn btn--body btn--circle js-photoswipe__zoom product__photo-zoom">
                                        <svg aria-hidden="true" focusable="false" role="presentation" className="icon icon-search" viewBox="0 0 64 64">
                                          <title>icon-search</title>
                                          <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 41.94 42" />
                                        </svg>
                                        <span className="icon__fallback-text">Close (esc)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid__item medium-up--one-half">
                        <div className="product-single__meta">
                          <div className="product-block product-block--header">
                            <h1 className="h2 product-single__title">Designing A (designinga.com)</h1>
                          </div>
                          <div data-product-blocks>
                            <div className="product-block product-block--price">
                              <span data-a11y-price className="visually-hidden">Regular price</span>
                              <span data-product-price className="product__price">$1,495.00</span>
                            </div>
                            <div className="product-block">
                              <div className="rte">
                                <p>
                                  "Designinga.com is an 11-character domain using the widely recognized .com TLD. The name combines the common word "design" with the inventive "inga," hinting at creativity and innovation. It's phonetically composed of four syllables, providing a rhythmic and memorable auditory appeal. This could work for businesses in sectors like graphic design, web development, and design education platforms. While not a direct keyword, its brandable nature could support effective SEO strategies when used with quality content. The structure allows flexibility across various creative industries."
                                </p>
                              </div>
                            </div>
                            <div className="product-block">
                              <form method="post" action="/cart/add" className="product-single__form">
                                <input type="hidden" name="form_type" value="product" />
                                <button type="submit" name="add" data-add-to-cart className="btn btn--full add-to-cart">
                                  <span data-add-to-cart-text>Add to cart</span>
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Browse All Domains CTA */}
            <div 
              id="shopify-section-template--15611116716081__advanced_content_DBJDiw" 
              className="shopify-section"
            >
              <div className="custom-content">
                <div className="custom__item one-whole align--bottom-middle">
                  <div className="custom__item-inner custom__item-inner--liquid">
                    <div className="rte">
                      <a href="https://brandlesse.com/collections/all-products" className="center-button btn btn--full">
                        Browse All Domains
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rich Text Section - Snapshots */}
            <div 
              id="shopify-section-template--15611116716081__rich_text_zpDddf" 
              className="shopify-section index-section"
            >
              <div className="text-center page-width page-width--narrow">
                <div className="theme-block">
                  <h2>Snapshots</h2>
                </div>
                <div className="theme-block">
                  <div className="rte">
                    <div className="enlarge-text">
                      <p>"Here are some hot domains to check out. Each one is available and will be transferred to you after checkout."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Product 3 - Glaussy */}
            <div 
              id="shopify-section-template--15611116716081__featured_product_dWKnXz" 
              className="shopify-section index-section"
            >
              <div 
                id="ProductSection-template--15611116716081__featured_product_dWKnXz-7082964975665"
                className="product-section"
                data-section-id="template--15611116716081__featured_product_dWKnXz"
                data-product-id="7082964975665"
                data-section-type="product"
                data-product-handle="glaussy-brandable-domain"
                data-product-title="Glaussy (glaussy.com)"
                data-product-url="/products/glaussy-brandable-domain"
              >
                <div className="page-content page-content--product">
                  <div className="page-width">
                    <div className="grid grid--product-images--partial">
                      <div className="grid__item medium-up--one-half product-single__sticky">
                        <div data-product-images data-zoom="true" data-has-slideshow="false">
                          <div className="product__photos product__photos--beside">
                            <div className="product__main-photos aos-init aos-animate">
                              <div data-product-photos data-zoom="true" className="product-slideshow">
                                <div className="product-main-slide starting-slide is-selected">
                                  <div data-product-image-main className="product-image-main">
                                    <div className="image-wrap loaded" style={{ height: 0, paddingBottom: '100.0%' }}>
                                      <div className="image-element" data-aos="image-fade-in" data-aos-offset="150">
                                        <img 
                                          src="//brandlesse.com/cdn/shop/files/1JHMI4inIpACrjhU7EllMedEg9VhNFGFM.jpg?v=1763532841&width=1080"
                                          alt="Glaussy (glaussy.com)"
                                          loading="lazy"
                                          className="photoswipe__image image-element"
                                          width="1080"
                                          height="1080.0"
                                          sizes="(min-width: 769px) 50vw, 75vw"
                                        />
                                      </div>
                                      <button type="button" className="btn btn--body btn--circle js-photoswipe__zoom product__photo-zoom">
                                        <svg aria-hidden="true" focusable="false" role="presentation" className="icon icon-search" viewBox="0 0 64 64">
                                          <title>icon-search</title>
                                          <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 41.94 42" />
                                        </svg>
                                        <span className="icon__fallback-text">Close (esc)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid__item medium-up--one-half">
                        <div className="product-single__meta">
                          <div className="product-block product-block--header">
                            <h1 className="h2 product-single__title">Glaussy (glaussy.com)</h1>
                          </div>
                          <div data-product-blocks>
                            <div className="product-block product-block--price">
                              <span data-a11y-price className="visually-hidden">Regular price</span>
                              <span data-product-price className="product__price">$995.00</span>
                            </div>
                            <div className="product-block">
                              <div className="rte">
                                <p>
                                  "glaussy.com is a 7-character domain featuring the .com TLD, known for global recognition. The name combines three syllables, promoting easy pronunciation and memorability. Its smooth, contemporary sound aids recall for users."
                                </p>
                                <p>
                                  "This is an invented word, allowing for unique brand identity creation. It could work for businesses in beauty, wellness, tech startups, fashion, and creative agencies, offering a versatile brand narrative. From an SEO angle, it competes less with established keywords, though requires tailored strategies for visibility. Suitable for diverse audiences, it ensures straightforward mobile typing."
                                </p>
                              </div>
                            </div>
                            <div className="product-block">
                              <form method="post" action="/cart/add" className="product-single__form">
                                <input type="hidden" name="form_type" value="product" />
                                <button type="submit" name="add" data-add-to-cart className="btn btn--full add-to-cart">
                                  <span data-add-to-cart-text>Add to cart</span>
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Browse All Domains CTA */}
            <div 
              id="shopify-section-template--15611116716081__advanced_content_B4Gg7z" 
              className="shopify-section"
            >
              <div className="custom-content">
                <div className="custom__item one-whole align--bottom-middle">
                  <div className="custom__item-inner custom__item-inner--liquid">
                    <div className="rte">
                      <a href="https://brandlesse.com/collections/all-products" className="center-button btn btn--full">
                        Browse All Domains
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Rich Text Section */}
            <div 
              id="shopify-section-template--15611116716081__rich-text" 
              className="shopify-section index-section"
            >
              {/* Additional content */}
            </div>
          </main>

          {/* BEGIN sections: footer-group */}
          <div 
            id="shopify-section-sections--15611117240369__footer" 
            className="shopify-section shopify-section-group-footer-group"
          >
            <footer className="site-footer">
              <div className="page-width">
                {/* Footer content would go here */}
              </div>
            </footer>
          </div>
          {/* END sections: footer-group */}

          {/* Video Modal */}
          <div id="VideoModal" className="modal modal--solid">
            {/* Modal content */}
          </div>

          {/* PSWP (PhotoSwipe) */}
          <div className="pswp" tabIndex={-1} role="dialog" aria-hidden="true">
            {/* PhotoSwipe markup */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product data extracted from inspection
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
  {
    id: '7082967007281',
    handle: 'ziiio-brandable-domain',
    title: 'Ziiio (ziiio.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/ziiio-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082966974513',
    handle: 'tokioh-brandable-domain',
    title: 'Tokioh (tokioh.com)',
    price: '$2,495.00',
    image: '//brandlesse.com/cdn/shop/files/tokioh-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082966745137',
    handle: 'w-h-i-s-p-i-e-brandable-domain',
    title: 'Whispie (whispie.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/whispie-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965860401',
    handle: 'suvony-brandable-domain',
    title: 'Suvony (suvony.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/suvony-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965827633',
    handle: 'supiori-brandable-domain',
    title: 'Supiori (supiori.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/supiori-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965663793',
    handle: 'ruovi-brandable-domain',
    title: 'Ruovi (ruovi.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/ruovi-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965631025',
    handle: 'rokokko-brandable-domain',
    title: 'Rokokko (rokokko.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/rokokko-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965499953',
    handle: 'parlexa-brandable-domain',
    title: 'Parlexa (parlexa.com)',
    price: '$2,495.00',
    image: '//brandlesse.com/cdn/shop/files/parlexa-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082965467185',
    handle: 'omoshi-brandable-domain',
    title: 'Omoshi (omoshi.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/omoshi-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082964680753',
    handle: 'designing-a-brandable-domain',
    title: 'Designinga (designinga.com)',
    price: '$1,495.00',
    image: '//brandlesse.com/cdn/shop/files/designinga-brandable-domain.jpg?v=1763590593&width=1080'
  },
  {
    id: '7082951409713',
    handle: 'athleate-brandable-domain',
    title: 'Athleate (athleate.com)',
    price: '$1,995.00',
    image: '//brandlesse.com/cdn/shop/files/athleate-brandable-domain.jpg?v=1763590593&width=1080'
  }
];

export default Demo;
