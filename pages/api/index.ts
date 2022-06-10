import { createServer } from "@graphql-yoga/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Resolvers } from "../../types";
import prisma from "../../lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import currencyFormatter from "currency-formatter";
import { findOrCreateCart } from "../../lib/cart";

export type GraphQLContext = {
  prisma: PrismaClient;
};

const currencyCode = "USD";

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"), {
  encoding: "utf8",
});

export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}

const resolvers: Resolvers = {
  Query: {
    cart: async (_, { id }, { prisma }) => {
      return findOrCreateCart(prisma, id);
    },
  },
  Cart: {
    items: async ({ id }, _, { prisma }) => {
      const cartItems = await prisma.cart.findUnique({ where: { id } }).items();
      return cartItems;
    },
    totalItems: async ({ id }, _, { prisma }) => {
      let cartItems = await prisma.cart.findUnique({ where: { id } }).items();
      return cartItems.reduce((total, item) => total + item.quantity ?? 1, 0);
    },
    subTotal: async ({ id }, _, { prisma }) => {
      let cartItems = await prisma.cart.findUnique({ where: { id } }).items();
      const amount =
        cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) ??
        0;
      const formatted = currencyFormatter.format(amount / 100, {
        code: currencyCode,
      });
      return { formatted, amount };
    },
  },
  CartItem: {
    unitTotal: async ({ price }) => {
      const amount = price;
      const formatted = currencyFormatter.format(amount / 100, {
        code: currencyCode,
      });
      return { formatted, amount };
    },
    lineTotal: async ({ price, quantity }) => {
      const amount = price * quantity;
      const formatted = currencyFormatter.format(amount / 100, {
        code: currencyCode,
      });
      return { formatted, amount };
    },
  },
  Mutation: {
    addItem: async (_, { input }, { prisma }) => {
      const cart = await findOrCreateCart(prisma, input.cartId);
      await prisma.cartItem.upsert({
        create: {
          cartId: cart.id,
          id: input.id,
          name: input.name,
          description: input.description,
          image: input.image,
          price: input.price,
          quantity: input.quantity ?? 1,
        },
        update: {
          quantity: {
            increment: input.quantity ?? 1,
          },
        },
        where: {
          id_cartId: {
            cartId: cart.id,
            id: input.id,
          },
        },
      });
      return cart;
    },
    removeItem: async (_, { input }, { prisma }) => {
      const { cartId } = await prisma.cartItem.delete({
        where: {
          id_cartId: {
            cartId: input.cartId,
            id: input.id,
          },
        },
        select: {
          cartId: true,
        },
      });
      return findOrCreateCart(prisma, cartId);
    },
    increaseCartItem: async (_, { input }, { prisma }) => {
      const { cartId } = await prisma.cartItem.update({
        data: {
          quantity: {
            increment: 1,
          },
        },
        where: {
          id_cartId: {
            cartId: input.cartId,
            id: input.id,
          },
        },
        select: {
          cartId: true,
        },
      });
      return findOrCreateCart(prisma, cartId);
    },
    decreaseCartItem: async (_, { input }, { prisma }) => {
      const { cartId, quantity } = await prisma.cartItem.update({
        data: {
          quantity: {
            decrement: 1,
          },
        },
        where: {
          id_cartId: {
            cartId: input.cartId,
            id: input.id,
          },
        },
        select: {
          cartId: true,
          quantity: true,
        },
      });

      if (quantity <= 0) {
        await prisma.cartItem.delete({
          where: {
            id_cartId: {
              cartId: input.cartId,
              id: input.id,
            },
          },
        });
      }

      return findOrCreateCart(prisma, cartId);
    },
  },
};

const server = createServer<{ req: NextApiRequest; res: NextApiResponse }>({
  endpoint: "/api",
  schema: {
    typeDefs,
    resolvers,
  },
  context: createContext(),
});

export default server;
