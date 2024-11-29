import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { createClient } from "./deps.js";
import { serve } from "./deps.js";
import { cacheMethodCalls } from "./util/cacheUtil.js";

const redis = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
})
await redis.connect();

const cachedProgrammingAssignmentService = cacheMethodCalls(programmingAssignmentService, ["getAssignments"]);

const handleGetAssignments = async (request) => {
  const assignments = await cachedProgrammingAssignmentService.getAssignments();

  return Response.json(assignments);
};

const handleGetAssignment = async (request, urlPatternResult) => {
  const order = urlPatternResult.pathname.groups.order
  const assignment = await cachedProgrammingAssignmentService.getAssignment(order);

  if (!assignment) {
    return new Response(JSON.stringify({ error: "Assignment not found" }), { status: 404 });
  }

  return Response.json(assignment);
};

const produceMessage = async (streamName, message) => {
  try {
    await redis.xAdd(streamName, "*", { data: JSON.stringify(message) });
  } catch (error) {
    console.error("Error producing message:", error);
  }
}

const handleGrading = async (request) => {
  const requestData = await request.json();
  const userId = requestData.userId;
  const assignmentOrder = requestData.assignmentOrder;
  const code = requestData.code;

  const assignment = await programmingAssignmentService.getAssignment(assignmentOrder);
  const assignmentId = assignment["id"];

  const similarSubmission = await programmingAssignmentService.getSubmission(assignmentId, code);

  if (similarSubmission) {
    const submission = await programmingAssignmentService.addSubmission(assignmentId, code, userId, similarSubmission["status"], similarSubmission["grader_feedback"], similarSubmission["correct"]);
    return new Response(JSON.stringify({ submissionId: submission["id"], status: "Grading finished", result: similarSubmission["grader_feedback"] }));
  } else {
    const submission = await programmingAssignmentService.addSubmission(assignmentId, code, userId);
    const submissionId = submission["id"];
    const testCode = assignment["test_code"];

    produceMessage("grading-stream", { submissionId: submissionId, code: code, testCode: testCode });
    return new Response(JSON.stringify({ submissionId: submissionId, status: "Grading pending" }));
  }
};

const handleUpdate = async (request) => {
  const requestData = await request.json();
  await programmingAssignmentService.updateSubmission(requestData.submissionId, "processed", requestData.feedback, requestData.correct);
  return new Response(JSON.stringify({ result: "Ok" }));
};

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments" }),
    fn: handleGetAssignments,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignment/:order" }),
    fn: handleGetAssignment,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/grade" }),
    fn: handleGrading,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/update" }),
    fn: handleUpdate,
  }
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  try {
    return await mapping.fn(request, mappingResult);
  } catch (e) {
    console.log(e);
    return new Response(e.stack, { status: 500 })
  }
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);