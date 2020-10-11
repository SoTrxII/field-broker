import "reflect-metadata";
import { container } from "./inversify.config";
import { InversifyExpressServer } from 'inversify-express-utils';

import "./controller/lullaby-controller"

// start the server
const server = new InversifyExpressServer(container);
server.setConfig((app) => {
});

let app = server.build();
app.listen(8089);
console.log('Server started on port 3000 :)');

exports = module.exports = app;