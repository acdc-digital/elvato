"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment, useState, useEffect } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Account: "/account",
  Cart: "/cart",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const headerHeight = 96
  const bannerHeight = 45  // Adjusted to connect with header border
  const [menuTop, setMenuTop] = useState(headerHeight + bannerHeight)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      // Banner scrolls away, header is sticky
      // When scrolled past banner, header is at viewport top (0px)
      // Menu should be at headerHeight from viewport
      // When at top, banner is visible, header is below it
      // Menu should be at headerHeight + remaining banner
      const visibleBanner = Math.max(0, bannerHeight - scrollY)
      setMenuTop(headerHeight + visibleBanner)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Run once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none text-sm uppercase tracking-wider font-mono text-black"
                >
                  MENU
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] pointer-events-auto"
                  style={{ top: `${menuTop}px` }}
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition-transform ease-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition-transform ease-in duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <PopoverPanel 
                  className="fixed left-0 bottom-0 w-[400px] z-[51] bg-white border-r border-black"
                  style={{ 
                    top: `${menuTop}px`
                  }}
                >
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full justify-between p-8"
                  >
                    <div>
                      <div className="flex justify-end mb-8" id="xmark">
                        <button 
                          data-testid="close-menu-button" 
                          onClick={close}
                          className="hover:opacity-60 transition-opacity"
                        >
                          <XMark className="text-black" size={24} />
                        </button>
                      </div>
                      <ul className="flex flex-col gap-6 items-start justify-start">
                        {Object.entries(SideMenuItems).map(([name, href]) => {
                          return (
                            <li key={name}>
                              <LocalizedClientLink
                                href={href}
                                className="text-3xl lg:text-4xl font-semibold leading-tight font-sans text-black hover:opacity-60 transition-opacity"
                                onClick={close}
                                data-testid={`${name.toLowerCase()}-link`}
                              >
                                {name}
                              </LocalizedClientLink>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-y-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 text-black",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-black",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small font-mono text-black opacity-60">
                        © {new Date().getFullYear()} Elvato. All rights reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
