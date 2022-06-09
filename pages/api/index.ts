import { createServer } from "@graphql-yoga/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"), {
  encoding: "utf8",
});

const resolvers = {
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
