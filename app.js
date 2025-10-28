const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./app_server/config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const requestLogger = require('./app_server/midelware/logger');

app.use(requestLogger);


const authRoutes = require("./app_server/route/authRoute");
const ideaRoutes = require("./app_server/route/ideaRoute");
const tagRoutes = require("./app_server/route/tagRoute");


app.use("/api/auth", authRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/tags", tagRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`💧 IDEKU API running on http://localhost:${PORT}`);
});
