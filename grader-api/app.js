import { createClient } from "./deps.js";
import { serve } from "./deps.js";
import { grade } from "./services/gradingService.js";

const serverId = crypto.randomUUID();

const redis = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});

await redis.connect();

const consumeMessages = async (streamName, consumerName, groupName) => {
  try {
    try {
      await redis.xGroupCreate(streamName, groupName, '0', {
        MKSTREAM: true
      });
    } catch (e) {
    }

    while (true) {
      const results = await redis.xReadGroup(groupName, consumerName, [
        { key: streamName, id: '>' }
      ], { COUNT: 1, BLOCK: 2000 });

      if (results && results.length > 0) {
        const [{ messages }] = results;
        
        for (const message of messages) {
          const { id, message: data } = message;
          const parsedMessage = JSON.parse(data.data);
          
          const submissionId = parsedMessage.submissionId;

          await redis.set(`progress:${submissionId}`, JSON.stringify({ submissionId: submissionId, status: "Grading pending" }));

          const code = parsedMessage.code;
          const testCode = parsedMessage.testCode;

          const result = await grade(code, testCode);
          const response = JSON.stringify({ submissionId: submissionId, status: "Grading finished", result: result });
          
          await redis.set(`progress:${submissionId}`, response);
          
          await redis.xAck(streamName, groupName, id);
        }
      }
    }
  } catch (e) {
    console.error("Error consuming messages:", e);
  }
}

consumeMessages("grading-stream", `${serverId}`, "grading-group");

const handleRequest = async (request) => {
  const { socket, response } = Deno.upgradeWebSocket(request);

  const url = new URL(request.url);
  const submissionId = url.searchParams.get('submissionId');

  if (!submissionId) {
    socket.close(1008, "Missing submissionId");
    return response;
  }

  let interval = setInterval(async () => {
    const progress = await redis.get(`progress:${submissionId}`);
    if (progress) {
      socket.send(progress);
    }
  }, 1000);

  socket.onclose = () => {
    clearInterval(interval);
  };

  return response;
};

const portConfig = { port: 7000, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);