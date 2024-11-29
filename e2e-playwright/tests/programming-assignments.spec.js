const { test, expect } = require("@playwright/test");

const wrongAnswer = `def hello():
  return "hello world"
`;
const correctAnswer = `def hello():
  return "Hello"
`;

test("Server responds with a page with the title 'Programming assignments'", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");
});

test("Grading fails with wrong input", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await page.getByLabel("Your code:").fill(wrongAnswer);
  await page.getByRole("button", { name: "Grade" }).click();
  await expect(page.locator("#status")).toContainText("Grading finished");
  await expect(page.locator("#feedback")).toContainText("FAILED");
});

test("User points do not increase when grading fails", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await page.getByLabel("Your code:").fill(wrongAnswer);
  await page.getByRole("button", { name: "Grade" }).click();
  await expect(page.locator("#status")).toContainText("Grading finished");
  await expect(page.locator("#feedback")).toContainText("FAILED");
  await expect(page.locator("#points")).toHaveText("Points: 0");
});

test("Grading passes with correct input", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await page.getByLabel("Your code:").fill(correctAnswer);
  await page.getByRole("button", { name: "Grade" }).click();
  await expect(page.locator("#status")).toContainText("Grading finished");
  await expect(page.locator("#feedback")).toContainText("OK");
});

test("Grading passes with correct input and new assignment is loaded", async ({ page }) => {
  test.slow();
  await page.goto("/");
  const firstDescription = await page.locator("#description").innerText();
  await page.getByLabel("Your code:").fill(correctAnswer);
  await page.getByRole("button", { name: "Grade" }).click();
  await expect(page.locator("#status")).toContainText("Grading finished");
  await expect(page.locator("#feedback")).toContainText("OK");
  await page.getByRole("button", { name: "Next assignment" }).click();
  await expect(page.locator("#description")).not.toEqual(firstDescription);
});

test("User points increase when grading passes", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await page.getByLabel("Your code:").fill(correctAnswer);
  await page.getByRole("button", { name: "Grade" }).click();
  await expect(page.locator("#status")).toContainText("Grading finished");
  await expect(page.locator("#feedback")).toContainText("OK");
  await page.getByRole("button", { name: "Next assignment" }).click();
  await expect(page.locator("#points")).toHaveText("Points: 100");
});