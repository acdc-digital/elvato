"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState, useRef } from "react"
import ReactCountryFlag from "react-country-flag"

import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectCompactProps = {
  regions: HttpTypes.StoreRegion[]
}

const CountrySelectCompact = ({ regions }: CountrySelectCompactProps) => {
  const [current, setCurrent] = useState<
    | { country: string | undefined; region: string; label: string | undefined }
    | undefined
  >(undefined)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { countryCode } = useParams()
  const currentPath = usePathname().split(`/${countryCode}`)[1]

  const options = useMemo(() => {
    return regions
      ?.map((r) => {
        return r.countries?.map((c) => ({
          country: c.iso_2,
          region: r.id,
          label: c.display_name,
        }))
      })
      .flat()
      .sort((a, b) => (a?.label ?? "").localeCompare(b?.label ?? ""))
  }, [regions])

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o?.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleChange = (option: CountryOption) => {
    updateRegion(option.country, currentPath)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <Listbox
        as="span"
        onChange={handleChange}
        defaultValue={
          countryCode
            ? options?.find((o) => o?.country === countryCode) as CountryOption | undefined
            : undefined
        }
      >
        <ListboxButton 
          className="flex items-center gap-x-1.5 text-sm font-mono text-black hover:opacity-60 transition-opacity focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {current && (
            <>
              {/* @ts-ignore */}
              <ReactCountryFlag
                svg
                style={{
                  width: "14px",
                  height: "14px",
                }}
                countryCode={current.country ?? ""}
              />
              <span className="uppercase">{current.country}</span>
            </>
          )}
        </ListboxButton>
        <Transition
          show={isOpen}
          as={Fragment}
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            className="absolute top-full right-0 mt-1 max-h-[300px] overflow-y-scroll z-[900] bg-white border border-black text-sm font-mono uppercase text-black no-scrollbar w-48 focus:outline-none"
            static
          >
            {options?.map((o, index) => {
              return (
                <ListboxOption
                  key={index}
                  value={o}
                  className="py-2 hover:bg-gray-100 px-3 cursor-pointer flex items-center gap-x-2 focus:outline-none"
                >
                  {/* @ts-ignore */}
                  <ReactCountryFlag
                    svg
                    style={{
                      width: "14px",
                      height: "14px",
                    }}
                    countryCode={o?.country ?? ""}
                  />
                  {o?.label}
                </ListboxOption>
              )
            })}
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  )
}

export default CountrySelectCompact
