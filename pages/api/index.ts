import { createServer } from "@graphql-yoga/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Resolvers } from "../../types";
import prisma from "../../lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import currencyFormatter from "currency-formatter";

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
      let cartData = await prisma.cart.findUnique({ where: { id } });
      if (!cartData) {
        cartData = await prisma.cart.create({ data: { id } });
      }
      return cartData;
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

      return {
        formatted: currencyFormatter.format(amount / 100, {
          code: currencyCode,
        }),
        amount,
      };
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
