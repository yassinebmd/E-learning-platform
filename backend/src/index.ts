import { app, db } from "./app";

app.listen(5001, (srv) => {
  console.log(`🦊 Server running on http://${srv.hostname}:${srv.port}`);
});
