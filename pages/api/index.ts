import { createServer } from "@graphql-yoga/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Resolvers } from "../../types";

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"), {
  encoding: "utf8",
});

const resolvers: Resolvers = {
  Query: {
    cart: (_, { id }) => {
      return { id, totalItems: 0 };
    },
  },
};

const server = createServer({
  endpoint: "/api",
  schema: {
    typeDefs,
    resolvers,
  },
});

export default server;
