import http from "k6/http";

export const options = {
  duration: "10s",
  vus: 10,
  summaryTrendStats: ["avg", "p(95)"]
};

export default function () {
  http.get("http://localhost:7800/api/assignment/1");
}