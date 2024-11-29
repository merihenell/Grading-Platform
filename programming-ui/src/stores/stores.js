import { readable, writable } from "svelte/store";

let user = localStorage.getItem("userUuid");
let assignment = localStorage.getItem("assignmentOrder");
let points = localStorage.getItem("userPoints");

if (!user) {
  user = crypto.randomUUID().toString();
  assignment = "1";
  points = "0";
  localStorage.setItem("userUuid", user);
  localStorage.setItem("assignmentOrder", assignment);
  localStorage.setItem("userPoints", points);
} 

export const userUuid = readable(user);
export const assignmentOrder = writable(assignment);
export const userPoints = writable(points);

assignmentOrder.subscribe((value) => {
  localStorage.setItem("assignmentOrder", value);
});

userPoints.subscribe((value) => {
  localStorage.setItem("userPoints", value);
});