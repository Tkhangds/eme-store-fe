"use client"

import { Region } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { Button, Label } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { isValidEmail } from "@lib/util/emailIsValid"

import { useIntersection } from "@lib/hooks/use-in-view"
import { addToCart } from "@modules/cart/actions"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/option-select"

import { Input } from "@medusajs/ui"
import { Minus, Plus } from "lucide-react"
import MobileActions from "../mobile-actions"
import ProductPrice from "../product-price"
import { DeliveryInfo } from "types/global"

type ProductActionsProps = {
  product: PricedProduct
  region: Region
  disabled?: boolean
}

export type PriceType = {
  calculated_price: string
  original_price?: string
  price_type?: "sale" | "default"
  percentage_diff?: string
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)

  const countryCode = useParams().countryCode as string

  const variants = product.variants

  // initialize the option state
  useEffect(() => {
    const optionObj: Record<string, string> = {}

    for (const option of product.options || []) {
      Object.assign(optionObj, { [option.id]: undefined })
    }

    setOptions(optionObj)
  }, [product])

  // memoized record of the product's variants
  const variantRecord = useMemo(() => {
    const map: Record<string, Record<string, string>> = {}

    for (const variant of variants) {
      if (!variant.options || !variant.id) continue

      const temp: Record<string, string> = {}

      for (const option of variant.options) {
        temp[option.option_id] = option.value
      }

      map[variant.id] = temp
    }

    return map
  }, [variants])

  // memoized function to check if the current options are a valid variant
  const variant = useMemo(() => {
    let variantId: string | undefined = undefined

    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key
      }
    }

    return variants.find((v) => v.id === variantId)
  }, [options, variantRecord, variants])

  // if product only has one variant, then select it
  useEffect(() => {
    if (variants.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id])
    }
  }, [variants, variantRecord])

  // update the options when a variant is selected
  const updateOptions = (update: Record<string, string>) => {
    setOptions({ ...options, ...update })
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (variant && !variant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (variant && variant.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (variant?.inventory_quantity && variant.inventory_quantity > 0) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [variant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!variant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: variant.id,
      quantity: quantity,
      countryCode,
      ...deliveryDetails,
    })

    setIsAdding(false)
  }

  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (value: string) => {
    const numValue = Number.parseInt(value) || 1
    if (numValue >= 1) {
      setQuantity(numValue)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const [deliveryOption, setDeliveryOption] = useState("email")
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryInfo>({
    sender_name: "",
    receiver_name: "",
    receiver_email: "",
    sender_email: "",
    delivery_method: "email",
  })

  const handleDeliveryDetailsChange = (field: string, value: string) => {
    setDeliveryDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function isDisabled({
    sender_email,
    sender_name,
    receiver_email,
    receiver_name,
    delivery_method,
  }: DeliveryInfo): boolean {
    if (delivery_method === "email") {
      return !(sender_name && receiver_name && isValidEmail(receiver_email))
    }
    if (delivery_method === "print") {
      return !(sender_name && isValidEmail(sender_email))
    }
    return true
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {product.variants.length > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={updateOptions}
                      title={option.title}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <div className="text-sm font-semibold">Quantity</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="transparent"
              size="small"
              className="h-8 w-8 shrink-0"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || !!disabled || isAdding}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-center flex-1 h-8 "
              disabled={!!disabled || isAdding}
              data-testid="quantity-input"
            />
            <Button
              type="button"
              variant="transparent"
              size="small"
              className="h-8 w-8 shrink-0"
              onClick={incrementQuantity}
              disabled={!!disabled || isAdding}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Divider />
        </div>

        <div className="flex flex-col gap-y-4">
          <div className="text-sm font-semibold">Delivery Options</div>

          {/* Delivery Method Selection */}
          <div className="flex gap-4">
            <Label className="flex items-center space-x-2">
              <input
                type="radio"
                id="email-delivery"
                name="delivery"
                value="email"
                checked={deliveryOption === "email"}
                onChange={(e) => {
                  setDeliveryOption(e.target.value)
                  handleDeliveryDetailsChange("delivery_method", e.target.value)
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                disabled={!!disabled || isAdding}
              />
              <div className="text-sm font-normal cursor-pointer">
                Email Delivery
              </div>
            </Label>
            <Label className="flex items-center space-x-2">
              <input
                type="radio"
                id="print-delivery"
                name="delivery"
                value="print"
                checked={deliveryOption === "print"}
                onChange={(e) => {
                  setDeliveryOption(e.target.value)
                  handleDeliveryDetailsChange("delivery_method", e.target.value)
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                disabled={!!disabled || isAdding}
              />
              <div className="text-sm font-normal cursor-pointer">
                Print Delivery
              </div>
            </Label>
          </div>

          {/* Delivery Details Form */}
          <div className="grid gap-4">
            {/* Common field - Sender Name */}
            <div className="flex flex-col gap-y-1">
              <div className="text-sm">Sender Name</div>
              <Input
                id="sender-name"
                type="text"
                placeholder="Enter sender name"
                value={deliveryDetails.sender_name}
                onChange={(e) =>
                  handleDeliveryDetailsChange("sender_name", e.target.value)
                }
                disabled={!!disabled || isAdding}
                className="h-9"
              />
            </div>

            {deliveryOption === "email" ? (
              <>
                {/* Email Delivery Fields */}
                <div className="flex flex-col gap-y-1">
                  <div className="text-sm">Receiver Name</div>
                  <Input
                    id="receiver-name"
                    type="text"
                    placeholder="Enter receiver name"
                    value={deliveryDetails.receiver_name}
                    onChange={(e) =>
                      handleDeliveryDetailsChange(
                        "receiver_name",
                        e.target.value
                      )
                    }
                    disabled={!!disabled || isAdding}
                    className="h-9"
                  />
                </div>
                <div className="flex flex-col gap-y-1">
                  <div className="text-sm">Receiver Email</div>
                  <Input
                    id="receiver-email"
                    type="email"
                    placeholder="Enter receiver email"
                    value={deliveryDetails.receiver_email}
                    onChange={(e) =>
                      handleDeliveryDetailsChange(
                        "receiver_email",
                        e.target.value
                      )
                    }
                    disabled={!!disabled || isAdding}
                    className="h-9"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Print Delivery Fields */}
                <div className="flex flex-col gap-y-1">
                  <div className="text-sm">Sender Email</div>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="Enter sender email"
                    value={deliveryDetails.sender_email}
                    onChange={(e) =>
                      handleDeliveryDetailsChange(
                        "sender_email",
                        e.target.value
                      )
                    }
                    disabled={!!disabled || isAdding}
                    className="h-9"
                  />
                </div>
              </>
            )}
          </div>
          <Divider />
        </div>

        <ProductPrice product={product} variant={variant} region={region} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !variant ||
            !!disabled ||
            isAdding ||
            isDisabled(deliveryDetails)
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!variant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={variant}
          region={region}
          options={options}
          updateOptions={updateOptions}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={
            isDisabled(deliveryDetails) || !!disabled || isAdding
          }
        />
      </div>
    </>
  )
}
