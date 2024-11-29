import http from "k6/http";
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  duration: "10s",
  vus: 10,
  summaryTrendStats: ["avg", "p(95)"]
};

const code = `def hello():
  return "Hello"
`;

export default function () {
  const randomUUID = uuidv4();
  http.post(
    "http://localhost:7800/api/grade",
    JSON.stringify({ userId: randomUUID, assignmentOrder: 1, code: code})
  );
}