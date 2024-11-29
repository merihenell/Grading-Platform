import { sql } from "../database/database.js";

const getAssignments = async () => {
  return await sql`SELECT * FROM programming_assignments`;
};

const getAssignment = async (order) => {
  const assignments = await sql`SELECT * FROM programming_assignments WHERE assignment_order = ${order}`;
  return assignments[0];
};

const getSubmission = async (assignmentId, code) => {
  const submissions = await sql`SELECT * FROM programming_assignment_submissions WHERE programming_assignment_id = ${assignmentId} AND code = ${code}`;
  return submissions[0];
};

const addSubmission = async (assignmentId, code, userId, status = "pending", feedback = "", correct = false) => {
  const submission = await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid, status, grader_feedback, correct) VALUES (${assignmentId}, ${code}, ${userId}, ${status}, ${feedback}, ${correct}) RETURNING id`;
  return submission[0];
};

const updateSubmission = async (submissionId, status, feedback, correct) => {
  await sql`UPDATE programming_assignment_submissions SET status = ${status}, grader_feedback = ${feedback}, correct = ${correct} WHERE id = ${submissionId}`;
};

export { getAssignments, getAssignment, getSubmission, addSubmission, updateSubmission };