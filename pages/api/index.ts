import { createServer } from "@graphql-yoga/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Resolvers } from "../../types";
import prisma from "../../lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export type GraphQLContext = {
  prisma: PrismaClient;
};

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
    cart: (_, { id }) => {
      return { id, totalItems: 0 };
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
