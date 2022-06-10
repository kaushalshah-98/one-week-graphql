import { PrismaClient } from "@prisma/client";

export async function findOrCreateCart(prisma: PrismaClient, id: string) {
  let cartData = await prisma.cart.findUnique({ where: { id } });
  if (!cartData) {
    cartData = await prisma.cart.create({ data: { id } });
  }
  return cartData;
}
