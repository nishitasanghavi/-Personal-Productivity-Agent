import dotenv from "dotenv";
dotenv.config();

import { generateTasksForEvent } from "../server/gemini";

const mockEvent = {
  title: "Team Sync",
  description: "Weekly team catch-up",
  location: "Zoom",
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

(async () => {
  const output = await generateTasksForEvent(mockEvent);
  console.log("AI OUTPUT:", output);
})();
