

import express from "express";
import cors from "cors";
import uiAnalyzer from "./routes/uiAnalyzer.js";


const app = express();

app.use(express.json({ limit: '50mb' })); // <-- Increase as needed
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
// Add your route here
app.use("/api/ui", uiAnalyzer);

app.listen(5000, () => console.log("Server running on port 5000"));
