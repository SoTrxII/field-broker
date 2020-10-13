import "reflect-metadata";
import { container } from "./inversify.config";
import { InversifyExpressServer } from "inversify-express-utils";
import "./controller/lullaby-controller";
import { json } from "body-parser";
export const PORT = 8089;
// start the server
const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(json());
});

export const app = server.build();
app.listen(PORT);
console.log(`Server started on port ${PORT} :) `);
