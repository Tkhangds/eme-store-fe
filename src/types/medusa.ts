import { Region as MedusaRegion, ProductVariant } from "@medusajs/medusa"
export type Variant = Omit<ProductVariant, "beforeInsert">

export interface Region extends Omit<MedusaRegion, "beforeInsert"> {}

export type CalculatedVariant = ProductVariant & {
  calculated_price: number
  calculated_price_type: "sale" | "default"
  original_price: number
}

declare module "@medusajs/medusa" {
  interface ProductVariant {
    processing_fee: number
  }
}

declare module "@medusajs/medusa" {
  interface Cart {
    processing_fee_total?: number
  }
}

declare module "@medusajs/medusa" {
  interface Order {
    processing_fee_total?: number
  }
}

declare module "@medusajs/medusa" {
  interface LineItem {
    sender_name?: string
    sender_email?: string
    receiver_name?: string
    receiver_email?: string
    delivery_method?: string
  }
}

declare module "@medusajs/medusa" {
  interface StorePostCartsCartLineItemsReq {
    sender_name?: string
    sender_email?: string
    receiver_name?: string
    receiver_email?: string
    delivery_method?: string
  }
}
