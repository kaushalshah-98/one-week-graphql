import { PrismaClient, CartItem } from "@prisma/client";
import { Product } from "./products";
import { Stripe } from "stripe";

export const currencyCode = "USD";

export async function findOrCreateCart(prisma: PrismaClient, id: string) {
  let cartData = await prisma.cart.findUnique({ where: { id } });
  if (!cartData) {
    cartData = await prisma.cart.create({ data: { id } });
  }
  return cartData;
}

/**
 * Verifies that the cart items are valid and formats them for Stripe.checkout
 *
 * An item is valid if:
 * - Id matches a product in our inventory
 * - Price hasn't been tampered with. This is why we use the price from our inventory
 */
export function validateCartItems(
  inventory: Product[],
  cartItems: CartItem[]
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const checkoutItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of cartItems) {
    const product = inventory.find(({ id }) => id === item.id);
    if (!product) {
      throw new Error(`Item with id ${item.id} is not on the inventory`);
    }
    checkoutItems.push({
      quantity: item.quantity,
      price_data: {
        currency: currencyCode,
        unit_amount: product.price,
        product_data: {
          name: item.name,
          description: item.description || undefined,
          images: item.image ? [item.image] : [],
        },
      },
    });
  }

  return checkoutItems;
}
